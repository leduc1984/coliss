# Role-Based Player Models System

## 🎭 Overview

The Pokemon MMO now supports role-based 3D player models, with special admin models for privileged users. The system automatically loads the appropriate GLB model based on user roles.

## 👑 Player Models

### **Regular Players** (`player.glb`)
- **File**: `pokemon-map-editor/assets/player/player.glb`
- **Used for**: Regular users, helpers
- **Fallback color**: Blue (#0066CC)

### **Admin Players** (`admin.glb`)
- **File**: `pokemon-map-editor/assets/player/admin.glb`
- **Used for**: Admin, Co-admin roles
- **Fallback color**: Gold (#FFD700)
- **Special features**: Larger, golden name tags

## 🔧 System Features

### **Automatic Model Selection**
```javascript
// Game automatically chooses model based on user role
if (user.role === 'admin' || user.role === 'co-admin') {
    modelFileName = 'admin.glb';  // Load admin model
} else {
    modelFileName = 'player.glb'; // Load regular model
}
```

### **Animation System**
- **Idle**: Standing still animation
- **Walk**: Moving with WASD keys
- **Run**: Moving while holding Shift/Space
- Both models share the same animation system

### **Role-Based Visual Differences**
- **Admin name tags**: Gold color (#FFD700) with larger font
- **Regular name tags**: White color (#FFFFFF) with standard font
- **Fallback materials**: Different colors when 3D models fail to load

## 🎮 In-Game Features

### **Multiplayer Support**
- Each player sees others with correct role-based models
- Admin players are visually distinguished in multiplayer
- Real-time model loading for new players joining

### **Fallback System**
- If GLB model fails to load, uses colored capsule mesh
- Admin: Gold capsule
- Regular: Blue capsule
- Ensures gameplay continuity

## 🛠️ Technical Implementation

### **File Structure**
```
pokemon-map-editor/
└── assets/
    └── player/
        ├── player.glb    # Regular player model
        └── admin.glb     # Admin player model
```

### **Role Detection**
The system checks user roles from the authentication system:
- `admin`: Full administrator privileges
- `co-admin`: Secondary administrator privileges
- `helper`: Assistant role (uses regular model)
- `user`: Standard player (uses regular model)

### **Network Protocol**
Player data now includes role information:
```javascript
{
    userId: 123,
    username: "leduc",
    role: "admin",        // NEW: Role information
    position: {...},
    character: {...}
}
```

## 🧪 Testing

### **Model Testing Page**
Access `http://localhost:3000/test-player-model.html` to test both models:
- **Test Regular Player**: Loads `player.glb`
- **Test Admin Player**: Loads `admin.glb`
- **Clear Scene**: Removes current model

### **In-Game Testing**
1. Login as admin user (leduc)
2. Observe gold name tag and admin model
3. Create regular user and observe differences
4. Test multiplayer with mixed roles

## 🎯 User Experience

### **Admin Benefits**
- Distinctive golden appearance
- Enhanced visual status in multiplayer
- Same gameplay mechanics as regular players
- Professional admin presence

### **Recognition System**
- Players can easily identify administrators
- Clear visual hierarchy in multiplayer sessions
- Maintains game balance while showing authority

## 🔍 Troubleshooting

### **Model Not Loading**
1. Check file exists: `pokemon-map-editor/assets/player/admin.glb`
2. Verify file permissions and accessibility
3. Check browser console for loading errors
4. Fallback system will use colored capsule

### **Role Not Recognized**
1. Verify user role in database
2. Check authentication token validity
3. Ensure role information is broadcast correctly
4. Refresh client connection

### **Animation Issues**
1. Verify GLB file contains animation data
2. Check animation naming conventions
3. Both models should have compatible animations
4. Test with model testing page

## 📋 Future Enhancements

- **Additional Role Models**: Helper-specific models
- **Customization**: Player model selection
- **Effects**: Special particle effects for admin
- **Badges**: 3D role indicators
- **Outfits**: Seasonal admin appearances

## ⚙️ Configuration

The system automatically detects and applies appropriate models based on database roles. No additional configuration required.

**Memory Requirements**: ~300KB per unique GLB model
**Performance Impact**: Minimal, with efficient fallback system
**Compatibility**: Works with all Babylon.js supported browsers

---

*Role-based models enhance the Pokemon MMO experience by providing clear visual distinction for administrators while maintaining gameplay balance.*