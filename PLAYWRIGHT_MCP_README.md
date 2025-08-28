# Playwright MCP Integration for Pokemon MMO

This document explains how to use Playwright with MCP (Model Context Protocol) to automate and test the Pokemon MMO browser game.

## Setup

1. Ensure the main game server is running:
   ```bash
   npm start
   ```

2. Start the Playwright MCP server:
   ```bash
   npm run mcp-server
   ```

## Available Scripts

- `npm run test:playwright` - Run basic Playwright automation
- `npm run test:map` - Test general map functionality
- `npm run test:matrix1` - Test matrix1 map and camera functionality
- `npm run test:admin` - Test admin map selector functionality
- `npm run mcp-server` - Start the Playwright MCP server

## MCP Server Endpoints

The MCP server runs on `http://localhost:3001` and provides the following endpoints:

- `POST /navigate` - Navigate to a URL
- `POST /click` - Click an element by selector
- `POST /fill` - Fill an input field
- `POST /getText` - Get text content of an element
- `POST /screenshot` - Take a screenshot
- `POST /pressKey` - Press a keyboard key
- `POST /waitForSelector` - Wait for an element to appear

## Example Usage

```javascript
// Navigate to the game
await axios.post('http://localhost:3001/navigate', {
  url: 'http://localhost:3000'
});

// Fill login form
await axios.post('http://localhost:3001/fill', {
  selector: '#loginInput',
  text: 'leduc'
});

// Click login button
await axios.post('http://localhost:3001/click', {
  selector: 'button[type="submit"]'
});
```

## Test Scenarios

### Basic Navigation Test
- Navigate to game URL
- Verify auth screen loads
- Fill login form
- Submit and verify game loads

### Map Functionality Test
- Verify current map display
- Test player movement (WASD keys)
- Test chat functionality
- Take screenshots for verification

### Matrix1 Map Test
- Verify matrix1 map loading
- Test camera controls (R key)
- Test player movement in matrix1
- Verify camera follows player correctly

### Admin Map Test
- Test admin map selector (1 key)
- Test map editor access (9 key)
- Verify admin-only features

## Integration with Qoder

To integrate with Qoder IDE:

1. Configure the MCP server in Qoder's settings
2. Use natural language commands that map to the MCP endpoints
3. Example commands:
   - "Navigate to the Pokemon MMO game"
   - "Login as user 'leduc'"
   - "Move the player forward"
   - "Take a screenshot of the current view"
   - "Check what map we're on"

## Customization

You can customize the test scripts to:
- Add more specific map tests
- Test different player models
- Verify collision detection
- Test teleportation between maps
- Validate battle system integration

## Troubleshooting

If tests fail:
1. Ensure the main game server is running on port 3000
2. Check that all required assets are loaded
3. Verify selector strings match current HTML structure
4. Increase timeouts for slow-loading elements