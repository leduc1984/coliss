<<<<<<< HEAD
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
=======
(function() {
    'use strict';

    /**
     * A simple test suite to verify the integration of the battle system.
     */
    class BattleSystemTester {
        constructor() {
            this.log('Initializing battle system test...');
            this.waitForGameManager().then(() => {
                this.runTests();
            }).catch(error => {
                console.error(error.message);
            });
        }

        /**
         * Waits for the global gameManager to be available before running tests.
         * @returns {Promise} A promise that resolves when gameManager is ready.
         */
        waitForGameManager() {
            return new Promise((resolve, reject) => {
                const maxRetries = 10;
                let attempt = 0;

                const check = () => {
                    if (window.gameManager && window.gameManager.isInitialized) {
                        this.log('GameManager is available.');
                        resolve();
                    } else if (attempt < maxRetries) {
                        attempt++;
                        this.log(`Waiting for GameManager... (Attempt ${attempt})`);
                        setTimeout(check, 1000);
                    } else {
                        reject(new Error('❌ Test failed: GameManager did not initialize in time.'));
                    }
                };
                check();
            });
        }

        /**
         * Runs all defined tests for the battle system.
         */
        runTests() {
            this.log('🧪 Running battle system integration tests...');

            this.testBattleModuleAvailability();
            this.testGameManagerMethods();
            this.testBattleContainer();

            this.log('🏁 Battle system test completed.');
        }

        testBattleModuleAvailability() {
            this.assert(typeof BattleModule !== 'undefined', 'BattleModule is available');
        }

        testGameManagerMethods() {
            this.assert(window.gameManager && typeof window.gameManager.startPokengineBattle === 'function', 'GameManager has startPokengineBattle method');
            this.assert(window.gameManager && typeof window.gameManager.endPokengineBattle === 'function', 'GameManager has endPokengineBattle method');
        }

        testBattleContainer() {
            const battleContainer = document.getElementById('battle-container');
            this.assert(battleContainer, 'Battle container element exists in the DOM');
        }

        /**
         * Custom assertion function for logging test results.
         * @param {boolean} condition - The condition to test.
         * @param {string} message - The message to log.
         */
        assert(condition, message) {
            if (condition) {
                this.log(`✅ PASS: ${message}`);
            } else {
                this.log(`❌ FAIL: ${message}`, 'error');
            }
        }

        /**
         * Helper for logging messages to the console.
         * @param {string} message - The message to log.
         * @param {string} type - The type of log ('log', 'error', 'warn').
         */
        log(message, type = 'log') {
            const prefix = '[Battle Test]';
            console[type](`${prefix} ${message}`);
        }
    }

    // Run the tests when the DOM is fully loaded.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new BattleSystemTester());
    } else {
        new BattleSystemTester();
    }

})();
>>>>>>> fd63a9deaee7b81a36ca4e0b566595344472f5ca
