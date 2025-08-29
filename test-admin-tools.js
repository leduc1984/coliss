// Test script for admin tools integration
// This script verifies that the admin tools are properly integrated and accessible

const http = require('http');

// Test URLs for the dev tools
const testUrls = [
  '/dev-tools/dialogue-editor/',
  '/dev-tools/ui-editor/',
  '/dev-tools/monster-editor/',
  '/dev-tools/admin-panel/',
  '/pokemon-map-editor/'
];

console.log('🧪 Testing Admin Tools Integration...\n');

let passedTests = 0;
let totalTests = testUrls.length;

testUrls.forEach((url, index) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: url,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Test ${index + 1}/${totalTests}: ${url}`);
    console.log(`  Status: ${res.statusCode} ${res.statusMessage}`);
    
    if (res.statusCode === 200) {
      console.log(`  ✅ PASS: Tool is accessible`);
      passedTests++;
    } else {
      console.log(`  ❌ FAIL: Tool is not accessible`);
    }
    
    console.log('');
    
    // Check if all tests are completed
    if (index === totalTests - 1) {
      console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
      if (passedTests === totalTests) {
        console.log('🎉 All admin tools are properly integrated!');
      } else {
        console.log('⚠️  Some tools may need attention.');
      }
    }
  });

  req.on('error', (e) => {
    console.log(`Test ${index + 1}/${totalTests}: ${url}`);
    console.log(`  ❌ FAIL: ${e.message}`);
    console.log('');
    
    // Check if all tests are completed
    if (index === totalTests - 1) {
      console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
      console.log('⚠️  Some tools may need attention.');
    }
  });

  req.end();
});