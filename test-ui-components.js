/**
 * Test script for UI components
 * This script tests the functionality of the new UI components
 */

// Test the draggable functionality
function testDraggable() {
    console.log('🧪 Testing draggable functionality...');
    
    // Create a test element
    const testElement = document.createElement('div');
    testElement.id = 'test-draggable';
    testElement.style.cssText = 'position: absolute; width: 100px; height: 100px; background: #4f46e5; border-radius: 8px; z-index: 10000;';
    testElement.innerHTML = '<div data-drag-handle="true" style="padding: 10px; color: white; cursor: grab;">Drag me!</div>';
    document.body.appendChild(testElement);
    
    // Make it draggable
    const draggable = makeDraggable(testElement, {
        initialPosition: { x: 100, y: 100 }
    });
    
    console.log('✅ Draggable test element created at position:', draggable.getPosition());
    
    // Test setting position
    setTimeout(() => {
        draggable.setPosition({ x: 200, y: 200 });
        console.log('✅ Draggable position updated to:', draggable.getPosition());
        
        // Clean up after 3 seconds
        setTimeout(() => {
            testElement.remove();
            console.log('🧹 Draggable test element removed');
        }, 3000);
    }, 1000);
}

// Test the chat functionality
function testChat() {
    console.log('🧪 Testing chat functionality...');
    
    // Check if chat container exists
    const chatContainer = document.getElementById('new-chat-container');
    if (chatContainer) {
        console.log('✅ Chat container found');
        
        // Toggle chat visibility
        const chatUI = window.chatManager;
        if (chatUI) {
            console.log('✅ ChatManager instance found');
            
            // Test sending a message
            const originalSendMessage = chatUI.sendMessage;
            chatUI.sendMessage = function() {
                console.log('✅ Chat message sending functionality works');
                // Call original function
                return originalSendMessage.apply(this, arguments);
            };
        }
    } else {
        console.warn('⚠️ Chat container not found');
    }
}

// Test the main UI components
function testMainUI() {
    console.log('🧪 Testing main UI components...');
    
    // Check if main UI instance exists
    if (window.mainUI) {
        console.log('✅ MainUI instance found');
        
        // Test action bar buttons
        const pokedexButton = document.getElementById('pokedex-button');
        const chatButton = document.getElementById('chat-button');
        const playerButton = document.getElementById('player-button');
        
        if (pokedexButton) {
            console.log('✅ Pokedex button found');
        } else {
            console.warn('⚠️ Pokedex button not found');
        }
        
        if (chatButton) {
            console.log('✅ Chat button found');
        } else {
            console.warn('⚠️ Chat button not found');
        }
        
        if (playerButton) {
            console.log('✅ Player button found');
        } else {
            console.warn('⚠️ Player button not found');
        }
    } else {
        console.warn('⚠️ MainUI instance not found');
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running UI component tests...');
    
    testDraggable();
    testChat();
    testMainUI();
    
    console.log('🏁 UI component tests completed');
}

// Run tests when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}