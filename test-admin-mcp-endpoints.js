const axios = require('axios');

// MCP server base URL
const MCP_BASE_URL = 'http://localhost:3001';

// Game server URL
const GAME_URL = 'http://localhost:3000';

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'leduc',
  password: 'Sansgenie1!'
};

async function testMCPNavigation() {
  console.log('Testing MCP Navigation endpoint...');
  
  try {
    const response = await axios.post(`${MCP_BASE_URL}/navigate`, {
      url: GAME_URL
    });
    
    console.log('Navigation response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Navigation test failed:', error.message);
    return false;
  }
}

async function testMCPFill() {
  console.log('Testing MCP Fill endpoint...');
  
  try {
    // Test filling username field
    const response1 = await axios.post(`${MCP_BASE_URL}/fill`, {
      selector: '#loginInput',
      text: ADMIN_CREDENTIALS.username
    });
    console.log('Fill username response:', response1.data);
    
    // Test filling password field
    const response2 = await axios.post(`${MCP_BASE_URL}/fill`, {
      selector: '#loginPassword',
      text: ADMIN_CREDENTIALS.password
    });
    console.log('Fill password response:', response2.data);
    
    return response1.data.success && response2.data.success;
  } catch (error) {
    console.error('Fill test failed:', error.message);
    return false;
  }
}

async function testMCPClick() {
  console.log('Testing MCP Click endpoint...');
  
  try {
    const response = await axios.post(`${MCP_BASE_URL}/click`, {
      selector: 'button[type="submit"]'
    });
    
    console.log('Click response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Click test failed:', error.message);
    return false;
  }
}

async function testMCPKeyPress() {
  console.log('Testing MCP Key Press endpoint...');
  
  try {
    // Test pressing '1' key for map selector
    const response1 = await axios.post(`${MCP_BASE_URL}/pressKey`, {
      key: '1'
    });
    console.log('Press "1" key response:', response1.data);
    
    // Test pressing 'Escape' key to close
    const response2 = await axios.post(`${MCP_BASE_URL}/pressKey`, {
      key: 'Escape'
    });
    console.log('Press "Escape" key response:', response2.data);
    
    return response1.data.success && response2.data.success;
  } catch (error) {
    console.error('Key press test failed:', error.message);
    return false;
  }
}

async function testMCPGetText() {
  console.log('Testing MCP Get Text endpoint...');
  
  try {
    const response = await axios.post(`${MCP_BASE_URL}/getText`, {
      selector: '#currentMap'
    });
    
    console.log('Get text response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Get text test failed:', error.message);
    return false;
  }
}

async function testMCPWaitForSelector() {
  console.log('Testing MCP Wait For Selector endpoint...');
  
  try {
    const response = await axios.post(`${MCP_BASE_URL}/waitForSelector`, {
      selector: '#game-screen',
      timeout: 10000
    });
    
    console.log('Wait for selector response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Wait for selector test failed:', error.message);
    return false;
  }
}

async function testMCPScreenshot() {
  console.log('Testing MCP Screenshot endpoint...');
  
  try {
    const response = await axios.post(`${MCP_BASE_URL}/screenshot`, {
      path: 'mcp-test-screenshot.png'
    });
    
    console.log('Screenshot response:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Screenshot test failed:', error.message);
    return false;
  }
}

async function runAllMCPEndpointTests() {
  console.log('Running all MCP endpoint tests...\n');
  
  const tests = [
    { name: 'Navigation', fn: testMCPNavigation },
    { name: 'Fill', fn: testMCPFill },
    { name: 'Click', fn: testMCPClick },
    { name: 'Key Press', fn: testMCPKeyPress },
    { name: 'Get Text', fn: testMCPGetText },
    { name: 'Wait For Selector', fn: testMCPWaitForSelector },
    { name: 'Screenshot', fn: testMCPScreenshot }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`\n--- Testing ${test.name} ---`);
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      
      if (result) {
        console.log(`✅ ${test.name} test passed`);
      } else {
        console.log(`❌ ${test.name} test failed`);
      }
    } catch (error) {
      console.error(`💥 ${test.name} test crashed:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }
  
  console.log('\n--- Test Results Summary ---');
  let passedCount = 0;
  
  for (const result of results) {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    if (result.passed) passedCount++;
  }
  
  console.log(`\n📊 Overall: ${passedCount}/${results.length} tests passed`);
  
  if (passedCount === results.length) {
    console.log('🎉 All MCP endpoint tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runAllMCPEndpointTests()
    .then(() => {
      console.log('\n✅ MCP endpoint tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ MCP endpoint tests failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runAllMCPEndpointTests };