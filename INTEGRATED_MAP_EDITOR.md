# 🗺️ Integrated Map Editor Documentation

## Overview

The Pokemon MMO now features a fully integrated map editor that runs directly within the main game, eliminating the need for a separate server. Admins can access the editor using keyboard shortcuts and create/edit maps in real-time.

## ✨ Key Features

### 🔧 **No Separate Server Required**
- Map editor is now integrated directly into the main game
- Uses the same server and resources as the main Pokemon MMO
- No need to start additional processes or manage multiple ports

### 🎮 **Direct Access via Keyboard**
- **Key 'E'**: Opens the integrated map editor (Admin/Co-Admin only)
- **Key '1'**: Admin map selector (existing functionality)
- **Key '0'**: Battle system testing (existing functionality)

### 🛠️ **Professional Editor Interface**
- **Babylon.js-powered 3D viewport**: Full 3D editing capabilities
- **Tool panels**: File operations, map tools, object properties
- **Real-time editing**: Changes visible immediately
- **Status bar**: Live feedback and operation status

## 🚀 Getting Started

### Access Requirements
- **User Role**: Admin or Co-Admin
- **Authentication**: Must be logged into the main Pokemon MMO
- **Browser**: WebGL-compatible browser (Chrome, Firefox, Safari, Edge)

### Opening the Editor
1. **Join the game** as an admin user
2. **Press 'E' key** to open the integrated map editor
3. **Editor opens** in full-screen overlay mode
4. **Start editing** by loading a map file or creating new content

### Closing the Editor
- **Click "Close Editor"** button in the top-right corner
- **Returns to main game** immediately
- **All progress** is preserved if saved

## 🎨 Editor Interface

### Main Areas

#### 1. **Header Bar**
- **Title**: Pokemon Map Editor branding
- **Close Button**: Return to main game
- **Background**: Dark theme with blue accents

#### 2. **3D Viewport**
- **Canvas**: Full Babylon.js scene rendering
- **Mouse Controls**: 
  - **Orbit**: Left-click and drag
  - **Zoom**: Mouse wheel
  - **Pan**: Right-click and drag
- **Grid**: Wireframe ground plane for reference

#### 3. **Tools Panel** (Left Side)
- **File Operations**: Load, Save, Export
- **Map Tools**: Placement, Collision, Pokemon Zones
- **Object Properties**: Position, rotation, scale controls
- **Real-time updates**: Changes apply immediately

#### 4. **Status Bar** (Bottom)
- **Current Operation**: Shows active tool or process
- **Help Text**: Keyboard shortcuts and tips
- **File Information**: Loaded map details

### Tool Sections

#### 📁 **File Operations**
```
🔵 Load Map (.glb)    - Import 3D map files
🟢 Save Map          - Save current work (JSON format)
🟡 Export (.json)    - Export map data for use
```

#### 🎮 **Map Tools**
```
🔘 Placement Tool    - Place and move objects
🔘 Collision Tool    - Define collision boundaries
🔘 Pokemon Zones     - Set encounter areas
```

#### 📝 **Object Properties**
```
📍 Position (X,Y,Z)  - Object coordinates
🔄 Rotation          - Object orientation
📏 Scale             - Object size
🎯 Apply Button      - Confirm changes
```

## 🔌 Technical Integration

### Server-Side APIs

The main server now includes map editor endpoints:

```javascript
// Map file upload
POST /api/map-editor/upload

// Save map data  
POST /api/map-editor/save

// List saved maps
GET /api/map-editor/saves

// Pokemon sprites for zones
GET /api/map-editor/pokemon/sprites/:id
GET /api/map-editor/pokemon/list
```

### Client-Side Architecture

```javascript
// Main integration point
GameManager.openIntegratedMapEditor()

// Editor lifecycle
- initializeIntegratedEditor()
- setupEditorTools()
- loadMapInEditor()
- cleanupIntegratedEditor()

// Tool management
- setEditorTool(toolName)
- saveCurrentMap()
- exportMapData()
```

## 🎯 Usage Examples

### Loading a Map
1. **Click "Load Map (.glb)"** in the tools panel
2. **Select your .glb file** from the file dialog
3. **Map loads** into the 3D viewport
4. **Camera adjusts** to show the full map
5. **Start editing** with the available tools

