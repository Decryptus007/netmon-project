from flask import Blueprint, request, jsonify, current_app
import logging

from ..services.brain_service import BrainService # Import BrainService

brain_bp = Blueprint('brain_bp', __name__)
logger = logging.getLogger(__name__)

# Placeholder for get_current_tenant_id, assuming it will be shared or defined elsewhere
# from .device_routes import get_current_tenant_id 
# For now:
def get_current_tenant_id():
    return "default-tenant"

# Instantiate BrainService once. Since BrainLangGraphAgent is now an app-level singleton
# managed by get_brain_agent_instance(), BrainService itself can be a simple class.
_brain_service_instance = BrainService() 

def get_brain_service():
    # This now simply returns the already instantiated BrainService.
    # The actual agent singleton logic is within BrainService calling get_brain_agent_instance().
    return _brain_service_instance

@brain_bp.route('/query', methods=['POST'])
def query_brain():
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "Missing query in request body"}), 400

    user_query = data['query']
    tenant_id = get_current_tenant_id() 
    session_id = data.get('session_id') # For conversational history

    brain_service = get_brain_service()
    
    # The check for agent initialization is now effectively handled within brain_service.handle_query
    # which calls get_brain_agent_instance(). If that returns None, handle_query returns an error.

    logger.info(f"Received brain query for tenant {tenant_id} (session: {session_id}): {user_query}")

    response = brain_service.handle_query(user_query, tenant_id, session_id)
        
    return jsonify(response), 200 