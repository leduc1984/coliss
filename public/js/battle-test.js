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