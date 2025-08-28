const { chromium } = require('playwright');

async function testAdminMapSelector() {
  console.log('Starting Playwright automation for Pokemon MMO admin map selector testing...');
  
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
    
    // Login with admin credentials
    console.log('Logging in as admin...');
    await page.fill('#loginInput', 'leduc');
    await page.fill('#loginPassword', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    // Wait for the game screen to load
    console.log('Waiting for game screen...');
    await page.waitForSelector('#game-screen', { timeout: 15000 });
    
    console.log('Game screen loaded successfully');
    
    // Wait for the game canvas to be visible
    console.log('Waiting for game canvas...');
    await page.waitForSelector('#gameCanvas', { timeout: 10000 });
    
    // Wait for player to be loaded
    console.log('Waiting for player to load...');
    await page.waitForTimeout(5000);
    
    // Test admin map selector (1 key)
    console.log('Testing admin map selector (1 key)...');
    await page.keyboard.press('1');
    await page.waitForTimeout(3000);
    
    // Check if map selector is visible
    const mapSelectorVisible = await page.isVisible('#map-selector-modal');
    console.log('Map selector visible:', mapSelectorVisible);
    
    if (mapSelectorVisible) {
      // Take screenshot of map selector
      await page.screenshot({ path: 'admin-map-selector.png' });
      console.log('Admin map selector screenshot saved as admin-map-selector.png');
      
      // Close map selector
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    
    // Test map editor access (9 key) - should open in new tab
    console.log('Testing map editor access (9 key)...');
    const pagePromise = context.waitForEvent('page');
    await page.keyboard.press('9');
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    
    // Check if new page is map editor
    const newPageUrl = newPage.url();
    console.log('New page URL:', newPageUrl);
    
    if (newPageUrl.includes('pokemon-map-editor')) {
      console.log('Map editor opened successfully');
      await newPage.screenshot({ path: 'map-editor.png' });
      console.log('Map editor screenshot saved as map-editor.png');
      await newPage.close();
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'admin-final-view.png' });
    console.log('Admin final view screenshot saved as admin-final-view.png');
    
    console.log('Admin map selector test completed. Keeping browser open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Admin map selector test error:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the admin map selector test
if (require.main === module) {
  testAdminMapSelector().catch(console.error);
}

module.exports = { testAdminMapSelector };