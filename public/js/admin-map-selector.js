/**
 * Admin Map Selector Component
 * Manages the map selection interface for administrators
 */
class AdminMapSelector {
    constructor(gameManager, socket) {
        this.gameManager = gameManager;
        this.socket = socket;
        this.isVisible = false;
        this.availableMaps = [];
        this.selectedMapIndex = -1;
        this.currentMap = null;
        
        this.createUI();
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    
    createUI() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'admin-map-selector-overlay';
        this.overlay.innerHTML = `
            <div class=\"admin-map-selector-panel\">
                <button class=\"admin-map-selector-close\" title=\"Fermer (Échap)\">&times;</button>
                
                <div class=\"admin-map-selector-header\">
                    <h2 class=\"admin-map-selector-title\">🗺️ Sélecteur de Cartes Admin</h2>
                    <p class=\"admin-map-selector-subtitle\">Choisissez une carte pour téléportation instantanée</p>
                </div>
                
                <div class=\"admin-map-loading\">Chargement des cartes disponibles...</div>
                
                <ul class=\"admin-map-list\" style=\"display: none;\"></ul>
                
                <div class=\"admin-map-controls\">
                    <div class=\"admin-map-controls-text\">Navigation:</div>
                    <span class=\"admin-map-keyboard-hint\">1-9</span> Sélection rapide
                    <span class=\"admin-map-keyboard-hint\">↑↓</span> Navigation
                    <span class=\"admin-map-keyboard-hint\">Entrée</span> Confirmer
                    <span class=\"admin-map-keyboard-hint\">Échap</span> Fermer
                    
                    <button class=\"admin-map-teleport-button\">🚀 Téléporter</button>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(this.overlay);
        
        // Get references to UI elements
        this.panel = this.overlay.querySelector('.admin-map-selector-panel');
        this.closeButton = this.overlay.querySelector('.admin-map-selector-close');
        this.loadingElement = this.overlay.querySelector('.admin-map-loading');
        this.mapList = this.overlay.querySelector('.admin-map-list');
        this.teleportButton = this.overlay.querySelector('.admin-map-teleport-button');
    }
    
    setupEventListeners() {
        // Close button
        this.closeButton.addEventListener('click', () => this.hide());
        
        // Overlay click to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
        
        // Teleport button
        this.teleportButton.addEventListener('click', () => this.confirmTeleport());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
    
    setupSocketListeners() {
        // Listen for map data
        this.socket.on('admin_maps_available', (data) => {
            console.log('📩 Received admin_maps_available:', data);
            this.handleMapsReceived(data);
        });
        
        // Listen for teleportation completion
        this.socket.on('admin_teleport_complete', (data) => {
            this.handleTeleportComplete(data);
        });
        
        // Listen for errors
        this.socket.on('admin_map_request_denied', (data) => {
            console.log('❌ Admin map request denied:', data);
            this.showError('Accès refusé: ' + data.message);
        });
        
        this.socket.on('admin_map_request_error', (data) => {
            console.log('❌ Admin map request error:', data);
            this.showError('Erreur du serveur: ' + data.message);
        });
        
        this.socket.on('admin_teleport_error', (data) => {
            this.showError('Erreur de téléportation: ' + data.message);
        });
    }
    
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.selectedMapIndex = -1;
        
        // Debug: Check socket connection
        console.log('🔍 Debug: Socket connected?', this.socket.connected);
        console.log('🔍 Debug: Socket authenticated?', this.socket.authenticated);
        
        // Request available maps from server
        this.showLoading();
        
        console.log('📡 Emitting admin_map_request...');
        this.socket.emit('admin_map_request');
        
        // Set a timeout to detect if server doesn't respond
        this.loadingTimeout = setTimeout(() => {
            if (this.loadingElement.style.display === 'block') {
                this.showError('Le serveur ne répond pas. Vérifiez votre connexion.');
            }
        }, 5000); // 5 second timeout
        
        // Show overlay with animation
        this.overlay.classList.add('visible');
        
        console.log('🗺️ Admin map selector opened');
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.overlay.classList.remove('visible');
        
        console.log('🗺️ Admin map selector closed');
    }
    
    showLoading() {
        this.loadingElement.style.display = 'block';
        this.mapList.style.display = 'none';
        this.teleportButton.classList.remove('visible');
    }
    
    showError(message) {
        this.loadingElement.innerHTML = `<div class=\"admin-map-error\">❌ ${message}</div>`;
        this.loadingElement.style.display = 'block';
        this.mapList.style.display = 'none';
    }
    
    handleMapsReceived(data) {
        // Clear timeout
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
        
        this.availableMaps = data.maps || [];
        this.currentMap = data.currentMap;
        
        this.renderMapList();
        
        this.loadingElement.style.display = 'none';
        this.mapList.style.display = 'block';
        
        console.log(`📋 Received ${this.availableMaps.length} available maps`);
    }
    
