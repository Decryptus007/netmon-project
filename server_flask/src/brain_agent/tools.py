from langchain_core.tools import tool
from langchain_openai import ChatOpenAI # For the diagnostic tool's LLM
from flask import current_app
import logging
import os
import re # For MAC/IP address validation
import json # For parsing LLM response
import yaml # For writing YAML for auto-generated testbed
from typing import List, Dict, Any, Callable
from elasticsearch import Elasticsearch, exceptions as es_exceptions # For Elasticsearch
from pyats.easypy import run # For running pyATS jobs/scripts
from pyats.topology import loader # For loading testbed

# For a real PyATS integration, you'd need a testbed file.
# PYATS_TESTBED_FILE = os.environ.get("PYATS_TESTBED_FILE", "testbed.yaml") 
# testbed = None
# if os.path.exists(PYATS_TESTBED_FILE):
#     testbed = loader.load(PYATS_TESTBED_FILE)
# else:
#     logging.warning(f"PyATS testbed file {PYATS_TESTBED_FILE} not found. PyATS tools will be limited.")

# Attempt to load PyATS - this is crucial for PyATS-based tools
try:
    from pyats.topology import loader as pyats_loader
    from pyats.easypy import runtime as pyats_runtime # For potentially running job files if needed
    # from genie.libs.ops.interface.iosxe.interface import Interface as GenieInterface # Example Genie Ops object
    # from genie.libs.ops.ospf.iosxe.ospf import Ospf as GenieOspf # Example
    PYATS_AVAILABLE = True
except ImportError:
    PYATS_AVAILABLE = False
    pyats_loader = None
    pyats_runtime = None
    logging.warning(
        "PyATS libraries not found. PyATS-based tools will be simulated or unavailable. "
        "Please install pyats[full] and genie to enable them."
    )

logger = logging.getLogger(__name__)

# --- Environment Variables for Auto-Generated Testbed (if main testbed file not found) ---
PYATS_GEN_DEFAULT_USERNAME = os.environ.get("PYATS_GEN_DEFAULT_USERNAME", "admin")
PYATS_GEN_DEFAULT_PASSWORD = os.environ.get("PYATS_GEN_DEFAULT_PASSWORD", "cisco") # Example, use secure defaults
PYATS_GEN_DEFAULT_PROTOCOL = os.environ.get("PYATS_GEN_DEFAULT_PROTOCOL", "ssh")
PYATS_GEN_ENABLE_PASSWORD = os.environ.get("PYATS_GEN_ENABLE_PASSWORD") # Optional
ES_HOST_FOR_TESTBED_GEN = os.environ.get('ES_HOST_FOR_TESTBED_GEN', 'http://localhost:9200')
ES_DEVICE_INDEX_FOR_TESTBED_GEN = os.environ.get('ES_DEVICE_INDEX_FOR_TESTBED_GEN', 'devices_index')
# Define which device types from Elasticsearch should be included in the auto-generated testbed
ES_DEVICE_TYPES_FOR_TESTBED = ["router", "switch", "firewall"] # Customize as needed

# --- PyATS Testbed Loading (with auto-generation fallback) ---
testbed = None
if PYATS_AVAILABLE:
    pyats_testbed_file_path = None
    # Prioritize environment variable for testbed path
    env_path = os.environ.get("PYATS_TESTBED_FILE")
    if env_path:
        pyats_testbed_file_path = env_path
    elif current_app: # Fallback to Flask app config if current_app is available
        pyats_testbed_file_path = current_app.config.get("PYATS_TESTBED_FILE")

    if not pyats_testbed_file_path:
        logger.warning("PYATS_TESTBED_FILE path not defined in environment or Flask config. Cannot load or auto-generate testbed.")
    else:
        if not os.path.exists(pyats_testbed_file_path):
            logger.info(f"PyATS testbed file '{pyats_testbed_file_path}' not found. Attempting to auto-generate from Elasticsearch.")
            try:
                es_client_gen = Elasticsearch(ES_HOST_FOR_TESTBED_GEN, request_timeout=10)
                if not es_client_gen.ping():
                    raise es_exceptions.ConnectionError(f"Failed to connect to ES at {ES_HOST_FOR_TESTBED_GEN} for testbed generation.")
                logger.info(f"Connected to ES at {ES_HOST_FOR_TESTBED_GEN} for testbed generation.")

                # Define the field name for IP address in your ES index
                # This should be a keyword field or an IP field for accurate aggregation.
                # If it's a text field, use .keyword (e.g., "ipAddress.keyword")
                ip_address_field_for_aggregation = "ipAddress.keyword" 
                # If your ipAddress field is already mapped as type 'ip', you might just use "ipAddress"
                # Adjust if your field name is different, e.g., "managementIp.keyword"

                query_body = {
                    "size": 0,  # We don't need the hits from the main query, only aggregations
                    "query": {
                        "terms": {
                            "type.keyword": ES_DEVICE_TYPES_FOR_TESTBED
                        }
                    },
                    "aggs": {
                        "unique_ips": {
                            "terms": {
                                "field": ip_address_field_for_aggregation,
                                "size": 1000  # Max unique IPs to consider for testbed
                            },
                            "aggs": {
                                "representative_doc": {
                                    "top_hits": {
                                        "size": 1 # Get only one document per unique IP
                                        # If you have a timestamp, you can sort to get the most recent:
                                        # "sort": [{"@timestamp": {"order": "desc"}}]
                                    }
                                }
                            }
                        }
                    }
                }
                logger.debug(f"Elasticsearch query for testbed generation: {json.dumps(query_body)}")
                res = es_client_gen.search(index=ES_DEVICE_INDEX_FOR_TESTBED_GEN, body=query_body)
                
                # Process aggregation results
                pyats_testbed_dict = {'devices': {}}
                buckets = res.get('aggregations', {}).get('unique_ips', {}).get('buckets', [])

                if buckets:
                    for bucket in buckets:
                        # The representative document is in the top_hits of the sub-aggregation
                        if bucket['representative_doc']['hits']['hits']:
                            device_data = bucket['representative_doc']['hits']['hits'][0]['_source']
                            device_name = device_data.get('name')
                            device_os = device_data.get('platform') 
                            device_type_from_es = device_data.get('type')
                            # The IP address is the key of the bucket in this aggregation
                            device_ip = bucket.get('key') 

                            if not all([device_name, device_os, device_type_from_es, device_ip]):
                                logger.warning(f"Skipping device (IP: {device_ip}) due to missing critical info (name, platform, type): {device_data}")
                                continue
                            
                            pyats_device_entry = {
                                'os': device_os,
                                'type': device_type_from_es,
                                'connections': {
                                    'cli': {
                                        'protocol': PYATS_GEN_DEFAULT_PROTOCOL,
                                        'ip': device_ip
                                    }
                                },
                                'credentials': {
                                    'default': {
                                        'username': PYATS_GEN_DEFAULT_USERNAME,
                                        'password': PYATS_GEN_DEFAULT_PASSWORD
                                    }
                                }
                            }
                            if PYATS_GEN_ENABLE_PASSWORD:
                                pyats_device_entry['credentials']['enable'] = {'password': PYATS_GEN_ENABLE_PASSWORD}
                            
                            # Use device_name as the key in the testbed. Ensure device_name is unique.
                            # If multiple devices could share a name but have different IPs (unlikely for management IPs),
                            # you might need a different strategy for the testbed device key.
                            if device_name in pyats_testbed_dict['devices']:
                                logger.warning(f"Duplicate device name '{device_name}' encountered during testbed generation for IP {device_ip}. Overwriting. Ensure names are unique or adjust testbed keying.")
                            pyats_testbed_dict['devices'][device_name] = pyats_device_entry
                    
                    if pyats_testbed_dict['devices']:
                        try:
                            # Ensure parent directory exists
                            os.makedirs(os.path.dirname(pyats_testbed_file_path), exist_ok=True)
                            with open(pyats_testbed_file_path, 'w') as f:
                                yaml.dump(pyats_testbed_dict, f, sort_keys=False, default_flow_style=False, Dumper=yaml.SafeDumper)
                            logger.info(f"Successfully auto-generated PyATS testbed file at '{pyats_testbed_file_path}'.")
                        except IOError as e:
                            logger.error(f"Failed to write auto-generated testbed file to '{pyats_testbed_file_path}': {e}")
                        except yaml.YAMLError as e:
                            logger.error(f"Failed to dump testbed data to YAML for '{pyats_testbed_file_path}': {e}")
                    else:
                        logger.warning(f"No valid devices processed from Elasticsearch aggregations to generate testbed.")
                else:
                    logger.warning(f"No device IP buckets returned from Elasticsearch aggregation on index '{ES_DEVICE_INDEX_FOR_TESTBED_GEN}' for testbed generation.")

            except es_exceptions.ConnectionError as e_conn:
                 logger.error(f"Elasticsearch connection error during testbed auto-generation: {e_conn}")
            except es_exceptions.NotFoundError as e_nf:
                logger.error(f"Elasticsearch index '{ES_DEVICE_INDEX_FOR_TESTBED_GEN}' not found during testbed auto-generation: {e_nf}")
            except es_exceptions.ElasticsearchException as e_es:
                logger.error(f"Elasticsearch query error during testbed auto-generation: {e_es}", exc_info=True)
            except Exception as e_gen:
                logger.error(f"Unexpected error during PyATS testbed auto-generation: {e_gen}", exc_info=True)

        # Attempt to load the testbed file (either pre-existing or newly generated)
        if os.path.exists(pyats_testbed_file_path):
            try:
                testbed = pyats_loader.load(pyats_testbed_file_path)
                logger.info(f"Successfully loaded PyATS testbed from '{pyats_testbed_file_path}'.")
            except Exception as e:
                logger.error(f"Failed to load PyATS testbed from '{pyats_testbed_file_path}': {e}", exc_info=True)
                testbed = None # Ensure testbed is None if loading failed
        else:
            logger.warning(f"PyATS testbed file '{pyats_testbed_file_path}' not found, even after auto-generation attempt. PyATS tools will be limited.")
            
