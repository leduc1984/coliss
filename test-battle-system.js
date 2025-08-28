/**
 * Test script for the battle system integration
 * This script can be run in the browser console to verify the battle system is working
 */

function testBattleSystem() {
    console.log('🧪 Starting battle system integration test...');
    
    // Test 1: Check if BattleModule class exists
    if (typeof BattleModule !== 'undefined') {
        console.log('✅ BattleModule class is available');
    } else {
        console.error('❌ BattleModule class is missing');
        return;
    }
    
    // Test 2: Check if GameManager has battle methods
    if (window.gameManager) {
        const hasStartMethod = typeof window.gameManager.startPokengineBattle === 'function';
        const hasEndMethod = typeof window.gameManager.endPokengineBattle === 'function';
        
        if (hasStartMethod) {
            console.log('✅ GameManager has startPokengineBattle method');
        } else {
            console.error('❌ GameManager missing startPokengineBattle method');
        }
        
        if (hasEndMethod) {
            console.log('✅ GameManager has endPokengineBattle method');
        } else {
            console.error('❌ GameManager missing endPokengineBattle method');
        }
    } else {
        console.error('❌ GameManager is not available');
    }
    
    // Test 3: Check if battle container exists
    const battleContainer = document.getElementById('battle-container');
    if (battleContainer) {
        console.log('✅ Battle container exists');
    } else {
        console.error('❌ Battle container is missing');
    }
    
    // Test 4: Check if required CSS is loaded
    const battleStyles = document.getElementById('battle-module-styles');
    if (battleStyles) {
        console.log('✅ Battle module styles are loaded');
    } else {
        console.warn('⚠️ Battle module styles not found (may be in separate CSS file)');
    }
    
    // Test 5: Check if battle CSS file is referenced
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    let battleCssFound = false;
    cssLinks.forEach(link => {
        if (link.href.includes('battle.css')) {
            battleCssFound = true;
        }
    });
    
    if (battleCssFound) {
        console.log('✅ Battle CSS file is referenced');
    } else {
        console.warn('⚠️ Battle CSS file not found in document head');
    }
    
    console.log('🏁 Battle system integration test completed');
    
    // Additional information
    console.log('\n📝 Additional Information:');
    console.log('- BattleModule path: public/js/battle-module.js');
    console.log('- Battle CSS path: public/css/battle.css');
    console.log('- Battle container ID: battle-container');
    console.log('- Test battle methods available in window.DEBUG');
}

// Run the test
testBattleSystem();