# Admin Tools Integration Documentation

## Overview

This document explains how to use the integrated admin tools in the Pokemon MMO game. Admin users can now access development tools directly from within the game using keyboard shortcuts, without needing to run separate servers.

## Available Admin Tools

The following tools are available for admin users:

1. **UI Editor** - Design and edit user interface components
2. **Map Editor** - Create and modify game maps
3. **Monster Editor** - Manage Pokemon data and statistics
4. **Dialogue Editor** - Create and edit conversation trees
5. **Admin Panel** - Server management and monitoring dashboard

## Keyboard Shortcuts

As an admin user, you can access these tools using the following keyboard shortcuts:

| Key | Tool | Description |
|-----|------|-------------|
| 1 | UI Editor | Opens the UI component design tool |
| 2 | Map Editor | Opens the map editing tool |
| 0 | Admin Panel | Opens the server management dashboard |
| M | Monster Editor | Opens the Pokemon database management tool |
| L | Dialogue Editor | Opens the node-based conversation editor |
| 9 | Map Editor (New Tab) | Opens the map editor in a new browser tab |
| 5 | Random Battle | Starts a random Pokemon battle for testing |
| 6 | Battle Testing Menu | Shows the battle testing options menu |
| 7 | Grass Encounter | Simulates a grass encounter (admin only) |
| 8 | AI Trainer Battle | Starts an AI trainer battle for testing (admin only) |

## Using the Tools

### Accessing Tools

1. Log in as an admin user (default admin user is "leduc")
2. Once in the game world, press any of the tool shortcuts listed above
3. The tool will open in an overlay panel within the game
4. Use the close button (×) or press Escape to close the tool panel

### UI Editor (Key: 1)

The UI Editor allows you to design interface components:
- Drag and drop components to create layouts
- Adjust properties like position, size, and styling
- Save designs for use in the game

### Map Editor (Key: 2)

The Map Editor allows you to create and modify game maps:
- Place objects and terrain
- Set collision boundaries
- Configure teleportation points
- Save and load map configurations

### Monster Editor (Key: M)

The Monster Editor allows you to manage Pokemon data:
- Edit Pokemon stats, types, and moves
- Create new Pokemon entries
- Modify existing Pokemon data
- Export and import Pokemon databases

### Dialogue Editor (Key: L)

The Dialogue Editor allows you to create conversation trees:
- Design node-based dialogue flows
- Add player choices and NPC responses
- Configure branching paths
- Save dialogue projects

### Admin Panel (Key: 0)

The Admin Panel provides server management capabilities:
- View server statistics and player activity
- Manage user accounts and roles
- Monitor system logs
- Execute server commands

## Technical Implementation

### File Structure

The tools are organized in the following directory structure:
```
dev-tools/
├── ui-editor/
├── dialogue-editor/
├── monster-editor/
└── admin-panel/
pokemon-map-editor/
```

### Server Configuration

The server is configured to serve all tools statically:
- Tools are served from `/dev-tools/[tool-name]/` paths
- The Pokemon Map Editor is served from `/pokemon-map-editor/`
- Fallback routes ensure proper navigation within tools

### Client Integration

The PlayerController in `public/js/player.js` handles keyboard shortcuts:
- Only admin users can access the tools
- Each tool opens in an iframe overlay panel
- Panels can be closed with the close button or Escape key

## Security

- All tools are restricted to admin users only
- Server-side authentication validates all tool requests
- Tools are served from the same origin to avoid CORS issues
- No external servers are required for tool access

## Troubleshooting

### Tools Not Loading

If a tool panel appears blank or fails to load:
1. Ensure you're logged in as an admin user
2. Check the browser console for error messages
3. Verify the tool was built successfully
4. Restart the server if necessary

### Keyboard Shortcuts Not Working

If keyboard shortcuts don't respond:
1. Ensure you're logged in as an admin user
2. Check that game controls are enabled
3. Verify no other elements have focus
4. Try refreshing the page

## Future Improvements

Planned enhancements include:
- Better integration between tools and the main game
- Real-time synchronization of tool changes
- Enhanced error handling and user feedback
- Additional tools for game development