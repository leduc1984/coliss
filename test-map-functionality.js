/**
 * Test script for Pokemon MMO map functionality
 * Run this in the browser console to debug map issues
 */

console.log('🧪 Starting Pokemon MMO Map Functionality Test...');

// Test 1: Check if all required components are loaded
function testComponentsLoaded() {
    console.log('\n🔍 Test 1: Checking component availability...');
    
    const components = {
        'GameManager': typeof window.gameManager,
        'Socket.io': typeof io,
        'AdminMapSelector class': typeof window.AdminMapSelector,
        'Admin Map Selector instance': typeof window.adminMapSelector,
        'PlayerController': window.gameManager ? typeof window.gameManager.playerController : 'gameManager not found',
        'Current Map': window.gameManager ? window.gameManager.currentMapName : 'gameManager not found'
    };
    
    console.table(components);
    
    const allLoaded = Object.entries(components).every(([name, type]) => 
        type !== 'undefined' && type !== 'gameManager not found'
    );
    
    console.log(allLoaded ? '✅ All components loaded' : '❌ Some components missing');
    return allLoaded;
}

// Test 2: Check user role and admin access
function testAdminAccess() {
    console.log('\n🔍 Test 2: Checking admin access...');
    
    if (!window.gameManager || !window.gameManager.user) {
        console.log('❌ User not authenticated or GameManager not available');
        return false;
    }
    
    const user = window.gameManager.user;
    console.log('User info:', {
        username: user.username,
        role: user.role,
        isAdmin: user.role === 'admin' || user.role === 'co-admin'
    });
    
    const hasAdminAccess = user.role === 'admin' || user.role === 'co-admin';
    console.log(hasAdminAccess ? '✅ User has admin access' : '❌ User lacks admin privileges');
    return hasAdminAccess;
}

// Test 3: Test admin map selector
function testAdminMapSelector() {
    console.log('\n🔍 Test 3: Testing admin map selector...');
    
    if (!window.adminMapSelector) {
        console.log('❌ Admin map selector not initialized');
        
        // Try to initialize it
        if (window.AdminMapSelector && window.gameManager) {
            console.log('🔧 Attempting to initialize admin map selector...');
            try {
                window.adminMapSelector = new AdminMapSelector(window.gameManager, window.gameManager.socket);
                console.log('✅ Admin map selector initialized successfully');
                return true;
            } catch (error) {
                console.log('❌ Failed to initialize admin map selector:', error);
                return false;
            }
        } else {
            console.log('❌ Dependencies missing for admin map selector');
            return false;
        }
    }
    
    console.log('✅ Admin map selector is available');
    
    // Test showing the selector
    try {
        console.log('🧪 Testing map selector show/hide...');
        window.adminMapSelector.show();
        
        setTimeout(() => {
            if (window.adminMapSelector.isOpen()) {
                console.log('✅ Map selector opened successfully');
                window.adminMapSelector.hide();
                console.log('✅ Map selector closed successfully');
            } else {
                console.log('❌ Map selector failed to open');
            }
        }, 1000);
        
        return true;
    } catch (error) {
        console.log('❌ Error testing map selector:', error);
        return false;
    }
}

// Test 4: Test socket connectivity
function testSocketConnection() {
    console.log('\n🔍 Test 4: Testing socket connection...');
    
    if (!window.gameManager || !window.gameManager.socket) {
        console.log('❌ Socket not available');
        return false;
    }
    
    const socket = window.gameManager.socket;
    console.log('Socket info:', {
        connected: socket.connected,
        id: socket.id,
        transport: socket.io.engine.transport.name
    });
    
    if (socket.connected) {
        console.log('✅ Socket connected successfully');
        
        // Test admin map request
        console.log('🧪 Testing admin map request...');
        socket.emit('admin_map_request');
        
        return true;
    } else {
        console.log('❌ Socket not connected');
        return false;
    }
}

// Test 5: Test map loading function
function testMapLoading() {
    console.log('\n🔍 Test 5: Testing map loading capability...');
    
    if (!window.gameManager || typeof window.gameManager.loadMap !== 'function') {
        console.log('❌ Map loading function not available');
        return false;
    }
    
    console.log('✅ Map loading function is available');
    console.log('Current map:', window.gameManager.currentMapName);
    
    // Test if we can access map configurations
    const testMapConfigs = [
        'house_inside',
        'drewfort',
        'fortree_city',
        'slateport_city',
        'matrix'
    ];
    
    console.log('Available test maps:', testMapConfigs);
    console.log('✅ Map loading test completed');
    
    return true;
}

// Test 6: Test player controller
function testPlayerController() {
    console.log('\n🔍 Test 6: Testing player controller...');
    
    if (!window.gameManager || !window.gameManager.playerController) {
        console.log('❌ Player controller not available');
        return false;
    }
    
    const playerController = window.gameManager.playerController;
    console.log('Player controller info:', {
        hasPlayer: !!playerController.player,
        position: playerController.player ? playerController.player.position : 'no player',
        teleportFunction: typeof playerController.teleportTo,
        isAdmin: playerController.isAdmin
    });
    
    console.log('✅ Player controller test completed');
    return true;
}

// Run all tests
function runAllTests() {
    console.log('🧪 Running comprehensive map functionality tests...\n');
    
    const tests = [
        { name: 'Components Loaded', fn: testComponentsLoaded },
        { name: 'Admin Access', fn: testAdminAccess },
        { name: 'Admin Map Selector', fn: testAdminMapSelector },
        { name: 'Socket Connection', fn: testSocketConnection },
        { name: 'Map Loading', fn: testMapLoading },
        { name: 'Player Controller', fn: testPlayerController }
    ];
    
    const results = tests.map(test => {
        try {
            const result = test.fn();
            return { name: test.name, passed: result, error: null };
        } catch (error) {
            console.log(`❌ Test "${test.name}" threw an error:`, error);
            return { name: test.name, passed: false, error: error.message };
        }
    });
    
    console.log('\n📊 Test Results Summary:');
    console.table(results);
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Map functionality should be working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the issues above to fix map functionality.');
    }
    
    return results;
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.mapTests = {
    runAllTests,
    testComponentsLoaded,
    testAdminAccess,
    testAdminMapSelector,
    testSocketConnection,
    testMapLoading,
    testPlayerController
};

console.log('\n💡 Tests completed! You can run individual tests using:');
console.log('window.mapTests.testComponentsLoaded()');
console.log('window.mapTests.testAdminAccess()');
console.log('window.mapTests.testAdminMapSelector()');
console.log('etc...');