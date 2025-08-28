const { chromium } = require('playwright');

async function testMapFunctionality() {
  console.log('Starting Playwright automation for Pokemon MMO map testing...');
  
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
    
    // Example automation: Fill in login form with test credentials
    console.log('Filling login form...');
    await page.fill('#loginInput', 'testuser');
    await page.fill('#loginPassword', 'TestPass123!');
    
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
    
    // Test map functionality
    console.log('Testing map functionality...');
    
    // Check if the current map is displayed
    const currentMap = await page.textContent('#currentMap');
    console.log('Current map:', currentMap);
    
    // Take a screenshot of the game screen
    await page.screenshot({ path: 'game-screen.png' });
    console.log('Game screen screenshot saved as game-screen.png');
    
    // Test player movement (simulate key presses)
    console.log('Testing player movement...');
    await page.keyboard.press('W');
    await page.waitForTimeout(1000);
    await page.keyboard.press('A');
    await page.waitForTimeout(1000);
    await page.keyboard.press('S');
    await page.waitForTimeout(1000);
    await page.keyboard.press('D');
    await page.waitForTimeout(1000);
    
    // Test chat functionality
    console.log('Testing chat functionality...');
    await page.click('#chatInput');
    await page.fill('#chatInput', 'Hello from Playwright!');
    await page.click('#sendChat');
    
    // Take a screenshot after movement and chat
    await page.screenshot({ path: 'game-screen-after-actions.png' });
    console.log('Game screen after actions screenshot saved as game-screen-after-actions.png');
    
    console.log('Map functionality test completed. Keeping browser open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Map test error:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the map test
if (require.main === module) {
  testMapFunctionality().catch(console.error);
}

module.exports = { testMapFunctionality };