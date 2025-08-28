/**
 * Battle Test - Simple test script to verify battle system integration
 */

// Simple test function to verify battle system
function testBattleSystem() {
    console.log('🧪 Testing battle system integration...');
    
    // Check if BattleModule is available
    if (typeof BattleModule !== 'undefined') {
        console.log('✅ BattleModule is available');
    } else {
        console.error('❌ BattleModule is not available');
        return;
    }
    
    // Check if GameManager has battle methods
    if (window.gameManager) {
        if (typeof window.gameManager.startPokengineBattle === 'function') {
            console.log('✅ GameManager has startPokengineBattle method');
        } else {
            console.error('❌ GameManager missing startPokengineBattle method');
        }
        
        if (typeof window.gameManager.endPokengineBattle === 'function') {
            console.log('✅ GameManager has endPokengineBattle method');
        } else {
            console.error('❌ GameManager missing endPokengineBattle method');
        }
    } else {
        console.error('❌ GameManager is not available');
    }
    
    // Check if battle container exists
    const battleContainer = document.getElementById('battle-container');
    if (battleContainer) {
        console.log('✅ Battle container exists');
    } else {
        console.error('❌ Battle container is missing');
    }
    
    console.log('🏁 Battle system test completed');
}

// Function to check if GameManager is available
function checkGameManagerAvailable() {
    if (window.gameManager) {
        testBattleSystem();
    } else {
        // Wait for GameManager to be initialized
        console.log('⏳ Waiting for GameManager to initialize...');
        setTimeout(checkGameManagerAvailable, 1000); // Check again in 1 second
    }
}

// Run test when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(checkGameManagerAvailable, 500); // Wait a bit after DOM loads
    });
} else {
    setTimeout(checkGameManagerAvailable, 500); // Wait a bit after DOM loads
}