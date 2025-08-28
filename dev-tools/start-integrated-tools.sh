#!/bin/bash

# Pokemon MMO Development Tools - Integrated Startup Script
# This script starts all development tools with full integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Create necessary directories
mkdir -p "$LOG_DIR" "$BACKUP_DIR"

echo -e "${BLUE}🚀 Pokemon MMO Development Tools - Integrated Startup${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking Prerequisites...${NC}"

MISSING_DEPS=0

if ! command_exists docker; then
    print_error "Docker is not installed"
    MISSING_DEPS=1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed"
    MISSING_DEPS=1
fi

if ! command_exists node; then
    print_error "Node.js is not installed"
    MISSING_DEPS=1
fi

if ! command_exists npm; then
    print_error "npm is not installed"
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Please install missing dependencies before continuing"
    exit 1
fi

print_status "All prerequisites satisfied"

# Check Docker daemon
if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running"
    exit 1
fi

print_status "Docker daemon is running"

# Environment setup
echo -e "\n${BLUE}🔧 Environment Setup...${NC}"

# Create .env file if it doesn't exist
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    print_warning "Creating .env file with default values"
    cat > "$SCRIPT_DIR/.env" << EOF
# Database Configuration
DB_PASSWORD=pokemon123

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)

# Grafana Configuration
GRAFANA_PASSWORD=admin123

# AWS Configuration (optional for backups)
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# S3_BACKUP_BUCKET=pokemon-mmo-backups

# Development Mode
NODE_ENV=development
EOF
    print_status ".env file created"
else
    print_status ".env file exists"
fi

# Build and start services
echo -e "\n${BLUE}🏗️  Building and Starting Services...${NC}"

# Start infrastructure services first
print_status "Starting infrastructure services..."
docker-compose -f docker-compose.integration.yml up -d postgres redis

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
until docker-compose -f docker-compose.integration.yml exec postgres pg_isready -U postgres >/dev/null 2>&1; do
    sleep 2
done
print_status "Database is ready"

# Start API Gateway
print_status "Starting API Gateway..."
docker-compose -f docker-compose.integration.yml up -d api-gateway

# Wait for API Gateway to be ready
echo -e "${YELLOW}⏳ Waiting for API Gateway to be ready...${NC}"
until curl -f http://localhost:3001/api/health >/dev/null 2>&1; do
    sleep 2
done
print_status "API Gateway is ready"

# Install dependencies for all tools
echo -e "\n${BLUE}📦 Installing Dependencies...${NC}"

TOOLS=("ui-editor" "dialogue-editor" "monster-editor" "admin-panel")

for tool in "${TOOLS[@]}"; do
    if [ -d "$SCRIPT_DIR/$tool" ]; then
        echo -e "${YELLOW}Installing dependencies for $tool...${NC}"
        (cd "$SCRIPT_DIR/$tool" && npm install --silent) &
    fi
done

# Wait for all npm installs to complete
wait
print_status "All dependencies installed"

# Start development tools
echo -e "\n${BLUE}🛠️  Starting Development Tools...${NC}"

for tool in "${TOOLS[@]}"; do
    if [ -d "$SCRIPT_DIR/$tool" ]; then
        print_status "Starting $tool..."
        docker-compose -f docker-compose.integration.yml up -d "$tool"
    fi
done

# Start monitoring services
echo -e "\n${BLUE}📊 Starting Monitoring Services...${NC}"
docker-compose -f docker-compose.integration.yml up -d prometheus grafana

# Start NGINX load balancer
print_status "Starting NGINX load balancer..."
docker-compose -f docker-compose.integration.yml up -d nginx

# Start backup service
print_status "Starting backup service..."
docker-compose -f docker-compose.integration.yml up -d backup

# Health check
echo -e "\n${BLUE}🏥 Running Health Checks...${NC}"

SERVICES=(
    "http://localhost:3000|UI Editor"
    "http://localhost:3001|Dialogue Editor"
    "http://localhost:3002|Monster Editor"
    "http://localhost:3003|Admin Panel"
    "http://localhost:3001/api/health|API Gateway"
    "http://localhost:9090|Prometheus"
    "http://localhost:3001|Grafana"
)

ALL_HEALTHY=1

for service in "${SERVICES[@]}"; do
    IFS='|' read -r url name <<< "$service"
    if curl -f "$url" >/dev/null 2>&1; then
        print_status "$name is healthy"
    else
        print_error "$name is not responding"
        ALL_HEALTHY=0
    fi
done

# Final status
echo -e "\n${BLUE}🎉 Startup Complete!${NC}"
echo "========================================"

if [ $ALL_HEALTHY -eq 1 ]; then
    print_status "All services are healthy and ready!"
else
    print_warning "Some services may need more time to start up"
fi

echo -e "\n${BLUE}🌐 Access URLs:${NC}"
echo "• UI Editor:         http://localhost:3000"
echo "• Dialogue Editor:   http://localhost:3001"
echo "• Monster Editor:    http://localhost:3002"
echo "• Admin Panel:       http://localhost:3003"
echo "• API Gateway:       http://localhost:3001"
echo "• Prometheus:        http://localhost:9090"
echo "• Grafana:          http://localhost:3001 (admin/admin123)"

echo -e "\n${BLUE}📁 Important Directories:${NC}"
echo "• Logs:              $LOG_DIR"
echo "• Backups:           $BACKUP_DIR"
echo "• Configuration:     $SCRIPT_DIR/.env"

echo -e "\n${BLUE}🔧 Management Commands:${NC}"
echo "• View logs:         docker-compose -f docker-compose.integration.yml logs -f [service]"
echo "• Stop all:          docker-compose -f docker-compose.integration.yml down"
echo "• Restart service:   docker-compose -f docker-compose.integration.yml restart [service]"
echo "• View status:       docker-compose -f docker-compose.integration.yml ps"

echo -e "\n${GREEN}✅ Pokemon MMO Development Tools are now running with full integration!${NC}"
echo -e "${YELLOW}💡 Check the INTEGRATION_GUIDE.md for detailed usage instructions${NC}"

# Create a stop script
cat > "$SCRIPT_DIR/stop-integrated-tools.sh" << 'EOF'
#!/bin/bash

echo "🛑 Stopping Pokemon MMO Development Tools..."

# Stop all services
docker-compose -f docker-compose.integration.yml down

echo "✅ All services stopped successfully!"
EOF

chmod +x "$SCRIPT_DIR/stop-integrated-tools.sh"
print_status "Stop script created: stop-integrated-tools.sh"