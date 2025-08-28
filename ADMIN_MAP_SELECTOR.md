# Admin Map Selector System Documentation

⚠️ **Known Issue**: Chat functionality currently not working properly. This is a known bug being investigated.

## 🗺️ Overview

The Admin Map Selector is a powerful feature that allows administrators and co-administrators to instantly teleport to any available map in the Pokemon MMO game. This system provides quick navigation capabilities for moderation, exploration, and administrative tasks.

## ✨ Features

### 🔐 Role-Based Access
- **Restricted Access**: Only users with `admin` or `co-admin` roles can access the map selector
- **Security**: Both client-side and server-side role verification
- **Visual Indicators**: Admin users see special UI elements and controls

### 🎮 User Interface
- **Keyboard Activation**: Press `1` key to open the map selector
- **Professional Design**: Dark themed overlay with smooth animations
- **Map Categories**: Support for different map types including large maps
- **Visual Status**: Current map highlighting and selection feedback

### 🗺️ Supported Maps

1. **house_inside** - Maison Intérieure
2. **drewfort** - Drewfort
3. **fortree_city** - Fortree City
4. **slateport_city** - Slateport City
5. **sootopolis_city** - Sootopolis City
6. **shoal_cave_entrance_low** - Shoal Cave - Entrée (Marée Basse)
7. **shoal_cave_ice_room** - Shoal Cave - Salle de Glace
8. **granite_cave** - Grotte Granite
9. **fallarbor_town** - Fallarbor Town
10. **matrix** - Matrix World (Large Map with Separate Collisions) 🔒

### 🔧 Special Features

#### Matrix Map Support
The Matrix map (`matrix1.glb`) has special handling:
- **Visual Map**: `matrix1.glb` (3.1MB)
- **Collision Map**: `matrix1_collision.glb` (2.8MB) - separate collision meshes
- **Auto-Rotation**: Applies -90° rotation for proper orientation
- **Large Map Indicator**: Special purple styling in the selector

#### Advanced Map Loading
- **Dual File Support**: Main visual file + separate collision file
- **Smart Rotation**: Automatic orientation correction per map
- **Collision Optimization**: Invisible collision meshes for performance
- **Fallback Systems**: Graceful handling of missing files

## 🎯 Usage Instructions

### For Administrators

1. **Opening the Selector**
   - Press the `1` key while in-game
   - The map selector overlay will appear

2. **Navigation**
   - **Number Keys (1-9)**: Quick selection
   - **Arrow Keys (↑↓)**: Navigate through list
   - **Enter**: Confirm selection
   - **Escape**: Close selector

3. **Map Selection**
   - Click on any map in the list
   - Use keyboard shortcuts for quick selection
   - Current map is highlighted in green
   - Selected map is highlighted in orange

4. **Teleportation**
   - Click the \"🚀 Téléporter\" button
   - Or press Enter after selecting a map
   - Instant teleportation with map change notification

## 🔧 Technical Implementation

### Client-Side Components

#### Files Structure
```
public/
├── css/
│   └── admin-map-selector.css     # Styling for the selector UI
├── js/
│   ├── admin-map-selector.js      # Main selector component
│   ├── game.js                    # Enhanced with map loading
│   └── player.js                  # Keyboard event handling
└── index.html                     # Updated with new imports
```

#### Key Classes
- **AdminMapSelector**: Main component managing the UI and interactions
- **GameManager**: Enhanced with collision loading and map configurations
- **PlayerController**: Extended with admin key binding (key '1')

### Server-Side Components

#### API Endpoints
- `GET /api/admin/maps`: Retrieve available maps for admin selector
- `POST /api/admin/teleport`: Admin-only teleportation endpoint

#### Socket.IO Events
- `admin_map_request`: Client requests available maps
- `admin_maps_available`: Server sends map list
- `admin_map_change`: Admin initiates map change
- `admin_teleport_complete`: Confirm successful teleportation
- `admin_teleport_error`: Handle teleportation errors

#### Enhanced Services
- **GameService.js**: New methods for admin map handling
- **routes/admin.js**: New endpoints for map management

### Map Configuration System

```javascript
const mapConfigs = {
    'matrix': {
        path: '/pokemon-map-editor/assets/maps/perso/matrix/matrix1.glb',
        collisionPath: '/pokemon-map-editor/assets/maps/perso/matrix/matrix1_collision.glb',
        rotation: -Math.PI / 2, // 90 degrees LEFT rotation
        isLargeMap: true
    },
    // ... other maps
};
```

## 🛡️ Security Features

