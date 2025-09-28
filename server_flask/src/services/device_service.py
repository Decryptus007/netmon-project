from elasticsearch import Elasticsearch, NotFoundError, ConflictError
from elasticsearch.helpers import scan
from flask import current_app
from pydantic import ValidationError
import uuid
from datetime import datetime
from typing import Optional

from ..models.device_model import Device, DeviceCreate, DeviceUpdate

class DeviceService:
    def __init__(self):
        self.es = Elasticsearch(current_app.config['ELASTICSEARCH_HOST'])
        self.index_name = current_app.config.get('ELASTICSEARCH_DEVICES_INDEX', 'devices_index')
        self._ensure_index_exists()

    def _ensure_index_exists(self):
        """Ensures the Elasticsearch index exists, creating it if necessary."""
        if not self.es.indices.exists(index=self.index_name):
            # You might want a more specific mapping based on your Device model
            # For dynamic mapping, ES will infer types, but explicit mapping is better for production.
            # Example explicit mapping (simplified):
            # mapping = {
            #     "mappings": {
            #         "properties": {
            #             "tenantId": {"type": "keyword"},
            #             "name": {"type": "text"},
            #             "type": {"type": "keyword"},
            #             "ipAddress": {"type": "ip"},
            #             "platform": {"type": "keyword"},
            #             "status": {"type": "keyword"},
            #             "createdAt": {"type": "date"},
            #             "updatedAt": {"type": "date"},
            #             "siteId": {"type": "keyword"}
            #         }
            #     }
            # }
            # self.es.indices.create(index=self.index_name, body=mapping)
            self.es.indices.create(index=self.index_name) # Simple creation with dynamic mapping
            current_app.logger.info(f"Created Elasticsearch index: {self.index_name}")

    def get_all_devices(self, tenant_id: str, site_id: Optional[str] = None) -> list[Device]:
        """Retrieves all devices, optionally filtered by tenant_id and site_id."""
        query_body = {
            "query": {
                "bool": {
                    "filter": [
                        {"term": {"tenantId.keyword": tenant_id}} # Use .keyword for exact match on text fields if dynamically mapped
                    ]
                }
            }
        }
        if site_id:
            query_body["query"]["bool"]["filter"].append({"term": {"siteId.keyword": site_id}})

        devices = []
        # Using scan helper for potentially large number of documents
        for hit in scan(self.es, index=self.index_name, query=query_body):
            try:
                device_data = hit['_source']
                # ES stores document id in _id, our Pydantic model expects it as 'id'
                device_data['id'] = hit['_id'] 
                devices.append(Device(**device_data))
            except ValidationError as e:
                current_app.logger.error(f"Validation error for device {hit['_id']}: {e}")
            except Exception as e:
                current_app.logger.error(f"Error processing device {hit['_id']}: {e}")
        return devices

    def get_device_by_id(self, device_id: str, tenant_id: str) -> Optional[Device]:
        """Retrieves a single device by its ID, ensuring it belongs to the tenant."""
        try:
            res = self.es.get(index=self.index_name, id=device_id)
            device_data = res['_source']
            device_data['id'] = res['_id']
            
            if device_data.get('tenantId') != tenant_id:
                current_app.logger.warning(f"Attempt to access device {device_id} by incorrect tenant {tenant_id}")
                return None # Or raise an authorization error

            return Device(**device_data)
        except NotFoundError:
            return None
        except ValidationError as e:
            current_app.logger.error(f"Validation error for device {device_id}: {e}")
            return None

    def create_device(self, device_data: DeviceCreate, tenant_id: str) -> Optional[Device]:
        """Creates a new device."""
        # Ensure the tenantId in the data matches the one from auth context (if different)
        if device_data.tenantId != tenant_id:
            # This might indicate an issue or an attempt to create a device for another tenant
            current_app.logger.error("Mismatch in tenantId during device creation.")
            # Depending on policy, either overwrite, error out, or use context tenant_id
            # For now, let's assume device_data.tenantId should be respected if passed, but log if different from context
            pass # Or raise ValueError("Tenant ID mismatch")

        new_device_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Prepare document for Elasticsearch
        # Pydantic model .dict() is useful here
        doc = device_data.dict()
        doc['createdAt'] = now
        doc['updatedAt'] = now
        # Ensure tenantId is correctly set based on your auth logic. 
        # Here, we trust device_data.tenantId or overwrite with context tenant_id.
        doc['tenantId'] = tenant_id # Or device_data.tenantId if that's the policy

        try:
            self.es.create(index=self.index_name, id=new_device_id, document=doc)
            # Fetch the created document to return it with all fields (like generated ID and timestamps)
            # This is good practice, though self.es.create doesn't return the doc by default
            created_doc_data = doc.copy()
            created_doc_data['id'] = new_device_id
            return Device(**created_doc_data)
        except ConflictError:
            current_app.logger.error(f"Conflict error: Device with ID {new_device_id} already exists.")
            return None # Should ideally not happen with UUIDs
        except ValidationError as e:
            current_app.logger.error(f"Validation error creating device: {e}")
            # This typically means DeviceCreate model had issues, but we are converting to dict.
            # More likely, if Device model itself has issues with the data from ES.
            return None
        except Exception as e:
            current_app.logger.error(f"Error creating device in Elasticsearch: {e}")
            return None

    def update_device(self, device_id: str, device_update_data: DeviceUpdate, tenant_id: str) -> Optional[Device]:
        """Updates an existing device."""
        # First, verify the device exists and belongs to the tenant
        existing_device = self.get_device_by_id(device_id, tenant_id)
        if not existing_device:
            return None # Not found or not authorized for this tenant

        update_payload = device_update_data.dict(exclude_unset=True) # Only include fields that were set
        if not update_payload:
            # No actual changes provided
            return existing_device 

        update_payload['updatedAt'] = datetime.utcnow()

        try:
            self.es.update(index=self.index_name, id=device_id, doc=update_payload)
            # Fetch the updated document to return the complete and current state
            updated_res = self.es.get(index=self.index_name, id=device_id)
            updated_doc_data = updated_res['_source']
            updated_doc_data['id'] = updated_res['_id']
            return Device(**updated_doc_data)
        except NotFoundError: # Should be caught by initial get_device_by_id
            current_app.logger.warning(f"Device {device_id} not found during update attempt, though pre-check passed.")
            return None
        except ValidationError as e:
            current_app.logger.error(f"Validation error updating device {device_id}: {e}")
            return None
        except Exception as e:
            current_app.logger.error(f"Error updating device {device_id} in Elasticsearch: {e}")
            return None

    def delete_device(self, device_id: str, tenant_id: str) -> bool:
        """Deletes a device. Returns True if successful, False otherwise."""
        # Verify the device belongs to the tenant before deleting
        existing_device = self.get_device_by_id(device_id, tenant_id)
        if not existing_device:
            return False # Not found or not authorized
        
        try:
            self.es.delete(index=self.index_name, id=device_id)
            return True
        except NotFoundError:
            return False # Already deleted or never existed
        except Exception as e:
            current_app.logger.error(f"Error deleting device {device_id} from Elasticsearch: {e}")
            return False 