// Enhanced player-controller-test.js
console.log('Testing PlayerController accessibility...');

// Check if window object exists
if (typeof window === 'undefined') {
    console.error('❌ Window object not available');
} else {
    console.log('✅ Window object available');
    
    // Check if PlayerController is defined in global scope
    if (typeof window.PlayerController !== 'undefined') {
        console.log('✅ PlayerController is accessible globally');
    } else {
        console.error('❌ PlayerController is NOT accessible globally');
        console.log('Current window properties:', Object.keys(window).filter(key => key.includes('Player')));
    }

    // Check if PlayerController is defined as a class/function
    if (typeof window.PlayerController === 'function') {
        console.log('✅ PlayerController is defined as a function/class');
        try {
            // Try to instantiate
            const testInstance = new window.PlayerController();
            console.log('✅ PlayerController can be instantiated');
        } catch (e) {
            console.error('❌ PlayerController instantiation failed:', e.message);
        }
    } else {
        console.error('❌ PlayerController is NOT defined as a function/class');
        console.log('PlayerController type:', typeof window.PlayerController);
        console.log('PlayerController value:', window.PlayerController);
    }
}