### Role Verification
- **Client-Side**: Initial check before showing UI
- **Server-Side**: All admin actions validated on server
- **Multiple Layers**: API endpoints and Socket.IO events both protected

### Access Control
```javascript
// Server-side role check
if (socket.user.role !== 'admin' && socket.user.role !== 'co-admin') {
    socket.emit('admin_map_request_denied', { message: 'Admin access required' });
    return;
}
```

### Anti-Exploitation
- **Rate Limiting**: Prevent rapid teleportation abuse
- **Validation**: Ensure target maps exist and are active
- **Audit Trail**: Log all admin teleportations with timestamps

## 🎨 User Interface Design

### Color Scheme
- **Background**: Dark overlay (rgba(0, 0, 0, 0.8))
- **Panel**: Gradient background (#2c3e50 → #34495e)
- **Accent**: Gold borders and highlights (#f39c12)
- **Current Map**: Green highlighting (#27ae60)
- **Selection**: Orange highlighting (#f39c12)
- **Large Maps**: Purple styling (#8e44ad)

### Animations
- **Slide-in**: Panel entrance animation
- **Hover Effects**: Button and item interactions
- **Loading Spinner**: During map retrieval
- **Color Transitions**: Smooth state changes

### Responsive Design
- **Mobile Support**: Adapts to smaller screens
- **Keyboard Navigation**: Full keyboard accessibility
- **Touch Support**: Click/tap interactions

## 🔍 Troubleshooting

### Common Issues

1. **Selector Not Opening**
   - Check user role: must be admin or co-admin
   - Verify JavaScript console for errors
   - Ensure admin-map-selector.js is loaded

2. **Maps Not Loading**
   - Check server connection
   - Verify map files exist in pokemon-map-editor/assets/maps/
   - Check console for file loading errors

3. **Teleportation Fails**
   - Verify server connection
   - Check user permissions
   - Review server logs for errors

4. **Matrix Map Issues**
   - Ensure both matrix1.glb and matrix1_collision.glb exist
   - Check file paths in configuration
   - Verify collision loading in console

### Debug Information

Press `F1` to toggle debug overlay showing:
- Player position and rotation
- Camera settings
- Movement status
- Current map information

### Console Commands

For debugging, use browser console:
```javascript
// Check if admin map selector is available
console.log(window.adminMapSelector);

// Force show selector (admin only)
if (window.adminMapSelector) {
    window.adminMapSelector.show();
}

// Check current user role
console.log(window.gameManager?.user?.role);
```

## 🔄 Updates and Maintenance

### Adding New Maps

1. **Add map files** to `pokemon-map-editor/assets/maps/`
2. **Update map configurations** in both:
   - `routes/admin.js` (line ~55)
   - `services/GameService.js` (line ~265)
   - `public/js/game.js` (line ~475)

3. **Test the new map** with admin account

### Configuration Example
```javascript
{
    id: 11,
    name: 'new_map',
    displayName: 'New Map Name',
    filePath: '/pokemon-map-editor/assets/maps/folder/map.glb',
    collisionPath: '/pokemon-map-editor/assets/maps/folder/map_collision.glb', // Optional
    rotation: -Math.PI / 2, // Optional rotation
    spawnPosition: { x: 0, y: 1, z: 0 },
    isLargeMap: false // Optional flag
}
```

## 📊 Performance Considerations

### Optimization Features
- **Lazy Loading**: Maps loaded only when needed
- **Caching**: Map list cached on client
- **Compression**: Efficient data transfer
- **Memory Management**: Proper disposal of unused resources

### Resource Usage
- **Network**: Minimal data transfer for map list
- **Memory**: Collision meshes are invisible but maintained
- **Storage**: GLB files cached by browser
- **CPU**: Smooth animations with optimized rendering

## 🚀 Future Enhancements

### Planned Features
- **Map Bookmarks**: Save frequently visited locations
- **Batch Teleportation**: Move multiple players to selected map
- **Map Status Monitoring**: Real-time map health indicators
- **Custom Spawn Points**: Define multiple spawn locations per map
- **Map Previews**: Thumbnail images in selector
- **Recent Maps**: Quick access to recently visited maps

### Integration Opportunities
- **Map Editor**: Direct integration with editing tools
- **Analytics**: Track admin teleportation patterns
- **Permissions**: Granular map access control
- **Events**: Automated map switching for events

---

**Created by**: Pokemon MMO Development Team  
**Last Updated**: 2025-08-24  
**Version**: 1.0.0  
**Compatibility**: Encore Pokemon MMO v1.0+"