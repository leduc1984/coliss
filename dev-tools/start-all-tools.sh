#!/bin/bash

# Pokemon MMO Development Tools Startup Script
# This script starts all development tools in the correct order

echo "🎮 Starting Pokemon MMO Development Tools Suite"
echo "================================================"

# Function to check if a port is available
check_port() {
    local port=$1
    if netstat -an | grep ":$port " > /dev/null; then
        echo "❌ Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to start a tool in a new terminal
start_tool() {
    local tool_name=$1
    local tool_dir=$2
    local port=$3
    
    echo "🚀 Starting $tool_name on port $port..."
    
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        start "Pokemon MMO - $tool_name" cmd /k "cd $tool_dir && npm start"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell app \"Terminal\" to do script \"cd $tool_dir && npm start\""
    else
        # Linux
        gnome-terminal --title="Pokemon MMO - $tool_name" -- bash -c "cd $tool_dir && npm start; exec bash"
    fi
    
    sleep 2
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm --version) is installed"

# Check if all tool directories exist
tools=("ui-editor" "dialogue-editor" "monster-editor" "admin-panel")
for tool in "${tools[@]}"; do
    if [ ! -d "$tool" ]; then
        echo "❌ Directory $tool not found. Please ensure all tools are properly installed."
        exit 1
    fi
    echo "✅ $tool directory found"
done

# Check port availability
echo ""
echo "🔍 Checking port availability..."
ports=(3000 3001 3002 3003)
port_names=("UI Editor" "Dialogue Editor" "Monster Editor" "Admin Panel")

for i in "${!ports[@]}"; do
    if ! check_port "${ports[$i]}"; then
        echo "❌ ${port_names[$i]} port ${ports[$i]} is not available"
        echo "Please close any applications using this port and try again."
        exit 1
    fi
done

# Install dependencies if needed
echo ""
echo "📦 Checking and installing dependencies..."
for tool in "${tools[@]}"; do
    if [ ! -d "$tool/node_modules" ]; then
        echo "Installing dependencies for $tool..."
        cd "$tool"
        npm install
        cd ..
    else
        echo "✅ $tool dependencies already installed"
    fi
done

# Start all tools
echo ""
echo "🚀 Starting all development tools..."
echo "This will open 4 new terminal windows/tabs."
echo ""

# Start UI Editor (port 3000)
start_tool "UI Editor" "ui-editor" 3000

# Start Dialogue Editor (port 3001)  
start_tool "Dialogue Editor" "dialogue-editor" 3001

# Start Monster Editor (port 3002)
start_tool "Monster Editor" "monster-editor" 3002

# Start Admin Panel (port 3003)
start_tool "Admin Panel" "admin-panel" 3003

echo ""
echo "🎉 All development tools are starting up!"
echo ""
echo "Access URLs:"
echo "  🎨 UI Editor:       http://localhost:3000"
echo "  💬 Dialogue Editor: http://localhost:3001"  
echo "  🦄 Monster Editor:  http://localhost:3002"
echo "  👑 Admin Panel:     http://localhost:3003"
echo ""
echo "Wait a few moments for all services to fully load."
echo "Check each terminal window for any startup errors."
echo ""
echo "To stop all services, close the terminal windows or press Ctrl+C in each."

# Keep the script running to show status
echo "📊 Monitoring services... (Press Ctrl+C to exit this monitor)"
while true; do
    sleep 30
    echo "⏰ $(date): All services should be running. Check terminal windows if you encounter issues."
done