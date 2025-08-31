/**
 * Main UI Module
 * Handles the main UI components like action bar, pokedex, etc.
 */

class MainUI {
    constructor() {
        this.isChatOpen = true;
        this.isPokedexOpen = false;
        this.isPlayerMenuOpen = false;
        this.isMapEditorOpen = false;
        this.chatManager = null;
        this.pokedexElement = null;
        this.playerMenuElement = null;
        this.mapEditorElement = null;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        console.log('🔧 Initializing Main UI...');
        this.createActionBar();
        this.setupEventListeners();
        console.log('✅ Main UI initialized');
    }
    
    createActionBar() {
        // Create action bar container
        const actionBar = document.createElement('div');
        actionBar.id = 'action-bar';
        actionBar.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-black/30 backdrop-blur-md rounded-full shadow-2xl z-20';
        actionBar.innerHTML = `
            <div class="group relative">
                <button id="pokedex-button" class="w-12 h-12 bg-gray-800/60 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white/80 hover:bg-cyan-500/50 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-cyan-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </button>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-gray-900/80 rounded-md text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    Pokédex
                </div>
            </div>
            <div class="group relative">
                <button id="bag-button" class="w-12 h-12 bg-gray-800/60 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white/80 hover:bg-cyan-500/50 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-cyan-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </button>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-gray-900/80 rounded-md text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    Bag
                </div>
            </div>
            <div class="group relative">
                <button id="chat-button" class="w-12 h-12 bg-gray-800/60 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white/80 hover:bg-cyan-500/50 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-cyan-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-gray-900/80 rounded-md text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    Chat
                </div>
            </div>
            <div class="group relative">
                <button id="player-button" class="w-12 h-12 bg-gray-800/60 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white/80 hover:bg-cyan-500/50 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-cyan-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </button>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-gray-900/80 rounded-md text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    Player
                </div>
            </div>
            <div class="group relative">
                <button id="settings-button" class="w-12 h-12 bg-gray-800/60 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white/80 hover:bg-cyan-500/50 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-cyan-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-gray-900/80 rounded-md text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    Settings
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(actionBar);
    }
    
    setupEventListeners() {
        // Pokedex button
        const pokedexButton = document.getElementById('pokedex-button');
        if (pokedexButton) {
            pokedexButton.addEventListener('click', () => {
                this.togglePokedex();
            });
        }
        
        // Bag button
        const bagButton = document.getElementById('bag-button');
        if (bagButton) {
            bagButton.addEventListener('click', () => {
                console.log('Bag button clicked');
                // TODO: Implement bag functionality
            });
        }
        
        // Chat button
        const chatButton = document.getElementById('chat-button');
        if (chatButton) {
            chatButton.addEventListener('click', () => {
                this.toggleChat();
            });
        }
        
        // Player button
        const playerButton = document.getElementById('player-button');
        if (playerButton) {
            playerButton.addEventListener('click', () => {
                this.togglePlayerMenu();
            });
        }
        
        // Settings button
        const settingsButton = document.getElementById('settings-button');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                console.log('Settings button clicked');
                // TODO: Implement settings functionality
            });
        }
    }
    
    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        
        const chatContainer = document.getElementById('new-chat-container');
        if (chatContainer) {
            chatContainer.style.display = this.isChatOpen ? 'block' : 'none';
        }
        
        console.log('Chat toggled:', this.isChatOpen);
    }
    
    togglePokedex() {
        this.isPokedexOpen = !this.isPokedexOpen;
        
        if (this.isPokedexOpen) {
            this.createPokedex();
        } else {
            this.destroyPokedex();
        }
        
        console.log('Pokedex toggled:', this.isPokedexOpen);
    }
    
    createPokedex() {
        // If already exists, just show it
        if (this.pokedexElement) {
            this.pokedexElement.style.display = 'block';
            return;
        }
        
        // Create pokedex container
        this.pokedexElement = document.createElement('div');
        this.pokedexElement.id = 'pokedex-window';
        this.pokedexElement.className = 'w-[800px] max-h-[70vh] flex flex-col bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl text-white';
        this.pokedexElement.style.cssText = 'position: absolute; top: 100px; left: calc(50% - 400px); z-index: 1000;';
        
        // Create pokedex content
        this.pokedexElement.innerHTML = `
            <header data-drag-handle="true" class="flex items-center justify-between p-4 border-b border-white/10 cursor-grab active:cursor-grabbing flex-shrink-0">
                <h2 class="text-lg font-bold">Pokédex</h2>
                <button id="pokedex-close-button" class="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>
            
            <div class="p-4 overflow-y-auto">
                <div class="grid grid-cols-6 gap-4" id="pokedex-entries">
                    <!-- Pokédex entries will be added here -->
                </div>
            </div>
        `;
        
        // Make draggable
        makeDraggable(this.pokedexElement, {
            initialPosition: { x: window.innerWidth / 2 - 400, y: 100 }
        });
        
        // Add to document
        document.body.appendChild(this.pokedexElement);
        
        // Add close button event
        const closeButton = document.getElementById('pokedex-close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.togglePokedex();
            });
        }
        
        // Load pokedex data
        this.loadPokedexData();
    }
    
    destroyPokedex() {
        if (this.pokedexElement) {
            this.pokedexElement.remove();
            this.pokedexElement = null;
        }
    }
    
    loadPokedexData() {
        // Sample pokédex data (first 36 Pokémon)
        const pokedexData = [
            { id: 1, name: 'Bulbasaur' }, { id: 2, name: 'Ivysaur' }, { id: 3, name: 'Venusaur' },
            { id: 4, name: 'Charmander' }, { id: 5, name: 'Charmeleon' }, { id: 6, name: 'Charizard' },
            { id: 7, name: 'Squirtle' }, { id: 8, name: 'Wartortle' }, { id: 9, name: 'Blastoise' },
            { id: 10, name: 'Caterpie' }, { id: 11, name: 'Metapod' }, { id: 12, name: 'Butterfree' },
            { id: 13, name: 'Weedle' }, { id: 14, name: 'Kakuna' }, { id: 15, name: 'Beedrill' },
            { id: 16, name: 'Pidgey' }, { id: 17, name: 'Pidgeotto' }, { id: 18, name: 'Pidgeot' },
            { id: 19, name: 'Rattata' }, { id: 20, name: 'Raticate' }, { id: 21, name: 'Spearow' },
            { id: 22, name: 'Fearow' }, { id: 23, name: 'Ekans' }, { id: 24, name: 'Arbok' },
            { id: 25, name: 'Pikachu' }, { id: 26, name: 'Raichu' }, { id: 27, name: 'Sandshrew' },
            { id: 28, name: 'Sandslash' }, { id: 29, name: 'Nidoran♀' }, { id: 30, name: 'Nidorina' },
            { id: 31, name: 'Nidoqueen' }, { id: 32, name: 'Nidoran♂' }, { id: 33, name: 'Nidorino' },
            { id: 34, name: 'Nidoking' }, { id: 35, name: 'Clefairy' }, { id: 36, name: 'Clefable' }
        ];
        
        const entriesContainer = document.getElementById('pokedex-entries');
        if (!entriesContainer) return;
        
        // Clear existing entries
        entriesContainer.innerHTML = '';
        
        // Add entries
        pokedexData.forEach(pokemon => {
            const entry = document.createElement('div');
            entry.className = 'bg-black/30 rounded-lg p-2 flex flex-col items-center justify-end aspect-square hover:bg-cyan-500/20 cursor-pointer transition-colors group relative overflow-hidden';
            entry.innerHTML = `
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png" 
                     alt="${pokemon.name}" 
                     class="absolute inset-2 h-auto w-auto object-contain transition-transform duration-300 group-hover:scale-110" 
                     onerror="this.onerror=null; this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png';" />
                <div class="relative w-full text-center p-1 bg-black/40 backdrop-blur-sm rounded-b-md">
                    <p class="text-xs text-white/70 group-hover:text-white">#${String(pokemon.id).padStart(3, '0')}</p>
                    <p class="text-sm font-semibold truncate">${pokemon.name}</p>
                </div>
            `;
            entriesContainer.appendChild(entry);
        });
    }
    
    togglePlayerMenu() {
        this.isPlayerMenuOpen = !this.isPlayerMenuOpen;
        
        if (this.isPlayerMenuOpen) {
            this.createPlayerMenu();
        } else {
            this.destroyPlayerMenu();
        }
        
        console.log('Player menu toggled:', this.isPlayerMenuOpen);
    }
    
    createPlayerMenu() {
        // If already exists, just show it
        if (this.playerMenuElement) {
            this.playerMenuElement.style.display = 'block';
            return;
        }
        
        // Create player menu container
        this.playerMenuElement = document.createElement('div');
        this.playerMenuElement.id = 'player-menu';
        this.playerMenuElement.className = 'w-[400px] max-h-[70vh] flex flex-col bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl text-white';
        this.playerMenuElement.style.cssText = 'position: absolute; top: 100px; left: calc(50% - 200px); z-index: 1000;';
        
        // Create player menu content
        this.playerMenuElement.innerHTML = `
            <header data-drag-handle="true" class="flex items-center justify-between p-4 border-b border-white/10 cursor-grab active:cursor-grabbing flex-shrink-0">
                <h2 class="text-lg font-bold">Player Menu</h2>
                <button id="player-menu-close-button" class="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>
            
            <div class="p-4 overflow-y-auto">
                <div class="space-y-4">
                    <div class="bg-black/30 rounded-lg p-4">
                        <h3 class="text-md font-semibold mb-2">Player Info</h3>
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                                <span class="text-xl">T</span>
                            </div>
                            <div>
                                <p class="font-semibold" id="player-name">Trainer Name</p>
                                <p class="text-sm text-gray-400" id="player-role">User</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-black/30 rounded-lg p-4">
                        <h3 class="text-md font-semibold mb-2">Options</h3>
                        <div class="space-y-2">
                            <button class="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors">Profile</button>
                            <button class="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors">Inventory</button>
                            <button class="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors">Settings</button>
                            <button class="w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors">Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Make draggable
        makeDraggable(this.playerMenuElement, {
            initialPosition: { x: window.innerWidth / 2 - 200, y: 100 }
        });
        
        // Add to document
        document.body.appendChild(this.playerMenuElement);
        
        // Add close button event
        const closeButton = document.getElementById('player-menu-close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.togglePlayerMenu();
            });
        }
        
        // Update player info
        this.updatePlayerInfo();
    }
    
    destroyPlayerMenu() {
        if (this.playerMenuElement) {
            this.playerMenuElement.remove();
            this.playerMenuElement = null;
        }
    }
    
    updatePlayerInfo() {
        // Update player name and role from existing elements
        const playerNameElement = document.getElementById('playerName');
        const playerRoleElement = document.getElementById('playerRole');
        
        if (playerNameElement && playerRoleElement) {
            const playerNameDisplay = document.getElementById('player-name');
            const playerRoleDisplay = document.getElementById('player-role');
            
            if (playerNameDisplay) {
                playerNameDisplay.textContent = playerNameElement.textContent;
            }
            
            if (playerRoleDisplay) {
                playerRoleDisplay.textContent = playerRoleElement.textContent;
            }
        }
    }
}

// Initialize main UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.mainUI) {
        window.mainUI = new MainUI();
    }
});