    renderMapList() {
        this.mapList.innerHTML = '';
        
        this.availableMaps.forEach((map, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'admin-map-item';
            
            // Add current map class
            if (map.name === this.currentMap) {
                listItem.classList.add('current');
            }
            
            // Add special styling for large maps
            if (map.isLargeMap) {
                listItem.style.background = 'rgba(142, 68, 173, 0.3)';
                listItem.style.borderColor = '#8e44ad';
            }
            
            listItem.innerHTML = `
                <span class=\"admin-map-number\">${index + 1}</span>
                <div class=\"admin-map-info\">
                    <div class=\"admin-map-name\">${map.displayName}</div>
                    <div class=\"admin-map-description\">
                        ${map.name} ${map.isLargeMap ? '(Grande Carte)' : ''}
                        ${map.collisionPath ? '🔒 Collisions séparées' : ''}
                    </div>
                </div>
            `;
            
            // Add click handler
            listItem.addEventListener('click', () => this.selectMap(index));
            
            this.mapList.appendChild(listItem);
        });
    }
    
    selectMap(index) {
        if (index < 0 || index >= this.availableMaps.length) return;
        
        // Remove previous selection
        const prevSelected = this.mapList.querySelector('.admin-map-item.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }
        
        // Add selection to new item
        const items = this.mapList.querySelectorAll('.admin-map-item');
        if (items[index]) {
            items[index].classList.add('selected');
            this.selectedMapIndex = index;
            
            // Show teleport button
            this.teleportButton.classList.add('visible');
            
            console.log(`🎯 Selected map: ${this.availableMaps[index].displayName}`);
        }
    }
    
    confirmTeleport() {
        if (this.selectedMapIndex < 0) return;
        
        const selectedMap = this.availableMaps[this.selectedMapIndex];
        
        if (selectedMap.name === this.currentMap) {
            this.showError('Vous êtes déjà sur cette carte!');
            return;
        }
        
        console.log(`🚀 Initiating teleport to: ${selectedMap.displayName}`);
        
        // Send teleport request
        this.socket.emit('admin_map_change', {
            mapName: selectedMap.name,
            spawnPosition: selectedMap.spawnPosition
        });
        
        // Show loading state
        this.teleportButton.innerHTML = '🔄 Téléportation...';
        this.teleportButton.disabled = true;
    }
    
    handleTeleportComplete(data) {
        console.log(`✅ Teleportation complete: ${data.mapName}`);
        
        // Update current map
        this.currentMap = data.mapName;
        
        // Hide selector
        this.hide();
        
        // Reset button
        this.teleportButton.innerHTML = '🚀 Téléporter';
        this.teleportButton.disabled = false;
        
        // Notify game manager to reload the map
        if (this.gameManager && this.gameManager.loadMap) {
            console.log(`🗺️ Loading new map: ${data.mapName}`);
            this.gameManager.loadMap(data.mapName).then(() => {
                console.log(`✅ Map loaded successfully: ${data.mapName}`);
                
                // Force refresh of player position if provided
                if (data.position && this.gameManager.playerController) {
                    this.gameManager.playerController.teleportTo(data.position);
                    console.log(`📍 Player position updated:`, data.position);
                }
            }).catch(error => {
                console.error(`❌ Failed to load map ${data.mapName}:`, error);
                this.showError(`Failed to load map: ${error.message}`);
            });
        } else {
            console.warn('⚠️ Game manager or loadMap method not available');
            // Fallback: try to reload the page if map loading fails
            if (confirm('Map loading system unavailable. Reload page to continue?')) {
                window.location.reload();
            }
        }
    }
    
    handleKeydown(e) {
        if (!this.isVisible) return;
        
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.hide();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedMapIndex >= 0) {
                    this.confirmTeleport();
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.navigateUp();
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateDown();
                break;
                
            default:
                // Number keys (1-9) for quick selection
                const num = parseInt(e.key);
                if (num >= 1 && num <= 9) {
                    e.preventDefault();
                    const index = num - 1;
                    if (index < this.availableMaps.length) {
                        this.selectMap(index);
                    }
                }
                break;
        }
    }
    
    navigateUp() {
        if (this.availableMaps.length === 0) return;
        
        let newIndex = this.selectedMapIndex - 1;
        if (newIndex < 0) {
            newIndex = this.availableMaps.length - 1;
        }
        this.selectMap(newIndex);
    }
    
    navigateDown() {
        if (this.availableMaps.length === 0) return;
        
        let newIndex = this.selectedMapIndex + 1;
        if (newIndex >= this.availableMaps.length) {
            newIndex = 0;
        }
        this.selectMap(newIndex);
    }
    
    // Public method to check if selector is visible
    isOpen() {
        return this.isVisible;
    }
    
    // Cleanup method
    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AdminMapSelector = AdminMapSelector;
}