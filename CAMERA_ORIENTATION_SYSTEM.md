# Pokemon MMO - Camera and Orientation System

## Overview

This document describes the implementation of the authentic Pokemon ORAS-style camera and orientation system in the Pokemon MMO game. The system provides world-relative movement and a fixed camera view that matches the perspective from Pokemon Omega Ruby and Alpha Sapphire.

## Features

### World-Relative Movement

The player movement system has been updated to use world-relative movement instead of camera-relative movement. This ensures that:

- Pressing W always moves the player north (positive Z direction)
- Pressing S always moves the player south (negative Z direction)
- Pressing A always moves the player west (negative X direction)
- Pressing D always moves the player east (positive X direction)

This provides an authentic Pokemon gaming experience where movement is consistent regardless of camera orientation.

### Player Rotation

The player rotation system calculates the player's facing direction based on their movement vector using the formula:

```
const targetRotation = Math.atan2(moveVector.x, moveVector.z);
```

This ensures that the player always faces the direction they are moving, which is consistent with Pokemon games.

### Fixed ORAS Camera

The camera system implements authentic Pokemon ORAS characteristics:

| Setting | Value | Purpose |
|---------|-------|---------|
| Radius | 8 units | Authentic ORAS distance |
| Beta | Math.PI / 3.5 (~50°) | Characteristic viewing angle |
| Alpha | -Math.PI / 2 | Behind player, facing north |
| Locked Target | Player position + 1 unit height | Proper viewing perspective |

All manual camera controls have been disabled to maintain the fixed ORAS perspective.

## Implementation Details

### PlayerController Changes

The [PlayerController](file:///c%3A/Users/Leduc/Desktop/projet/public/js/player.js#L1-L1068) class in [public/js/player.js](file:///c%3A/Users/Leduc/Desktop/projet/public/js/player.js) has been updated with the following changes:

1. **Movement Calculation**: The [updateMovement()](file:///c%3A/Users/Leduc/Desktop/projet/public/js/player.js#L426-L495) method now calculates movement using world coordinates instead of camera-relative coordinates.

2. **Rotation Calculation**: Player rotation is calculated using `Math.atan2(moveVector.x, moveVector.z)` to ensure proper facing direction.

3. **ORAS Camera Setup**: The [setupORASCamera()](file:///c%3A/Users/Leduc/Desktop/projet/public/js/player.js#L75-L107) method configures the camera with authentic ORAS settings and disables manual controls.

### GameManager Changes

The [GameManager](file:///c%3A/Users/Leduc/Desktop/projet/public/js/game.js#L1-L3186) class in [public/js/game.js](file:///c%3A/Users/Leduc/Desktop/projet/public/js/game.js) has been updated with the following changes:

1. **Camera Initialization**: The [initializeBabylon()](file:///c%3A/Users/Leduc/Desktop/projet/public/js/game.js#L234-L404) method creates the camera with authentic ORAS parameters.

2. **Camera Constraints**: Camera constraints are set to maintain the fixed ORAS perspective.

## Debug Tools

### Real-time Debug Overlay (F1)

Press F1 to toggle a debug overlay showing:
- Player position (X, Y, Z)
- Player rotation in degrees
- Camera angles (Alpha, Beta, Radius)
- Movement state (Idle/Walking/Running)

### Console Debug (P key)

Press P to output detailed information to the console:
- Position and rotation data (in both radians and degrees)
- Camera settings
- Movement state
- Input map status

### Movement Indicator

A visual compass shows:
- Active movement directions (green arrows)
- Player status (gold center dot, red when running)

## Testing

Unit tests have been created for the camera and orientation system:

1. **PlayerController.test.js**: Tests for world-relative movement and player rotation
2. **CameraSystem.test.js**: Tests for ORAS camera configuration
3. **CameraPlayerIntegration.test.js**: Integration tests for camera-player synchronization

## API Endpoints

The system uses the existing player movement API endpoints:

### Player Movement Update
```
POST /api/player/move
{
  "position": { "x": 0, "y": 0, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 },
  "isMoving": true,
  "isRunning": false
}
```

## Future Improvements

Possible future enhancements to the camera and orientation system:

1. **Dynamic Camera Transitions**: Smooth transitions between different camera modes
2. **Battle Camera**: Special camera settings for battle sequences
3. **Cinematic Camera**: Predefined cinematic sequences for story moments
4. **First-Person View**: Optional first-person perspective for indoor areas