elif not PYATS_AVAILABLE:
    logger.info("PyATS not available, PyATS tools will be simulated.")

# --- Regex for IP and MAC ---
# Simple MAC address regex: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
MAC_ADDRESS_REGEX = r"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
# Simple IPv4 address regex
IP_ADDRESS_REGEX = r"^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"

# --- Helper to get Elasticsearch client ---
# In a larger application, you might have a shared ES client utility
def get_es_client():
    es_host = current_app.config.get('ELASTICSEARCH_HOST', 'http://localhost:9200')
    return Elasticsearch(es_host)

# --- PyATS Helper Functions (Implement with actual PyATS logic) ---

def _pyats_check_device_cpu_memory(device_name: str) -> Dict[str, Any]:
    logger.info(f"PyATS Helper: Checking CPU/Memory for {device_name}")
    if not PYATS_AVAILABLE or not testbed or device_name not in testbed.devices:
        return {"status": "error", "output": f"PyATS unavailable or device {device_name} not in testbed."}
    
    device = testbed.devices[device_name]
    output_summary = []
    error_occurred = False

    try:
        logger.info(f"Connecting to {device_name} for CPU/Memory check...")
        device.connect(log_stdout=False, learn_hostname=True) # learn_hostname can be useful

        # Example for Cisco IOS/IOS-XE - adapt for other OS types using device.os
        # For CPU:
        # 'show processes cpu sorted' can be very long. 'show processes cpu history' is often better for a snapshot.
        cpu_command = "show processes cpu history" 
        if device.os == 'nxos':
            cpu_command = "show processes cpu" # NX-OS has a different layout
        
        logger.info(f"Executing: {cpu_command} on {device_name}")
        cpu_output_raw = device.execute(cpu_command)
        # Simple parsing for illustration - robust parsing needed for production
        # For Genie: cpu_data = device.parse(cpu_command) then extract from structured data.
        output_summary.append(f"CPU Info from {device_name}:\\n{cpu_output_raw[:500]}...") # Truncate for summary

        # For Memory:
        mem_command = "show memory statistics"
        if device.os == 'nxos':
            mem_command = "show system resources" # Or "show memory summary"
        
        logger.info(f"Executing: {mem_command} on {device_name}")
        mem_output_raw = device.execute(mem_command)
        output_summary.append(f"Memory Info from {device_name}:\\n{mem_output_raw[:500]}...") # Truncate

        return {"status": "success", "output": "\\n".join(output_summary)}

    except Exception as e:
        logger.error(f"PyATS Error checking CPU/Memory on {device_name}: {e}", exc_info=True)
        error_occurred = True
        return {"status": "error", "output": f"Failed to check CPU/Memory on {device_name}: {str(e)}"}
    finally:
        if device.is_connected:
            logger.info(f"Disconnecting from {device_name} after CPU/Memory check.")
            device.disconnect()

def _pyats_check_interface_errors_utilization(device_name: str, interface_name: str) -> Dict[str, Any]:
    logger.info(f"PyATS Helper: Checking interface errors/utilization for {device_name} interface {interface_name}")
    if not PYATS_AVAILABLE or not testbed or device_name not in testbed.devices:
        return {"status": "error", "output": f"PyATS unavailable or device {device_name} not in testbed."}

    device = testbed.devices[device_name]
    try:
        logger.info(f"Connecting to {device_name} for interface status on {interface_name}...")
        device.connect(log_stdout=False, learn_hostname=True)

        # Using device.parse() with Genie is highly recommended for structured data
        # Ensure parsers for 'show interface <interface_name>' are available for your device.os
        interface_command = f"show interface {interface_name}"
        logger.info(f"Executing/Parsing: {interface_command} on {device_name}")
        
        # Example: parsed_interface_data = device.parse(interface_command)
        # Then extract specific counters:
        # if parsed_interface_data:
        #     oper_status = parsed_interface_data.get('oper_status', 'N/A')
        #     input_errors = parsed_interface_data.get('counters', {}).get('in_errors', 'N/A')
        #     output_errors = parsed_interface_data.get('counters', {}).get('out_errors', 'N/A')
        #     # ... and so on for other relevant fields (CRC, runts, giants, utilization tx/rx)
        #     summary = (f"Interface: {interface_name} on {device_name}\\n"
        #                f"  Operational Status: {oper_status}\\n"
        #                f"  Input Errors: {input_errors}\\n"
        #                f"  Output Errors: {output_errors}\\n"
        #                # Add more details as needed
        #               )
        #     return {"status": "success", "output": summary, "data": parsed_interface_data}
        # else:
        #     return {"status": "error", "output": f"Could not parse interface data for {interface_name} on {device_name}."}

        # Fallback to raw execute if parse is not set up or fails (less ideal)
        raw_output = device.execute(interface_command)
        return {"status": "success", "output": f"Raw output for 'show interface {interface_name}' on {device_name}:\\n{raw_output[:1000]}..."} # Truncate

    except Exception as e:
        logger.error(f"PyATS Error checking interface {interface_name} on {device_name}: {e}", exc_info=True)
        return {"status": "error", "output": f"Failed to check interface {interface_name} on {device_name}: {str(e)}"}
    finally:
        if device.is_connected:
            logger.info(f"Disconnecting from {device_name} after interface check.")
            device.disconnect()

