# Pokemon MMO Development Tools Suite

A comprehensive set of development tools for the Pokemon MMO - Omega Ruby Style project. This suite provides four essential tools for game development, content creation, and server management.

## Overview

This development tools suite consists of four main components:

1. **UI Editor** - Visual interface builder for game menus and HUD elements
2. **Dialogue Editor** - Node-based conversation and story editor  
3. **Monster Editor** - Pokemon database management and balancing tool
4. **Admin Panel** - Live server management and GM tools

## Tool Descriptions

### 1. UI Editor (`dev-tools/ui-editor/`)

A professional React-based visual editor for creating all 2D user interface elements in the game.

**Key Features:**
- Three-panel layout: Component Library, Visual Canvas, Properties Panel
- Drag-and-drop component creation and positioning
- Real-time visual editing with snap-to-grid and alignment guides
- Comprehensive component library (buttons, panels, inputs, game-specific UI)
- Properties panel for detailed customization
- Multiple screen resolution preview modes
- Animation timeline editor
- Template system for reusable UI layouts
- Data binding system for dynamic content
- Event scripting interface
- Export to clean JSON format for game integration

**Components Included:**
- Basic controls: Button, Text, Image, Input, Checkbox, Slider
- Layout containers: Panel, Window, Scroll List
- Game-specific: Item Slot, Progress Bar, Tooltip, Pokemon display elements

**Technology Stack:**
- React 19 with TypeScript
- react-dnd for drag-and-drop functionality
- styled-components for styling
- react-color for color picking
- Canvas-based visual editing

### 2. Dialogue Editor (`dev-tools/dialogue-editor/`)

A node-based visual editor for creating complex branching conversations, story events, and NPC interactions.

**Key Features:**
- Visual node graph interface for conversation flow
- Multiple node types: Dialogue, Player Choice, Condition, Event
- Character management system with portraits and voice-over support
- Variable system for dynamic text and branching logic
- Condition checking (inventory, quest status, player stats)
- Event triggering (quest start/complete, item give/take, battles)
- Search and commenting system for large conversations
- Play-test mode for conversation preview
- Integration with quest and character systems
- Export to JSON for game integration

**Node Types:**
- **Dialogue Node**: NPC speech with character portrait
- **Player Choice Node**: Multiple response options for players
- **Condition Node**: Branching based on game state
- **Event Node**: Trigger game actions (quests, battles, items)

### 3. Monster Editor (`dev-tools/monster-editor/`)

A comprehensive database management tool for Pokemon data, stats, and game balance.

**Key Features:**
- Complete Pokemon database browser with search and filtering
- Base stats editor with validation and balance checking
- Type assignment and effectiveness calculator
- Comprehensive moveset editor:
  - Level-up moves with level assignments
  - TM/HM compatibility matrix
  - Egg moves for breeding mechanics
- Evolution chain visual editor
- Sprite and model viewer with all forms (normal, shiny, gender variants)
- Wild encounter location mapping
- Version control system for safe database updates
- Mass editing tools for balance adjustments
- Balance analysis dashboard with statistical insights
- Import/export functionality for spreadsheet editing
- Forms editor for Mega Evolution, regional variants
- Abilities assignment system
- Pokedex entry editor

**Data Management:**
- Safe version control with rollback capability
- Publish system for live game updates
- Change history tracking
- Balance analysis and recommendations
- Damage calculator for testing

### 4. Admin Panel (`dev-tools/admin-panel/`)

A secure web-based dashboard for live server management and Game Master operations.

**Key Features:**

**Server Management:**
- Real-time server status monitoring (CPU, RAM, player count)
- Live player list with detailed profiles
- Chat moderation with message deletion and player muting
- Server announcement system
- Safe server restart and shutdown controls

**Player Management:**
- Player profile inspection (character, inventory, Pokemon)
- Moderation actions: kick, mute, ban with history tracking
- Support ticket system
- IP tracking for security monitoring

**Game Master Tools:**
- Invisible GM character with noclip movement
- Teleportation system with world map interface
- Item and Pokemon spawning tools
- World event triggering (special events, server-wide activities)
- Economy monitoring and adjustment tools
- Guild/team management interface

**Security & Access Control:**
- Role-based permissions (Admin, Moderator, Developer)
- Secure authentication system
- Action logging and audit trails
- Automated alert system for server issues

