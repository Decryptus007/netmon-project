from flask import current_app # Removed g, as we are using an app-level singleton
import logging
from typing import List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage # For type hinting history

from ..brain_agent.agent import BrainLangGraphAgent
# from ..brain_agent.tools import all_tools # Tools are used by the agent itself

logger = logging.getLogger(__name__)

# In-memory store for conversation histories by session_id
# For production, consider a more persistent store like Redis or a database.
_conversation_histories: Dict[str, List[Dict[str, Any]]] = {}
MAX_HISTORY_LENGTH = 10 # Max number of (Human, AI) message pairs to keep in history

# --- App-level singleton for BrainLangGraphAgent ---
_app_level_brain_agent: Optional[BrainLangGraphAgent] = None

def get_brain_agent_instance() -> Optional[BrainLangGraphAgent]:
    """Gets or initializes the app-level singleton BrainLangGraphAgent instance."""
    global _app_level_brain_agent
    if _app_level_brain_agent is None:
        logger.info("Attempting to initialize BrainLangGraphAgent (app-level singleton).")
        if not current_app:
            # This case might happen if this function is somehow called outside of an active app context
            # before the app has fully initialized the agent via init_brain_agent_with_app.
            logger.error("Cannot initialize app-level brain agent: Flask current_app is not available.")
            # Optionally, raise an error or handle gracefully depending on expected usage.
            return None
        try:
            # The BrainLangGraphAgent constructor itself uses current_app.config
            _app_level_brain_agent = BrainLangGraphAgent()
            logger.info("BrainLangGraphAgent (app-level singleton) initialized successfully.")
        except Exception as e:
            logger.critical(f"CRITICAL - Failed to initialize app-level BrainLangGraphAgent: {e}", exc_info=True)
            _app_level_brain_agent = None # Ensure it remains None if initialization failed
    return _app_level_brain_agent

def init_brain_agent_with_app(app):
    """Allows pre-initialization of the agent when the Flask app is created."""
    with app.app_context():
        get_brain_agent_instance() # Call to initialize and store it in _app_level_brain_agent
    logger.info("BrainService pre-initialization with app context completed.")

class BrainService:
    # _agent_instance will be handled by app context now

    def __init__(self):
        # Agent initialization will be handled by get_brain_agent_instance
        pass

    def _load_history(self, session_id: str) -> List[BaseMessage]:
        history_dicts = _conversation_histories.get(session_id, [])
        history_messages: List[BaseMessage] = []
        for msg_dict in history_dicts:
            if msg_dict.get('type') == 'human':
                history_messages.append(HumanMessage(content=msg_dict.get('content', '')))
            elif msg_dict.get('type') == 'ai':
                # We only store the content for AIMessage for simplicity here.
                # If tools calls/ids need to be part of history for re-invocation, this needs expansion.
                history_messages.append(AIMessage(content=msg_dict.get('content', '')))
            # ToolMessages and SystemMessages are usually not re-fed as direct history this way
            # as they are part of a specific turn's execution context.
        return history_messages

    def _save_history(self, session_id: str, current_turn_messages: List[Dict[str, Any]]):
        if session_id not in _conversation_histories:
            _conversation_histories[session_id] = []
        
        # Extract Human and AI messages from the current turn to append to history
        # We want to store simplified versions, mainly the conversational parts.
        # The agent's `full_conversation_this_turn` includes system prompts and tool messages too.
        simplified_turn_history = []
        for msg_data in current_turn_messages:
            msg_type = msg_data.get('type')
            msg_content = msg_data.get('data', {}).get('content', '')
            is_tool_call_response = bool(msg_data.get('data', {}).get('tool_calls'))

            if msg_type == 'human':
                simplified_turn_history.append({"type": "human", "content": msg_content})
            elif msg_type == 'ai' and not is_tool_call_response: # Only save AI messages that are direct responses
                simplified_turn_history.append({"type": "ai", "content": msg_content})
        
        _conversation_histories[session_id].extend(simplified_turn_history)
        
        # Trim history to MAX_HISTORY_LENGTH (pairs of Human/AI messages)
        if len(_conversation_histories[session_id]) > MAX_HISTORY_LENGTH * 2:
            # Keep the most recent messages
            _conversation_histories[session_id] = _conversation_histories[session_id][-(MAX_HISTORY_LENGTH * 2):]

    def handle_query(self, user_query: str, tenant_id: str, session_id: Optional[str] = None):
        agent = get_brain_agent_instance()
        if not agent:
            logger.error("Brain agent is not initialized or initialization failed. Cannot handle query.")
            return {
                "query": user_query,
                "response": "Error: The Brain AI is currently unavailable. Please try again later or contact support.",
                "actions_taken": [],
                "conversation_history_debug": []
            }
        
        conversation_history: List[BaseMessage] = []
        if session_id:
            conversation_history = self._load_history(session_id)
            logger.debug(f"Loaded history for session {session_id}: {len(conversation_history)} messages")

        try:
            result = agent.invoke(
                user_query,
                tenant_id=tenant_id,
                session_id=session_id, 
                conversation_history=conversation_history
            )
            
            if session_id and result.get("full_conversation_this_turn"):
                self._save_history(session_id, result["full_conversation_this_turn"])
                logger.debug(f"Saved history for session {session_id}. New length: {len(_conversation_histories.get(session_id, []))}")

            # For debugging, add current history to response
            # result["conversation_history_debug"] = [msg.dict() for msg in self._load_history(session_id)] if session_id else []
            return result
        except Exception as e:
            logger.error(f"Error during brain agent invocation for query '{user_query}': {e}", exc_info=True)
            return {
                "query": user_query,
                "response": f"An error occurred while processing your request: {str(e)}",
                "actions_taken": [],
                "conversation_history_debug": [msg.dict() for msg in conversation_history] # Show history up to the error
            }

# --- Function to initialize the agent with the app (optional, for pre-loading) ---
def init_brain_service_with_app(app):
    with app.app_context():
        get_brain_agent_instance() # This will initialize it and store in g for the current app context
    logger.info("BrainService pre-initialization attempted with app context.")
    # Note: `g` is request-bound by default. For a true app-singleton, 
    # you might store it on `app.extensions` or a custom app attribute if needed across requests without `g`.
    # However, for models that might have state or resource implications per request context, 
    # or if re-initialization on app worker restart is fine, `g` can work if managed. 
    # A more robust singleton for heavy objects often involves custom app extensions.
    # For now, this ensures it's loaded on first request to the service via the app context.
    # To make it a true app-level singleton, independent of `g`, we'd adjust `get_brain_agent_instance`
    # and potentially initialize it in `create_app` and store on `current_app` directly.
    # Let's refine get_brain_agent_instance to be a more robust app-level singleton.

# We'll use this app-level one now. Modify get_brain_agent_instance in BrainService and routes.
# The BrainService methods should then call this app-level getter.

# Re-defining the service method to use the app-level agent getter directly.
# The BrainService class itself doesn't need to change much further for this part. 