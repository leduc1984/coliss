#!/bin/bash

# Pokemon MMO Server Startup Script

echo "🎮 Starting Pokemon MMO Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 14+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    print_error "Node.js version 14+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) detected"

# Check if PostgreSQL is running
print_status "Checking PostgreSQL connection..."
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL client not found. Make sure PostgreSQL is installed and running."
else
    print_success "PostgreSQL client found"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Using default configuration."
    print_status "Creating .env file with default values..."
    
    cat > .env << EOL
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pokemon_mmo
DB_USER=postgres
DB_PASSWORD=password

# JWT Secret (change this in production!)
JWT_SECRET=your_super_secret_jwt_key_change_in_production_pokemon_mmo_2024

# Server Configuration
PORT=3000
NODE_ENV=development

# Game Configuration
MAX_PLAYERS_PER_MAP=50
CHAT_MESSAGE_LIMIT=100
ADMIN_EMAILS=admin@pokemonmmo.com
EOL
    
    print_success ".env file created with default values"
    print_warning "Please update the database credentials in .env file if needed"
else
    print_success ".env file found"
fi

# Run database migrations
print_status "Running database migrations..."
node database/migrate.js
if [ $? -eq 0 ]; then
    print_success "Database migrations completed"
else
    print_error "Database migration failed. Please check your PostgreSQL connection."
    print_status "Make sure PostgreSQL is running and the database 'pokemon_mmo' exists."
    exit 1
fi

# Start the server
print_status "Starting Pokemon MMO server..."
print_success "🚀 Pokemon MMO Server will start on http://localhost:3000"
print_success "🗺️  Map editor available at: http://localhost:3000/pokemon-map-editor/"
print_success "📝 Admin panel will be available for admin/co-admin users"

echo ""
echo "=== Pokemon MMO Server ==="
echo "Game: http://localhost:3000"
echo "Map Editor: http://localhost:3000/pokemon-map-editor/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server with nodemon if available, otherwise use node
if command -v nodemon &> /dev/null; then
    nodemon server.js
else
    node server.js
fi