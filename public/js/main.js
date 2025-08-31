<<<<<<< HEAD
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
=======
// Main application controller, encapsulated to avoid global scope pollution
(function() {
    'use strict';

    // --- Error Handling Module ---
    const ErrorHandler = {
        init() {
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
                        opacity: 0;
                        transform: translateX(100%);
                        transition: opacity 0.3s ease, transform 0.3s ease;
                    }
                    .error-notification.visible {
                        opacity: 1;
                        transform: translateX(0);
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
        },
>>>>>>> fd63a9deaee7b81a36ca4e0b566595344472f5ca

        showError(message) {
            console.error('Application error:', message);
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-notification';
            errorDiv.innerHTML = `
                <div class="error-content">
                    <strong>Error:</strong> ${message}
                    <button onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;

            document.body.appendChild(errorDiv);

            // Animate in
            setTimeout(() => {
                errorDiv.classList.add('visible');
            }, 10);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                errorDiv.classList.remove('visible');
                errorDiv.addEventListener('transitionend', () => {
                    if (errorDiv.parentElement) {
                        errorDiv.remove();
                    }
                });
            }, 5000);
        }
    };

    // --- Main Application Class ---
    class PokemonMMO {
        constructor() {
            this.isInitialized = false;
            this.currentScreen = 'auth';

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }
        }

        init() {
            console.log('🎮 Initializing Pokemon MMO...');
            ErrorHandler.init();
            this.setupErrorHandling();
            this.checkExistingSession();
            this.setupWindowEvents();

            console.log('✅ Pokemon MMO initialized');
            this.isInitialized = true;
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
                    ErrorHandler.showError('Session check failed. Please log in again.');
                    this.showScreen('auth');
                }
            } else {
                this.showScreen('auth');
            }
        }

        setupErrorHandling() {
            window.addEventListener('error', (event) => {
                const message = event.message || 'Unknown error';
                if (message.includes('CANNON.js failed to load') ||
                    message.includes('toLowerCase') ||
                    message.includes('Cannot read properties of undefined')) {
                    console.warn('Expected error (suppressed):', message);
                    return;
                }

                console.error('Global error:', event.error);
                ErrorHandler.showError(event.error?.message || message);
            });

            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                ErrorHandler.showError('An unexpected promise rejection occurred.');
            });
        }

        setupWindowEvents() {
            document.addEventListener('visibilitychange', () => {
                document.hidden ? this.onWindowBlur() : this.onWindowFocus();
            });
            window.addEventListener('beforeunload', (e) => this.onBeforeUnload(e));
            window.addEventListener('resize', () => this.onWindowResize());
        }

        showScreen(screenName) {
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });

            const targetScreen = document.getElementById(`${screenName}-screen`);
            if (targetScreen) {
                targetScreen.classList.add('active');
                this.currentScreen = screenName;
                console.log(`📱 Switched to ${screenName} screen`);
            } else {
                console.error(`Screen not found: ${screenName}`);
                ErrorHandler.showError(`UI screen "${screenName}" not found.`);
            }
        }

        onWindowFocus() {
            if (this.currentScreen === 'game' && window.gameManager) {
                console.log('🎯 Window focused, resuming game...');
                // Game resume logic can be added here
            }
        }

        onWindowBlur() {
            if (this.currentScreen === 'game' && window.gameManager) {
                console.log('😴 Window blurred, pausing game...');
                // Game pause logic can be added here
            }
        }

        onBeforeUnload(event) {
            if (window.socket && window.socket.connected && window.gameManager?.playerController) {
                console.log('🧹 Cleaning up before unload...');
                const playerState = window.gameManager.playerController.getPlayerState();
                window.socket.emit('player_move', { ...playerState, isMoving: false, isRunning: false });
                window.socket.disconnect();
            }
        }

        onWindowResize() {
            if (this.currentScreen === 'game' && window.gameManager?.engine) {
                window.gameManager.engine.resize();
            }
        }
    }

    // --- Enhanced GameManager Integration ---
    function enhanceGameManager() {
        if (!window.gameManager) return;

        const originalInitialize = window.gameManager.initialize;
        window.gameManager.initialize = function(user, token) {
            return originalInitialize.call(this, user, token).then(() => {
                if (window.chatManager && this.socket) {
                    window.chatManager.initialize(this.socket);
                }
                if (this.socket) {
                    this.socket.on('online_count', (count) => {
                        if (window.chatManager) {
                            window.chatManager.updateOnlineCount(count);
                        }
                    });
                    this.socket.emit('get_online_count');
                }
            });
        };
    }

    // --- Development Helpers ---
    function setupDebugTools() {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return;
        }

        window.DEBUG = {
            auth: () => window.authManager,
            game: () => window.gameManager,
            chat: () => window.chatManager,
            socket: () => window.socket,
            battle: () => window.gameManager?.battleModule,
            
            quickLogin: async (username = 'testuser', password = 'Test123!') => {
                try {
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
                } catch (error) {
                    ErrorHandler.showError('Quick login failed.');
                    console.error('Quick login error:', error);
                }
            },

            players: () => window.gameManager?.otherPlayers,
            teleport: (x, y, z) => window.gameManager?.playerController?.teleportTo({x, y, z}),
            randomBattle: () => window.gameManager?.playerController?.startRandomBattle(),
            aiBattle: () => window.gameManager?.playerController?.startAITrainerBattle(),
            grassEncounter: () => window.gameManager?.playerController?.simulateGrassEncounter(),
            endBattle: () => window.gameManager?.endPokengineBattle(),
        };

        console.log('🛠️ Development mode enabled. Use window.DEBUG for testing helpers.');
    }

    // --- Initialization ---
    // The instance is not stored on window anymore, just created.
    new PokemonMMO();
    enhanceGameManager();
    setupDebugTools();

})();