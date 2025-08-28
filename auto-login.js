const { chromium } = require('playwright');

async function autoLogin() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to the game
        await page.goto('http://localhost:3000');
        
        // Wait for login form
        await page.waitForSelector('#username', { timeout: 5000 });
        
        // Fill login credentials
        await page.fill('#username', 'leduc');
        await page.fill('#password', 'Sansgenie1!');
        
        // Click login button
        await page.click('#loginBtn');
        
        // Wait for game to load
        await page.waitForSelector('#game-screen', { timeout: 10000 });
        
        console.log('✅ Auto-login successful! Admin access granted.');
        
        // Keep browser open for gaming
        // await browser.close();
        
    } catch (error) {
        console.error('❌ Auto-login failed:', error);
        await browser.close();
    }
}

autoLogin();