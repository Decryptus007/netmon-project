from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import ToolExecutor, ToolInvocation
from typing import TypedDict, Annotated, Sequence, List, Optional, Dict, Any
import operator
import logging
from flask import current_app
from langchain.chat_models import init_chat_model

from .tools import all_tools # Your defined tools

logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    # Accumulates a summary of tool calls (name, input, output) throughout the graph invocation
    actions_taken_summary: List[Dict[str, Any]] # Changed: No longer Optional, will be initialized
    # New fields for HITL configuration confirmation
    pending_config_device: Optional[str]
    pending_config_commands: Optional[List[str]]
    is_awaiting_config_confirmation: bool

DEFAULT_SYSTEM_PROMPT = ( # Default system prompt - WILL BE UPDATED
    "You are Tracix Brain, an expert network operations assistant. "
    "Your goal is to help users understand and resolve network issues. "
    "You have access to a suite of tools to diagnose problems, check device status, identify device locations, "
    "generate configuration fixes, and apply those fixes after explicit user confirmation.\n\n" 
    "Key Interaction Patterns:\n" 
    "1. Diagnosis: Use diagnostic tools to understand the issue. Summarize findings for the user.\n" 
    "2. Configuration Generation: If a configuration change is identified as a solution, use the 'generate_configuration_fix' tool. "
    "   This tool will provide suggested commands as a JSON string. You need to parse this JSON to extract the commands and device name(s).\n" 
    "3. User Confirmation Request: Before applying any configuration, you MUST obtain explicit user confirmation. To do this:\n"
    "   a. After parsing the configuration from 'generate_configuration_fix', call the 'prepare_config_confirmation' tool with the exact device_name and list of command strings.\n"
    "   b. Then, present the proposed commands and device clearly to the user and ask for their explicit confirmation (e.g., \"Do you want to apply these commands to device X?\"). Await their response.\n"
    "4. Applying Configuration (After User Confirms):\n"
    "   - If the user explicitly confirms (e.g., \"yes\", \"proceed\"), retrieve the pending device and commands (which were stored by 'prepare_config_confirmation') and call the 'apply_configuration_fix' tool. This tool requires `device_name`, `configuration_commands`, and you MUST set `confirm_apply=True`.\n"
    "   - After calling 'apply_configuration_fix' (whether it succeeds or fails), you MUST then call the 'clear_config_confirmation_state' tool to reset the pending confirmation status.\n"
    "5. Handling Denials or Changes: If the user denies the configuration, or asks for changes, call 'clear_config_confirmation_state' and then re-evaluate. Do NOT proceed with applying the original commands.\n"
    "6. Clarity & Safety: Always be clear. Prioritize network stability. If unsure, ask for clarification."
)

