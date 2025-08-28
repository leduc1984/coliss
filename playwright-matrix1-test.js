const { chromium } = require('playwright');

async function testMatrix1Map() {
  console.log('Starting Playwright automation for Pokemon MMO matrix1 map testing...');
  
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
    
    // Login with test credentials
    console.log('Logging in...');
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
    
    // Check if we're on the matrix1 map
    console.log('Checking current map...');
    const currentMap = await page.textContent('#currentMap');
    console.log('Current map:', currentMap);
    
    // Wait for player to be loaded
    console.log('Waiting for player to load...');
    await page.waitForTimeout(5000);
    
    // Test camera controls
    console.log('Testing camera controls...');
    
    // Take initial screenshot
    await page.screenshot({ path: 'matrix1-initial-view.png' });
    console.log('Initial view screenshot saved as matrix1-initial-view.png');
    
    // Test camera reset key (R)
    console.log('Testing camera reset (R key)...');
    await page.keyboard.press('R');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'matrix1-after-reset.png' });
    console.log('After reset screenshot saved as matrix1-after-reset.png');
    
    // Test player movement to verify camera is working correctly
    console.log('Testing player movement...');
    
    // Move forward (W key)
    console.log('Moving forward...');
    await page.keyboard.press('W');
    await page.waitForTimeout(2000);
    
    // Move left (A key)
    console.log('Moving left...');
    await page.keyboard.press('A');
    await page.waitForTimeout(2000);
    
    // Move backward (S key)
    console.log('Moving backward...');
    await page.keyboard.press('S');
    await page.waitForTimeout(2000);
    
    // Move right (D key)
    console.log('Moving right...');
    await page.keyboard.press('D');
    await page.waitForTimeout(2000);
    
    // Test running (Shift key)
    console.log('Testing running...');
    await page.keyboard.down('Shift');
    await page.keyboard.press('W');
    await page.waitForTimeout(2000);
    await page.keyboard.up('Shift');
    
    // Take final screenshot
    await page.screenshot({ path: 'matrix1-final-view.png' });
    console.log('Final view screenshot saved as matrix1-final-view.png');
    
    // Test debug info (P key)
    console.log('Checking debug info...');
    await page.keyboard.press('P');
    await page.waitForTimeout(1000);
    
    console.log('Matrix1 map test completed. Keeping browser open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Matrix1 map test error:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the matrix1 map test
if (require.main === module) {
  testMatrix1Map().catch(console.error);
}

module.exports = { testMatrix1Map };