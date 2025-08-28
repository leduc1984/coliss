/**
 * Extensions d'Outils Pokémon Avancés
 * Fonctionnalités étendues pour l'édition de cartes Pokémon
 */
class PokemonToolsExtended {
    constructor(scene, selectionManager) {
        this.scene = scene;
        this.selectionManager = selectionManager;
        
        // Données des outils Pokémon
        this.encounterZones = new Map();
        this.trainers = new Map();
        this.wildPokemon = new Map();
        this.items = new Map();
        this.signs = new Map();
        this.doors = new Map();
        
        // Brush pour peindre les zones
        this.brushSize = 5;
        this.currentBrushType = 'encounter';
        this.isPainting = false;
        
        // Données Pokémon étendues
        this.pokemonDatabase = new Map();
        this.trainerClasses = new Map();
        this.itemDatabase = new Map();
        
        this.initializePokemonTools();
    }
    
    /**
     * Initialiser les outils Pokémon étendus
     */
    initializePokemonTools() {
        this.loadPokemonData();
        this.createAdvancedUI();
        this.setupBrushTool();
        this.setupTrainerEditor();
        this.setupItemPlacer();
    }
    
    /**
     * Créer l'interface avancée pour les outils Pokémon
     */
    createAdvancedUI() {
        const leftPanel = document.getElementById('left-panel');
        if (!leftPanel) return;
        
        const advancedPokemonHTML = `
            <div id="advancedPokemonPanel" class="tool-panel" style="display: none;">
                <h3>Outils Pokémon Avancés</h3>
                
                <!-- Encounter Zone Painter -->
                <div class="pokemon-tool-section">
                    <h4>Peinture de Zones</h4>
                    <div class="brush-controls">
                        <label>Taille du pinceau:</label>
                        <input type="range" id="brushSize" min="1" max="20" value="5">
                        <span id="brushSizeDisplay">5</span>
                    </div>
                    <div class="zone-types">
                        <button class="zone-type-btn active" data-type="grass">Herbe</button>
                        <button class="zone-type-btn" data-type="water">Eau</button>
                        <button class="zone-type-btn" data-type="cave">Grotte</button>
                        <button class="zone-type-btn" data-type="desert">Désert</button>
                        <button class="zone-type-btn" data-type="mountain">Montagne</button>
                    </div>
                    <button id="startPaintingBtn">Commencer Peinture</button>
                </div>
                
                <!-- Wild Pokemon Editor -->
                <div class="pokemon-tool-section">
                    <h4>Pokémon Sauvages</h4>
                    <div class="encounter-table-editor">
                        <select id="selectedZoneForEdit">
                            <option value="">Sélectionner une zone...</option>
                        </select>
                        <button id="editEncounterTableBtn">Éditer Table</button>
                    </div>
                    <div class="time-based-encounters">
                        <h5>Rencontres par période</h5>
                        <div class="time-slots">
                            <label><input type="checkbox" checked> Matin (6h-12h)</label>
                            <label><input type="checkbox" checked> Jour (12h-18h)</label>
                            <label><input type="checkbox" checked> Soir (18h-22h)</label>
                            <label><input type="checkbox"> Nuit (22h-6h)</label>
                        </div>
                    </div>
                </div>
                
                <!-- Trainer Editor -->
                <div class="pokemon-tool-section">
                    <h4>Éditeur de Dresseurs</h4>
                    <div class="trainer-controls">
                        <select id="trainerClass">
                            <option value="youngster">Gamin</option>
                            <option value="lass">Fillette</option>
                            <option value="bugcatcher">Attrape-Insecte</option>
                            <option value="gymleader">Champion d'Arène</option>
                            <option value="eliteforur">Conseil 4</option>
                        </select>
                        <input type="text" id="trainerName" placeholder="Nom du dresseur">
                        <button id="placeTrainerBtn">Placer Dresseur</button>
                    </div>
                    <div class="trainer-party-editor">
                        <h5>Équipe Pokémon</h5>
                        <div id="trainerParty"></div>
                        <button id="addPokemonToPartyBtn">Ajouter Pokémon</button>
                    </div>
                </div>
                
                <!-- Item Placer -->
                <div class="pokemon-tool-section">
                    <h4>Placement d'Objets</h4>
                    <div class="item-controls">
                        <select id="itemType">
                            <option value="visible">Visible (Poké Ball)</option>
                            <option value="hidden">Caché</option>
                        </select>
                        <select id="itemSelect">
                            <option value="potion">Potion</option>
                            <option value="pokeball">Poké Ball</option>
                            <option value="tm">CT</option>
                            <option value="berry">Baie</option>
                            <option value="keyitem">Objet Clé</option>
                        </select>
                        <input type="number" id="itemQuantity" value="1" min="1">
                        <button id="placeItemBtn">Placer Objet</button>
                    </div>
                </div>
                
                <!-- Signs and NPCs -->
                <div class="pokemon-tool-section">
                    <h4>Panneaux et PNJ</h4>
                    <div class="sign-controls">
                        <textarea id="signText" placeholder="Texte du panneau..." rows="3"></textarea>
                        <button id="placeSignBtn">Placer Panneau</button>
                    </div>
                    <div class="npc-controls">
                        <select id="npcType">
                            <option value="generic">PNJ Générique</option>
                            <option value="shopkeeper">Marchand</option>
                            <option value="nurse">Infirmière Joëlle</option>
                            <option value="professor">Professeur</option>
                        </select>
                        <input type="text" id="npcDialogue" placeholder="Dialogue du PNJ">
                        <button id="placeNPCBtn">Placer PNJ</button>
                    </div>
                </div>
                
                <!-- Warp Points -->
                <div class="pokemon-tool-section">
                    <h4>Points de Téléportation</h4>
                    <div class="warp-controls">
                        <input type="text" id="targetMapName" placeholder="Nom de la carte cible">
                        <input type="number" id="targetX" placeholder="X" step="0.1">
                        <input type="number" id="targetY" placeholder="Y" step="0.1">
                        <input type="number" id="targetZ" placeholder="Z" step="0.1">
                        <button id="placeWarpBtn">Placer Point de Warp</button>
                    </div>
                </div>
            </div>
        `;
        
        leftPanel.insertAdjacentHTML('beforeend', advancedPokemonHTML);
        this.setupAdvancedPokemonEvents();
    }
    
