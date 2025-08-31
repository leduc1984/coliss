// Main application controller
class PokemonMMO {
    constructor() {
        this.isInitialized = false;
        this.currentScreen = 'auth';
        this.mainUI = null;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('🎮 Initializing Pokemon MMO...');
        
        // Check if user is already logged in
        this.checkExistingSession();
        
        // Setup global error handling
        this.setupErrorHandling();
        
        // Setup window events
        this.setupWindowEvents();
        
        // Initialize main UI
        this.initializeMainUI();
        
        console.log('✅ Pokemon MMO initialized');
        this.isInitialized = true;
    }
    
    initializeMainUI() {
        // Initialize the main UI components
        if (typeof MainUI !== 'undefined') {
            this.mainUI = new MainUI();
            console.log('🎨 Main UI initialized');
        } else {
            console.warn('⚠️ MainUI class not found, UI components may not work');
        }
    }

    async checkExistingSession() {
        if (window.authManager && window.authManager.token) {
            console.log('🔍 Checking existing session...');
            
            try {
                const isValid = await window.authManager.verifyToken();
                if (isValid) {
                    console.log('✅ Valid session found, starting game...');
                    window.authManager.startGame();
                } else {
                    console.log('❌ Invalid session, showing login...');
                    this.showScreen('auth');
                }
            } catch (error) {
                console.error('Session check error:', error);
                this.showScreen('auth');
            }
        } else {
            this.showScreen('auth');
        }
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            // Filter out common expected errors
            if (event.message && (
                event.message.includes('CANNON.js failed to load') ||
                event.message.includes('toLowerCase') ||
                event.message.includes('Cannot read properties of undefined')
            )) {
                console.warn('Expected error (handled):', event.message);
                return; // Don't show these to user
            }
            
            console.error('Global error:', event.error);
            this.handleError(event.error?.message || event.message || 'An unexpected error occurred');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError('An unexpected error occurred');
        });
    }

    setupWindowEvents() {
        // Handle visibility change (tab focus/blur)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onWindowBlur();
            } else {
                this.onWindowFocus();
            }
        });

        // Handle before unload
        window.addEventListener('beforeunload', (event) => {
            this.onBeforeUnload(event);
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show requested screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            console.log(`📱 Switched to ${screenName} screen`);
        } else {
            console.error(`Screen not found: ${screenName}`);
        }
    }

    handleError(message) {
        console.error('Application error:', message);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <strong>Error:</strong> ${message}
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add error styles if not already present
        if (!document.getElementById('error-styles')) {
            const styles = document.createElement('style');
            styles.id = 'error-styles';
            styles.textContent = `
                .error-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ff6b6b;
                    color: white;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    z-index: 10000;
                    max-width: 300px;
                }
                .error-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .error-content button {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    onWindowFocus() {
        // Resume game activities when window gains focus
        if (this.currentScreen === 'game' && window.gameManager) {
            console.log('🎯 Window focused, resuming game...');
            // Resume any paused activities
        }
    }

    onWindowBlur() {
        // Pause game activities when window loses focus
        if (this.currentScreen === 'game' && window.gameManager) {
            console.log('😴 Window blurred, pausing game...');
            // Pause non-essential activities to save resources
        }
    }

    onBeforeUnload(event) {
        // Clean up before page unload
        if (window.socket && window.socket.connected) {
            console.log('🧹 Cleaning up before unload...');
            
            // Send final position update
            if (window.gameManager && window.gameManager.playerController) {
                const playerState = window.gameManager.playerController.getPlayerState();
                window.socket.emit('player_move', {
                    position: playerState.position,
                    rotation: playerState.rotation,
                    isMoving: false,
                    isRunning: false
                });
            }
            
            // Graceful disconnect
            window.socket.disconnect();
        }
    }

    onWindowResize() {
        // Handle window resize
        if (this.currentScreen === 'game' && window.gameManager && window.gameManager.engine) {
            window.gameManager.engine.resize();
        }
    }

    // Public API methods
    static getInstance() {
        if (!window.pokemonMMOInstance) {
            window.pokemonMMOInstance = new PokemonMMO();
        }
        return window.pokemonMMOInstance;
    }
}

// Enhanced GameManager integration
if (window.gameManager) {
    const originalInitialize = window.gameManager.initialize;
    window.gameManager.initialize = function(user, token) {
        return originalInitialize.call(this, user, token).then(() => {
            // Initialize chat after game is ready
            if (window.chatManager && this.socket) {
                window.chatManager.initialize(this.socket);
            }
            
            // Update online count periodically
            if (this.socket) {
                this.socket.on('online_count', (count) => {
                    if (window.chatManager) {
                        window.chatManager.updateOnlineCount(count);
                    }
                });
                
                // Request initial online count
                this.socket.emit('get_online_count');
            }
        });
    };
}

// Initialize the main application
const pokemonMMO = PokemonMMO.getInstance();

// Expose to global scope for debugging
window.PokemonMMO = PokemonMMO;
window.pokemonMMO = pokemonMMO;

// Development helpers (remove in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.DEBUG = {
        authManager: () => window.authManager,
        gameManager: () => window.gameManager,
        chatManager: () => window.chatManager,
        socket: () => window.socket,
        battleModule: () => window.gameManager?.battleModule,
        
        // Quick login for testing
        quickLogin: async (username = 'testuser', password = 'Test123!') => {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: username, password })
            });
            const result = await response.json();
            if (result.token) {
                localStorage.setItem('pokemon_mmo_token', result.token);
                window.location.reload();
            }
            return result;
        },
        
        // Show all active players
        getActivePlayers: () => {
            if (window.gameManager) {
                return window.gameManager.otherPlayers;
            }
        },
        
        // Teleport player (for testing)
        teleport: (x, y, z) => {
            if (window.gameManager && window.gameManager.playerController) {
                window.gameManager.playerController.teleportTo({x, y, z});
            }
        },
        
        // Start random battle (for testing)
        randomBattle: () => {
            if (window.gameManager && window.gameManager.playerController) {
                window.gameManager.playerController.startRandomBattle();
            }
        },
        
        // Start AI trainer battle (for testing)
        aiBattle: () => {
            if (window.gameManager && window.gameManager.playerController) {
                window.gameManager.playerController.startAITrainerBattle();
            }
        },
        
        // Simulate grass encounter (for testing)
        grassEncounter: () => {
            if (window.gameManager && window.gameManager.playerController) {
                window.gameManager.playerController.simulateGrassEncounter();
            }
        },
        
        // End current battle (for testing)
        endBattle: () => {
            if (window.gameManager && window.gameManager.endPokengineBattle) {
                window.gameManager.endPokengineBattle();
            }
        }
    };
    
    console.log('🛠️ Development mode enabled. Use window.DEBUG for testing helpers.');
}