class BrainLangGraphAgent:
    def __init__(self, system_prompt: str = None):
        if not current_app.config.get('OPENAI_API_KEY'):
            raise ValueError("OPENAI_API_KEY is not set in the configuration.")
        
        self.llm = init_chat_model(
            model="gpt-4-turbo-preview", # Or your preferred model
            openai_api_key=current_app.config['OPENAI_API_KEY'],
            temperature=0.1,
            model_provider="openai"
        )
        self.tool_executor = ToolExecutor(all_tools)
        self.graph = self._build_graph()
        self.system_prompt_content = system_prompt or DEFAULT_SYSTEM_PROMPT

    def _should_continue(self, state: AgentState) -> str:
        messages = state['messages']
        last_message = messages[-1]
        # If the LLM last spoke and responded with a message that has no tool calls, it's the end of this turn.
        if isinstance(last_message, AIMessage) and not last_message.tool_calls:
            return "end"
        # Otherwise, if there are tool_calls or if the last message was a ToolMessage (meaning tools just ran),
        # we continue the loop to let the LLM process tool results or make new calls.
        return "continue"

    def _call_model(self, state: AgentState):
        messages = state['messages']
        # Prepend system message to every LLM call in the graph
        # This ensures the agent adheres to its defined role and instructions.
        system_message = SystemMessage(content=self.system_prompt_content)
        
        # Filter out any existing SystemMessage from `messages` to avoid duplication if graph loops
        # and messages are passed through. This is a simple way; more complex history management might be needed.
        user_and_tool_messages = [msg for msg in messages if not isinstance(msg, SystemMessage)]
        
        response = self.llm.invoke([system_message] + user_and_tool_messages)
        return {"messages": [response]} # The new AIMessage is added to the list of messages

    def _call_tool_executor(self, state: AgentState):
        messages = state['messages']
        last_message = messages[-1]
        actions: List[ToolInvocation] = []
        
        # Initialize updates for state fields, starting with existing actions_taken_summary
        # Make a copy to avoid modifying the original list in place during iteration if issues arise.
        updated_actions_summary = list(state.get("actions_taken_summary", []))
        
        # Initialize other state fields from the current state
        updated_pending_device = state.get("pending_config_device")
        updated_pending_commands = state.get("pending_config_commands")
        updated_is_awaiting_confirmation = state.get("is_awaiting_config_confirmation")

        if not hasattr(last_message, 'tool_calls') or not last_message.tool_calls:
            logger.warning("_call_tool_executor called without tool_calls in the last message.")
            # Return current state values if no tools are called
            return {
                "messages": [], 
                "actions_taken_summary": updated_actions_summary,
                "pending_config_device": updated_pending_device,
                "pending_config_commands": updated_pending_commands,
                "is_awaiting_config_confirmation": updated_is_awaiting_confirmation
            }

        tool_call_details_for_summary = []
        for tool_call in last_message.tool_calls:
            actions.append(ToolInvocation(tool=tool_call["name"], tool_input=tool_call["args"]))
            tool_call_details_for_summary.append({
                "tool_name": tool_call["name"],
                "tool_input": tool_call["args"],
                "tool_call_id": tool_call["id"]
            })
        
        responses = self.tool_executor.batch(actions)
        
        tool_messages: List[ToolMessage] = []

        for i, (action, response_content, tool_detail) in enumerate(zip(actions, responses, tool_call_details_for_summary)):
            tool_messages.append(
                ToolMessage(content=str(response_content), name=action.tool, tool_call_id=tool_detail["tool_call_id"])
            )
            tool_summary_entry = {**tool_detail, "tool_output": str(response_content)}
            updated_actions_summary.append(tool_summary_entry)

            # Update state based on specific tool calls
            if action.tool == "prepare_config_confirmation":
                if action.tool_input and isinstance(action.tool_input, dict):
                    updated_pending_device = action.tool_input.get("device_name")
                    updated_pending_commands = action.tool_input.get("commands")
                    updated_is_awaiting_confirmation = True
                    logger.info(f"State updated by prepare_config_confirmation: Device: {updated_pending_device}, Awaiting: {updated_is_awaiting_confirmation}")
            
            elif action.tool == "clear_config_confirmation_state":
                updated_pending_device = None
                updated_pending_commands = None
                updated_is_awaiting_confirmation = False
                logger.info(f"State updated by clear_config_confirmation_state: Awaiting: {updated_is_awaiting_confirmation}")
            elif action.tool == "apply_configuration_fix":
                # After an attempt to apply (success or fail), if the call implied confirmation (confirm_apply=True),
                # we should ideally clear the pending state. This is guided by the system prompt.
                # The LLM should call clear_config_confirmation_state next.
                # However, for safety, if `confirm_apply` was true, we can also clear it here.
                if action.tool_input and isinstance(action.tool_input, dict) and action.tool_input.get("confirm_apply") is True:
                    logger.info(f"apply_configuration_fix with confirm_apply=True was called. LLM should call clear_config_confirmation_state next.")
                    # No direct state change here; relying on LLM to call clear_config_confirmation_state as per prompt.
                    pass 

        return {
            "messages": tool_messages, 
            "actions_taken_summary": updated_actions_summary,
            "pending_config_device": updated_pending_device,
            "pending_config_commands": updated_pending_commands,
            "is_awaiting_config_confirmation": updated_is_awaiting_confirmation
        }

    def _build_graph(self):
        workflow = StateGraph(AgentState)
        workflow.add_node("agent", self._call_model)
        workflow.add_node("action", self._call_tool_executor)
        workflow.set_entry_point("agent")
        workflow.add_conditional_edges(
            "agent",
            self._should_continue,
            {
                "continue": "action",
                "end": END,
            },
        )
        workflow.add_edge("action", "agent")
        return workflow.compile()

    def invoke(self, query: str, tenant_id: str, session_id: Optional[str] = None, conversation_history: Optional[List[BaseMessage]] = None):
        # session_id can be used to load/store conversation history for follow-up questions.
        # tenant_id might be used to scope tools or provide context if needed.
        
        # Prepare initial messages: start with history (if any), then the new user query.
        # The system prompt will be added by _call_model node in the graph.
        initial_messages: List[BaseMessage] = []
        if conversation_history:
            initial_messages.extend(conversation_history)
        initial_messages.append(HumanMessage(content=query))

        inputs = {
            "messages": initial_messages,
            "actions_taken_summary": [], # Initialize as an empty list for each new invocation run
            # Initialize new state fields
            "pending_config_device": None,
            "pending_config_commands": None,
            "is_awaiting_config_confirmation": False,
        }
        # If you add tenant_id to AgentState and need it globally: inputs["tenant_id"] = tenant_id

        final_state = self.graph.invoke(inputs)
        
        response_messages = final_state.get('messages', [])
        # The last AIMessage is typically the agent's response to the user for this turn.
        final_ai_message_content = "No AI response generated for this turn." 
        if response_messages and isinstance(response_messages[-1], AIMessage):
            final_ai_message_content = response_messages[-1].content
        elif response_messages and any(isinstance(msg, AIMessage) for msg in response_messages):
            # Fallback: find the last AIMessage if it's not THE last message (e.g. if graph ended on tool error)
            for msg in reversed(response_messages):
                if isinstance(msg, AIMessage):
                    final_ai_message_content = msg.content
                    break
        
        actions_summary = final_state.get("actions_taken_summary", [])

        # The full conversation for this invoke call (excluding prior history passed in)
        # This is useful for the caller to update its own history.
        # The system prompt is added within the graph, so it will appear in these messages.
        current_turn_messages = final_state.get('messages', []) 

        # Include the final confirmation state in the response for debugging/visibility
        final_confirmation_state = {
            "pending_config_device": final_state.get("pending_config_device"),
            "pending_config_commands_count": len(final_state.get("pending_config_commands", [])), # just count for brevity
            "is_awaiting_config_confirmation": final_state.get("is_awaiting_config_confirmation")
        }

        return {
            "query": query,
            "response": final_ai_message_content,
            "full_conversation_this_turn": [msg.dict() for msg in current_turn_messages], 
            "actions_taken": actions_summary,
            "confirmation_status": final_confirmation_state # Added for visibility
        }

# Example usage (for testing, not directly in service yet):
# if __name__ == "__main__":
#     # This requires OPENAI_API_KEY to be set in environment
#     # Mock Flask app and config for testing
#     class MockApp:
#         def __init__(self):
#             self.config = {
#                 "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY"),
#                 "PYATS_TESTBED_FILE": "testbed.yaml" # Path to your testbed
#             }
#             self.logger = logging.getLogger("mock_app")
#             logging.basicConfig(level=logging.INFO)

#     current_app = MockApp() # This makes current_app.config work
    
#     agent = BrainLangGraphAgent()
#     # result = agent.invoke("Where is device with MAC aa:bb:cc:dd:ee:ff connected?", tenant_id="test-tenant")
#     result = agent.invoke("Can router1 ping 10.0.0.2?", tenant_id="test-tenant")
#     print(result) 