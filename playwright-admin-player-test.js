const { chromium } = require('playwright');

async function testAdminPlayer() {
  console.log('Starting Playwright automation for Pokemon MMO admin player testing...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the Pokemon MMO game
    console.log('Navigating to Pokemon MMO...');
    await page.goto('http://localhost:3000');
    
    // Wait for the auth screen to load
    console.log('Waiting for auth screen...');
    await page.waitForSelector('#auth-screen', { timeout: 15000 });
    
    console.log('Auth screen loaded successfully');
    
    // Login with admin credentials
    console.log('Logging in as admin user "leduc" with password "Sansgenie1!"...');
    await page.fill('#loginInput', 'leduc');
    await page.fill('#loginPassword', 'Sansgenie1!');
    await page.click('button[type="submit"]');
    
    // Wait for the game screen to load
    console.log('Waiting for game screen...');
    await page.waitForSelector('#game-screen', { timeout: 20000 });
    
    console.log('Game screen loaded successfully');
    
    // Wait for the game canvas to be visible
    console.log('Waiting for game canvas...');
    await page.waitForSelector('#gameCanvas', { timeout: 15000 });
    
    // Check if we're on the correct map
    console.log('Checking current map...');
    try {
      const currentMap = await page.textContent('#currentMap', { timeout: 5000 });
      console.log('Current map:', currentMap);
    } catch (error) {
      console.log('Could not find current map element, this might indicate a loading issue');
    }
    
    // Wait for player to be loaded - increased timeout
    console.log('Waiting for player to load...');
    await page.waitForTimeout(10000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'admin-player-initial-view.png' });
    console.log('Initial view screenshot saved as admin-player-initial-view.png');
    
    // Test player movement
    console.log('Testing player movement...');
    
    // Move forward (W key)
    console.log('Moving forward...');
    await page.keyboard.press('W');
    await page.waitForTimeout(3000);
    
    // Move left (A key)
    console.log('Moving left...');
    await page.keyboard.press('A');
    await page.waitForTimeout(3000);
    
    // Move backward (S key)
    console.log('Moving backward...');
    await page.keyboard.press('S');
    await page.waitForTimeout(3000);
    
    // Move right (D key)
    console.log('Moving right...');
    await page.keyboard.press('D');
    await page.waitForTimeout(3000);
    
    // Test running (Shift key)
    console.log('Testing running...');
    await page.keyboard.down('Shift');
    await page.keyboard.press('W');
    await page.waitForTimeout(3000);
    await page.keyboard.up('Shift');
    
    // Test admin-specific features
    console.log('Testing admin features...');
    
    // Test admin map selector (1 key)
    console.log('Testing admin map selector (1 key)...');
    await page.keyboard.press('1');
    await page.waitForTimeout(5000);
    
    // Close map selector if open
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2000);
    
    // Test debug info (P key)
    console.log('Checking debug info...');
    await page.keyboard.press('P');
    await page.waitForTimeout(2000);
    
    // Take final screenshot
    await page.screenshot({ path: 'admin-player-final-view.png' });
    console.log('Final view screenshot saved as admin-player-final-view.png');
    
    console.log('Admin player test completed. Keeping browser open for 60 seconds...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('Admin player test error:', error);
    
    // Take screenshot on error
    try {
      await page.screenshot({ path: 'admin-player-error.png' });
      console.log('Error screenshot saved as admin-player-error.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError);
    }
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the admin player test
if (require.main === module) {
  testAdminPlayer().catch(console.error);
}

module.exports = { testAdminPlayer };