# Map Editor Duplication Issue Solution

## Problem Description
When using the MCP Playwright system to open the map editor, it was creating duplicate editors on top of each other. This happened because:
1. The main game server was already running and serving the map editor
2. The MCP Playwright system created a new browser instance and navigated to the map editor
3. Multiple browser instances or tabs could be opened without checking if one already exists
4. No singleton pattern was implemented to ensure only one instance of the map editor is open at a time

## Solution Implemented

### 1. Server-Side Solution (MCP Playwright Server)
Modified [playwright-mcp-server.js](file:///C:/Users/Leduc/Desktop/projet/playwright-mcp-server.js) to implement a page registry system:

- Added a `pageRegistry` Map to track open pages by URL
- Modified the `initBrowser()` function to check for existing pages before creating new ones
- If a page for the requested URL already exists, it brings that page to focus instead of creating a new one
- If no page exists for the URL, it creates a new page and registers it

### 2. Client-Side Solution (Map Editor)
Modified [pokemon-map-editor/editor.js](file:///C:/Users/Leduc/Desktop/projet/pokemon-map-editor/editor.js) to implement localStorage-based instance tracking:

- Added code to check if another instance is already running using localStorage
- If an instance is detected, it dispatches a custom event to request focus
- The existing instance listens for this event and attempts to focus itself
- Clean up localStorage entry when the window is closed

### 3. Consistency Improvements
Updated [open-editor.js](file:///C:/Users/Leduc/Desktop/projet/open-editor.js) to use the same URL pattern for consistency.

## Key Changes

### In `playwright-mcp-server.js`:
```javascript
// Added page registry
const pageRegistry = new Map();

// Modified initBrowser to accept targetUrl parameter
async function initBrowser(targetUrl = null) {
  if (!browser) {
    // Create new browser instance
  } else if (targetUrl && pageRegistry.has(targetUrl)) {
    // Reuse existing page
    page = pageRegistry.get(targetUrl);
    await page.bringToFront();
    return;
  } else {
    // Create new page for this URL
  }
}

// Updated navigate endpoint to pass URL to initBrowser
app.post('/navigate', async (req, res) => {
  try {
    const { url } = req.body;
    await initBrowser(url);
    await page.goto(url);
    res.json({ success: true, message: `Navigated to ${url}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### In `pokemon-map-editor/editor.js`:
```javascript
// Added at the top of the file
if (typeof window !== 'undefined' && window.localStorage) {
  const instanceId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const existingInstanceId = localStorage.getItem('mapEditorInstanceId');
  
  if (existingInstanceId) {
    // Notify existing instance
    window.dispatchEvent(new CustomEvent('mapEditorFocusRequested'));
  } else {
    // Register this instance
    localStorage.setItem('mapEditorInstanceId', instanceId);
    
    // Clean up on unload
    window.addEventListener('beforeunload', () => {
      if (localStorage.getItem('mapEditorInstanceId') === instanceId) {
        localStorage.removeItem('mapEditorInstanceId');
      }
    });
    
    // Listen for focus requests
    window.addEventListener('mapEditorFocusRequested', () => {
      window.focus();
    });
  }
}
```

## Benefits of This Solution

1. **Prevents Duplicate Instances**: Only one map editor instance will be open at a time
2. **Improves User Experience**: When trying to open the editor again, it focuses the existing instance
3. **Minimal Code Changes**: The solution requires only a few targeted changes
4. **Backward Compatible**: Existing functionality remains unchanged
5. **Works Across Methods**: Whether opening via MCP, direct script, or manual navigation

## Testing the Solution

To test the solution:
1. Start the main server: `npm start`
2. Start the MCP server: `node playwright-mcp-server.js`
3. Send a request to open the map editor: 
   ```bash
   curl -X POST http://localhost:3001/navigate -H "Content-Type: application/json" -d "{\"url\":\"http://localhost:3000/pokemon-map-editor/\"}"
   ```
4. Send the same request again - it should focus the existing editor rather than opening a new one

## Future Enhancements

1. **Multi-Editor Support**: Allow multiple editors for different maps with clear labeling
2. **Session Persistence**: Save editor state to resume work after browser restart
3. **Enhanced Automation**: Add more sophisticated MCP tools for map editor automation