def _pyats_ping_test(device_name: str, destination_ip: str) -> Dict[str, Any]:
    logger.info(f"PyATS Helper: Performing ping from {device_name} to {destination_ip}")
    if not PYATS_AVAILABLE or not testbed or device_name not in testbed.devices:
        return {"status": "error", "output": f"PyATS unavailable or device {device_name} not in testbed."}
    
    device = testbed.devices[device_name]
    try:
        logger.info(f"Connecting to {device_name} for ping test to {destination_ip}...")
        device.connect(log_stdout=False, learn_hostname=True)
        
        # The device.ping() method is quite versatile.
        # It often returns a string summary, but for some OS/connection types, it can return structured data.
        # Check PyATS documentation for your specific setup.
        logger.info(f"Executing ping from {device_name} to {destination_ip}")
        ping_output = device.ping(destination_ip) # Add parameters like count, timeout if needed
        
        # Process ping_output: If it's a string, it's likely a summary.
        # If it's a dict, it might contain 'success_rate_percent', 'packets_sent', 'packets_received'.
        if isinstance(ping_output, str):
            # Basic check for success in common string outputs
            if "!!!" in ping_output or "Success rate is 100" in ping_output or " 0% packet loss" in ping_output.lower():
                status = "success"
            elif "Success rate is 0" in ping_output or "100% packet loss" in ping_output.lower():
                status = "error" # Or "warning" if some packets get through
            else:
                status = "info" #indeterminate from string
            return {"status": status, "output": f"Ping from {device_name} to {destination_ip}:\\n{ping_output}"}
        elif isinstance(ping_output, dict): # Ideal case if structured data is returned
            success_rate = ping_output.get('statistics', {}).get('success_rate_percent', 'N/A')
            return {"status": "success" if success_rate == 100.0 else "error", 
                    "output": f"Ping from {device_name} to {destination_ip}: Success Rate {success_rate}%", 
                    "data": ping_output}
        else:
            return {"status": "info", "output": f"Ping from {device_name} to {destination_ip} executed. Output type: {type(ping_output)}, Raw: {str(ping_output)[:500]}"}

    except Exception as e:
        logger.error(f"PyATS Error during ping from {device_name} to {destination_ip}: {e}", exc_info=True)
        return {"status": "error", "output": f"Failed to perform ping from {device_name} to {destination_ip}: {str(e)}"}
    finally:
        if device.is_connected:
            logger.info(f"Disconnecting from {device_name} after ping test.")
            device.disconnect()

def _pyats_traceroute_test(device_name: str, destination_ip: str) -> Dict[str, Any]:
    logger.info(f"PyATS Helper: Performing traceroute from {device_name} to {destination_ip}")
    if not PYATS_AVAILABLE or not testbed or device_name not in testbed.devices:
        return {"status": "error", "output": f"PyATS unavailable or device {device_name} not in testbed."}
    # Example: result = device.traceroute(destination_ip)
    return {"status": "success", "output": f"Simulated traceroute from {device_name} to {destination_ip}: Path: {device_name} -> hop1 -> hop2 -> {destination_ip}."}

def _pyats_get_device_logs(device_name: str, log_filter: str = None, max_lines: int = 100) -> Dict[str, Any]:
    logger.info(f"PyATS Helper: Getting logs for {device_name}. Filter: '{log_filter}', Max lines: {max_lines}")
    if not PYATS_AVAILABLE or not testbed or device_name not in testbed.devices:
        return {"status": "error", "output": f"PyATS unavailable or device {device_name} not in testbed."}
    
    device = testbed.devices[device_name]
    try:
        logger.info(f"Connecting to {device_name} to get logs...")
        device.connect(log_stdout=False, learn_hostname=True)
        
        log_command = "show logging" # Default
        # OS-specific command adjustments
        if hasattr(device, 'os'):
            if device.os == 'nxos':
                log_command = "show logging logfile" 
            elif device.os == 'junos':
                log_command = "show log messages"
            # Add other OS types as needed: elif device.os == 'asa': log_command = "show logging"
        
        # Applying filter and line limits. This is highly OS and command dependent.
        # For simplicity, we'll fetch logs and then filter/truncate in Python if needed,
        # though server-side filtering via CLI is more efficient.
        # Example: if log_filter: log_command += f" | include {log_filter}" (IOS specific)
        
        logger.info(f"Executing: {log_command} on {device_name}")
        raw_logs = device.execute(log_command)
        
        log_lines = raw_logs.splitlines()
        
        if log_filter:
            log_lines = [line for line in log_lines if re.search(log_filter, line, re.IGNORECASE)]
            
        # Get the last N lines
        if len(log_lines) > max_lines:
            final_log_lines = log_lines[-max_lines:]
        else:
            final_log_lines = log_lines
            
        output_str = "\\n".join(final_log_lines)
        if not output_str and log_filter:
             output_str = f"No log entries found on {device_name} matching filter '{log_filter}' (checked last {max_lines} of available logs if unfiltered)."
        elif not output_str:
            output_str = f"No log entries found or returned from {device_name}."

        return {"status": "success", "output": output_str if output_str else "No relevant log entries found."}

    except Exception as e:
        logger.error(f"PyATS Error getting logs from {device_name}: {e}", exc_info=True)
        return {"status": "error", "output": f"Failed to get logs from {device_name}: {str(e)}"}
    finally:
        if device.is_connected:
            logger.info(f"Disconnecting from {device_name} after getting logs.")
            device.disconnect()