## Installation and Setup

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database (for admin panel integration)
- Modern web browser with WebGL support

### Setup Instructions

1. **Clone and Navigate:**
   ```bash
   cd dev-tools
   ```

2. **UI Editor Setup:**
   ```bash
   cd ui-editor
   npm install
   npm start
   # Access at http://localhost:3000
   ```

3. **Dialogue Editor Setup:**
   ```bash
   cd dialogue-editor
   npm install
   npm start
   # Access at http://localhost:3001
   ```

4. **Monster Editor Setup:**
   ```bash
   cd monster-editor
   npm install
   npm start
   # Access at http://localhost:3002
   ```

5. **Admin Panel Setup:**
   ```bash
   cd admin-panel
   npm install
   # Configure .env with database connection
   npm start
   # Access at http://localhost:3003
   ```

## Integration with Main Game

### UI Editor Integration
- Export UI layouts as JSON files
- Place exported files in `public/ui-layouts/`
- Load layouts in game using the UI loading system
- Bind data sources to dynamic UI elements

### Dialogue Editor Integration
- Export conversations as JSON files
- Place in `public/dialogues/`
- Reference dialogue IDs in NPC configuration
- Integrate with quest and character systems

### Monster Editor Integration
- Export Pokemon data as JSON
- Update game database via migration scripts
- Sync with battle system and encounter tables
- Version control prevents breaking changes

### Admin Panel Integration
- Connect to live game database
- Integrate with Socket.io for real-time updates
- Secure with JWT authentication matching game system
- Configure role permissions matching game roles

## Development Workflow

### UI Development
1. Design UI mockups and wireframes
2. Use UI Editor to create interactive prototypes
3. Test across different screen resolutions
4. Export and integrate with game
5. Iterate based on player feedback

### Content Creation
1. Write story outlines and character descriptions
2. Use Dialogue Editor to create interactive conversations
3. Test conversation flow and branching logic
4. Integrate with quest system and world events
5. Localize text for multiple languages

### Game Balance
1. Import existing Pokemon data into Monster Editor
2. Analyze current balance and meta-game trends
3. Make calculated adjustments to stats and movesets
4. Test changes in controlled environment
5. Deploy updates with version control safety

### Server Operations
1. Monitor server health via Admin Panel
2. Respond to player reports and support tickets
3. Moderate chat and enforce community guidelines
4. Run special events and seasonal content
5. Maintain economy balance and progression

## Architecture Notes

### Technology Choices
- **React + TypeScript**: Type safety and modern development experience
- **Node.js Backend**: Consistent with main game technology stack
- **PostgreSQL Integration**: Direct connection to game database
- **WebSocket Communication**: Real-time updates for admin operations
- **JSON Data Format**: Universal compatibility and human-readable

### Security Considerations
- All admin operations require authentication
- Role-based access control prevents unauthorized actions
- Input validation and sanitization throughout
- Audit logging for accountability
- Rate limiting to prevent abuse

### Performance Optimizations
- Virtual scrolling for large data sets
- Debounced input handling
- Lazy loading of images and assets
- Efficient diff algorithms for real-time updates
- Caching strategies for frequently accessed data

## Future Enhancements

### Planned Features
- **World Editor**: Visual map creation and editing tools
- **Quest Editor**: Interactive quest design and dependency management
- **Asset Manager**: Centralized asset pipeline with optimization
- **Analytics Dashboard**: Player behavior and game metrics analysis
- **Localization Tools**: Translation management and testing interfaces

### Integration Possibilities
- **CI/CD Pipeline**: Automated testing and deployment
- **Version Control**: Git integration for collaborative development
- **Cloud Deployment**: Scalable hosting for development tools
- **Mobile Support**: Responsive design for tablet-based editing
- **Plugin System**: Extensible architecture for custom tools

## Support and Documentation

### Getting Help
- Check individual tool README files for specific instructions
- Review integration guides in the `docs/` directory
- Submit issues via the project issue tracker
- Join the development Discord for real-time support

### Contributing
- Follow TypeScript and React best practices
- Add unit tests for new functionality
- Update documentation for new features
- Test across different browsers and screen sizes
- Follow the established code style and conventions

---

*This development tools suite is designed to streamline Pokemon MMO development and provide professional-grade content creation capabilities. Each tool is built with usability, performance, and integration in mind.*