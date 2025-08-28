const { chromium } = require('playwright');

async function openEditor() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Go directly to the Pokemon map editor
        await page.goto('http://localhost:3000/pokemon-map-editor/');
        
        console.log('✅ Map editor opened at localhost:3002');
        
    } catch (error) {
        console.error('❌ Error opening editor:', error);
        await browser.close();
    }
}

openEditor();