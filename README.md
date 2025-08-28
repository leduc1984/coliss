# 🎮 Pokemon MMO - Omega Ruby Style

A professional multiplayer Pokemon game inspired by Pokemon Omega Ruby, featuring real-time 3D gameplay, authentication system, role-based chat commands, and map editor.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [File Structure](#file-structure)
- [Setup Instructions](#setup-instructions)
- [Admin Configuration](#admin-configuration)
- [Chat Commands](#chat-commands)
- [Development Guide](#development-guide)

## 🎯 Overview

This Pokemon MMO is a complete multiplayer game system built with modern web technologies:

- **Backend**: Node.js + Express + Socket.io + PostgreSQL
- **Frontend**: Babylon.js 3D engine with Pokemon ORAS-style camera
- **Real-time Features**: Live multiplayer, chat system, player movements
- **Security**: JWT authentication, password validation, role-based permissions
- **Administration**: Complete admin panel with moderation tools

## ✨ Features

### 🔐 Authentication System
- **Registration**: Username, email, secure password (8+ chars, uppercase, lowercase, digit, special char)
- **Login**: Username OR email + password
- **Security**: JWT tokens, bcrypt password hashing
- **Roles**: Admin, Co-Admin, Helper, User with hierarchical permissions

### 🎮 Game Features
- **3D World**: Babylon.js rendering with Pokemon ORAS camera style
- **Real-time Multiplayer**: See other players moving in real-time
- **Movement**: WASD/Arrow keys, hold Shift/Space to run
- **Maps**: Multi-map system with seamless transitions
- **Map Editor**: Admin/Co-Admin exclusive access
- **🆕 Collision System**: Invisible boundaries prevent leaving the map
- **🆕 Stair Teleportation**: Walk near stairs to teleport between house and Drewfort
- **🆕 Interactive UI**: Teleport prompts with keyboard shortcuts (Space/Escape)

### 💬 Chat System
- **Real-time Chat**: Instant messaging between players
- **Role-based Commands**: 15+ commands with permission levels
- **Moderation Tools**: Kick, ban, mute, warn players
- **Admin Tools**: Server announcements, shutdown, user promotion

## 🏗️ System Architecture

```
Frontend (Browser)           Backend (Node.js)           Database (PostgreSQL)
├── Babylon.js 3D Engine    ├── Express API Server      ├── Users Table
├── Socket.io Client        ├── Socket.io Real-time      ├── Characters Table
├── Authentication UI       ├── JWT Authentication       ├── Chat Messages
├── Chat Interface          ├── Chat Service             ├── User Sessions
└── Game Controls           └── Game Service             └── Maps Data
```

## 📁 File Structure

### 🔧 Core Backend Files

#### `server.js`
**Purpose**: Main application entry point
- Initializes Express server and Socket.io
- Sets up middleware (CORS, Helmet, Rate Limiting)
- Mounts authentication routes
- Handles real-time game connections
- Manages server startup and database connection

#### `package.json`
**Purpose**: Project configuration and dependencies
- Defines all required Node.js packages
- Scripts for running, development, and database migration
- Project metadata and versioning

#### `.env`
**Purpose**: Environment configuration
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pokemon_mmo
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=your_super_secret_jwt_key_change_in_production_pokemon_mmo_2024
PORT=3000
```

### 🗄️ Database

#### `database/migrate.js`
**Purpose**: Complete database schema setup
- **Users Table**: Authentication, roles, account status
- **Characters Table**: Player data, positions, levels, experience
- **Chat Messages Table**: Message history with timestamps
- **User Sessions Table**: Active player tracking
- **Maps Table**: Game world definitions
- **Pokemon Encounters Table**: Battle system data

### 🛣️ API Routes

#### `routes/auth.js`
**Purpose**: Authentication endpoints
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - User login (username OR email)
- Password validation function with strict requirements
- JWT token generation and verification middleware

### 🎮 Game Services

#### `services/GameService.js`
**Purpose**: Core multiplayer game logic
- **Player Authentication**: JWT verification, session management
- **Movement Handling**: Real-time position updates, collision detection
- **Map Management**: Multi-map support, room-based networking
- **Session Tracking**: Active players, disconnection cleanup
- **Map Editor Access**: Permission-based editor access control

#### `services/ChatService.js`
**Purpose**: Complete chat and moderation system
- **15 Chat Commands** with role-based permissions:
  - **User Level**: `/help`, `/commands`, `/who`, `/time`, `/ping`
  - **Helper Level**: `/mute`, `/unmute`, `/warn`
  - **Co-Admin Level**: `/kick`, `/clear`, `/promote`, `/teleport`, `/freeze`, `/unfreeze`
  - **Admin Level**: `/ban`, `/unban`, `/demote`, `/announce`, `/shutdown`, `/setmotd`, `/reload`
- **Role Hierarchy**: Strict permission checking
- **Message History**: Database-backed chat persistence

### 🖥️ Frontend Files

#### `public/index.html`
**Purpose**: Main game interface
- Authentication forms (login/register)
- 3D game canvas for Babylon.js
- Chat panel with real-time messaging
- Admin controls and player information
- Responsive design for different screen sizes

#### `public/styles/main.css`
**Purpose**: Complete visual styling
- Pokemon-themed gradient backgrounds
- Role-based color coding (Admin: red, Co-Admin: orange, Helper: cyan, User: green)
- Responsive design for mobile and desktop
- Animated UI elements and smooth transitions
- Professional game interface styling

#### `public/js/auth.js`
**Purpose**: Frontend authentication logic
- Real-time password validation with visual feedback
- Form submission handling
- JWT token storage and management
- Login/register form switching
- Error message display

#### `public/js/game.js`
**Purpose**: 3D game engine and networking
- **Babylon.js Scene Setup**: 3D world initialization
- **Pokemon ORAS Camera**: ArcRotateCamera with authentic feel
```javascript
this.camera = new BABYLON.ArcRotateCamera(
    "playerCamera",
    -Math.PI / 2, // Horizontal rotation
    Math.PI / 3,  // Vertical angle (Pokemon style)
    15,           // Distance from player
    BABYLON.Vector3.Zero(),
    this.scene
);
```
- **Map Loading**: GLB/GLTF 3D model support
- **Socket.io Integration**: Real-time multiplayer communication
- **Player Management**: Other players rendering and updates

#### `public/js/player.js`
**Purpose**: Player movement and controls
- **Pokemon-style Movement**: Grid-based with smooth interpolation
- **Input Handling**: WASD/Arrow keys + Shift/Space for running
- **Animation System**: Walking, running, idle states (placeholder)
- **Network Sync**: Real-time position broadcasting
- **Camera Following**: Smooth camera that follows player movement

#### `public/js/chat.js`
**Purpose**: Chat interface and commands
- Real-time message display with role colors
- Command processing and auto-completion
- Message history scrolling
- Role badge display
- System message handling

## 🚀 Setup Instructions

### 1. Database Setup (PostgreSQL)

```bash
# Install PostgreSQL (if not already installed)
# Create database
createdb pokemon_mmo

# Set up environment variables in .env file
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pokemon_mmo
DB_USER=postgres
DB_PASSWORD=your_password
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Database

```bash
node database/migrate.js
```

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 5. Access the Game

Open your browser and go to: `http://localhost:3000`

## 👑 Admin Configuration

### Default Admin Setup

The system is configured with **leduc** as the primary administrator:

- **Username**: `leduc`
- **Email**: `leducgagnetommy@gmail.com`
- **Role**: `admin` (highest level)
- **Permissions**: Full access to all commands and features

### Admin Privileges

**leduc** has access to all features including:
- All 15 chat commands
- Map editor access
- User management (promote/demote/ban)
- Server administration (shutdown, announcements)
- Database management capabilities

### Creating Additional Admins

To promote other users to admin status, use the `/promote` command:
```
/promote username admin
```

## 💬 Chat Commands Reference

### 👤 User Commands (Everyone)
- `/help` - Show help information
- `/commands` - List available commands
- `/who` - Show online players
- `/time` - Show server time
- `/ping` - Check connection latency

### 🛡️ Helper Commands
- `/mute <username>` - Mute a player
- `/unmute <username>` - Unmute a player
- `/warn <username> <reason>` - Warn a player

### ⚔️ Co-Admin Commands
- `/kick <username> <reason>` - Kick a player from server
- `/clear` - Clear chat messages
- `/promote <username> <role>` - Promote user (user/helper only)
- `/teleport <username> <x> <y> <z>` - Teleport player
- `/freeze <username>` - Freeze player movement
- `/unfreeze <username>` - Unfreeze player movement

### 👑 Admin Commands (leduc and other admins)
- `/ban <username> <reason>` - Ban player permanently
- `/unban <username>` - Remove ban from player
- `/demote <username>` - Demote user rank
- `/announce <message>` - Server-wide announcement
- `/shutdown <reason>` - Graceful server shutdown
- `/setmotd <message>` - Set message of the day
- `/reload` - Reload server configuration

## 🔧 Development Guide

### Adding New Features

1. **New Chat Commands**: Add to `services/ChatService.js`
2. **New API Routes**: Create in `routes/` directory
3. **Database Changes**: Update `database/migrate.js`
4. **Frontend Features**: Add to respective `public/js/` files

### Code Structure

- **Backend**: RESTful API + Socket.io real-time events
- **Frontend**: Modular JavaScript with separation of concerns
- **Database**: PostgreSQL with proper indexing and relationships
- **Security**: JWT tokens, bcrypt hashing, input validation

### Testing

```bash
# Start development server
npm run dev

# Test authentication
# Register new account at http://localhost:3000
# Test chat commands in-game
# Test multiplayer by opening multiple browser tabs
```

### Database Reset (if needed)

```bash
# Connect to PostgreSQL
psql -U postgres -d pokemon_mmo

# Drop all tables (CAUTION: This deletes all data!)
DROP TABLE IF EXISTS user_sessions, chat_messages, pokemon_encounters, characters, users, maps CASCADE;

# Re-run migration
node database/migrate.js
```

## 🎮 Game Controls

### Basic Movement
- **Movement**: WASD or Arrow Keys
- **Run**: Hold Shift or Spacebar while moving
- **Chat**: Type in chat box at bottom-left
- **Commands**: Type `/help` in chat for command list

### 🔐 Admin Controls (Admin/Co-Admin Only)
- **🗺️ Map Editor**: Press **'9'** to open Pokemon Map Editor in new tab
- **🗺️ Map Selector**: Press **'1'** for admin map selector with teleportation
- **⚔️ Battle Test**: Press **'0'** for random Pokemon battle testing

### 🆕 Map System
- **📍 Teleportation**: Walk near stairs/escaliers to see teleport prompt
  - **Space**: Accept teleportation
  - **Escape**: Cancel teleportation
  - **Auto-close**: Prompt disappears after 10 seconds

### 🛠️ ### 🎮 Map Editor Access

The Pokemon MMO now includes a **fully integrated map editor** that eliminates the need for a separate server:

#### ✨ **Key Advantages**
- **No Separate Server**: Editor runs directly in the main game (no port 3001 needed)
- **Seamless Access**: Press 'E' to toggle between game and editor instantly
- **Admin Security**: Only Admin/Co-Admin users can access the editor
- **Full Integration**: Uses the same authentication and resources as the main game

#### 🎨 **Editor Features**
- **3D Viewport**: Professional Babylon.js-powered editing interface
- **File Operations**: Load .glb maps, save progress, export JSON data
- **Editing Tools**: Placement tool, collision editor, Pokemon zone creator
- **Object Properties**: Real-time position, rotation, and scale editing
- **Status Feedback**: Live updates and operation status in the bottom bar

#### 🎮 **Editor Controls**
- **Open Editor**: Press 'E' key (Admin/Co-Admin only)
- **Load Map**: Click "Load Map (.glb)" to import 3D map files
- **Save Work**: Click "Save Map" to preserve your editing progress
- **Export Data**: Click "Export (.json)" to export map data for game use
- **Navigation**: Left-drag to orbit camera, mouse wheel to zoom, right-drag to pan
- **Close Editor**: Click "✕ Close Editor" to return to the main game
  - **Space**: Accept teleportation
  - **Escape**: Cancel teleportation
  - **Auto-close**: Prompt disappears after 10 seconds

## 🆕 Map System Details

### Starting Map
- **Default**: `pokemon-map-editor/assets/maps/male_house_inside/house.glb`
- **Position**: Player spawns at center (0, 1, 0)
- **Boundaries**: Invisible walls prevent escaping the map

### Collision System
- **Walls & Objects**: All meshes have collision enabled except stairs
- **Map Boundaries**: 100x100 unit invisible collision walls
- **Stairs**: No collision but trigger teleportation zones

### Teleportation System
- **Detection**: Meshes with 'stair', 'escalier', or 'teleport' in name
- **Trigger Distance**: 2 units from stair center
- **Destinations**: 
  - From house → Drewfort (`drewfort.glb`)
  - From Drewfort → house (`house.glb`)
- **UI**: French prompts with keyboard shortcuts

## 🛡️ Security Features

- **Password Requirements**: 8+ characters, uppercase, lowercase, digit, special character
- **JWT Authentication**: Secure token-based sessions
- **Rate Limiting**: Prevents spam and abuse
- **Input Validation**: All user inputs are sanitized
- **Role-based Permissions**: Hierarchical access control
- **SQL Injection Protection**: Parameterized queries

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify `.env` credentials
   - Ensure database `pokemon_mmo` exists

2. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Kill process using port 3000: `netstat -ano | findstr :3000`

3. **Chat Commands Not Working**
   - Verify user role in database
   - Check command syntax (must start with `/`)
   - Ensure user is authenticated

4. **3D Models Not Loading**
   - Check browser console for errors
   - Verify model files in correct directory
   - Ensure WebGL is supported

## 📄 License

MIT License - Feel free to modify and distribute.

---

**Created by**: Pokemon MMO Development Team  
**Admin Contact**: leducgagnetommy@gmail.com  
**Version**: 1.0.0  
**Last Updated**: 2024