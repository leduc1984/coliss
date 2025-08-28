/**
 * BattleModule - Encapsulated pokengine battle system for integration
 * This module provides a clean interface to the pokengine battle system
 * without taking over the entire page or managing its own networking.
 */
class BattleModule {
    constructor(containerElement) {
        this.container = containerElement;
        this.isActive = false;
        this.eventListeners = {};
        this.battleData = null;
        this.battleId = null;
        this.pokeEngineLoaded = false;
        this.pokeEngineInitialized = false;
        
        // Create the battle container structure
        this.setupContainer();
        
        console.log('⚔️ BattleModule initialized');
    }
    
    /**
     * Set up the battle container structure
     */
    setupContainer() {
        // Clear container
        this.container.innerHTML = '';
        this.container.className = 'battle-module-container';
        
        // Add battle module styles
        this.addStyles();
        
        // Create battle interface elements
        this.createBattleInterface();
        
        console.log('⚔️ BattleModule container set up');
    }
    
    /**
     * Add required CSS styles for the battle module
     */
    addStyles() {
        // Styles are now in the separate CSS file
    }
    
    /**
     * Create the basic battle interface structure
     */
    createBattleInterface() {
        // Create the battle element for pokengine
        this.container.innerHTML = `
            <div id="battle" class="battle-module-hidden"></div>
            <div class="battle-module-overlay" id="battle-loading">
                <div class="battle-module-loading">
                    <div class="battle-module-loading-spinner"></div>
                    <p>Loading battle system...</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Start a battle with the provided data
     * @param {Object} battleData - Battle configuration data
     */
    async startBattle(battleData) {
        try {
            console.log('⚔️ BattleModule: Starting battle...', battleData);
            
            this.battleData = battleData;
            this.isActive = true;
            
            // Show loading state
            this.showLoading();
            
            // Load pokengine if not already loaded
            if (!this.pokeEngineLoaded) {
                await this.loadPokeEngine();
            }
            
            // Initialize pokengine battle system
            await this.initializePokengine(battleData);
            
            // Emit battle start event
            this.emit('battle_started', { battleId: this.battleId });
            
            console.log('⚔️ BattleModule: Battle started successfully');
            
        } catch (error) {
            console.error('❌ BattleModule: Failed to start battle:', error);
            this.emit('battle_error', { error: error.message });
        }
    }
    
    /**
     * Load the pokengine battle system
     */
    async loadPokeEngine() {
        return new Promise((resolve, reject) => {
            try {
                // Check if already loaded
                if (this.pokeEngineLoaded) {
                    resolve();
                    return;
                }
                
                // Create link element for pokengine CSS
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = './poke-battle/battle/battle.css';
                cssLink.onload = () => {
                    console.log('⚔️ PokeEngine CSS loaded successfully');
                };
                cssLink.onerror = (error) => {
                    console.warn('⚠️ Failed to load PokeEngine CSS:', error);
                };
                
                // Add CSS to document
                document.head.appendChild(cssLink);
                
                // Create script element for pokengine imports
                const script = document.createElement('script');
                script.src = './poke-battle/battle/imports.js';
                script.onload = () => {
                    console.log('⚔️ PokeEngine loaded successfully');
                    this.pokeEngineLoaded = true;
                    resolve();
                };
                script.onerror = (error) => {
                    console.error('❌ Failed to load PokeEngine:', error);
                    reject(new Error('Failed to load PokeEngine'));
                };
                
                // Add to document
                document.head.appendChild(script);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Initialize the pokengine battle system
     * @param {Object} battleData - Battle configuration data
     */
    async initializePokengine(battleData) {
        return new Promise((resolve, reject) => {
            // Wait for pokengine to be ready
            const checkReady = () => {
                // Check if required pokengine objects are available
                if (typeof loadScript !== 'undefined') {
                    // Initialize the battle
                    this.setupPokeEngineBattle(battleData);
                    this.battleId = 'battle_' + Date.now();
                    this.hideLoading();
                    this.pokeEngineInitialized = true;
                    resolve();
                } else {
                    // Check again in 100ms
                    setTimeout(checkReady, 100);
                    
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        reject(new Error('PokeEngine failed to initialize within 10 seconds'));
                    }, 10000);
                }
            };
            
            // Start checking for readiness
            checkReady();
        });
    }
    
    /**
     * Set up the pokengine battle with provided data
     * @param {Object} battleData - Battle configuration data
     */
    setupPokeEngineBattle(battleData) {
        try {
            // Show the battle container
            const battleElement = document.getElementById('battle');
            if (battleElement) {
                battleElement.classList.remove('battle-module-hidden');
            }
            
            // Set up battle configuration based on battleData
            // This would involve setting up the player's team, opponent data, etc.
            // For now, we'll just log the data
            console.log('⚔️ Setting up PokeEngine battle with data:', battleData);
            
            // Initialize the battle interface
            if (typeof loadScript !== 'undefined') {
                // This is where we would initialize the actual battle
                // For now, we'll just simulate it
                console.log('⚔️ PokeEngine interface initialized');
            }
            
        } catch (error) {
            console.error('❌ Error setting up PokeEngine battle:', error);
            throw error;
        }
    }
    
    /**
     * End the current battle
     */
    endBattle() {
        console.log('⚔️ BattleModule: Ending battle');
        
        this.isActive = false;
        this.battleData = null;
        this.battleId = null;
        this.pokeEngineInitialized = false;
        
        // Hide the battle element
        const battleElement = document.getElementById('battle');
        if (battleElement) {
            battleElement.classList.add('battle-module-hidden');
        }
        
        // Clean up the container
        this.setupContainer();
        
        // Emit battle end event
        this.emit('battle_ended');
        
        console.log('⚔️ BattleModule: Battle ended');
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        const loadingOverlay = document.getElementById('battle-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('battle-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    /**
     * Emit an event to listeners
     * @param {string} eventName - Name of the event
     * @param {Object} data - Event data
     */
    emit(eventName, data = {}) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ BattleModule: Error in ${eventName} listener:`, error);
                }
            });
        }
    }
    
    /**
     * Add an event listener
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function
     */
    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }
    
    /**
     * Remove an event listener
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to remove
     */
    off(eventName, callback) {
        if (this.eventListeners[eventName]) {
            const index = this.eventListeners[eventName].indexOf(callback);
            if (index > -1) {
                this.eventListeners[eventName].splice(index, 1);
            }
        }
    }
    
    /**
     * Process a battle action (move, switch, item, run)
     * @param {string} actionType - Type of action
     * @param {Object} actionData - Action data
     */
    processAction(actionType, actionData) {
        console.log(`⚔️ BattleModule: Processing ${actionType} action`, actionData);
        
        // Emit action event for the main game to handle
        this.emit('battle_action', {
            type: actionType,
            data: actionData,
            battleId: this.battleId
        });
    }
    
    /**
     * Update battle state with server data
     * @param {Object} battleState - Current battle state from server
     */
    updateBattleState(battleState) {
        console.log('⚔️ BattleModule: Updating battle state', battleState);
        
        // Update the battle display with new state
        // This would involve updating the pokengine UI
        this.emit('battle_state_updated', battleState);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattleModule;
} else {
    window.BattleModule = BattleModule;
}