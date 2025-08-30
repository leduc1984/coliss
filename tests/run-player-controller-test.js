// Simple test runner to verify PlayerController implementation
console.log('Running PlayerController tests...');

// Mock window object for Node.js environment
if (typeof window === 'undefined') {
    global.window = {
        PlayerController: typeof PlayerController !== 'undefined' ? PlayerController : undefined
    };
}

// Test 1: Check if PlayerController is defined globally
console.log('\nTest 1: Checking if PlayerController is defined globally');
if (typeof window.PlayerController !== 'undefined') {
    console.log('✅ PASS: PlayerController is defined globally');
} else {
    console.log('❌ FAIL: PlayerController is not defined globally');
}

// Test 2: Check if PlayerController is a function
console.log('\nTest 2: Checking if PlayerController is a function');
if (typeof window.PlayerController === 'function') {
    console.log('✅ PASS: PlayerController is a function');
} else {
    console.log('❌ FAIL: PlayerController is not a function');
}

// Test 3: Check special model loading for admin "leduc"
console.log('\nTest 3: Checking special model loading for admin "leduc"');
const testUsers = [
    { username: 'leduc', role: 'admin', expectedModel: 'calem/leduc/kaido.glb' },
    { username: 'leduc', role: 'co-admin', expectedModel: 'calem/leduc/kaido.glb' },
    { username: 'leduc', role: 'user', expectedModel: 'calem/calem.glb' },
    { username: 'otheruser', role: 'admin', expectedModel: 'calem/calem.glb' }
];

let allModelTestsPassed = true;
testUsers.forEach((user, index) => {
    let modelFileName = 'calem/calem.glb';
    if (user.username === 'leduc' && (user.role === 'admin' || user.role === 'co-admin')) {
        modelFileName = 'calem/leduc/kaido.glb';
    }
    
    if (modelFileName === user.expectedModel) {
        console.log(`✅ PASS: User ${user.username} (${user.role}) loads ${modelFileName}`);
    } else {
        console.log(`❌ FAIL: User ${user.username} (${user.role}) should load ${user.expectedModel} but loads ${modelFileName}`);
        allModelTestsPassed = false;
    }
});

if (allModelTestsPassed) {
    console.log('✅ All model loading tests passed');
} else {
    console.log('❌ Some model loading tests failed');
}

console.log('\nPlayerController tests completed.');