### Creating Collision Zones
1. **Click "Collision Tool"** to activate
2. **Tool becomes active** (highlighted in blue)
3. **Click in viewport** to place collision volumes
4. **Adjust properties** in the properties panel
5. **Save your work** using "Save Map"

### Exporting Map Data
1. **Complete your edits** using the various tools
2. **Click "Export (.json)"** in file operations
3. **JSON file downloads** with all map data
4. **Includes**: Meshes, positions, collisions, zones
5. **Compatible** with Pokemon MMO map system

## 🔧 Advanced Features

### Map File Support
- **GLB/GLTF**: Primary 3D model format
- **JSON Export**: Map data and metadata
- **Large Files**: Support up to 100MB uploads
- **Batch Processing**: Multiple file handling

### Real-Time Editing
- **Live Updates**: Changes visible immediately
- **Undo/Redo**: Full edit history (planned)
- **Auto-Save**: Periodic progress saving (planned)
- **Collaborative**: Multi-admin editing (future)

### Performance Optimization
- **Separate Engine**: Editor uses own Babylon.js instance
- **Resource Management**: Automatic cleanup on close
- **Memory Efficient**: Optimized for large maps
- **WebGL Acceleration**: Hardware-accelerated rendering

## 🚨 Troubleshooting

### Common Issues

#### Editor Won't Open
- **Check Role**: Must be Admin or Co-Admin
- **Browser Compatibility**: Ensure WebGL is enabled
- **Console Errors**: Check browser developer tools
- **Solution**: Refresh page and try again

#### Map Won't Load
- **File Format**: Only .glb files supported
- **File Size**: Maximum 100MB limit
- **File Corruption**: Try a different map file
- **Solution**: Check console for specific errors

#### Performance Issues
- **Large Maps**: Consider splitting into smaller sections
- **Complex Meshes**: Reduce polygon count if possible
- **Browser Memory**: Close other tabs if needed
- **Solution**: Use simpler maps for testing

### Error Messages

```
"Admin access required" → User lacks admin privileges
"Failed to initialize" → WebGL/Babylon.js issue
"Error loading map"     → File format or corruption
"Map editor not available" → Integration problem
```

## 🔄 Migration from Separate Server

### What Changed
- **No Port 3001**: Separate server no longer needed
- **Integrated UI**: Editor runs in main game window  
- **Same Features**: All functionality preserved
- **Better Performance**: Shared resources and optimization

### Migration Steps
1. **Stop the old map editor server** (port 3001)
2. **Update bookmarks** to use main game (port 3000)
3. **Use 'E' key** instead of separate URL access
4. **All existing maps** work with the new editor

### Benefits
- **Simpler Setup**: One server instead of two
- **Better Integration**: Seamless game/editor switching
- **Shared Authentication**: Uses same login system
- **Resource Efficiency**: No duplicate services

## 📚 Best Practices

### Map Creation Workflow
1. **Plan Your Map**: Sketch layout before editing
2. **Start Simple**: Basic geometry first, details later
3. **Test Frequently**: Load in main game to verify
4. **Save Often**: Regular saves prevent data loss
5. **Export Final**: Keep JSON backup of completed maps

### Performance Guidelines
- **Optimize Meshes**: Use lowest polycount possible
- **Texture Sizes**: Keep textures reasonable (1024x1024 max)
- **Collision Efficiency**: Simple collision shapes
- **Zone Planning**: Logical Pokemon encounter areas

### Collaboration Tips
- **Naming Convention**: Use clear, descriptive names
- **Version Control**: Save incremental versions
- **Documentation**: Comment complex areas
- **Testing**: Verify with other admins before release

## 🆕 Future Enhancements

### Planned Features
- **Undo/Redo System**: Full edit history
- **Multi-Selection**: Select multiple objects
- **Copy/Paste**: Duplicate map elements
- **Prefab Library**: Reusable map components
- **Lighting Editor**: Dynamic lighting setup
- **Texture Painting**: Direct texture editing
- **Animation Support**: Animated map elements

### Integration Improvements
- **Live Collaboration**: Multiple admins editing simultaneously
- **Version Control**: Map versioning and branching
- **Asset Browser**: Browse and search map assets
- **Template System**: Start from predefined templates
- **Export Options**: Multiple format support

---

**Created**: 2025-08-26  
**Version**: 1.0.0  
**Compatibility**: Pokemon MMO v1.0+  
**Requirements**: Admin/Co-Admin access, WebGL-enabled browser