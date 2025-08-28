const { chromium } = require('playwright');

async function testCalemMap() {
  console.log('Starting Playwright test for calem user map loading...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the Pokemon MMO game
    console.log('Navigating to Pokemon MMO...');
    await page.goto('http://localhost:3000');
    
    // Wait for the auth screen to load
    console.log('Waiting for auth screen...');
    await page.waitForSelector('#auth-screen', { timeout: 10000 });
    
    console.log('Auth screen loaded successfully');
    
    // Fill in login form with calem credentials
    console.log('Filling login form for calem...');
    await page.fill('#loginInput', 'calem');
    await page.fill('#loginPassword', 'password123');
    
    // Submit the login form
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for the game screen to load
    console.log('Waiting for game screen...');
    await page.waitForSelector('#game-screen', { timeout: 15000 });
    
    console.log('Game screen loaded successfully');
    
    // Wait for the game canvas to be visible
    console.log('Waiting for game canvas...');
    await page.waitForSelector('#gameCanvas', { timeout: 10000 });
    
    // Wait a bit more for the map to fully load
    await page.waitForTimeout(5000);
    
    // Check if the current map is displayed
    const currentMap = await page.textContent('#currentMap');
    console.log('Current map:', currentMap);
    
    // Check if it's the correct map
    if (currentMap === 'soaring_overworld') {
      console.log('✅ SUCCESS: calem is loading the correct map (soaring_overworld)');
    } else {
      console.log('❌ FAILURE: calem is loading the wrong map:', currentMap);
      console.log('Expected: soaring_overworld');
    }
    
    // Take a screenshot of the game screen
    await page.screenshot({ path: 'calem-game-screen.png' });
    console.log('Game screen screenshot saved as calem-game-screen.png');
    
    console.log('Test completed. Keeping browser open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the test
if (require.main === module) {
  testCalemMap().catch(console.error);
}

module.exports = { testCalemMap };