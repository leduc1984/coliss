const axios = require('axios');

// MCP server URL
const MCP_SERVER = 'http://localhost:3001';

// Example function to demonstrate MCP usage
async function runMMOTest() {
  try {
    console.log('Starting MMO test using Playwright MCP...');
    
    // Navigate to the game
    console.log('Navigating to game...');
    await axios.post(`${MCP_SERVER}/navigate`, {
      url: 'http://localhost:3000'
    });
    
    // Wait for auth screen
    console.log('Waiting for auth screen...');
    await axios.post(`${MCP_SERVER}/waitForSelector`, {
      selector: '#auth-screen'
    });
    
    // Fill login form
    console.log('Filling login form...');
    await axios.post(`${MCP_SERVER}/fill`, {
      selector: '#loginInput',
      text: 'leduc'
    });
    
    await axios.post(`${MCP_SERVER}/fill`, {
      selector: '#loginPassword',
      text: 'TestPass123!'
    });
    
    // Submit login
    console.log('Submitting login...');
    await axios.post(`${MCP_SERVER}/click`, {
      selector: 'button[type="submit"]'
    });
    
    // Wait for game screen
    console.log('Waiting for game screen...');
    await axios.post(`${MCP_SERVER}/waitForSelector`, {
      selector: '#game-screen'
    });
    
    // Wait for game to load
    console.log('Waiting for game to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot
    console.log('Taking screenshot...');
    await axios.post(`${MCP_SERVER}/screenshot`, {
      path: 'mcp-test-screenshot.png'
    });
    
    // Test movement
    console.log('Testing movement...');
    await axios.post(`${MCP_SERVER}/pressKey`, {
      key: 'W'
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await axios.post(`${MCP_SERVER}/pressKey`, {
      key: 'A'
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check current map
    console.log('Checking current map...');
    const mapResponse = await axios.post(`${MCP_SERVER}/getText`, {
      selector: '#currentMap'
    });
    
    console.log('Current map:', mapResponse.data.text);
    
    // Final screenshot
    console.log('Taking final screenshot...');
    await axios.post(`${MCP_SERVER}/screenshot`, {
      path: 'mcp-test-final.png'
    });
    
    console.log('MMO test completed successfully!');
    
  } catch (error) {
    console.error('MMO test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  runMMOTest().catch(console.error);
}

module.exports = { runMMOTest };