@tool
def _pyats_inspect_config_and_dynamic_show(device_name: str, problem_context: str) -> Dict[str, Any]:
    """
    Retrieves the running configuration from a device, and then intelligently suggests and executes additional relevant 'show' commands 
    for deeper diagnosis based on the provided problem context. Uses an LLM to analyze the configuration and suggest targeted diagnostic commands.
    
    Args:
        device_name (str): The hostname of the device to inspect.
        problem_context (str): A brief description of the network problem or the area to focus on for diagnosis.
    
    Returns:
        Dict[str, Any]: A dictionary containing the status and output of the inspection, including relevant config snippets 
        and outputs from dynamically selected show commands.
    """
    logger.info(f"PyATS Helper: Inspecting config and dynamic shows for {device_name}. Context: '{problem_context}'")
    if not PYATS_AVAILABLE or not testbed or device_name not in testbed.devices:
        return {"status": "error", "output": f"PyATS unavailable or device {device_name} not in testbed."}

    device = testbed.devices[device_name]
    device_os = getattr(device, 'os', 'unknown')
    device_type = getattr(device, 'type', 'unknown') # e.g., router, switch
    
    full_running_config = ""
    dynamic_show_outputs = {}
    relevant_config_snippets_text = "No specific config snippets identified as relevant by keyword search."
    final_summary_parts = []

    try:
        logger.info(f"Connecting to {device_name} for config inspection...")
        device.connect(log_stdout=False, learn_hostname=True)

        # 1. Get full running configuration
        run_config_command = "show running-config"
        if device_os == 'junos':
            run_config_command = "show configuration"
        # Add other OS variants if needed
        
        logger.info(f"Executing: {run_config_command} on {device_name}")
        full_running_config = device.execute(run_config_command)
        final_summary_parts.append(f"Retrieved running configuration for {device_name} (length: {len(full_running_config)} chars).")

        # 2. Use LLM to suggest relevant config sections and dynamic show commands
        if not current_app.config.get('OPENAI_API_KEY'):
            logger.error("OPENAI_API_KEY not configured for sub-LLM in _pyats_inspect_config_and_dynamic_show")
            final_summary_parts.append("Skipping LLM-based dynamic show command selection: OpenAI API key not configured.")
        else:
            sub_llm = ChatOpenAI(
                model="gpt-3.5-turbo", 
                openai_api_key=current_app.config['OPENAI_API_KEY'],
                temperature=0
            )
            
            # Limit the length of running config passed to the LLM if it's very large
            # to avoid exceeding token limits for the sub-LLM prompt.
            # Passing full config might be too much; a summary or targeted sections might be better in some cases.
            # For this example, we'll pass a portion if too long.
            max_config_len_for_prompt = 8000 # Approx characters, adjust as needed
            config_for_prompt = full_running_config
            if len(config_for_prompt) > max_config_len_for_prompt:
                config_for_prompt = f"{full_running_config[:max_config_len_for_prompt // 2]}\n... (config truncated) ...\n{full_running_config[-max_config_len_for_prompt // 2:]}"

            prompt_for_sub_llm = f"""
            You are a network diagnostics assistant. Given a problem context, device OS ('{device_os}'), 
            device type ('{device_type}'), and a snippet of its running configuration, your task is to suggest:
            1. Up to 3 specific keywords or short phrases from the running configuration that appear most relevant to the problem. These will be used to extract snippets.
            2. Up to 3 specific, safe, read-only `show` commands (excluding 'show running-config' itself or its variants) that would be most helpful for diagnosing the problem. 
               Prioritize commands relevant to the problem context. For example, if context is about OSPF, suggest OSPF show commands.

            Problem Context: "{problem_context}"
            Device OS: {device_os}
            Device Type: {device_type}
            Running Configuration Snippet (may be truncated):
            ```
            {config_for_prompt}
            ```

            Output your suggestions in a VALID JSON object with two keys: 
            - "config_keywords": a list of strings (keywords extracted from the provided running-config snippet that are relevant to the problem).
            - "diagnostic_show_commands": a list of strings (exact `show` commands to run).

            Example for problem 'OSPF neighbor issue on a Cisco IOS router':
            {{
              "config_keywords": ["router ospf 1", "network 10.0.0.0 0.0.0.255 area 0"],
              "diagnostic_show_commands": ["show ip ospf neighbor", "show ip ospf interface brief", "show ip protocols"]
            }}
            If no specific keywords or commands are highly relevant, return empty lists for them.
            Only suggest commands appropriate for '{device_os}' and '{device_type}'.
            Ensure all suggested show commands are safe and do not alter device state.
            Output ONLY the JSON object.
            """
            try:
                logger.info("Invoking sub-LLM for diagnostic command/keyword suggestions...")
                llm_response_content = sub_llm.invoke(prompt_for_sub_llm).content
                logger.debug(f"Sub-LLM response: {llm_response_content}")
                
                # Clean up potential markdown and ensure it's valid JSON
                if llm_response_content.startswith("```json"): llm_response_content = llm_response_content[7:]
                if llm_response_content.startswith("```"): llm_response_content = llm_response_content[3:]
                if llm_response_content.endswith("```"): llm_response_content = llm_response_content[:-3]
                llm_response_content = llm_response_content.strip()

                suggestions = json.loads(llm_response_content)
                config_keywords = suggestions.get("config_keywords", [])
                diagnostic_show_commands = suggestions.get("diagnostic_show_commands", [])

                # 3. Extract relevant config snippets using keywords
                if config_keywords and full_running_config:
                    temp_snippets = []
                    # Search for whole sections related to keywords for better context
                    for keyword in config_keywords:
                        section_found = False
                        current_section = []
                        in_section = False
                        for line in full_running_config.splitlines():
                            if keyword.lower() in line.lower() and not line.strip().startswith('!'): # Start of a potential section
                                if current_section: # new keyword found, save previous section if any
                                    temp_snippets.extend(current_section)
                                    temp_snippets.append("----------")
                                    current_section = []
                                current_section.append(line)
                                in_section = True
                                section_found = True
                            elif in_section and (line.startswith(' ') or line.strip() == keyword.strip()): # part of current section
                                current_section.append(line)
                            elif in_section and not line.startswith(' '): # end of section
                                temp_snippets.extend(current_section)
                                temp_snippets.append("----------")
                                current_section = []
                                in_section = False
                        if current_section: # Append any last section
                             temp_snippets.extend(current_section)
                             temp_snippets.append("----------")
                    
                    if temp_snippets:
                        if temp_snippets[-1] == "----------": temp_snippets.pop() # Remove trailing separator
                        relevant_config_snippets_text = "Relevant configuration snippets based on keywords (" + ', '.join(config_keywords) + "):\n" + "\n".join(temp_snippets)
                        final_summary_parts.append(relevant_config_snippets_text)
                    else:
                        final_summary_parts.append(f"No specific config sections found for keywords: {config_keywords}")
                elif config_keywords:
                    final_summary_parts.append("Config keywords suggested, but running config was empty or not retrieved.")

                # 4. Execute dynamic show commands
                if diagnostic_show_commands:
                    final_summary_parts.append("Executing LLM-suggested diagnostic show commands:")
                    for cmd in diagnostic_show_commands:
                        # Security check: ensure it's a 'show' command (basic check)
                        if cmd.strip().lower().startswith("show "):
                            logger.info(f"Executing dynamic command: {cmd} on {device_name}")
                            try:
                                output = device.execute(cmd)
                                dynamic_show_outputs[cmd] = output
                                final_summary_parts.append(f"Output of '{cmd}':\n{output[:1000]}...") # Truncate
                            except Exception as e_cmd:
                                logger.error(f"Error executing dynamic command '{cmd}' on {device_name}: {e_cmd}")
                                final_summary_parts.append(f"Error executing '{cmd}': {str(e_cmd)}")
                        else:
                            logger.warning(f"Sub-LLM suggested a non-show command: '{cmd}'. Skipping.")
                            final_summary_parts.append(f"Skipped non-show command: '{cmd}'")
                else:
                    final_summary_parts.append("No specific additional diagnostic show commands suggested by LLM.")

            except json.JSONDecodeError as e_json:
                logger.error(f"Sub-LLM output was not valid JSON: {e_json}. Raw: {llm_response_content}")
                final_summary_parts.append(f"Error processing suggestions from diagnostic AI: Invalid JSON. ({llm_response_content[:200]}...)")
            except Exception as e_sub_llm:
                logger.error(f"Error during sub-LLM processing for dynamic commands: {e_sub_llm}", exc_info=True)
                final_summary_parts.append(f"Error obtaining dynamic command suggestions: {str(e_sub_llm)}")

        return {"status": "success", "output": "\n\n".join(final_summary_parts)}

    except Exception as e:
        logger.error(f"PyATS Error during config inspection on {device_name}: {e}", exc_info=True)
        return {"status": "error", "output": f"Failed to inspect config on {device_name}: {str(e)}"}
    finally:
        if device.is_connected:
            logger.info(f"Disconnecting from {device_name} after config inspection.")
            device.disconnect()

