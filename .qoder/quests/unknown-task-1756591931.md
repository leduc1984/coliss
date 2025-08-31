# Map Editor Duplication Issue in MCP Playwright Integration

## Overview

This document addresses the issue where using the MCP Playwright system to open the map editor results in one editor opening on top of another, creating a confusing user experience. The problem occurs when the MCP server attempts to open the map editor while it may already be open or when multiple instances are launched.

## Problem Analysis

### Current System Architecture

The Pokemon MMO system has multiple components that can open the map editor:

1. **Main Game Server** (`server.js`) - Serves the map editor at `/pokemon-map-editor/`
2. **Standalone Map Editor Server** (`pokemon-map-editor/server.js`) - Runs on port 3001
3. **MCP Playwright Server** (`playwright-mcp-server.js`) - Runs on port 3001, controls browser automation
4. **Direct Opening Script** (`open-editor.js`) - Directly opens the map editor in a browser

### Issue Identification

The duplication occurs because:
1. The main game server is already running and serving the map editor
2. The MCP Playwright system creates a new browser instance and navigates to the map editor
3. Multiple browser instances or tabs can be opened without checking if one already exists
4. No singleton pattern is implemented to ensure only one instance of the map editor is open at a time

## Solution Design

### Approach 1: Browser Tab Reuse Strategy

Instead of always creating a new browser instance, check if the map editor is already open in an existing tab and reuse it.

#### Implementation Plan

1. Modify the MCP Playwright server to track browser instances
2. Before opening a new page, check if a tab with the map editor URL already exists
3. If found, bring that tab to focus instead of creating a new one
4. If not found, create a new tab

#### Code Changes

In `playwright-mcp-server.js`:
- Add a registry to track open pages and their URLs
- Modify the navigation function to check existing pages before creating new ones

### Approach 2: Map Editor Singleton Enforcement

Implement a singleton pattern in the map editor itself to prevent multiple instances.

#### Implementation Plan

1. Add a check in the map editor's initialization code
2. Use localStorage or a server-side flag to track if an instance is already running
3. If an instance is detected, either:
   - Redirect to the existing instance
   - Show a message that the editor is already open
   - Bring the existing window to focus

### Approach 3: Centralized Editor Management

Create a centralized service that manages all map editor instances.

#### Implementation Plan

1. Create a new service that tracks all map editor instances
2. All requests to open the editor go through this service
3. The service ensures only one instance is active at a time
4. Provide API endpoints for checking editor status

## Recommended Solution

I recommend implementing **Approach 1: Browser Tab Reuse Strategy** as it:
- Requires minimal changes to existing code
- Addresses the core issue without affecting other functionality
- Works within the existing MCP Playwright framework
- Provides immediate user experience improvement

## Detailed Implementation

### Modifications to `playwright-mcp-server.js`

1. Add a page registry to track open pages:
```javascript
// Global registry to track open pages
const pageRegistry = new Map();
```

2. Modify the `initBrowser()` function to check for existing pages:
```javascript
async function initBrowser(targetUrl) {
  if (!browser) {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Register the page with its URL
    if (targetUrl) {
      pageRegistry.set(targetUrl, page);
    }
    
    console.log('Browser initialized');
  } else {
    // Check if we already have a page for this URL
    if (targetUrl && pageRegistry.has(targetUrl)) {
      page = pageRegistry.get(targetUrl);
      // Bring existing page to front
      await page.bringToFront();
      return;
    }
    
    // Create new page for this URL
    const context = browser.contexts()[0];
    page = await context.newPage();
    
    if (targetUrl) {
      pageRegistry.set(targetUrl, page);
    }
  }
}
```

3. Update all tool endpoints to pass the target URL:
```javascript
app.post('/navigate', async (req, res) => {
  try {
    const { url } = req.body;
    await initBrowser(url); // Pass URL to initBrowser
    await page.goto(url);
    res.json({ success: true, message: `Navigated to ${url}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Modifications to Map Editor Client-side

Add a simple check in the map editor's initialization to detect if another instance is already running:

1. In `pokemon-map-editor/editor.js`, add:
```javascript
// Check if another instance is already running
if (localStorage.getItem('mapEditorInstance')) {
  const existingInstanceId = localStorage.getItem('mapEditorInstance');
  console.warn(`Map editor instance ${existingInstanceId} is already running`);
  // Optionally show a message to the user
}

// Set current instance
const instanceId = Date.now().toString();
localStorage.setItem('mapEditorInstance', instanceId);

// Clean up on unload
window.addEventListener('beforeunload', () => {
  localStorage.removeItem('mapEditorInstance');
});
```

## Testing Strategy

1. **Unit Tests**:
   - Test the page registry functionality
   - Verify that existing pages are reused correctly
   - Ensure new pages are created when needed

2. **Integration Tests**:
   - Test the complete flow of opening the map editor via MCP
   - Verify that only one instance opens even with multiple requests
   - Check that focus is properly transferred to existing instances

3. **User Acceptance Tests**:
   - Manual testing of the map editor opening via different methods
   - Verification that the user experience is improved
   - Check that no duplicate editors appear

## Deployment Considerations

1. **Backward Compatibility**: 
   - The changes are additive and don't break existing functionality
   - Existing scripts that use the MCP server will continue to work

2. **Performance Impact**:
   - Minimal performance impact from tracking pages
   - Potential improvement from reusing existing browser resources

3. **Error Handling**:
   - Proper error handling for cases where tracked pages are closed manually
   - Cleanup of registry when pages are closed

## Future Enhancements

1. **Multi-Editor Support**:
   - Allow multiple editors for different maps with clear labeling
   - Implement tab management for easy switching

2. **Session Persistence**:
   - Save editor state to resume work after browser restart
   - Implement workspace management features

3. **Enhanced Automation**:
   - Add more sophisticated MCP tools for map editor automation
   - Implement batch operations for common editing tasks

## Conclusion

The proposed solution addresses the core issue of duplicate map editor instances by implementing a browser tab reuse strategy. This approach is minimally invasive, maintains backward compatibility, and provides immediate improvement to the user experience. The implementation focuses on the MCP Playwright server where the issue originates, ensuring that automation requests intelligently reuse existing editor instances rather than creating new ones.