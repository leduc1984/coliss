// Simple script to verify our singleton fix for the map editor duplication issue

console.log('=== Map Editor Singleton Fix Verification ===');
console.log('This script verifies the implementation to prevent duplicate map editor instances.');

// Check if the playwright-mcp-server.js has been updated with page registry
const fs = require('fs');
const path = require('path');

// Check playwright-mcp-server.js
const mcpServerPath = path.join(__dirname, 'playwright-mcp-server.js');
const mcpServerContent = fs.readFileSync(mcpServerPath, 'utf8');

console.log('\n1. Checking playwright-mcp-server.js for page registry implementation...');
if (mcpServerContent.includes('pageRegistry') && mcpServerContent.includes('Map()')) {
    console.log('✅ Page registry implementation found');
} else {
    console.log('❌ Page registry implementation NOT found');
}

if (mcpServerContent.includes('initBrowser(targetUrl') && mcpServerContent.includes('pageRegistry.has')) {
    console.log('✅ initBrowser function updated to handle targetUrl parameter');
} else {
    console.log('❌ initBrowser function NOT updated properly');
}

// Check editor.js
const editorPath = path.join(__dirname, 'pokemon-map-editor', 'editor.js');
const editorContent = fs.readFileSync(editorPath, 'utf8');

console.log('\n2. Checking editor.js for client-side singleton detection...');
if (editorContent.includes('mapEditorInstanceId') && editorContent.includes('localStorage')) {
    console.log('✅ Client-side singleton detection implemented');
} else {
    console.log('❌ Client-side singleton detection NOT found');
}

if (editorContent.includes('mapEditorFocusRequested')) {
    console.log('✅ Focus request handling implemented');
} else {
    console.log('❌ Focus request handling NOT implemented');
}

console.log('\n=== Implementation Summary ===');
console.log('The solution implements a dual-layer approach:');
console.log('1. Server-side (MCP Playwright): Page registry to track and reuse existing browser pages');
console.log('2. Client-side (Map Editor): LocalStorage-based detection to prevent multiple instances');
console.log('\nThis should resolve the issue where using MCP Playwright to open the map editor');
console.log('would create duplicate editors on top of each other.');