# --- Map of PyATS Diagnostic Capabilities ---
PYATS_CAPABILITIES_MAP: Dict[str, Dict[str, Any]] = {
    "check_cpu_memory": {
        "function": _pyats_check_device_cpu_memory,
        "description": "Checks CPU and memory utilization on a specified network device.",
        "params": [{"name": "device_name", "type": "string", "description": "The hostname of the device to check."}]
    },
    "check_interface_stats": {
        "function": _pyats_check_interface_errors_utilization,
        "description": "Checks a specific interface on a device for errors, discards, and utilization levels.",
        "params": [
            {"name": "device_name", "type": "string", "description": "The hostname of the device."},
            {"name": "interface_name", "type": "string", "description": "The name of the interface (e.g., GigabitEthernet0/1, Eth1/1)."}
        ]
    },
    "ping_test": {
        "function": _pyats_ping_test,
        "description": "Performs a ping test from a specified network device to a destination IP address to check reachability.",
        "params": [
            {"name": "device_name", "type": "string", "description": "The hostname of the source device for the ping."},
            {"name": "destination_ip", "type": "string", "description": "The IP address to ping."}
        ]
    },
    "traceroute_test": {
        "function": _pyats_traceroute_test,
        "description": "Performs a traceroute from a specified network device to a destination IP address to map the path.",
        "params": [
            {"name": "device_name", "type": "string", "description": "The hostname of the source device for the traceroute."},
            {"name": "destination_ip", "type": "string", "description": "The IP address to trace to."}
        ]
    },
    "get_device_logs": {
        "function": _pyats_get_device_logs,
        "description": "Retrieves recent log messages from a specified network device. Can be filtered.",
        "params": [
            {"name": "device_name", "type": "string", "description": "The hostname of the device from which to retrieve logs."},
            {"name": "log_filter", "type": "string", "optional": True, "description": "Keywords to filter logs by (e.g., an interface name, IP address, or error message)."},
            {"name": "max_lines", "type": "integer", "optional": True, "default": 100, "description": "Maximum number of recent log lines to retrieve."}
        ]
    },
    "inspect_config_and_run_dynamic_diagnostics": { # New Capability
        "function": _pyats_inspect_config_and_dynamic_show,
        "description": "Retrieves the running configuration from a device, and then intelligently suggests and executes additional relevant 'show' commands for deeper diagnosis based on the provided problem context. Returns a summary including relevant config snippets and dynamic command outputs.",
        "params": [
            {"name": "device_name", "type": "string", "description": "The hostname of the device to inspect."},
            {"name": "problem_context", "type": "string", "description": "A brief description of the network problem or the area to focus on for diagnosis."}
        ]
    }
}

# --- Main Diagnostic Tool ---
@tool
def diagnose_network_issue_with_pyats(problem_description: str, target_devices: List[str] = None) -> str:
    """
    Diagnoses a network issue using PyATS based on a problem description. 
    It will intelligently select and run relevant PyATS commands on specified target devices (if provided) or 
    potentially infer them. It can check device health (CPU, memory), interface status, connectivity (ping, traceroute), etc.
    Use this for questions like 'Why is the network slow between server A and server B?', 
    'What's wrong with router X?', or 'Diagnose connectivity issues to 10.1.1.1'.
    """
    logger.info(f"Tool: diagnose_network_issue_with_pyats called. Problem: '{problem_description}', Devices: {target_devices}")

    if not PYATS_AVAILABLE or not testbed:
        return "PyATS is not available or the testbed is not loaded. Cannot perform diagnostics."

    if not current_app.config.get('OPENAI_API_KEY'):
         return "Error: OPENAI_API_KEY is not configured for the diagnostic tool's LLM."

    diag_llm = ChatOpenAI(
        model="gpt-3.5-turbo", # Cheaper/faster model for internal decision making
        openai_api_key=current_app.config['OPENAI_API_KEY'],
        temperature=0
    )

    capabilities_description = "\n".join([
        f"- {name}: {info['description']} Parameters: {json.dumps(info['params'])}"
        for name, info in PYATS_CAPABILITIES_MAP.items()
    ])

    prompt = f"""
You are an expert network troubleshooting assistant. Based on the user's problem description, 
select a sequence of diagnostic commands to run using the available PyATS capabilities. 

Problem Description: "{problem_description}"

Available PyATS Capabilities:
{capabilities_description}

Consider the target devices if provided: {target_devices or 'None provided, infer if necessary and possible.'}

Respond with a JSON array of objects, where each object represents a command to run. 
Each object must have a "command_id" (from the list of capabilities) and a "parameters" object 
(with keys matching the capability's parameters). 

If no specific devices are mentioned by the user and the problem doesn't clearly indicate them, 
you might need to select commands that don't require a device_name or ask for clarification if critical.
If a capability requires a device_name and none can be reasonably inferred or provided, do not select it.
Prioritize simple checks first. Limit to a maximum of 3-4 commands for this initial diagnosis.

Example response format:
[ 
  {{ "command_id": "check_cpu_memory", "parameters": {{"device_name": "router1"}} }},
  {{ "command_id": "ping_test", "parameters": {{"device_name": "router1", "destination_ip": "10.0.0.1"}} }}
]
If no suitable commands can be determined, return an empty array [].
"""

    results_summary = []
    try:
        llm_response = diag_llm.invoke(prompt)
        logger.debug(f"LLM response for command selection: {llm_response.content}")
        
        # Ensure content is a string before attempting to load JSON
        content_str = llm_response.content
        if not isinstance(content_str, str):
            content_str = str(content_str) # Convert if it's some other message object attribute
        
        # Strip potential markdown code block delimiters
        if content_str.startswith("```json"): content_str = content_str[7:]
        if content_str.startswith("```"): content_str = content_str[3:]
        if content_str.endswith("```"): content_str = content_str[:-3]
        content_str = content_str.strip()

        selected_commands = json.loads(content_str)

        if not isinstance(selected_commands, list):
            logger.error(f"LLM did not return a list of commands. Response: {selected_commands}")
            return "Error: AI failed to select diagnostic commands in the expected format."

        results_summary.append(f"AI has selected the following diagnostic steps based on '{problem_description}':")
        if not selected_commands:
             results_summary.append("- No specific actions determined by AI. Further information might be needed.")

        for cmd_obj in selected_commands:
            command_id = cmd_obj.get("command_id")
            params = cmd_obj.get("parameters", {})

            if command_id in PYATS_CAPABILITIES_MAP:
                capability = PYATS_CAPABILITIES_MAP[command_id]
                func_to_call: Callable = capability["function"]
                
                # Validate device_name if present in params and testbed
                device_name_param = None
                for p_info in capability.get("params", []):
                    if p_info["name"] == "device_name":
                        device_name_param = params.get("device_name")
                        break
                
                if device_name_param and device_name_param not in testbed.devices:
                    logger.warning(f"LLM selected command '{command_id}' for device '{device_name_param}' which is not in the testbed. Skipping.")
                    results_summary.append(f"- Skipped: {command_id} on {device_name_param} (Device not in testbed). Action: {capability['description']}")
                    continue

                logger.info(f"Executing diagnostic capability: {command_id} with params: {params}")
                try:
                    result = func_to_call(**params)
                    results_summary.append(f"- Action: {capability['description']} (Params: {params}). Result: {result.get('output', 'No output')}")
                except Exception as e:
                    logger.error(f"Error executing capability {command_id}: {e}", exc_info=True)
                    results_summary.append(f"- Action: {capability['description']} (Params: {params}). Error: {str(e)}")
            else:
                logger.warning(f"LLM selected unknown command_id: {command_id}")
                results_summary.append(f"- Unknown action selected by AI: {command_id}")

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM JSON response for diagnostic commands: {e}. Response was: {llm_response.content if 'llm_response' in locals() else 'N/A'}")
        return f"Error: AI response for command selection was not valid JSON. Details: {e}"
    except Exception as e:
        logger.error(f"Error in diagnose_network_issue_with_pyats: {e}", exc_info=True)
        return f"An unexpected error occurred during diagnosis: {str(e)}"

    return "\n".join(results_summary)