    /**
     * Configurer les événements pour les outils Pokémon avancés
     */
    setupAdvancedPokemonEvents() {
        // Brush size control
        const brushSizeSlider = document.getElementById('brushSize');
        const brushSizeDisplay = document.getElementById('brushSizeDisplay');
        
        if (brushSizeSlider && brushSizeDisplay) {
            brushSizeSlider.addEventListener('input', (e) => {
                this.brushSize = parseInt(e.target.value);
                brushSizeDisplay.textContent = this.brushSize;
            });
        }
        
        // Zone type buttons
        document.querySelectorAll('.zone-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.zone-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentZoneType = e.target.getAttribute('data-type');
            });
        });
        
        // Start painting button
        const startPaintingBtn = document.getElementById('startPaintingBtn');
        if (startPaintingBtn) {
            startPaintingBtn.addEventListener('click', () => {
                this.togglePaintMode();
            });
        }
        
        // Trainer placement
        const placeTrainerBtn = document.getElementById('placeTrainerBtn');
        if (placeTrainerBtn) {
            placeTrainerBtn.addEventListener('click', () => {
                this.setTrainerPlacementMode();
            });
        }
        
        // Item placement
        const placeItemBtn = document.getElementById('placeItemBtn');
        if (placeItemBtn) {
            placeItemBtn.addEventListener('click', () => {
                this.setItemPlacementMode();
            });
        }
        
        // Sign placement
        const placeSignBtn = document.getElementById('placeSignBtn');
        if (placeSignBtn) {
            placeSignBtn.addEventListener('click', () => {
                this.setSignPlacementMode();
            });
        }
        
        // NPC placement
        const placeNPCBtn = document.getElementById('placeNPCBtn');
        if (placeNPCBtn) {
            placeNPCBtn.addEventListener('click', () => {
                this.setNPCPlacementMode();
            });
        }
        
        // Warp point placement
        const placeWarpBtn = document.getElementById('placeWarpBtn');
        if (placeWarpBtn) {
            placeWarpBtn.addEventListener('click', () => {
                this.setWarpPlacementMode();
            });
        }
    }
    
    /**
     * Configurer l'outil de pinceau pour peindre les zones
     */
    setupBrushTool() {
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (!this.isPainting) return;
            
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN || 
                (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && pointerInfo.event.buttons === 1)) {
                
                const pickResult = pointerInfo.pickInfo;
                if (pickResult.hit && pickResult.pickedPoint) {
                    this.paintEncounterZone(pickResult.pickedPoint);
                }
            }
        });
    }
    
    /**
     * Peindre une zone de rencontre
     */
    paintEncounterZone(position) {
        const zoneName = `${this.currentZoneType}_zone_${Date.now()}`;
        
        // Créer la zone visuelle
        const zoneGeometry = BABYLON.MeshBuilder.CreateGround(zoneName, {
            width: this.brushSize,
            height: this.brushSize
        }, this.scene);
        
        zoneGeometry.position = position.clone();
        zoneGeometry.position.y += 0.01; // Légèrement au-dessus du sol
        
        // Matériau de la zone
        const zoneMaterial = new BABYLON.StandardMaterial(`${zoneName}_mat`, this.scene);
        zoneMaterial.diffuseColor = this.getZoneColor(this.currentZoneType);
        zoneMaterial.alpha = 0.6;
        zoneGeometry.material = zoneMaterial;
        
        // Données de la zone
        const zoneData = {
            id: zoneName,
            type: this.currentZoneType,
            position: position.clone(),
            size: this.brushSize,
            encounters: this.getDefaultEncounters(this.currentZoneType),
            timeBasedRates: {
                morning: 1.0,
                day: 1.0,
                evening: 1.0,
                night: 0.8
            }
        };
        
        this.encounterZones.set(zoneName, zoneData);
        zoneGeometry.encounterData = zoneData;
        
        console.log(`Zone ${this.currentZoneType} créée:`, zoneData);
    }
    
    /**
     * Obtenir la couleur d'une zone selon son type
     */
    getZoneColor(zoneType) {
        const colors = {
            'grass': new BABYLON.Color3(0.2, 0.8, 0.2),
            'water': new BABYLON.Color3(0.2, 0.2, 0.8),
            'cave': new BABYLON.Color3(0.4, 0.3, 0.2),
            'desert': new BABYLON.Color3(0.9, 0.8, 0.3),
            'mountain': new BABYLON.Color3(0.6, 0.6, 0.6)
        };
        return colors[zoneType] || new BABYLON.Color3(1, 1, 1);
    }
    
    /**
     * Obtenir les rencontres par défaut pour un type de zone
     */
    getDefaultEncounters(zoneType) {
        const defaults = {
            'grass': [
                { pokemon: 'pidgey', level: [2, 5], rate: 30 },
                { pokemon: 'rattata', level: [2, 4], rate: 25 },
                { pokemon: 'caterpie', level: [3, 5], rate: 20 }
            ],
            'water': [
                { pokemon: 'magikarp', level: [5, 15], rate: 70 },
                { pokemon: 'psyduck', level: [10, 15], rate: 20 },
                { pokemon: 'goldeen', level: [10, 15], rate: 10 }
            ],
            'cave': [
                { pokemon: 'zubat', level: [6, 12], rate: 40 },
                { pokemon: 'geodude', level: [8, 12], rate: 35 },
                { pokemon: 'onix', level: [12, 15], rate: 15 }
            ]
        };
        return defaults[zoneType] || [];
    }
    
    /**
     * Basculer le mode peinture
     */
    togglePaintMode() {
        this.isPainting = !this.isPainting;
        const btn = document.getElementById('startPaintingBtn');
        
        if (this.isPainting) {
            btn.textContent = 'Arrêter Peinture';
            btn.style.backgroundColor = '#f44336';
            this.scene.activeCamera.detachControl();
        } else {
            btn.textContent = 'Commencer Peinture';
            btn.style.backgroundColor = '#4CAF50';
            this.scene.activeCamera.attachControl(this.scene.getEngine().getRenderingCanvas());
        }
    }
    
    /**
     * Créer un dresseur avec IA avancée
     */
    createAdvancedTrainer(position) {
        const trainerClass = document.getElementById('trainerClass').value;
        const trainerName = document.getElementById('trainerName').value || 'Dresseur';
        
        const trainerId = `trainer_${Date.now()}`;
        
        // Créer le mesh du dresseur
        const trainerMesh = BABYLON.MeshBuilder.CreateBox(trainerId, { size: 2 }, this.scene);
        trainerMesh.position = position.clone();
        
        // Matériau du dresseur
        const trainerMaterial = new BABYLON.StandardMaterial(`${trainerId}_mat`, this.scene);
        trainerMaterial.diffuseColor = this.getTrainerColor(trainerClass);
        trainerMesh.material = trainerMaterial;
        
        // Données du dresseur
        const trainerData = {
            id: trainerId,
            name: trainerName,
            class: trainerClass,
            position: position.clone(),
            party: [],
            dialogue: {
                challenge: 'Tu veux te battre ?',
                victory: 'Tu es fort !',
                defeat: 'J\'ai perdu...'
            },
            ai: {
                strategy: this.getAIStrategy(trainerClass),
                switchProbability: this.getSwitchProbability(trainerClass),
                itemUsage: trainerClass === 'gymleader' || trainerClass === 'eliteforur'
            },
            sightRange: 5,
            movement: {
                type: 'stationary', // stationary, patrol, random
                path: [],
                speed: 1
            },
            defeatedFlag: `defeated_${trainerId}`
        };
        
        this.trainers.set(trainerId, trainerData);
        trainerMesh.trainerData = trainerData;
        
        // Configurer le comportement du dresseur
        this.setupTrainerBehavior(trainerMesh, trainerData);
        
        console.log(`Dresseur ${trainerName} créé:`, trainerData);
        return trainerData;
    }
    
    /**
     * Obtenir la couleur d'un dresseur selon sa classe
     */
    getTrainerColor(trainerClass) {
        const colors = {
            'youngster': new BABYLON.Color3(0.3, 0.3, 1.0),
            'lass': new BABYLON.Color3(1.0, 0.3, 0.3),
            'bugcatcher': new BABYLON.Color3(0.3, 0.8, 0.3),
            'gymleader': new BABYLON.Color3(1.0, 0.8, 0.0),
            'eliteforur': new BABYLON.Color3(0.8, 0.0, 0.8)
        };
        return colors[trainerClass] || new BABYLON.Color3(0.5, 0.5, 0.5);
    }
    
    /**
     * Obtenir la stratégie IA selon la classe de dresseur
     */
    getAIStrategy(trainerClass) {
        const strategies = {
            'youngster': 'aggressive',
            'lass': 'balanced',
            'bugcatcher': 'defensive',
            'gymleader': 'strategic',
            'eliteforur': 'expert'
        };
        return strategies[trainerClass] || 'balanced';
    }
    
    /**
     * Obtenir la probabilité de changement selon la classe
     */
    getSwitchProbability(trainerClass) {
        const probabilities = {
            'youngster': 0.1,
            'lass': 0.2,
            'bugcatcher': 0.15,
            'gymleader': 0.4,
            'eliteforur': 0.6
        };
        return probabilities[trainerClass] || 0.2;
    }
    
    /**
     * Configurer le comportement d'un dresseur
     */
    setupTrainerBehavior(trainerMesh, trainerData) {
        // Créer une zone de détection
        const detectionZone = BABYLON.MeshBuilder.CreateSphere(`${trainerData.id}_detection`, {
            diameter: trainerData.sightRange * 2
        }, this.scene);
        
        detectionZone.position = trainerMesh.position.clone();
        detectionZone.isVisible = false;
        detectionZone.isPickable = false;
        
        // Logique de détection du joueur (à implémenter selon le système de jeu)
        trainerMesh.detectionZone = detectionZone;
        
        // Mouvement du dresseur selon son type
        if (trainerData.movement.type === 'patrol') {
            this.setupTrainerPatrol(trainerMesh, trainerData);
        }
    }
    
    /**
     * Placer un objet dans le monde
     */
    placeItem(position) {
        const itemType = document.getElementById('itemType').value;
        const itemId = document.getElementById('itemSelect').value;
        const quantity = parseInt(document.getElementById('itemQuantity').value);
        
        const itemInstanceId = `item_${Date.now()}`;
        
        // Créer le mesh de l'objet
        let itemMesh;
        if (itemType === 'visible') {
            itemMesh = BABYLON.MeshBuilder.CreateSphere(itemInstanceId, { diameter: 1 }, this.scene);
            const itemMaterial = new BABYLON.StandardMaterial(`${itemInstanceId}_mat`, this.scene);
            itemMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Rouge pour Poké Ball
            itemMesh.material = itemMaterial;
        } else {
            // Objet caché - créer un marqueur invisible pour l'éditeur
            itemMesh = BABYLON.MeshBuilder.CreateBox(itemInstanceId, { size: 0.5 }, this.scene);
            const hiddenMaterial = new BABYLON.StandardMaterial(`${itemInstanceId}_mat`, this.scene);
            hiddenMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
            hiddenMaterial.alpha = 0.5;
            hiddenMaterial.wireframe = true;
            itemMesh.material = hiddenMaterial;
        }
        
        itemMesh.position = position.clone();
        
        // Données de l'objet
        const itemData = {
            id: itemInstanceId,
            itemId: itemId,
            quantity: quantity,
            type: itemType,
            position: position.clone(),
            collected: false,
            respawn: itemId === 'berry' // Les baies repoussent
        };
        
        this.items.set(itemInstanceId, itemData);
        itemMesh.itemData = itemData;
        
        console.log(`Objet ${itemId} placé:`, itemData);
        return itemData;
    }
    
    /**
     * Placer un panneau
     */
    placeSign(position) {
        const signText = document.getElementById('signText').value;
        
        if (!signText.trim()) {
            alert('Veuillez entrer du texte pour le panneau');
            return;
        }
        
        const signId = `sign_${Date.now()}`;
        
        // Créer le mesh du panneau
        const signMesh = BABYLON.MeshBuilder.CreateBox(signId, { 
            width: 2, 
            height: 3, 
            depth: 0.2 
        }, this.scene);
        
        signMesh.position = position.clone();
        signMesh.position.y += 1.5; // Centrer verticalement
        
        // Matériau du panneau
        const signMaterial = new BABYLON.StandardMaterial(`${signId}_mat`, this.scene);
        signMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.2); // Brun
        signMesh.material = signMaterial;
        
        // Données du panneau
        const signData = {
            id: signId,
            text: signText,
            position: position.clone()
        };
        
        this.signs.set(signId, signData);
        signMesh.signData = signData;
        
        console.log(`Panneau créé:`, signData);
        return signData;
    }
    
    /**
     * Définir le mode de placement de dresseur
     */
    setTrainerPlacementMode() {
        this.currentTool = 'PLACE_TRAINER';
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (this.currentTool !== 'PLACE_TRAINER') return;
            
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                const pickResult = pointerInfo.pickInfo;
                if (pickResult.hit && pickResult.pickedPoint) {
                    this.createAdvancedTrainer(pickResult.pickedPoint);
                    this.currentTool = 'SELECT'; // Revenir au mode sélection
                }
            }
        });
    }
    
    /**
     * Définir le mode de placement d'objet
     */
    setItemPlacementMode() {
        this.currentTool = 'PLACE_ITEM';
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (this.currentTool !== 'PLACE_ITEM') return;
            
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                const pickResult = pointerInfo.pickInfo;
                if (pickResult.hit && pickResult.pickedPoint) {
                    this.placeItem(pickResult.pickedPoint);
                    this.currentTool = 'SELECT';
                }
            }
        });
    }
    
    /**
     * Définir le mode de placement de panneau
     */
    setSignPlacementMode() {
        this.currentTool = 'PLACE_SIGN';
        this.scene.onPointerObservable.add((pointerInfo) => {
            if (this.currentTool !== 'PLACE_SIGN') return;
            
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                const pickResult = pointerInfo.pickInfo;
                if (pickResult.hit && pickResult.pickedPoint) {
                    this.placeSign(pickResult.pickedPoint);
                    this.currentTool = 'SELECT';
                }
            }
        });
    }
    
    /**
     * Charger les données Pokémon étendues
     */
    loadPokemonData() {
        // Cette fonction serait connectée à une base de données ou API
        console.log('Chargement des données Pokémon étendues...');
        
        // Pour la démo, on peut utiliser des données simulées
        this.pokemonDatabase.set('pidgey', {
            id: 16,
            name: 'pidgey',
            types: ['normal', 'flying'],
            baseStats: { hp: 40, attack: 45, defense: 40, spAttack: 35, spDefense: 35, speed: 56 },
            encounterRate: 30
        });
        
        // Ajouter plus de données Pokémon...
    }
    
    /**
     * Exporter toutes les données Pokémon
     */
    exportPokemonData() {
        return {
            encounterZones: Array.from(this.encounterZones.entries()),
            trainers: Array.from(this.trainers.entries()),
            items: Array.from(this.items.entries()),
            signs: Array.from(this.signs.entries()),
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Importer des données Pokémon
     */
    importPokemonData(data) {
        if (data.encounterZones) {
            this.encounterZones = new Map(data.encounterZones);
        }
        if (data.trainers) {
            this.trainers = new Map(data.trainers);
        }
        if (data.items) {
            this.items = new Map(data.items);
        }
        if (data.signs) {
            this.signs = new Map(data.signs);
        }
        
        console.log('Données Pokémon importées avec succès');
    }
    
    /**
     * Nettoyer les ressources
     */
    dispose() {
        // Nettoyer toutes les zones, dresseurs, objets, etc.
        this.encounterZones.clear();
        this.trainers.clear();
        this.items.clear();
        this.signs.clear();
        
        console.log('🧹 Outils Pokémon étendus nettoyés');
    }
}

// Export pour utilisation dans d'autres modules
window.PokemonToolsExtended = PokemonToolsExtended;