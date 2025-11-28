#!/bin/bash
# run_demo.sh: Orchestrates the V2V Hazard Detection Demo.
# This script manages the lifecycle of the entire prototype:
# 1. Calls gen_keys.sh to create cryptographic keys for all nodes.
# 2. Launches multiple v2v_node (C core) processes in the background.
# 3. Launches the web_server.py (Flask/API) for the dashboard.
# 4. Launches the simulator.py (Python) for visualization and scenario control.
# 5. Cleans up all background processes upon exit (e.g., Ctrl+C).

# --- Configuration ---
NUM_NODES=4  # Number of background C nodes to simulate (Must match simulator.py's internal logic)
NODE_EXE="./v2v_node"  # The compiled C executable (e.g., renamed from node.exe)
KEY_SCRIPT="./gen_keys.sh"
SIMULATOR_SCRIPT="./simulator.py"
WEB_SERVER_SCRIPT="./web_server.py" # New: Script to run the Flask backend/serve the React dashboard
LOG_FILE="./demo_run.log"
PKI_DIR="./keys" # Directory where your keys are stored

# --- Functions ---

# Function to kill all background nodes and exit cleanly
cleanup() {
    echo -e "\n--- Cleaning up running nodes and web server... ---"
    # Find and kill processes named after the executable
    pkill -f "$NODE_EXE"
    # Find and kill the web server process (assuming it runs via python3)
    pkill -f "$WEB_SERVER_SCRIPT"
    echo "Cleanup complete. Project shut down."
    exit 0
}

# Trap Ctrl+C (SIGINT) to ensure cleanup runs
trap cleanup SIGINT

# --- Demo Start ---

echo "=================================================="
echo " V2V Hazard Detection Prototype Demo Starting"
echo "=================================================="
echo "Starting $NUM_NODES V2V Node instances, Web Server, and Simulator..."

# 1. Setup the environment and PKI
echo "1. Cleaning up previous state and generating ECDSA keys..."
rm -f $LOG_FILE
rm -rf $PKI_DIR # Clean up keys directory before regenerating

# Check for the key generation script
if [ ! -x $KEY_SCRIPT ]; then
    echo "ERROR: Key generation script ($KEY_SCRIPT) not found or not executable."
    echo "Please ensure 'gen_keys.sh' is present and executable."
    exit 1
fi

# Generate keys for all simulated nodes (e.g., node1, node2, node3, node4)
for i in $(seq 1 $NUM_NODES); do
    NODE_NAME="node$i"
    # Execute the user's gen_keys.sh script for each node
    $KEY_SCRIPT $NODE_NAME || { echo "ERROR: Key generation failed for $NODE_NAME." ; exit 1 ; }
done


# 2. Check for the main executable
if [ ! -x $NODE_EXE ]; then
    echo "ERROR: V2V Node executable ($NODE_EXE) not found or not executable."
    echo "Please ensure the compiled 'node.exe' is present and named '$NODE_EXE'."
    exit 1
fi

# 3. Start V2V Node instances (background processes)
echo "2. Starting $NUM_NODES V2V background nodes (C core)..."
NODE_PIDS=()
for i in $(seq 1 $NUM_NODES); do
    NODE_NAME="node$i"
    
    # ASSUMPTION: The C executable takes the node name and its private key path as arguments
    $NODE_EXE --name $NODE_NAME --privkey $PKI_DIR/${NODE_NAME}_priv.pem --mode SIMULATED & # Running in background
    
    NODE_PIDS+=($!) # Store PID for potential debugging
    sleep 0.2 # Small delay to ensure they initialize in order
done
echo "Started nodes with PIDs: ${NODE_PIDS[@]}"

# 4. Start the Web Server (to serve the React/JSX Dashboard)
echo "3. Starting Web Server ($WEB_SERVER_SCRIPT) for dashboard..."
if [ ! -f $WEB_SERVER_SCRIPT ]; then
    echo "WARNING: Web server script ($WEB_SERVER_SCRIPT) not found. Skipping dashboard start."
else
    # Assuming the web server is a Python/Flask script
    python3 $WEB_SERVER_SCRIPT & # Running in background
    sleep 1 # Give server time to spin up
    echo "Dashboard available (check your web_server.py script for the port, usually http://localhost:5000)"
fi


# 5. Start the Python Simulator (Frontend/Driver)
echo "4. Starting Python Simulator ($SIMULATOR_SCRIPT)..."
# The simulator runs in the foreground, driving the scenario and displaying visuals.
# Execution pauses here until the simulator is closed.
python3 $SIMULATOR_SCRIPT

# 6. Cleanup (Will run after the simulator exits or on Ctrl+C)
cleanup

# --- End of Demo ---