# --- PyATS Related Tools (Placeholders) ---

@tool
def get_device_connectivity(device_name: str, destination_ip: str) -> str:
    """
    Checks connectivity from a given network device to a destination IP.
    For example, you can ask: 'Can router1 ping 10.0.0.1?'
    This would typically use a PyATS library or execute a ping command on the device.
    """
    logger.info(f"Tool: get_device_connectivity called for {device_name} to {destination_ip}")
    if not PYATS_AVAILABLE or not testbed or device_name not in testbed.devices:
        return f"PyATS unavailable, testbed not loaded, or device {device_name} not found in testbed."
    
    device = testbed.devices[device_name]
    try:
        # device.connect(log_stdout=False) 
        # result = device.ping(destination_ip) # This is a direct PyATS device method
        # device.disconnect()
        # return f"Ping from {device_name} to {destination_ip}: {result}" if result else f"Ping from {device_name} to {destination_ip} failed or no output."
        # For simulation:
        if destination_ip == "8.8.8.8": # Simulate common success
            return f"Simulated: Ping from {device_name} to {destination_ip} was successful (0% packet loss)."
        else:
            return f"Simulated: Ping from {device_name} to {destination_ip} timed out (100% packet loss)."
    except Exception as e:
        logger.error(f"Error during ping from {device_name} to {destination_ip}: {e}", exc_info=True)
        return f"Error performing ping from {device_name} to {destination_ip}: {str(e)}"

@tool
def get_device_interface_status(device_name: str, interface_name: str) -> str:
    """
    Retrieves the status (up/down, admin status, etc.) of a specific interface on a network device.
    Example: 'What is the status of GigabitEthernet0/1 on switch2?'
    """
    logger.info(f"Tool: get_device_interface_status called for {device_name}, interface {interface_name}")
    if not PYATS_AVAILABLE or not testbed or device_name not in testbed.devices:
        return f"PyATS unavailable, testbed not loaded, or device {device_name} not found in testbed."

    device = testbed.devices[device_name]
    try:
        # device.connect(log_stdout=False)
        # Using Genie Ops for structured data is preferred if available and learned.
        # ops_interface = GenieInterface(device=device) # This assumes Genie is installed and compatible
        # ops_interface.learn() # This can be time-consuming, consider learning once or on-demand
        # if_data = ops_interface.info.get(interface_name, {})
        # if if_data:
        #     oper_status = if_data.get('oper_status', 'N/A')
        #     line_protocol = if_data.get('line_protocol', 'N/A')
        #     description = if_data.get('description', 'N/A')
        #     return f"Interface {interface_name} on {device_name}: Status: {oper_status}/{line_protocol}, Description: {description}"
        # else:
        #     return f"Interface {interface_name} not found or no data via Genie Ops on {device_name}."
        # Fallback to CLI parsing if Genie Ops is not used or fails:
        # output = device.parse(f'show interface {interface_name}') # This requires a parser for the command
        # device.disconnect()
        # return f"Status of {interface_name} on {device_name}: {output} (raw parsed output)"
        return f"Simulated: Interface {interface_name} on {device_name} is up/up, Description: Core Link to Router2."
    except Exception as e:
        logger.error(f"Error getting interface status for {device_name} {interface_name}: {e}", exc_info=True)
        return f"Error getting interface status for {device_name} {interface_name}: {str(e)}"

@tool
def where_is_device_plugged_in(target_device_mac_or_ip: str) -> str:
    """
    Tries to find where a device (identified by MAC or IP address) is plugged into the network
    by querying the 'otel_snmp_data_index' in Elasticsearch.
    Example: 'Where is device with MAC aa:bb:cc:dd:ee:ff connected?' or 'Where is 192.168.1.50 connected?'
    """
    logger.info(f"Tool: where_is_device_plugged_in called for {target_device_mac_or_ip}")
    es_client = get_es_client()
    index_name = "otel_snmp_data_index" # As specified by the user

    # --- !!! IMPORTANT: Adjust these field names to match your Elasticsearch index schema !!! ---
    # Assumed field names in your otel_snmp_data_index:
    mac_field_in_es = "end_device_mac_address.keyword"  # Field storing the MAC of the end device (use .keyword for exact match)
    ip_field_in_es = "end_device_ip_address"      # Field storing the IP of the end device
    switch_hostname_field = "uplink_switch_hostname" # Field for the switch hostname
    switch_port_field = "uplink_switch_port"         # Field for the switch port

    query = None
    search_type = None

    if re.match(MAC_ADDRESS_REGEX, target_device_mac_or_ip):
        search_type = "MAC"
        query = {
            "bool": {
                "filter": [
                    {"term": {mac_field_in_es: target_device_mac_or_ip.lower()}}
                ]
            }
        }
        logger.info(f"Searching by MAC address: {target_device_mac_or_ip}")
    elif re.match(IP_ADDRESS_REGEX, target_device_mac_or_ip):
        search_type = "IP"
        query = {
            "bool": {
                "filter": [
                    {"term": {ip_field_in_es: target_device_mac_or_ip}}
                ]
            }
        }
        logger.info(f"Searching by IP address: {target_device_mac_or_ip}")
    else:
        return f"Invalid input: '{target_device_mac_or_ip}'. Please provide a valid MAC or IPv4 address."

    if not query: # Should not happen if regex matches, but as a safeguard
        return "Could not determine search type for the provided input."

    try:
        # Sort by timestamp if available to get the most recent information
        # Add a timestamp field from your index, e.g., "@timestamp" or "event_timestamp"
        # sort_criteria = [{"@timestamp": {"order": "desc"}}] 
        res = es_client.search(
            index=index_name,
            query=query,
            size=1 # We expect one primary location, or the most recent one
            # sort=sort_criteria # Uncomment and adjust if you have a timestamp field
        )
    except es_exceptions.NotFoundError:
        return f"Elasticsearch index '{index_name}' not found."
    except es_exceptions.ConnectionError:
        return "Could not connect to Elasticsearch. Please check the connection."
    except Exception as e:
        logger.error(f"Error querying Elasticsearch for {target_device_mac_or_ip}: {e}")
        return f"An error occurred while searching: {str(e)}"

    hits = res.get('hits', {}).get('hits', [])
    if not hits:
        return f"Device {target_device_mac_or_ip} ({search_type}) not found in '{index_name}' with the current query criteria."

    # Assuming the first hit is the most relevant or only one
    source_data = hits[0].get('_source', {})
    
    switch_hostname = source_data.get(switch_hostname_field)
    switch_port = source_data.get(switch_port_field)

    if switch_hostname and switch_port:
        return f"Device {target_device_mac_or_ip} ({search_type}) is connected to switch '{switch_hostname}' on port '{switch_port}'."
    elif switch_hostname:
        return f"Device {target_device_mac_or_ip} ({search_type}) is associated with switch '{switch_hostname}', but the specific port is unknown from the data."
    else:
        # This might mean your ES documents don't have the assumed fields, or they are null.
        # You might want to log source_data here for debugging.
        logger.warning(f"Found device {target_device_mac_or_ip} but switch/port information is missing in _source: {source_data}")
        return f"Found device {target_device_mac_or_ip} ({search_type}), but detailed switch/port location could not be determined from the available data in '{index_name}'. Check data fields: '{switch_hostname_field}', '{switch_port_field}'."

    # Note for IP-based search:
    # If 'otel_snmp_data_index' primarily contains MAC table information (MAC -> switch/port),
    # an IP-based search might be less direct. A more robust IP search might involve:
    # 1. First, query an ARP table source (possibly also in ES) to find the MAC for the given IP.
    # 2. Then, use that MAC address to search the MAC table source for the switch/port.
    # The current implementation performs a direct search based on IP against 'ip_field_in_es'.

