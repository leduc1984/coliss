/**
 * Battle Interface - Handles UI elements for the battle system
 */

class BattleInterface {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.socket = gameManager.socket;
        this.currentBattle = null;
        this.battleContainer = null;
        this.spriteManager = window.battleSpriteManager;
        this.animationManager = null;
        this.isActive = false;
        
        // États de l'interface
        this.currentPhase = 'waiting'; // waiting, selection, animation, victory, defeat
        this.selectedMove = null;
        this.selectedTarget = null;
        
        this.initialize();
    }

    /**
     * Initialize the battle interface
     */
    init() {
        // Get battle container
        this.battleContainer = document.getElementById('battle-container');
        if (!this.battleContainer) {
            console.error('❌ Battle container not found');
            return false;
        }
        
        // Create battle element
        this.battleElement = document.createElement('div');
        this.battleElement.id = 'battle';
        this.battleElement.className = 'battle-module-hidden';
        this.battleContainer.appendChild(this.battleElement);
        
        console.log('✅ Battle interface initialized');
        return true;
    }

    /**
     * Initialise l'interface de bataille
     */
    initialize() {
        this.createBattleHTML();
        this.setupEventListeners();
        this.setupAnimationManager();
        this.hide(); // Masqué par défaut
        
        console.log('⚔️ Battle Interface initialized');
    }

    /**
     * Show the battle interface
     */
    show() {
        if (this.battleContainer) {
            this.battleContainer.style.display = 'block';
        }
    }
    
    /**
     * Hide the battle interface
     */
    hide() {
        if (this.battleContainer) {
            this.battleContainer.style.display = 'none';
        }
    }
    
    /**
     * Show loading indicator
     */
    showLoading() {
        if (!this.battleContainer) return;
        
        // Create or show loading overlay
        let loadingOverlay = this.battleContainer.querySelector('.battle-module-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'battle-module-overlay';
            loadingOverlay.innerHTML = `
                <div class="battle-module-loading">
                    <div class="battle-module-loading-spinner"></div>
                    <p>Preparing battle...</p>
                </div>
            `;
            this.battleContainer.appendChild(loadingOverlay);
        }
        
        loadingOverlay.style.display = 'flex';
        this.isLoading = true;
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        if (!this.battleContainer) return;
        
        const loadingOverlay = this.battleContainer.querySelector('.battle-module-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        this.isLoading = false;
    }
    
    /**
     * Update battle display with pokengine content
     * @param {string} content - HTML content to display
     */
    updateContent(content) {
        if (this.battleElement) {
            this.battleElement.innerHTML = content;
            this.battleElement.classList.remove('battle-module-hidden');
        }
    }

    /**
     * Crée la structure HTML de l'interface de bataille
     */
    createBattleHTML() {
        // Conteneur principal de la bataille
        this.battleContainer = document.createElement('div');
        this.battleContainer.id = 'battle-interface';
        this.battleContainer.className = 'battle-interface hidden';
        
        this.battleContainer.innerHTML = `
            <!-- Terrain de bataille -->
            <div class="battle-field">
                <!-- Côté adversaire -->
                <div class="opponent-side">
                    <div class="pokemon-container opponent-pokemon">
                        <img class="pokemon-sprite" id="opponent-sprite" />
                        <div class="pokemon-info">
                            <div class="pokemon-name" id="opponent-name">Pikachu</div>
                            <div class="pokemon-level" id="opponent-level">Niv. 25</div>
                            <div class="health-bar-container">
                                <div class="health-bar">
                                    <div class="health-fill" id="opponent-health-fill"></div>
                                </div>
                                <div class="health-text">
                                    <span id="opponent-hp-current">85</span>/<span id="opponent-hp-max">85</span>
                                </div>
                            </div>
                            <div class="status-conditions" id="opponent-status"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Côté joueur -->
                <div class="player-side">
                    <div class="pokemon-container player-pokemon">
                        <img class="pokemon-sprite" id="player-sprite" />
                        <div class="pokemon-info">
                            <div class="pokemon-name" id="player-name">Charizard</div>
                            <div class="pokemon-level" id="player-level">Niv. 28</div>
                            <div class="health-bar-container">
                                <div class="health-bar">
                                    <div class="health-fill" id="player-health-fill"></div>
                                </div>
                                <div class="health-text">
                                    <span id="player-hp-current">92</span>/<span id="player-hp-max">92</span>
                                </div>
                            </div>
                            <div class="status-conditions" id="player-status"></div>
                            <div class="experience-bar-container">
                                <div class="experience-bar">
                                    <div class="experience-fill" id="player-exp-fill"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Effets visuels -->
                <div class="battle-effects" id="battle-effects"></div>
            </div>
            
            <!-- Interface de contrôle -->
            <div class="battle-controls">
                <!-- Menu principal -->
                <div class="action-menu" id="action-menu">
                    <button class="action-btn" data-action="attack">
                        <span class="btn-icon">⚔️</span>
                        <span class="btn-text">Attaque</span>
                    </button>
                    <button class="action-btn" data-action="pokemon">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Pokémon</span>
                    </button>
                    <button class="action-btn" data-action="bag">
                        <span class="btn-icon">🎒</span>
                        <span class="btn-text">Sac</span>
                    </button>
                    <button class="action-btn" data-action="run">
                        <span class="btn-icon">🏃</span>
                        <span class="btn-text">Fuite</span>
                    </button>
                </div>
                
                <!-- Menu des attaques -->
                <div class="moves-menu hidden" id="moves-menu">
                    <div class="moves-grid" id="moves-grid">
                        <!-- Les attaques seront ajoutées dynamiquement -->
                    </div>
                    <button class="back-btn" id="moves-back">← Retour</button>
                </div>
                
                <!-- Menu des Pokémon -->
                <div class="pokemon-menu hidden" id="pokemon-menu">
                    <div class="pokemon-list" id="pokemon-list">
                        <!-- L'équipe sera ajoutée dynamiquement -->
                    </div>
                    <button class="back-btn" id="pokemon-back">← Retour</button>
                </div>
                
                <!-- Zone de texte -->
                <div class="battle-text-box">
                    <p id="battle-text">Que doit faire votre Pokémon ?</p>
                    <div class="text-continue hidden" id="text-continue">▼</div>
                </div>
            </div>
            
            <!-- Overlay de chargement -->
            <div class="battle-loading hidden" id="battle-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Préparation du combat...</div>
            </div>
        `;
        
        document.body.appendChild(this.battleContainer);
        
        // Ajouter le CSS des animations
        if (!document.getElementById('battle-animations-css')) {
            const link = document.createElement('link');
            link.id = 'battle-animations-css';
            link.rel = 'stylesheet';
            link.href = '/css/battle-animations.css';
            document.head.appendChild(link);
        }
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Boutons d'action principaux
        document.getElementById('action-menu').addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                this.handleActionClick(action);
            }
        });

        // Menu des attaques
        document.getElementById('moves-grid').addEventListener('click', (e) => {
            const moveBtn = e.target.closest('.move-btn');
            if (moveBtn) {
                const moveId = parseInt(moveBtn.dataset.moveId);
                this.selectMove(moveId);
            }
        });

        document.getElementById('moves-back').addEventListener('click', () => {
            this.showActionMenu();
        });

        // Menu des Pokémon
        document.getElementById('pokemon-list').addEventListener('click', (e) => {
            const pokemonBtn = e.target.closest('.pokemon-item');
            if (pokemonBtn) {
                const pokemonIndex = parseInt(pokemonBtn.dataset.index);
                this.selectPokemon(pokemonIndex);
            }
        });

        document.getElementById('pokemon-back').addEventListener('click', () => {
            this.showActionMenu();
        });

        // Continuer le texte
        document.getElementById('text-continue').addEventListener('click', () => {
            this.nextText();
        });

        // Événements Socket.io
        this.socket.on('battle_start', (data) => this.onBattleStart(data));
        this.socket.on('battle_update', (data) => this.onBattleUpdate(data));
        this.socket.on('battle_animation', (data) => this.onBattleAnimation(data));
        this.socket.on('battle_end', (data) => this.onBattleEnd(data));
        this.socket.on('battle_error', (data) => this.onBattleError(data));
    }

    /**
     * Configure le gestionnaire d'animations
     */
    setupAnimationManager() {
        if (window.BattleAnimationManager) {
            this.animationManager = new window.BattleAnimationManager(this);
            console.log('🎬 Animation Manager configuré');
        } else {
            console.warn('⚠️ BattleAnimationManager non disponible');
        }
    }

    /**
     * Démarre une bataille
     */
    async startBattle(battleData) {
        try {
            this.showLoading('Préparation du combat...');
            
            // Masquer l'interface 3D principale
            this.gameManager.scene.dispose();
            
            // Initialiser le gestionnaire de sprites
            await this.spriteManager.ensureInitialized();
            
            // Charger les sprites des Pokémon
            await this.loadBattleSprites(battleData);
            
            // Configurer l'interface
            this.currentBattle = battleData;
            this.setupBattleData(battleData);
            
            // Afficher l'interface de bataille
            this.show();
            this.hideLoading();
            
            // Jouer l'animation d'entrée
            this.playIntroAnimation();
            
            console.log('⚔️ Battle started:', battleData);
            
        } catch (error) {
            console.error('❌ Failed to start battle:', error);
            this.hideLoading();
            this.showError('Impossible de démarrer le combat');
        }
    }

    /**
     * Charge les sprites nécessaires pour la bataille
     */
    async loadBattleSprites(battleData) {
        const spritesToLoad = [];
        
        // Pokémon du joueur
        if (battleData.playerTeam) {
            for (const pokemon of battleData.playerTeam) {
                spritesToLoad.push({
                    id: pokemon.species_id,
                    shiny: pokemon.is_shiny || false,
                    gender: pokemon.gender
                });
            }
        }
        
        // Pokémon adversaire
        if (battleData.opponentTeam) {
            for (const pokemon of battleData.opponentTeam) {
                spritesToLoad.push({
                    id: pokemon.species_id,
                    shiny: pokemon.is_shiny || false,
                    gender: pokemon.gender
                });
            }
        }
        
        await this.spriteManager.preloadSprites(spritesToLoad);
    }

    /**
     * Configure les données de bataille dans l'interface
     */
    setupBattleData(battleData) {
        // Pokémon actuel du joueur
        const playerPokemon = battleData.playerTeam[0];
        this.updatePokemonDisplay('player', playerPokemon);
        
        // Pokémon actuel de l'adversaire
        const opponentPokemon = battleData.opponentTeam[0];
        this.updatePokemonDisplay('opponent', opponentPokemon);
        
        // Mettre à jour les attaques disponibles
        this.updateMovesMenu(playerPokemon.moves);
        
        // Mettre à jour l'équipe
        this.updatePokemonMenu(battleData.playerTeam);
        
        // Message initial
        this.setBattleText(`${opponentPokemon.name} sauvage apparaît !`);
    }

    /**
     * Met à jour l'affichage d'un Pokémon
     */
    async updatePokemonDisplay(side, pokemon) {
        const isPlayer = side === 'player';
        const position = isPlayer ? 'back' : 'front';
        
        try {
            // Charger le sprite
            const spriteData = await this.spriteManager.loadPokemonSprite(
                pokemon.species_id,
                position,
                pokemon.is_shiny || false,
                pokemon.gender
            );
            
            // Mettre à jour le sprite
            const spriteElement = document.getElementById(`${side}-sprite`);
            spriteElement.src = spriteData.url;
            spriteElement.style.transform = `scale(${spriteData.scale})`;
            
            // Mettre à jour les informations
            document.getElementById(`${side}-name`).textContent = pokemon.name;
            document.getElementById(`${side}-level`).textContent = `Niv. ${pokemon.level}`;
            
            // Mettre à jour la santé
            this.updateHealthBar(side, pokemon.current_hp, pokemon.max_hp);
            
            // Mettre à jour les statuts
            this.updateStatusConditions(side, pokemon.status || []);
            
            // Mettre à jour l'expérience (côté joueur seulement)
            if (isPlayer) {
                this.updateExperienceBar(pokemon.experience, pokemon.next_level_exp);
            }
            
        } catch (error) {
            console.error(`Failed to update ${side} Pokemon display:`, error);
        }
    }

    /**
     * Met à jour la barre de santé
     */
    updateHealthBar(side, currentHp, maxHp) {
        const percentage = Math.max(0, (currentHp / maxHp) * 100);
        
        document.getElementById(`${side}-hp-current`).textContent = currentHp;
        document.getElementById(`${side}-hp-max`).textContent = maxHp;
        
        const healthFill = document.getElementById(`${side}-health-fill`);
        healthFill.style.width = `${percentage}%`;
        
        // Couleur selon le pourcentage de santé
        if (percentage > 50) {
            healthFill.className = 'health-fill health-good';
        } else if (percentage > 25) {
            healthFill.className = 'health-fill health-warning';
        } else {
            healthFill.className = 'health-fill health-critical';
        }
    }

    /**
     * Met à jour la barre d'expérience
     */
    updateExperienceBar(currentExp, nextLevelExp) {
        const percentage = Math.max(0, (currentExp / nextLevelExp) * 100);
        const expFill = document.getElementById('player-exp-fill');
        if (expFill) {
            expFill.style.width = `${percentage}%`;
        }
    }

    /**
     * Met à jour les conditions de statut
     */
    updateStatusConditions(side, statusConditions) {
        const statusContainer = document.getElementById(`${side}-status`);
        statusContainer.innerHTML = '';
        
        for (const status of statusConditions) {
            const statusElement = document.createElement('span');
            statusElement.className = `status-condition status-${status.type}`;
            statusElement.textContent = status.name;
            statusContainer.appendChild(statusElement);
        }
    }

    /**
     * Met à jour le menu des attaques
     */
    updateMovesMenu(moves) {
        const movesGrid = document.getElementById('moves-grid');
        movesGrid.innerHTML = '';
        
        for (const move of moves) {
            const moveBtn = document.createElement('button');
            moveBtn.className = 'move-btn';
            moveBtn.dataset.moveId = move.id;
            
            moveBtn.innerHTML = `
                <div class="move-name">${move.name}</div>
                <div class="move-info">
                    <span class="move-type type-${move.type.toLowerCase()}">${move.type}</span>
                    <span class="move-pp">${move.current_pp}/${move.max_pp}</span>
                </div>
            `;
            
            if (move.current_pp <= 0) {
                moveBtn.disabled = true;
                moveBtn.classList.add('disabled');
            }
            
            movesGrid.appendChild(moveBtn);
        }
    }

    /**
     * Met à jour le menu de l'équipe Pokémon
     */
    updatePokemonMenu(team) {
        const pokemonList = document.getElementById('pokemon-list');
        pokemonList.innerHTML = '';
        
        for (let i = 0; i < team.length; i++) {
            const pokemon = team[i];
            const pokemonItem = document.createElement('div');
            pokemonItem.className = 'pokemon-item';
            pokemonItem.dataset.index = i;
            
            if (pokemon.current_hp <= 0) {
                pokemonItem.classList.add('fainted');
            }
            
            pokemonItem.innerHTML = `
                <div class="pokemon-mini-sprite">
                    <img src="/poke-battle/battle/images/animated/pokemon/battlesprites/${pokemon.species_id.toString().padStart(3, '0')}-front-n.gif" />
                </div>
                <div class="pokemon-mini-info">
                    <div class="pokemon-mini-name">${pokemon.name}</div>
                    <div class="pokemon-mini-level">Niv. ${pokemon.level}</div>
                    <div class="pokemon-mini-hp">${pokemon.current_hp}/${pokemon.max_hp}</div>
                </div>
            `;
            
            pokemonList.appendChild(pokemonItem);
        }
    }

    /**
     * Gère les clics sur les actions principales
     */
    handleActionClick(action) {
        if (this.currentPhase !== 'selection') {
            return;
        }
        
        switch (action) {
            case 'attack':
                this.showMovesMenu();
                break;
            case 'pokemon':
                this.showPokemonMenu();
                break;
            case 'bag':
                this.showBagMenu();
                break;
            case 'run':
                this.attemptRun();
                break;
        }
    }

    /**
     * Affiche le menu des attaques
     */
    showMovesMenu() {
        document.getElementById('action-menu').classList.add('hidden');
        document.getElementById('moves-menu').classList.remove('hidden');
    }

    /**
     * Affiche le menu des Pokémon
     */
    showPokemonMenu() {
        document.getElementById('action-menu').classList.add('hidden');
        document.getElementById('pokemon-menu').classList.remove('hidden');
    }

    /**
     * Affiche le menu des objets (à implémenter)
     */
    showBagMenu() {
        this.setBattleText('Le sac est vide pour le moment...');
        // TODO: Implémenter le système d'objets
    }

    /**
     * Revient au menu d'action principal
     */
    showActionMenu() {
        document.getElementById('moves-menu').classList.add('hidden');
        document.getElementById('pokemon-menu').classList.add('hidden');
        document.getElementById('action-menu').classList.remove('hidden');
    }

    /**
     * Sélectionne une attaque
     */
    selectMove(moveId) {
        this.selectedMove = moveId;
        this.currentPhase = 'waiting';
        
        // Envoyer le choix au serveur
        this.socket.emit('battle_move', {
            battleId: this.currentBattle.id,
            moveId: moveId
        });
        
        this.showActionMenu();
        this.setBattleText('En attente de l\'adversaire...');
    }

    /**
     * Sélectionne un Pokémon
     */
    selectPokemon(pokemonIndex) {
        const pokemon = this.currentBattle.playerTeam[pokemonIndex];
        
        if (pokemon.current_hp <= 0) {
            this.setBattleText('Ce Pokémon est K.O. !');
            return;
        }
        
        this.socket.emit('battle_switch', {
            battleId: this.currentBattle.id,
            pokemonIndex: pokemonIndex
        });
        
        this.showActionMenu();
        this.setBattleText('Changement de Pokémon...');
    }

    /**
     * Tente de fuir le combat
     */
    attemptRun() {
        this.socket.emit('battle_run', {
            battleId: this.currentBattle.id
        });
        
        this.setBattleText('Tentative de fuite...');
    }

    /**
     * Définit le texte de bataille
     */
    setBattleText(text) {
        document.getElementById('battle-text').textContent = text;
    }

    /**
     * Joue l'animation d'introduction
     */
    async playIntroAnimation() {
        if (!this.animationManager) {
            // Animation de base si le gestionnaire n'est pas disponible
            const playerSprite = document.getElementById('player-sprite');
            const opponentSprite = document.getElementById('opponent-sprite');
            
            playerSprite.style.transform = 'translateX(-100px) scale(0)';
            opponentSprite.style.transform = 'translateX(100px) scale(0)';
            
            setTimeout(() => {
                playerSprite.style.transition = 'transform 0.8s ease-out';
                opponentSprite.style.transition = 'transform 0.8s ease-out';
                
                playerSprite.style.transform = 'translateX(0) scale(1)';
                opponentSprite.style.transform = 'translateX(0) scale(1)';
            }, 100);
            
            setTimeout(() => {
                this.currentPhase = 'selection';
                this.setBattleText('Que doit faire votre Pokémon ?');
            }, 1000);
            return;
        }

        // Utiliser le gestionnaire d'animations
        const playerSprite = document.getElementById('player-sprite');
        const opponentSprite = document.getElementById('opponent-sprite');
        
        playerSprite.dataset.side = 'player';
        opponentSprite.dataset.side = 'opponent';
        
        // Animation d'entrée du Pokémon adversaire
        this.animationManager.queueAnimation({
            type: this.animationManager.config.types.POKEMON_ENTRY,
            data: { side: 'opponent', pokemonElement: opponentSprite }
        });
        
        // Animation d'entrée du Pokémon joueur (avec délai)
        setTimeout(() => {
            this.animationManager.queueAnimation({
                type: this.animationManager.config.types.POKEMON_ENTRY,
                data: { side: 'player', pokemonElement: playerSprite }
            });
        }, 400);
        
        // Message de début après les animations
        setTimeout(() => {
            this.animationManager.queueAnimation({
                type: this.animationManager.config.types.TEXT,
                data: { 
                    text: `${this.currentBattle.opponentTeam[0].name} sauvage apparaît !`,
                    duration: 2000
                }
            });
            
            setTimeout(() => {
                this.currentPhase = 'selection';
                this.setBattleText('Que doit faire votre Pokémon ?');
            }, 2500);
        }, 1200);
    }

    /**
     * Termine la bataille et retourne au jeu principal
     */
    async endBattle() {
        this.hide();
        
        // Restaurer l'interface 3D
        await this.gameManager.initializeBabylon();
        await this.gameManager.loadMap(this.gameManager.currentMapName);
        await this.gameManager.createPlayer();
        
        this.currentBattle = null;
        this.currentPhase = 'waiting';
        
        console.log('⚔️ Battle ended, returned to main game');
    }

    // Gestionnaires d'événements Socket.io
    onBattleStart(data) {
        this.startBattle(data);
    }

    onBattleUpdate(data) {
        // Mettre à jour l'état de la bataille
        if (data.playerPokemon) {
            this.updatePokemonDisplay('player', data.playerPokemon);
        }
        if (data.opponentPokemon) {
            this.updatePokemonDisplay('opponent', data.opponentPokemon);
        }
        if (data.message) {
            this.setBattleText(data.message);
        }
        if (data.phase) {
            this.currentPhase = data.phase;
        }
    }

    onBattleAnimation(data) {
        // Jouer les animations de bataille
        if (this.animationManager) {
            this.animationManager.queueAnimation(data);
        } else {
            console.log('Battle animation (fallback):', data);
        }
    }

    onBattleEnd(data) {
        this.setBattleText(data.message || 'Le combat est terminé !');
        setTimeout(() => {
            this.endBattle();
        }, 3000);
    }

    onBattleError(data) {
        this.showError(data.message);
    }
}

// Export pour utilisation dans le GameManager
window.BattleInterface = BattleInterface;