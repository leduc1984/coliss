# Battle System Testing Guide

## Overview
This guide explains how to test the integrated pokengine battle system in the Pokemon MMO project.

## Prerequisites
1. The application must be running
2. You must be logged in as an admin user to access all testing features
3. The server must be running and accessible

## Testing Methods

### 1. Admin Control Testing
As an admin user, you can use the following keyboard shortcuts:
- Press `6` to open the admin battle help menu
- Press `0` to start a random wild Pokemon battle
- Press `7` to simulate a grass encounter (admin only)
- Press `8` to start an AI trainer battle (admin only)

### 2. Console Testing
Open the browser developer console and use the DEBUG helpers:
```javascript
// Start a random battle
window.DEBUG.randomBattle();

// Start an AI trainer battle
window.DEBUG.aiBattle();

// Simulate a grass encounter
window.DEBUG.grassEncounter();

// End the current battle
window.DEBUG.endBattle();

// Access the battle module directly
window.DEBUG.battleModule();
```

### 3. Automated Testing Script
Run the test script to verify the integration:
```javascript
// In the browser console, run:
fetch('./test-battle-system.js')
  .then(response => response.text())
  .then(script => eval(script));
```

## What to Expect

### Battle Start
1. The screen should fade or transition to the battle interface
2. The battle container (`#battle-container`) should become visible
3. The pokengine battle UI should load and display
4. Game controls should be disabled during battle

### Battle Interaction
1. You should be able to interact with the pokengine UI
2. Battle actions should be sent to the server via Socket.io
3. Battle updates should be received from the server and displayed

### Battle End
1. The battle should end properly (win, loss, escape)
2. The battle container should be hidden
3. Game controls should be re-enabled
4. The player should return to the overworld

## Troubleshooting

### Battle Container Not Visible
- Check if `#battle-container` exists in the DOM
- Verify CSS z-index values
- Ensure the container is not hidden by other elements

### Battle Module Not Loading
- Check browser console for JavaScript errors
- Verify all battle-related scripts are loaded
- Ensure the pokengine assets are accessible

### Networking Issues
- Check if Socket.io connection is active
- Verify battle events are being sent and received
- Check server logs for battle-related errors

## Files to Inspect

- `public/js/battle-module.js` - Main battle system implementation
- `public/js/game.js` - Battle integration with game manager
- `public/js/player.js` - Battle triggering methods
- `public/css/battle.css` - Battle system styling
- `public/index.html` - Battle container element

## Debugging Tips

1. Use `window.DEBUG.battleModule()` to access the battle module instance
2. Check the browser console for battle-related log messages
3. Use browser developer tools to inspect the battle container element
4. Monitor network traffic to verify battle events are being sent