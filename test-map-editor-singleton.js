const { chromium } = require('playwright');

async function testMapEditorSingleton() {
    console.log('Testing map editor singleton behavior...');
    
    // Launch browser
    const browser = await chromium.launch({ headless: false });
    
    try {
        // Create first page
        const context = await browser.newContext();
        const page1 = await context.newPage();
        
        // Navigate to map editor
        await page1.goto('http://localhost:3000/pokemon-map-editor/');
        console.log('✅ First map editor instance opened');
        
        // Wait a bit
        await page1.waitForTimeout(2000);
        
        // Create second page
        const page2 = await context.newPage();
        
        // Navigate to map editor again
        await page2.goto('http://localhost:3000/pokemon-map-editor/');
        console.log('✅ Second map editor instance opened');
        
        // Wait to observe behavior
        await page2.waitForTimeout(5000);
        
        console.log('Test completed. Check if both instances are active or if singleton behavior worked.');
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        // Close browser after test
        // await browser.close();
        console.log('Browser kept open for observation. Press Ctrl+C to close.');
        process.stdin.resume();
    }
}

testMapEditorSingleton();