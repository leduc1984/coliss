(function() {
    'use strict';

    const BATTLE_ASSETS_CONFIG = {
        css: './poke-battle/battle/battle.css',
        imports: './poke-battle/battle/imports.js',
        loadTimeout: 10000, // 10 seconds
    };

    /**
     * BattleModule - Encapsulated pokengine battle system for integration.
     * This module provides a clean interface to the pokengine battle system
     * without taking over the entire page or managing its own networking.
     */
    class BattleModule {
        constructor(containerElement) {
            if (!containerElement) {
                throw new Error("BattleModule requires a container element.");
            }
            this.container = containerElement;
            this.isActive = false;
            this.eventListeners = {};
            this.battleData = null;
            this.battleId = null;
            this.pokeEngineLoaded = false;

            this.setupContainer();
            console.log('⚔️ BattleModule initialized');
        }
        
        setupContainer() {
            this.container.innerHTML = `
                <div id="battle" class="battle-module-hidden"></div>
                <div class="battle-module-overlay" id="battle-loading">
                    <div class="battle-module-loading-spinner"></div>
                    <p>Loading battle system...</p>
                </div>
            `;
            this.dom = {
                battle: this.container.querySelector('#battle'),
                loadingOverlay: this.container.querySelector('#battle-loading'),
            };
        }

        async startBattle(battleData) {
            console.log('⚔️ BattleModule: Starting battle...', battleData);
            this.battleData = battleData;
            this.isActive = true;
            this.showLoading();

            try {
                if (!this.pokeEngineLoaded) {
                    await this.loadPokeEngine();
                }
                await this.initializePokengine(battleData);
                this.emit('battle_started', { battleId: this.battleId });
                console.log('⚔️ BattleModule: Battle started successfully');
            } catch (error) {
                console.error('❌ BattleModule: Failed to start battle:', error);
                this.emit('battle_error', { error: error.message });
                this.endBattle(); // Clean up on failure
            }
        }

        loadPokeEngine() {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('PokeEngine assets timed out.'));
                }, BATTLE_ASSETS_CONFIG.loadTimeout);

                // Load CSS
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = BATTLE_ASSETS_CONFIG.css;
                document.head.appendChild(cssLink);

                // Load JS
                const script = document.createElement('script');
                script.src = BATTLE_ASSETS_CONFIG.imports;
                script.onload = () => {
                    clearTimeout(timeout);
                    this.pokeEngineLoaded = true;
                    console.log('⚔️ PokeEngine loaded successfully');
                    resolve();
                };
                script.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Failed to load PokeEngine script.'));
                };
                document.head.appendChild(script);
            });
        }

        initializePokengine(battleData) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const checkReady = () => {
                    if (typeof loadScript !== 'undefined') {
                        this.setupPokeEngineBattle(battleData);
                        this.battleId = 'battle_' + Date.now();
                        this.hideLoading();
                        resolve();
                    } else if (Date.now() - startTime > BATTLE_ASSETS_CONFIG.loadTimeout) {
                        reject(new Error('PokeEngine did not become ready in time.'));
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            });
        }

        setupPokeEngineBattle(battleData) {
            if (this.dom.battle) {
                this.dom.battle.classList.remove('battle-module-hidden');
            }
            console.log('⚔️ Setting up PokeEngine battle with data:', battleData);
            // This is where the actual integration with `loadScript` and other
            // pokengine functions would happen.
        }

        endBattle() {
            if (!this.isActive) return;
            console.log('⚔️ BattleModule: Ending battle');
            this.isActive = false;
            this.battleData = null;
            this.battleId = null;
            
            if (this.dom.battle) {
                this.dom.battle.classList.add('battle-module-hidden');
            }
            this.hideLoading();
            this.emit('battle_ended');
        }
        
        showLoading() {
            if (this.dom.loadingOverlay) this.dom.loadingOverlay.style.display = 'flex';
        }
        
        hideLoading() {
            if (this.dom.loadingOverlay) this.dom.loadingOverlay.style.display = 'none';
        }

        emit(eventName, data = {}) {
            if (this.eventListeners[eventName]) {
                this.eventListeners[eventName].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`❌ Error in BattleModule event listener for ${eventName}:`, error);
                    }
                });
            }
        }

        on(eventName, callback) {
            if (!this.eventListeners[eventName]) {
                this.eventListeners[eventName] = [];
            }
            this.eventListeners[eventName].push(callback);
        }

        off(eventName, callback) {
            if (this.eventListeners[eventName]) {
                this.eventListeners[eventName] = this.eventListeners[eventName].filter(cb => cb !== callback);
            }
        }
        
        processAction(actionType, actionData) {
            console.log(`⚔️ BattleModule: Processing ${actionType} action`, actionData);
            this.emit('battle_action', { type: actionType, data: actionData, battleId: this.battleId });
        }
        
        updateBattleState(battleState) {
            console.log('⚔️ BattleModule: Updating battle state', battleState);
            // Here you would update the pokengine UI with the new state
            this.emit('battle_state_updated', battleState);
        }
    }

    // Export BattleModule to the global window object
    window.BattleModule = BattleModule;

})();