# --- Other Tools ---

@tool
def perform_packet_capture(device_name: str, interface_name: str, duration_seconds: int = 60, filters: str = None) -> str:
    """
    Initiates a packet capture on a specified device and interface for a certain duration.
    Optionally, filters can be applied (e.g., 'host 1.2.3.4 and port 80').
    The result should be a path to the capture file or a summary.
    This is a highly complex operation and might involve remote execution on the device or a capture appliance.
    Example: 'Start a packet capture on firewall1 interface eth0 for 120 seconds, filter for host 10.1.1.1'
    """
    logger.info(f"Tool: perform_packet_capture on {device_name}/{interface_name} for {duration_seconds}s, filters: {filters}")
    # Placeholder implementation:
    # This would require SSH access to the device or an agent on the device.
    # E.g., using tcpdump or platform-specific capture commands.
    # if testbed and device_name in testbed.devices:
    #     device = testbed.devices[device_name]
    #     try:
    #         # device.connect()
    #         # capture_command = f"tcpdump -i {interface_name} -w /tmp/capture_{device_name}_{interface_name}.pcap"
    #         # if filters:
    #         #    capture_command += f" '{filters}'"
    #         # device.execute(capture_command, timeout=duration_seconds + 10) # Run in background or manage process
    #         # device.disconnect()
    #         # return f"Packet capture started on {device_name}/{interface_name}. File: /tmp/capture.pcap (Simulated)"
    #         return f"Simulated: Packet capture started on {device_name} interface {interface_name}. Results will be available at /tmp/capture.pcap."
    #     except Exception as e:
    #         logger.error(f"Error starting packet capture on {device_name}: {e}")
    #         return f"Error starting packet capture: {e}"
    # else:
    #    return f"Cannot start packet capture on {device_name}: Device not found or testbed unavailable."
    return f"Simulated: Packet capture initiated on {device_name}/{interface_name} for {duration_seconds} seconds. Filters: {filters or 'None'}."

# --- LLM-Powered Configuration Generation Tool ---
@tool
def generate_configuration_fix(problem_description: str, diagnosis_summary: str, target_devices: List[str], device_os_map: Dict[str, str] = None) -> str:
    """
    Generates suggested configuration changes to fix a network issue based on its description and diagnosis.
    Provide the problem, a summary of diagnostic findings, and a list of target device hostnames.
    Optionally, provide a map of device hostnames to their OS types (e.g., {"router1": "iosxe", "switch1": "nxos"})
    to ensure correct configuration syntax. If not provided, the tool will attempt to infer OS from the PyATS testbed if possible.
    This tool DOES NOT apply any configuration; it only generates suggestions.
    The output will be a JSON string containing a list of objects, where each object has 'device_name' and 'commands' (a list of strings).
    Example: problem_description="Interface G0/1 on router1 is down and needs to be enabled.", 
             diagnosis_summary="get_device_interface_status on router1 G0/1 showed admin down.",
             target_devices=["router1"]
    """
    logger.info(f"Tool: generate_configuration_fix called. Problem: '{problem_description}', Devices: {target_devices}")

    if not current_app.config.get('OPENAI_API_KEY'):
        # Return JSON error structure
        return json.dumps({"error": "OPENAI_API_KEY is not configured for the configuration generation LLM.", "suggested_actions": []})

    config_llm = ChatOpenAI(
        model="gpt-4-turbo-preview", 
        openai_api_key=current_app.config['OPENAI_API_KEY'],
        temperature=0.1 
    )

    resolved_device_os_map = device_os_map or {}
    if PYATS_AVAILABLE and testbed:
        for device_name in target_devices:
            if device_name not in resolved_device_os_map and device_name in testbed.devices:
                resolved_device_os_map[device_name] = testbed.devices[device_name].os
            elif device_name not in resolved_device_os_map:
                logger.warning(f"OS type for device {device_name} not provided and not found in testbed. Config generation may be generic or fail.")
                resolved_device_os_map[device_name] = "unknown"
    
    os_info_str = "\n".join([f"- {dname}: {dos if dos != 'unknown' else 'OS type not specified, generate generic or common syntax if possible and indicate assumptions.'}" for dname, dos in resolved_device_os_map.items()])
    if not target_devices:
         return json.dumps({"error": "No target devices specified for configuration generation.", "suggested_actions": []})
    if not os_info_str:
        os_info_str = "OS types for target devices not determined. Generate generic configuration if possible."

    prompt = f"""
    You are an expert network engineer. Your task is to generate the exact configuration commands needed to resolve a network issue.

    Problem Description: {problem_description}
    Diagnosis Summary: {diagnosis_summary}
    Target Device(s) and their OS types (if known):
    {os_info_str}

    Instructions:
    1. Analyze the problem and diagnosis.
    2. For each target device, generate the precise sequence of configuration commands required to fix the issue.
    3. The output MUST be a JSON array of objects. Each object must have two keys: "device_name" (string) and "commands" (an array of strings, where each string is a single configuration command line).
    4. Include all necessary mode changes within the "commands" array (e.g., "configure terminal", "interface GigabitEthernet0/1", "exit").
    5. If an OS type is 'unknown' or generic, provide commands that are widely applicable (e.g., Cisco IOS-like) and state your assumption within the commands as comments if possible.
    6. If the fix involves removing configuration, show the `no ...` commands.
    7. If the information provided is insufficient to determine a specific configuration fix, respond with a JSON array containing a single object with "device_name": "general_error" and "commands": ["Error: Insufficient information. Please provide details such as X, Y, Z."]. Do not guess commands.

    Example for enabling an interface on a Cisco IOS-XE device named 'router1':
    ```json
    [
      {{
        "device_name": "router1",
        "commands": [
          "! Configuration for router1 (iosxe)",
          "configure terminal",
          "interface GigabitEthernet0/1",
          "description Link to CoreSwitch",
          "no shutdown",
          "exit",
          "exit"
        ]
      }}
    ]
    ```

    Respond ONLY with the JSON array. Do not include any other text, explanations, or markdown formatting around the JSON.
    """

    try:
        response = config_llm.invoke(prompt)
        generated_json_str = response.content
        logger.info(f"LLM generated configuration JSON: {generated_json_str}")
        
        # Attempt to validate and reformat if necessary (simple validation for now)
        try:
            parsed_config = json.loads(generated_json_str)
            if not isinstance(parsed_config, list):
                raise ValueError("LLM did not return a list as the root JSON object.")
            for item in parsed_config:
                if not all(k in item for k in ["device_name", "commands"]):
                    raise ValueError("Each item in JSON list must have 'device_name' and 'commands' keys.")
                if not isinstance(item["commands"], list):
                    raise ValueError("'commands' key must be a list of strings.")
            # Return the validated (and potentially reformatted by json.dumps) string
            return json.dumps(parsed_config)
        except json.JSONDecodeError as je:
            logger.error(f"LLM output was not valid JSON: {je}. Raw output: {generated_json_str}")
            return json.dumps({"error": f"LLM generated invalid JSON. Raw output: {generated_json_str}", "suggested_actions": []})
        except ValueError as ve:
            logger.error(f"LLM output JSON structure was invalid: {ve}. Raw output: {generated_json_str}")
            return json.dumps({"error": f"LLM generated invalid JSON structure: {ve}. Raw output: {generated_json_str}", "suggested_actions": []})

    except Exception as e:
        logger.error(f"Error generating configuration fix with LLM: {e}", exc_info=True)
        return json.dumps({"error": f"Could not generate configuration fix due to an LLM error: {str(e)}", "suggested_actions": []})

