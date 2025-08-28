const { chromium } = require('playwright');

async function openMapEditor() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to game
        await page.goto('http://localhost:3000');
        
        // Auto-login as admin
        await page.fill('#username', 'leduc');
        await page.fill('#password', 'Sansgenie1!');
        await page.click('#loginBtn');
        
        // Wait for game to load
        await page.waitForSelector('#game-screen', { timeout: 10000 });
        
        // Press 'E' key to open map editor
        await page.keyboard.press('KeyE');
        
        console.log('✅ Map editor opened successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await browser.close();
    }
}

openMapEditor();