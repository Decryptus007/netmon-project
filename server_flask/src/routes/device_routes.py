from flask import Blueprint, jsonify, request, current_app
from pydantic import ValidationError
import logging # Import the logging module

from ..services.device_service import DeviceService
from ..models.device_model import DeviceCreate, DeviceUpdate

# Get a logger instance
logger = logging.getLogger(__name__)

device_bp = Blueprint('device_bp', __name__)

# Placeholder for where device data would be stored or fetched from
# In a real application, this would interact with a database or a service layer.
_DEVICES_STORE = {} # Using a simple dictionary for now: { "device_id_1": {...}, "device_id_2": {...} }
_next_device_id = 1

# In a real app, the DeviceService would be initialized once, possibly when the app is created,
# and made available through Flask's application context (e.g., using g or app.extensions).
# For simplicity here, we'll instantiate it per request or as needed. 
# A better approach for production would be to manage its lifecycle with the app.

def get_device_service():
    """Helper to get DeviceService instance. Manages instance per request via flask.g if preferred."""
    # This is a simple way; for more complex apps, consider Flask extensions or dependency injection patterns.
    return DeviceService()

# TODO: Implement proper authentication and tenant_id extraction
# For now, we'll use a placeholder tenant_id.
def get_current_tenant_id():
    """Placeholder for getting tenant_id from auth context."""
    return "default-tenant" 

@device_bp.route('/', methods=['GET'])
def get_devices_route():
    service = get_device_service()
    tenant_id = get_current_tenant_id()
    site_id = request.args.get('siteId') # For filtering by siteId
    
    try:
        devices = service.get_all_devices(tenant_id=tenant_id, site_id=site_id)
        # Convert Pydantic models to dicts for JSON response
        return jsonify([device.dict() for device in devices]), 200
    except Exception as e:
        logger.error(f"Error fetching devices: {e}")
        return jsonify({"error": "Failed to fetch devices"}), 500

@device_bp.route('/<string:device_id>', methods=['GET'])
def get_device_by_id_route(device_id):
    service = get_device_service()
    tenant_id = get_current_tenant_id()
    try:
        device = service.get_device_by_id(device_id=device_id, tenant_id=tenant_id)
        if device:
            return jsonify(device.dict()), 200
        else:
            return jsonify({"error": "Device not found or not authorized"}), 404
    except Exception as e:
        logger.error(f"Error fetching device {device_id}: {e}")
        return jsonify({"error": "Failed to fetch device"}), 500

@device_bp.route('/', methods=['POST'])
def add_device_route():
    service = get_device_service()
    tenant_id = get_current_tenant_id()
    
    if not request.json:
        return jsonify({"error": "Missing JSON in request"}), 400

    try:
        device_data = DeviceCreate(**request.json)
    except ValidationError as e:
        return jsonify({"error": "Invalid request data", "details": e.errors()}), 400

    try:
        # Pass the validated Pydantic model and tenant_id to the service
        new_device = service.create_device(device_data=device_data, tenant_id=tenant_id)
        if new_device:
            return jsonify(new_device.dict()), 201
        else:
            # This case might occur if create_device returns None due to an internal error (e.g., ES conflict not expected with UUIDs)
            return jsonify({"error": "Failed to create device due to an internal issue"}), 500
    except Exception as e:
        logger.error(f"Error creating device: {e}")
        return jsonify({"error": "Failed to create device"}), 500

@device_bp.route('/<string:device_id>', methods=['PUT'])
def update_device_route(device_id):
    service = get_device_service()
    tenant_id = get_current_tenant_id()

    if not request.json:
        return jsonify({"error": "Missing JSON in request"}), 400

    try:
        update_data = DeviceUpdate(**request.json)
    except ValidationError as e:
        return jsonify({"error": "Invalid request data", "details": e.errors()}), 400

    if not update_data.dict(exclude_unset=True): # Check if any fields were actually provided for update
        return jsonify({"error": "No update fields provided"}), 400

    try:
        updated_device = service.update_device(device_id=device_id, device_update_data=update_data, tenant_id=tenant_id)
        if updated_device:
            return jsonify(updated_device.dict()), 200
        else:
            return jsonify({"error": "Device not found or failed to update"}), 404 # Or 500 if update failed for other reasons
    except Exception as e:
        logger.error(f"Error updating device {device_id}: {e}")
        return jsonify({"error": "Failed to update device"}), 500

@device_bp.route('/<string:device_id>', methods=['DELETE'])
def delete_device_route(device_id):
    service = get_device_service()
    tenant_id = get_current_tenant_id()
    try:
        success = service.delete_device(device_id=device_id, tenant_id=tenant_id)
        if success:
            return '', 204
        else:
            return jsonify({"error": "Device not found or failed to delete"}), 404
    except Exception as e:
        logger.error(f"Error deleting device {device_id}: {e}")
        return jsonify({"error": "Failed to delete device"}), 500 