# --- PyATS-Powered Configuration Application Tool ---
@tool
def apply_configuration_fix(device_name: str, configuration_commands: List[str], confirm_apply: bool = False) -> str:
    """
    Applies a list of configuration commands to a specified network device using PyATS.
    A crucial `confirm_apply` parameter defaults to False to prevent accidental application.
    IT MUST BE EXPLICITLY SET TO TRUE by the controlling agent or user decision to proceed with applying the configuration.
    
    Args:
        device_name (str): The hostname of the device to configure (must be in PyATS testbed).
        configuration_commands (List[str]): A list of configuration command strings to apply in sequence.
        confirm_apply (bool): Must be True to actually apply the configuration. Defaults to False (dry-run/safety).  
    """
    logger.info(f"Tool: apply_configuration_fix called for {device_name}. Confirm_apply: {confirm_apply}. Commands: {configuration_commands}")

    if not confirm_apply:
        logger.warning(f"apply_configuration_fix called for {device_name} but confirm_apply is False. No configuration will be applied.")
        return f"CONFIRMATION REQUIRED: Configuration for {device_name} was NOT applied because confirm_apply was False. Commands that would have been applied: \\n" + "\\n".join(configuration_commands)

    if not PYATS_AVAILABLE or not testbed:
        return "Error: PyATS is not available or the testbed is not loaded. Cannot apply configuration."
    
    if device_name not in testbed.devices:
        return f"Error: Device '{device_name}' not found in the PyATS testbed."

    if not configuration_commands:
        return f"Error: No configuration commands provided for device '{device_name}'."

    device = testbed.devices[device_name]
    try:
        logger.info(f"Attempting to connect to device: {device_name} for configuration application.")
        device.connect(log_stdout=False, learn_hostname=True) 
        
        logger.info(f"Applying configuration to {device_name}:\\n" + "\\n".join(configuration_commands))
        # PyATS device.configure() takes a list of commands or a multi-line string.
        # The result of device.configure() can vary. For some OS, it's the diff or full output. 
        # For others, it might be None or raise an exception on failure.
        # Robust error handling here should check for specific PyATS exceptions if known.
        config_output = device.configure(configuration_commands) 
        
        # Check output - this is highly dependent on the device OS and PyATS version
        # Some OS types might include "% Invalid input detected" or similar in output on error.
        # Some PyATS drivers might raise an exception on command failure, caught by the general Exception.
        # If config_output is a string, you might need to parse it for error indicators.
        
        # A simple check, often insufficient:
        if isinstance(config_output, str) and ("% invalid input" in config_output.lower() or "error:" in config_output.lower()):
            logger.error(f"Configuration application on {device_name} may have failed. Output: {config_output}")
            return f"Configuration application on {device_name} potentially failed. Device output:\\n{config_output}"
        
        logger.info(f"Successfully applied configuration to {device_name}. Device output (if any): {config_output}")
        return f"Successfully applied configuration to {device_name}. Output:\\n{str(config_output)}"
        
    except Exception as e: # This could be pyats.connections.exceptions.ConnectionError, SubCommandFailure, etc.
        logger.error(f"Error applying configuration to {device_name}: {e}", exc_info=True)
        return f"Error applying configuration to {device_name}: {str(e)}"
    finally:
        if device.is_connected:
            logger.info(f"Disconnecting from {device_name} after configuration attempt.")
            device.disconnect()

# --- Tools for managing HITL configuration confirmation state ---

@tool
def prepare_config_confirmation(device_name: str, commands: List[str]) -> str:
    """
    Prepares the agent to await user confirmation for applying specific configuration commands to a device.
    This tool should be called by the agent BEFORE asking the user for confirmation.
    It signals that the agent is now in a state of 'awaiting_config_confirmation'.
    The agent's internal state (pending_config_device, pending_config_commands, is_awaiting_config_confirmation)
    will be updated by the agent framework when this tool is called.

    Args:
        device_name (str): The hostname of the device for which configuration is pending.
        commands (List[str]): The list of command strings pending confirmation.

    Returns:
        str: An informational message indicating the confirmation state is now active.
    """
    logger.info(f"Tool: prepare_config_confirmation called for device '{device_name}' with {len(commands)} commands.")
    # The actual state update (pending_config_device, etc.) is handled in BrainLangGraphAgent._call_tool_executor
    # This tool's output is primarily for the LLM's context and to be logged in actions_taken.
    return f"State prepared for user confirmation: Device '{device_name}', Commands: {len(commands)}. Awaiting user response."

@tool
def clear_config_confirmation_state() -> str:
    """
    Clears any pending configuration confirmation state.
    This tool should be called after a configuration has been successfully applied (or explicitly denied by the user),
    or if the agent decides to abandon the current pending configuration.
    It resets the agent's internal state (pending_config_device, pending_config_commands, is_awaiting_config_confirmation).

    Returns:
        str: An informational message indicating the confirmation state has been cleared.
    """
    logger.info("Tool: clear_config_confirmation_state called.")
    # The actual state update is handled in BrainLangGraphAgent._call_tool_executor
    return "Pending configuration confirmation state has been cleared."

# List of all tools for the agent
all_tools = [
    get_device_connectivity,
    get_device_interface_status,
    where_is_device_plugged_in,
    perform_packet_capture,
    diagnose_network_issue_with_pyats, 
    generate_configuration_fix,        
    apply_configuration_fix,           
    prepare_config_confirmation,      
    clear_config_confirmation_state,
    _pyats_inspect_config_and_dynamic_show,
] 