const { chromium } = require('playwright');

async function runAutomation() {
  console.log('Starting Playwright automation for Pokemon MMO...');
  
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
    
    // Take a screenshot of the login screen
    await page.screenshot({ path: 'login-screen.png' });
    console.log('Login screen screenshot saved as login-screen.png');
    
    console.log('Automation completed. Keeping browser open for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('Automation error:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the automation
if (require.main === module) {
  runAutomation().catch(console.error);
}

module.exports = { runAutomation };