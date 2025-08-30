/**
 * Battle Test Module
 * Contains test functions for the battle system
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Battle test module loaded');
    
    // Only initialize if battle module exists
    if (typeof window.BattleModule !== 'undefined') {
        console.log('✅ Battle module detected, initializing test functionality');
        initBattleTest();
    } else {
        console.log('⚠️ Battle module not found, test functionality disabled');
    }
});

/**
 * Initialize battle test functionality
 */
function initBattleTest() {
    // Add global test method
    window.testBattle = function(type = 'wild') {
        console.log(`🎮 Starting test battle: ${type}`);
        
        if (type === 'wild') {
            // Create a random wild Pokemon encounter
            const wildPokemon = {
                id: Math.floor(Math.random() * 150) + 1,
                name: "Wild Pokemon",
                level: Math.floor(Math.random() * 30) + 5,
                moves: [
                    { name: "Tackle", power: 40, type: "normal" },
                    { name: "Growl", power: 0, type: "normal" }
                ]
            };
            
            // Start a battle with the wild Pokemon
            if (window.gameManager && window.gameManager.startWildBattle) {
                window.gameManager.startWildBattle(wildPokemon);
                return true;
            }
        } else if (type === 'trainer') {
            // Create a trainer with random Pokemon
            const trainer = {
                name: "Test Trainer",
                message: "Let's battle!",
                pokemon: [
                    {
                        id: Math.floor(Math.random() * 150) + 1,
                        name: "Trainer's Pokemon",
                        level: Math.floor(Math.random() * 30) + 10,
                        moves: [
                            { name: "Tackle", power: 40, type: "normal" },
                            { name: "Tail Whip", power: 0, type: "normal" },
                            { name: "Quick Attack", power: 40, type: "normal" },
                            { name: "Double Kick", power: 30, type: "fighting" }
                        ]
                    }
                ]
            };
            
            // Start a battle with the trainer
            if (window.gameManager && window.gameManager.startTrainerBattle) {
                window.gameManager.startTrainerBattle(trainer);
                return true;
            }
        }
        
        console.warn('⚠️ Battle could not be started');
        return false;
    };
    
    // Add test battle keyboard shortcuts for admins
    if (window.gameManager && window.gameManager.user && 
        ['admin', 'co-admin'].includes(window.gameManager.user.role)) {
        
        window.addEventListener('keydown', function(e) {
            // Admin battle test keys
            if (e.key === '0') {
                // Press 0 for wild battle
                window.testBattle('wild');
            } else if (e.key === '8') {
                // Press 8 for trainer battle
                window.testBattle('trainer');
            }
        });
        
        console.log('🔑 Admin battle test shortcuts enabled (0: Wild Battle, 8: Trainer Battle)');
    }
}