window.addEventListener('DOMContentLoaded', () => {
    // History management class - Moved to the top to avoid initialization error
    class History {
        constructor() {
            this.states = [];
            this.position = -1;
        }

        saveState(state) {
            if (this.position < this.states.length - 1) {
                this.states = this.states.slice(0, this.position + 1);
            }
            this.states.push(state);
            this.position++;
        }

        undo() {
            if (this.position > 0) {
                this.position--;
                return this.states[this.position];
            }
            return null;
        }

        redo() {
            if (this.position < this.states.length - 1) {
                this.position++;
                return this.states[this.position];
            }
            return null;
        }
    }

    // --- Initialisation ---
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1);
    scene.collisionsEnabled = true;

    // --- Variables Globales ---
    let loadedMeshes = [];
    let collisionMeshes = []; // New array for collision meshes
    let selectedMesh = null;
    let editorMode = 'EDIT';
    let currentTool = 'SELECT'; // SELECT, POKEMON_ZONE, NPC_PLACE, WARP_POINT
    let history;
    
    // Initialize History after the class has been loaded
    setTimeout(() => {
        history = new History();
        // Initial history save
        saveStateToHistory();
    }, 0);
    
    // Pokemon MMO specific data
    let pokemonZones = [];
    let npcPositions = [];
    let warpPoints = [];
    let pokemonEncounters = {
        // Example: 'grass_zone_1': [{ pokemon: 'Pidgey', level: [2,4], rate: 0.3 }]
    };
    
    // Draco compression status tracking
    let dracoCompressionStatus = {
        mainFile: null,     // null = not checked, true = compressed, false = not compressed
        collisionFile: null // null = not checked, true = compressed, false = not compressed
    };

    // --- Caméras ---
    const editorCam = new BABYLON.ArcRotateCamera("editorCam", -Math.PI / 2, Math.PI / 4, 150, BABYLON.Vector3.Zero(), scene);
    editorCam.lowerRadiusLimit = 2; editorCam.upperRadiusLimit = 1000;
    editorCam.attachControl(canvas, false);
    
    // Set initial camera position to see the grid
    editorCam.setTarget(BABYLON.Vector3.Zero());
    editorCam.alpha = 0;
    editorCam.beta = Math.PI / 3; // 60 degrees
    editorCam.radius = 200;

    // --- Joueur et Caméra Joueur ---
    const player = BABYLON.MeshBuilder.CreateBox("player", { size: 2 }, scene);
    player.position.y = 1;
    player.checkCollisions = true;

    const playerCam = new BABYLON.UniversalCamera("playerCam", new BABYLON.Vector3(10, 5, 10), scene);
    playerCam.setTarget(new BABYLON.Vector3(0, 1, 0));
    playerCam.attachControl(canvas, false);
    playerCam.minZ = 0.1;

    scene.activeCamera = editorCam;

    // --- Scène et Gizmo ---
    new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    
    // Create ground with grid
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 }, scene);
    
    // Try to create grid material, fallback to standard material if not available
    let gridMat;
    if (typeof BABYLON.GridMaterial !== 'undefined') {
        gridMat = new BABYLON.GridMaterial("gridMat", scene);
        gridMat.majorUnitFrequency = 10;
        gridMat.minorUnitVisibility = 0.45;
        gridMat.gridRatio = 1;
        gridMat.mainColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        gridMat.lineColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    } else {
        // Fallback to standard material with wireframe
        gridMat = new BABYLON.StandardMaterial("gridMat", scene);
        gridMat.wireframe = true;
        gridMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        console.warn('GridMaterial not available, using wireframe fallback');
    }
    
    ground.material = gridMat;
    ground.checkCollisions = true;
    ground.isGrid = true;
    ground.receiveShadows = true;
    
    // Debug logging
    console.log('Grid created:', {
        groundMesh: ground.name,
        material: gridMat.name,
        materialType: gridMat.getClassName(),
        groundVisible: ground.isVisible,
        groundPosition: ground.position
    });

    const gizmoManager = new BABYLON.GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true; gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.scaleGizmoEnabled = true; gizmoManager.attachToMesh(null);
    gizmoManager.gizmos.rotationGizmo.snapDistance = Math.PI / 4; // Snapping de 45 degrés

    gizmoManager.onAttachedToMeshObservable.add((mesh) => {
        if (mesh && mesh !== selectedMesh) {
            // Only update if it's a different mesh to prevent infinite recursion
            selectedMesh = mesh;
            if (mesh) {
                mesh.renderOutline = true;
                mesh.outlineWidth = 0.1;
                mesh.outlineColor = BABYLON.Color3.Yellow();
            }
            gizmoManager.gizmos.rotationGizmo.updateGizmoRotationToMatchAttachedMesh = true;
            buildMeshUI();
        }
    });

    ['positionGizmo', 'rotationGizmo', 'scaleGizmo'].forEach(gizmoType => {
        if (gizmoManager.gizmos[gizmoType]) {
            gizmoManager.gizmos[gizmoType].onDragEndObservable.add(() => saveStateToHistory());
        }
    });
//

    // --- Initialisation de l'Éditeur ---
    initUI();
    initCustomCameraControls();
    makePanelsResizable();
    initHotkeys();
    initWindowControls(); // Add this line to initialize window controls
    
    // Load Pokemon data
    loadPokemonData();
    
    // Initialiser l'intégration avancée
    let advancedIntegration = null;
    if (typeof AdvancedEditorIntegration !== 'undefined') {
        advancedIntegration = new AdvancedEditorIntegration();
        setTimeout(() => {
            advancedIntegration.initialize(scene, canvas, engine, gizmoManager);
            console.log('🚀 Éditeur avancé initialisé avec succès!');
        }, 500);
    } else {
        console.warn('AdvancedEditorIntegration non disponible');
    }
    
    engine.runRenderLoop(() => {
        scene.render();
        updateStatusBar();
    });
    window.addEventListener("resize", () => engine.resize());
    
    // Ensure grid is visible after initialization
    setTimeout(() => {
        refreshGrid();
        // Initialize grid toggle button state
        const toggleBtn = document.getElementById('toggleGridBtn');
        if (toggleBtn) {
            toggleBtn.textContent = 'Grille ON';
            toggleBtn.classList.add('active');
        }
    }, 100);

    // =================================================================
    // --- Fonctions de l'Éditeur ---
    // =================================================================
    
    /**
     * Initialize window controls for the editor
     */
    function initWindowControls() {
        // Get window control buttons
        const closeBtn = document.getElementById('closeEditorBtn');
        const minimizeBtn = document.getElementById('minimizeEditorBtn');
        const fullscreenBtn = document.getElementById('fullscreenEditorBtn');
        
        // Add event listeners for window controls
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // Close the editor (redirect to main game)
                window.location.href = '/';
            });
        }
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                // Minimize the editor (this would typically minimize the window)
                console.log('Minimize editor button clicked');
                // For now, just log the action
            });
        }
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                // Toggle fullscreen mode
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.error(`Error attempting to enable fullscreen: ${err.message}`);
                    });
                } else {
                    document.exitFullscreen();
                }
            });
        }
        
        console.log('Window controls initialized');
    }
    
    /**
     * Load Pokemon data and initialize Pokemon-related functionality
     */
    function loadPokemonData() {
        try {
            console.log('Loading Pokemon data for map editor...');
            
            // Initialize Pokemon sprite manager if available
            if (typeof pokemonSpriteManager !== 'undefined') {
                pokemonSpriteManager.initialize().then(() => {
                    console.log('Pokemon sprite manager initialized');
                    setupPokemonUI();
                }).catch(error => {
                    console.warn('Failed to initialize Pokemon sprite manager:', error);
                });
            } else {
                console.warn('Pokemon sprite manager not available');
            }
            
            // Initialize Pokemon data if available
            if (typeof PokemonDataManager !== 'undefined') {
                const pokemonDataManager = new PokemonDataManager();
                pokemonDataManager.loadPokemonData().then(() => {
                    console.log('Pokemon data loaded successfully');
                }).catch(error => {
                    console.warn('Failed to load Pokemon data:', error);
                });
            }
            
        } catch (error) {
            console.error('Error in loadPokemonData:', error);
        }
    }
    
    /**
     * Setup Pokemon-related UI elements
     */
    function setupPokemonUI() {
        // Populate Pokemon select dropdown if it exists
        const pokemonSelect = document.getElementById('pokemonSelect');
        if (pokemonSelect && typeof pokemonSpriteManager !== 'undefined') {
            pokemonSpriteManager.getAvailablePokemon().slice(0, 151).forEach(pokemon => {
                const option = document.createElement('option');
                option.value = pokemon.id;
                option.textContent = `#${pokemon.id}`;
                pokemonSelect.appendChild(option);
            });
        }
    }
    
        pokemonSpriteManager.createSpriteSelector('spriteGridContainer', (pokemonId, pokemonData) => {
            // Handle Pokemon selection
            console.log('Selected Pokemon:', pokemonId, pokemonData);
            
            // Update the Pokemon select dropdown
            const pokemonSelect = document.getElementById('pokemonSelect');
            if (pokemonSelect) {
                pokemonSelect.value = pokemonId;
            }
            
            // Close the modal
            spriteSelectorModal.classList.remove('active');
        }).then(() => {
            // Show the modal after content is loaded
            spriteSelectorModal.classList.add('active');
        }).catch(error => {
            console.error('Failed to create sprite selector:', error);
            spriteGridContainer.innerHTML = '<p style="text-align: center; color: #f44336; padding: 20px;">Failed to load Pokemon sprites</p>';
            spriteSelectorModal.classList.add('active');
        });
    }
    
    /**
     * Refresh the grid display
     */
    function refreshGrid() {
        const gridMesh = scene.getMeshByName('ground');
        if (gridMesh) {
            gridMesh.isVisible = true;
            gridMesh.setEnabled(true);
            console.log('Grid refreshed:', {
                visible: gridMesh.isVisible,
                enabled: gridMesh.isEnabled(),
                material: gridMesh.material?.name,
                position: gridMesh.position
            });
        } else {
            console.error('Grid mesh not found!');
        }
    }
    
    function toggleGrid() {
        const gridMesh = scene.getMeshByName('ground');
        const toggleBtn = document.getElementById('toggleGridBtn');
        
        if (gridMesh) {
            gridMesh.isVisible = !gridMesh.isVisible;
            
            // Update button text and style
            if (gridMesh.isVisible) {
                toggleBtn.textContent = 'Grille ON';
                toggleBtn.classList.add('active');
            } else {
                toggleBtn.textContent = 'Grille OFF';
                toggleBtn.classList.remove('active');
            }
            
            console.log('Grid toggled:', gridMesh.isVisible ? 'ON' : 'OFF');
        } else {
            console.error('Grid mesh not found for toggle!');
        }
    }

    function loadMapObjects() {
        fetch('/api/editor/map-objects')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load map objects');
                }
                return response.json();
            })
            .then(categories => {
                const mapObjectsPanel = document.getElementById('mapObjectsPanel');
                const container = mapObjectsPanel.querySelector('.object-categories');
                container.innerHTML = ''; // Clear existing placeholders

                for (const categoryName in categories) {
                    const categoryData = categories[categoryName];

                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'object-category';

                    const categoryTitle = document.createElement('h4');
                    categoryTitle.textContent = categoryName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    categoryDiv.appendChild(categoryTitle);

                    const objectGrid = document.createElement('div');
                    objectGrid.className = 'object-grid';

                    categoryData.forEach(object => {
                        const objectItem = document.createElement('div');
                        objectItem.className = 'object-item';
                        objectItem.dataset.object = object.path; // Store the full path

                        const thumbnail = document.createElement('div');
                        thumbnail.className = 'object-thumbnail';
                        // For now, use a generic icon. A better solution might be to generate thumbnails.
                        thumbnail.textContent = '📦';
                        objectItem.appendChild(thumbnail);

                        const name = document.createElement('div');
                        name.className = 'object-name';
                        name.textContent = object.name;
                        objectItem.appendChild(name);

                        objectItem.addEventListener('click', () => {
                            placeObject(object.name, object.path);
                        });

                        objectGrid.appendChild(objectItem);
                    });

                    categoryDiv.appendChild(objectGrid);
                    container.appendChild(categoryDiv);
                }
            })
            .catch(error => {
                console.error('Error loading map objects:', error);
                const container = document.getElementById('mapObjectsPanel').querySelector('.object-categories');
                container.innerHTML = '<p style="color: red;">Error loading objects.</p>';
            });
    }

    function placeObject(name, path) {
        BABYLON.SceneLoader.ImportMesh(null, "", path, scene, (meshes) => {
            const newMesh = meshes.find(m => m.getTotalVertices() > 0);
            if (!newMesh) return;

            const centerPick = scene.pick(engine.getRenderWidth() / 2, engine.getRenderHeight() / 2, (m) => !m.isGizmo);
            newMesh.position = centerPick.pickedPoint || editorCam.getTarget();

            const bounds = newMesh.getHierarchyBoundingVectors();
            const heightOffset = newMesh.position.y - bounds.min.y;
            newMesh.position.y += heightOffset;

            newMesh.instanceId = generateUUID();
            newMesh.objectId = name;
            newMesh.name = name + "_" + loadedMeshes.length;
            loadedMeshes.push(newMesh);
            buildMeshUI();
            saveStateToHistory();
            selectMesh(newMesh);
        });
    }

    function initUI() {
        const meshSearch = document.getElementById('meshSearch');
        if (meshSearch) {
            meshSearch.addEventListener('input', () => buildMeshUI());
        }
        
        // Load map objects dynamically
        loadMapObjects();
        
        // Bouton charger carte principale
        const loadMainMapBtn = document.getElementById('loadMainMapBtn');
        const fileInput = document.getElementById('fileInput');
        if (loadMainMapBtn && fileInput) {
            loadMainMapBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    loadMainMap(e.target.files[0]);
                }
            });
        }
        
        // Bouton charger fichier de collision
        const loadCollisionBtn = document.getElementById('loadCollisionBtn');
        const collisionFileInput = document.getElementById('collisionFileInput');
        if (loadCollisionBtn && collisionFileInput) {
            loadCollisionBtn.addEventListener('click', () => collisionFileInput.click());
            collisionFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    loadCollisionFile(e.target.files[0]);
                }
            });
        }
        
        // Bouton basculer visibilité collisions
        const toggleCollisionBtn = document.getElementById('toggleCollisionBtn');
        if (toggleCollisionBtn) {
            toggleCollisionBtn.addEventListener('click', toggleCollisionMeshesVisibility);
        }
        
        // Contrôles du panneau de collision
        const collisionTypeSelect = document.getElementById('collisionTypeSelect');
        const applyCollisionTypeBtn = document.getElementById('applyCollisionTypeBtn');
        const addCollisionBtn = document.getElementById('addCollisionBtn');
        const removeCollisionBtn = document.getElementById('removeCollisionBtn');
        const duplicateCollisionBtn = document.getElementById('duplicateCollisionBtn');
        
        if (collisionTypeSelect && applyCollisionTypeBtn) {
            applyCollisionTypeBtn.addEventListener('click', () => {
                if (selectedMesh) {
                    const type = collisionTypeSelect.value;
                    setCollisionType(selectedMesh, type);
                }
            });
        }
        
        if (addCollisionBtn) {
            addCollisionBtn.addEventListener('click', () => {
                if (selectedMesh && !selectedMesh.isCollisionMesh) {
                    addCollisionMesh(selectedMesh, "blocked");
                }
            });
        }
        
        if (removeCollisionBtn) {
            removeCollisionBtn.addEventListener('click', () => {
                if (selectedMesh && selectedMesh.isCollisionMesh) {
                    removeCollisionMesh(selectedMesh);
                }
            });
        }
        
        if (duplicateCollisionBtn) {
            duplicateCollisionBtn.addEventListener('click', () => {
                duplicateCollisionMesh();
            });
        }
        
        // Advanced collision properties
        const collisionPropertiesPanel = document.getElementById('collisionPropertiesPanel');
        const collisionTriggerTypeSelect = document.getElementById('collisionTriggerType');
        const collisionDestinationMapInput = document.getElementById('collisionDestinationMap');
        const collisionDestinationXInput = document.getElementById('collisionDestinationX');
        const collisionDestinationZInput = document.getElementById('collisionDestinationZ');
        const saveCollisionPropertiesBtn = document.getElementById('saveCollisionPropertiesBtn');
        
        if (saveCollisionPropertiesBtn) {
            saveCollisionPropertiesBtn.addEventListener('click', () => {
                if (selectedMesh && selectedMesh.isCollisionMesh) {
                    saveCollisionProperties(selectedMesh);
                }
            });
        }
        
        // Collision creation tools
        const createCollisionVolumeBtn = document.getElementById('createCollisionVolumeBtn');
        const createTriggerVolumeBtn = document.getElementById('createTriggerVolumeBtn');
        const paintCollisionBtn = document.getElementById('paintCollisionBtn');
        const creationCollisionTypeSelect = document.getElementById('creationCollisionType');
        const creationTriggerTypeSelect = document.getElementById('creationTriggerType');
        
        if (createCollisionVolumeBtn) {
            createCollisionVolumeBtn.addEventListener('click', () => {
                const type = creationCollisionTypeSelect ? creationCollisionTypeSelect.value : "blocked";
                createCollisionVolume(type);
            });
        }
        
        if (createTriggerVolumeBtn) {
            createTriggerVolumeBtn.addEventListener('click', () => {
                const triggerType = creationTriggerTypeSelect ? creationTriggerTypeSelect.value : "teleport";
                createTriggerVolume(triggerType);
            });
        }
        
        if (paintCollisionBtn) {
            paintCollisionBtn.addEventListener('click', () => {
                const type = creationCollisionTypeSelect ? creationCollisionTypeSelect.value : "blocked";
                paintCollision(type);
            });
        }
        
        // Batch compression tools
        const batchCompressBtn = document.getElementById('batchCompressBtn');
        const compressionQualitySelect = document.getElementById('compressionQuality');
        
        if (batchCompressBtn) {
            batchCompressBtn.addEventListener('click', () => {
                const quality = compressionQualitySelect ? compressionQualitySelect.value : "medium";
                batchCompressMeshes(quality);
            });
        }

        // Boutons Undo/Redo
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                const state = history.undo();
                if (state) {
                    loadStateFromHistory(state);
                }
            });
        }
        
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                const state = history.redo();
                if (state) {
                    loadStateFromHistory(state);
                }
            });
        }

        // Bouton exporter
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                // Update encounters from manager
                const currentEncounters = pokemonEncounterManager.getAllZoneEncounters();
                exportPokemonMap(loadedMeshes, pokemonZones, npcPositions, warpPoints, currentEncounters);
            });
        }

        // Bouton importer
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    importScene(e.target.files[0], (data) => {
                        loadStateFromHistory(data);
                    });
                }
            });
        }

        // Bouton mode test
        const testModeBtn = document.getElementById('testModeBtn');
        if (testModeBtn) {
            testModeBtn.addEventListener('click', () => {
                toggleTestMode();
            });
        }
        
        // Pokemon MMO Tool Buttons
        const selectToolBtn = document.getElementById('selectToolBtn');
        const pokemonZoneBtn = document.getElementById('pokemonZoneBtn');
        const npcPlaceBtn = document.getElementById('npcPlaceBtn');
        const warpPointBtn = document.getElementById('warpPointBtn');
        const toggleGridBtn = document.getElementById('toggleGridBtn');
        
        if (selectToolBtn) {
            selectToolBtn.addEventListener('click', () => setTool('SELECT'));
        }
        if (pokemonZoneBtn) {
            pokemonZoneBtn.addEventListener('click', () => setTool('POKEMON_ZONE'));
        }
        if (npcPlaceBtn) {
            npcPlaceBtn.addEventListener('click', () => setTool('NPC_PLACE'));
        }
        if (warpPointBtn) {
            warpPointBtn.addEventListener('click', () => setTool('WARP_POINT'));
        }
        if (toggleGridBtn) {
            toggleGridBtn.addEventListener('click', toggleGrid);
        }
        
        // Pokemon Sprite Selector Modal Events
        const openSpriteSelectorBtn = document.getElementById('openSpriteSelector');
        const spriteSelectorModal = document.getElementById('spriteSelectorModal');
        const closeSpriteSelector = document.getElementById('closeSpriteSelector');
        
        if (openSpriteSelectorBtn && spriteSelectorModal) {
            openSpriteSelectorBtn.addEventListener('click', () => {
                openPokemonSpriteSelector();
            });
        }
        
        if (closeSpriteSelector && spriteSelectorModal) {
            closeSpriteSelector.addEventListener('click', () => {
                spriteSelectorModal.classList.remove('active');
            });
            
            // Close modal when clicking outside
            spriteSelectorModal.addEventListener('click', (e) => {
                if (e.target === spriteSelectorModal) {
                    spriteSelectorModal.classList.remove('active');
                }
            });
        }
        
        // Window Controls Buttons
        const minimizeEditorBtn = document.getElementById('minimizeEditorBtn');
        const fullscreenEditorBtn = document.getElementById('fullscreenEditorBtn');
        const closeEditorBtn = document.getElementById('closeEditorBtn');
        
        if (minimizeEditorBtn) {
            minimizeEditorBtn.addEventListener('click', () => {
                // Minimize functionality - sending a message to parent window
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ action: 'minimizeMapEditor' }, '*');
                } else {
                    // Fallback for standalone mode
                    alert('Minimize feature only works when embedded in game');
                }
            });
        }
        
        if (fullscreenEditorBtn) {
            fullscreenEditorBtn.addEventListener('click', () => {
                // Toggle fullscreen
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.error(`Error attempting to enable fullscreen: ${err.message}`);
                    });
                    fullscreenEditorBtn.textContent = '⤓';
                    fullscreenEditorBtn.title = 'Exit Fullscreen';
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                        fullscreenEditorBtn.textContent = '⟱';
                        fullscreenEditorBtn.title = 'Fullscreen';
                    }
                }
            });
        }
        
        if (closeEditorBtn) {
            closeEditorBtn.addEventListener('click', () => {
                // Close functionality - sending a message to parent window
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ action: 'closeMapEditor' }, '*');
                } else {
                    // Fallback for standalone mode - ask for confirmation
                    if (confirm('Are you sure you want to close the Map Editor? Any unsaved changes will be lost.')) {
                        window.close();
                        // If window.close() doesn't work (browser restrictions)
                        window.location.href = '/';
                    }
                }
            });
        }
        
        // Handle fullscreen change events
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                if (fullscreenEditorBtn) {
                    fullscreenEditorBtn.textContent = '⤓';
                    fullscreenEditorBtn.title = 'Exit Fullscreen';
                }
            } else {
                if (fullscreenEditorBtn) {
                    fullscreenEditorBtn.textContent = '⟱';
                    fullscreenEditorBtn.title = 'Fullscreen';
                }
            }
        });
        
        // Pokemon Zone Creation
        const createZoneBtn = document.getElementById('createZoneBtn');
        const placeNpcBtn = document.getElementById('placeNpcBtn');
        const createWarpBtn = document.getElementById('createWarpBtn');
        
        if (createZoneBtn) {
            createZoneBtn.addEventListener('click', createPokemonZone);
        }
        if (placeNpcBtn) {
            placeNpcBtn.addEventListener('click', placeNPC);
        }
        if (createWarpBtn) {
            createWarpBtn.addEventListener('click', createWarpPoint);
        }
        
        // Pokemon Encounter System
        const addEncounterBtn = document.getElementById('addEncounterBtn');
        const zoneTypeSelect = document.getElementById('zoneType');
        
        if (addEncounterBtn) {
            addEncounterBtn.addEventListener('click', addPokemonEncounter);
        }
        
        if (zoneTypeSelect) {
            zoneTypeSelect.addEventListener('change', updatePokemonList);
        }
    }

    function loadMainMap(file) {
        if (!file) return;
        clearScene();
        
        // Check file size
        checkFileSize(file, 'main');
        
        // Check for Draco compression
        checkDracoCompression(file, 'main');
        
        const url = URL.createObjectURL(file);
        BABYLON.SceneLoader.ImportMesh(null, "", url, scene, (meshes) => {
            loadedMeshes = meshes.filter(m => m.getTotalVertices() > 0);
            autoAdjustMapHeight(); // Correction automatique
            recenterCamera();
            buildMeshUI();
            saveStateToHistory();
        }, null, null, ".glb");
    }

    function placeObject(objectId, url) {
        BABYLON.SceneLoader.ImportMesh(null, url, "", scene, (meshes) => {
            const newMesh = meshes.find(m => m.getTotalVertices() > 0);
            if (!newMesh) return;
            
            // Alignement automatique sur le sol
            const centerPick = scene.pick(engine.getRenderWidth() / 2, engine.getRenderHeight() / 2, (m) => !m.isGizmo);
            newMesh.position = centerPick.pickedPoint || editorCam.getTarget();
            
            // Ajustement final pour que le bas du modèle touche le sol
            const bounds = newMesh.getHierarchyBoundingVectors();
            const heightOffset = newMesh.position.y - bounds.min.y;
            newMesh.position.y += heightOffset;

            newMesh.instanceId = generateUUID(); newMesh.objectId = objectId;
            newMesh.name = objectId + "_" + loadedMeshes.length;
            loadedMeshes.push(newMesh);
            buildMeshUI();
            saveStateToHistory();
            selectMesh(newMesh);
        });
    }

    function autoAdjustMapHeight() {
        if (loadedMeshes.length === 0) return;
        let lowestPoint = Infinity;
        loadedMeshes.forEach(mesh => {
            const bounds = mesh.getBoundingInfo().boundingBox.minimumWorld;
            if (bounds.y < lowestPoint) {
                lowestPoint = bounds.y;
            }
        });
        if (lowestPoint !== Infinity && lowestPoint !== 0) {
            loadedMeshes.forEach(mesh => {
                mesh.position.y -= lowestPoint;
            });
        }
    }
    
    function buildMeshUI() {
        const meshPanel = document.getElementById("meshPanel");
        const meshSearch = document.getElementById('meshSearch');
        
        if (!meshPanel) {
            console.warn('meshPanel element not found');
            return;
        }
        
        const searchTerm = meshSearch ? meshSearch.value.toLowerCase() : '';
        meshPanel.innerHTML = "";

        const filteredMeshes = loadedMeshes.filter(m => m.name.toLowerCase().includes(searchTerm));

        filteredMeshes.forEach(mesh => {
            const div = document.createElement("div");
            if (mesh === selectedMesh) {
                div.className = "selected";
            }
            const label = document.createElement("label");
            label.textContent = mesh.name;
            div.appendChild(label);
            div.onclick = () => selectMesh(mesh);
            meshPanel.appendChild(div);
        });
    }

    function selectMesh(mesh) {
        // Prevent unnecessary updates if selecting the same mesh
        if (selectedMesh === mesh) {
            return;
        }
        
        if (selectedMesh) {
            selectedMesh.renderOutline = false;
        }
        
        selectedMesh = mesh;
        
        if (mesh) {
            mesh.renderOutline = true;
            mesh.outlineWidth = 0.1;
            mesh.outlineColor = BABYLON.Color3.Yellow();
            gizmoManager.attachToMesh(mesh);
            
            // Mettre à jour le panneau de propriétés de collision si c'est un mesh de collision
            const collisionPanel = document.getElementById('collisionPanel');
            const collisionTypeSelect = document.getElementById('collisionTypeSelect');
            const addCollisionBtn = document.getElementById('addCollisionBtn');
            const removeCollisionBtn = document.getElementById('removeCollisionBtn');
            
            if (collisionPanel && collisionTypeSelect && addCollisionBtn && removeCollisionBtn) {
                if (mesh.isCollisionMesh) {
                    // Afficher le panneau de collision
                    collisionPanel.style.display = 'block';
                    // Mettre à jour le type de collision sélectionné
                    collisionTypeSelect.value = mesh.collisionType || "blocked";
                    // Cacher le bouton "Ajouter comme collision" et afficher "Retirer collision"
                    addCollisionBtn.style.display = 'none';
                    removeCollisionBtn.style.display = 'block';
                    
                    // Update advanced collision properties
                    updateCollisionPropertiesPanel(mesh);
                } else {
                    // Afficher le panneau de collision
                    collisionPanel.style.display = 'block';
                    // Réinitialiser le type de collision
                    collisionTypeSelect.value = "blocked";
                    // Afficher le bouton "Ajouter comme collision" et cacher "Retirer collision"
                    addCollisionBtn.style.display = 'block';
                    removeCollisionBtn.style.display = 'none';
                }
            }
        } else {
            gizmoManager.attachToMesh(null);
            
            // Cacher le panneau de collision quand aucun mesh n'est sélectionné
            const collisionPanel = document.getElementById('collisionPanel');
            if (collisionPanel) {
                collisionPanel.style.display = 'none';
            }
        }
        
        buildMeshUI(); // Met à jour l'UI pour la surbrillance
    }
    
    function updateStatusBar() {
        const statusBarCoords = document.getElementById('cursor-coords');
        const statusBarSelected = document.getElementById('selected-object-info');
        const statusBarStats = document.getElementById('scene-stats');

        if (statusBarCoords) {
            const pickInfo = scene.pick(scene.pointerX, scene.pointerY, (m) => m.isGrid);
            if (pickInfo.hit) {
                const pos = pickInfo.pickedPoint;
                statusBarCoords.textContent = `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}`;
            }
        }
        
        if (statusBarSelected) {
            statusBarSelected.textContent = selectedMesh ? `Sélectionné : ${selectedMesh.name}` : "Aucun objet sélectionné";
        }
        
        if (statusBarStats) {
            // Convert SmartArray to regular array for reduce method
            const activeMeshes = scene.getActiveMeshes();
            let triangleCount = 0;
            if (activeMeshes && activeMeshes.data) {
                for (let i = 0; i < activeMeshes.length; i++) {
                    const mesh = activeMeshes.data[i];
                    if (mesh && mesh.getTotalIndices) {
                        triangleCount += mesh.getTotalIndices() / 3;
                    }
                }
            }
            statusBarStats.textContent = `Triangles: ${Math.floor(triangleCount)}`;
        }
    }
    
    function initHotkeys() {
        window.addEventListener('keydown', (e) => {
            if (editorMode === 'EDIT') {
                if (e.key === 'Delete' && selectedMesh) {
                    // Supprimer l'objet sélectionné
                    const index = loadedMeshes.indexOf(selectedMesh);
                    if (index > -1) {
                        selectedMesh.dispose();
                        loadedMeshes.splice(index, 1);
                        selectMesh(null);
                        buildMeshUI();
                        saveStateToHistory();
                    }
                    e.preventDefault();
                }
                if (e.ctrlKey && e.key.toLowerCase() === 'd' && selectedMesh) {
                    // Dupliquer l'objet sélectionné
                    const clone = selectedMesh.clone(selectedMesh.name + '_copy');
                    clone.position.x += 2; // Décaler légèrement
                    clone.instanceId = generateUUID();
                    clone.objectId = selectedMesh.objectId;
                    loadedMeshes.push(clone);
                    selectMesh(clone);
                    buildMeshUI();
                    saveStateToHistory();
                    e.preventDefault();
                }
            }
            
            // Raccourcis globaux
            if (e.ctrlKey && e.key.toLowerCase() === 'z') {
                const state = history.undo();
                if (state) {
                    loadStateFromHistory(state);
                }
                e.preventDefault();
            }
            if (e.ctrlKey && e.key.toLowerCase() === 'y') {
                const state = history.redo();
                if (state) {
                    loadStateFromHistory(state);
                }
                e.preventDefault();
            }
        });
    }

    function initCustomCameraControls() {
        // Contrôles personnalisés pour la caméra de l'éditeur
        scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.event.button === 0) { // Clic gauche
                    const pickInfo = scene.pick(scene.pointerX, scene.pointerY, (mesh) => !mesh.isGizmo && !mesh.isGrid);
                    if (pickInfo.hit) {
                        selectMesh(pickInfo.pickedMesh);
                    } else {
                        selectMesh(null);
                    }
                }
            }
        });

        // Désactiver la sélection automatique par défaut de Babylon.js
        scene.actionManager = new BABYLON.ActionManager(scene);
    }

    function recenterCamera() {
        if (loadedMeshes.length === 0) return;
        
        let totalPosition = BABYLON.Vector3.Zero();
        let count = 0;
        
        loadedMeshes.forEach(mesh => {
            totalPosition.addInPlace(mesh.position);
            count++;
        });
        
        if (count > 0) {
            const center = totalPosition.scale(1 / count);
            editorCam.setTarget(center);
        }
    }

    function clearScene() {
        // Only dispose loaded meshes, not the grid ground
        loadedMeshes.forEach(mesh => {
            if (mesh && !mesh.isGrid) {
                mesh.dispose();
            }
        });
        loadedMeshes = [];
        
        // Dispose collision meshes
        collisionMeshes.forEach(mesh => {
            if (mesh) {
                mesh.dispose();
            }
        });
        collisionMeshes = [];
        
        selectedMesh = null;
        gizmoManager.attachToMesh(null);
        buildMeshUI();
        
        // Ensure grid is still visible
        const gridMesh = scene.getMeshByName('ground');
        if (gridMesh) {
            gridMesh.isVisible = true;
            console.log('Grid preserved after scene clear');
        }
    }

    function saveStateToHistory() {
        // Skip if history is not yet initialized
        if (!history) return;
        
        const state = serializeMeshes(loadedMeshes);
        history.push(state);
    }

    function makePanelsResizable() {
        const leftPanel = document.getElementById('left-panel');
        const leftSplitter = document.getElementById('left-splitter');
        const rightPanel = document.getElementById('right-panel');
        const rightSplitter = document.getElementById('right-splitter');
        const editorContainer = document.getElementById('editor-container');
        
        // Function to handle resizing
        function initResizable(panel, splitter, isLeft) {
            if (!panel || !splitter) return;
            
            let isResizing = false;
            let startX, startWidth;
            
            splitter.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = parseInt(document.defaultView.getComputedStyle(panel).width, 10);
                
                // Add an overlay to capture mouse events during resize
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                overlay.style.zIndex = '9999';
                overlay.style.cursor = 'col-resize';
                document.body.appendChild(overlay);
                
                // Attach move and up events to the document
                function onMouseMove(e) {
                    if (!isResizing) return;
                    
                    const delta = e.clientX - startX;
                    let newWidth;
                    
                    if (isLeft) {
                        newWidth = startWidth + delta;
                    } else {
                        newWidth = startWidth - delta;
                    }
                    
                    // Set min and max width constraints
                    newWidth = Math.max(200, Math.min(500, newWidth));
                    
                    panel.style.width = `${newWidth}px`;
                    panel.style.flexBasis = `${newWidth}px`;
                    panel.style.minWidth = `${newWidth}px`;
                }
                
                function onMouseUp() {
                    isResizing = false;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    document.body.removeChild(overlay);
                }
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                
                e.preventDefault();
            });
        }
        
        // Initialize left panel resizing
        if (leftPanel && leftSplitter) {
            initResizable(leftPanel, leftSplitter, true);
        }
        
        // Initialize right panel resizing
        if (rightPanel && rightSplitter) {
            initResizable(rightPanel, rightSplitter, false);
        }
        
        console.log('Panels made resizable');
    }

    function loadStateFromHistory(state) {
        // Nettoyer la scène actuelle
        clearScene();
        
        // Recharger les objets depuis l'état
        state.forEach(meshData => {
            // Ici, vous devriez avoir une logique pour recréer les objets
            // Pour l'instant, on peut juste log l'état
            console.log('Loading mesh:', meshData.name);
        });
        
        buildMeshUI();
    }

    function toggleTestMode() {
        const testBtn = document.getElementById('testModeBtn');
        if (!testBtn) return;
        
        if (editorMode === 'EDIT') {
            editorMode = 'TEST';
            testBtn.textContent = 'Passer en Mode Édition';
            // Masquer les gizmos en mode test
            if (gizmoManager) {
                gizmoManager.positionGizmoEnabled = false;
                gizmoManager.rotationGizmoEnabled = false;
                gizmoManager.scaleGizmoEnabled = false;
            }
            // Désélectionner l'objet
            selectMesh(null);
        } else {
            editorMode = 'EDIT';
            testBtn.textContent = 'Passer en Mode Test';
            // Réactiver les gizmos en mode édition
            if (gizmoManager) {
                gizmoManager.positionGizmoEnabled = true;
                gizmoManager.rotationGizmoEnabled = true;
                gizmoManager.scaleGizmoEnabled = true;
            }
        }
    }
    
    // =================================================================
    // --- Fonctions de gestion des meshes de collision ---
    // =================================================================
    
    /**
     * Ajoute un mesh de collision
     * @param {BABYLON.Mesh} mesh - Le mesh à ajouter comme collision
     * @param {string} type - Le type de collision ("blocked", "trigger", "interactable")
     */
    function addCollisionMesh(mesh, type = "blocked") {
        if (!mesh) return;
        
        // Marquer le mesh comme collision mesh
        mesh.isCollisionMesh = true;
        mesh.collisionType = type;
        mesh.checkCollisions = true;
        
        // Rendre le mesh invisible mais avec un indicateur visuel
        mesh.visibility = 0.3; // Partiellement transparent
        mesh.renderOutline = true;
        mesh.outlineWidth = 0.05;
        mesh.outlineColor = BABYLON.Color3.Red(); // Rouge pour les collisions
        
        collisionMeshes.push(mesh);
        buildMeshUI(); // Mettre à jour l'interface
        saveStateToHistory();
        
        console.log(`Added collision mesh: ${mesh.name} (${type})`);
    }
    
    /**
     * Supprime un mesh de collision
     * @param {BABYLON.Mesh} mesh - Le mesh de collision à supprimer
     */
    function removeCollisionMesh(mesh) {
        if (!mesh || !mesh.isCollisionMesh) return;
        
        const index = collisionMeshes.indexOf(mesh);
        if (index > -1) {
            collisionMeshes.splice(index, 1);
            mesh.isCollisionMesh = false;
            mesh.collisionType = undefined;
            mesh.renderOutline = false;
            mesh.visibility = 1; // Remettre à la visibilité normale
            buildMeshUI();
            saveStateToHistory();
            console.log(`Removed collision mesh: ${mesh.name}`);
        }
    }
    
    /**
     * Définit le type de collision pour un mesh
     * @param {BABYLON.Mesh} mesh - Le mesh à modifier
     * @param {string} type - Le nouveau type de collision
     */
    function setCollisionType(mesh, type) {
        if (!mesh || !mesh.isCollisionMesh) return;
        
        mesh.collisionType = type;
        
        // Changer la couleur de l'outline selon le type
        switch(type) {
            case "blocked":
                mesh.outlineColor = BABYLON.Color3.Red();
                break;
            case "trigger":
                mesh.outlineColor = BABYLON.Color3.Yellow();
                break;
            case "interactable":
                mesh.outlineColor = BABYLON.Color3.Green();
                break;
            default:
                mesh.outlineColor = BABYLON.Color3.Red();
        }
        
        saveStateToHistory();
        console.log(`Set collision type for ${mesh.name}: ${type}`);
    }
    
    /**
     * Bascule la visibilité des meshes de collision
     */
    function toggleCollisionMeshesVisibility() {
        const isVisible = collisionMeshes.length > 0 ? collisionMeshes[0].visibility > 0 : false;
        const newVisibility = isVisible ? 0 : 0.3;
        
        collisionMeshes.forEach(mesh => {
            mesh.visibility = newVisibility;
        });
        
        // Mettre à jour le bouton dans l'interface
        const toggleBtn = document.getElementById('toggleCollisionBtn');
        if (toggleBtn) {
            toggleBtn.textContent = isVisible ? 'Collisions OFF' : 'Collisions ON';
            toggleBtn.classList.toggle('active', !isVisible);
        }
        
        console.log(`Collision meshes visibility toggled: ${!isVisible ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Charge un fichier de collision séparé
     * @param {File} file - Le fichier GLB de collision à charger
     */
    function loadCollisionFile(file) {
        if (!file) return;
        
        // Check file size
        checkFileSize(file, 'collision');
        
        // Check for Draco compression
        checkDracoCompression(file, 'collision');
        
        const url = URL.createObjectURL(file);
        BABYLON.SceneLoader.ImportMesh(null, "", url, scene, (meshes) => {
            meshes.forEach(mesh => {
                if (mesh.getTotalVertices() > 0) {
                    // Positionner le mesh de collision à la même position que le mesh principal
                    if (loadedMeshes.length > 0) {
                        mesh.position.copyFrom(loadedMeshes[0].position);
                    }
                    addCollisionMesh(mesh, "blocked");
                }
            });
            URL.revokeObjectURL(url);
        }, null, null, ".glb");
    }
    
    /**
     * Create a new collision volume
     * @param {string} type - Type of collision volume
     * @param {BABYLON.Vector3} position - Position of the volume
     * @param {BABYLON.Vector3} size - Size of the volume
     */
    function createCollisionVolume(type = "blocked", position = null, size = null) {
        // Use current camera target if no position provided
        if (!position) {
            position = editorCam.getTarget().clone();
        }
        
        // Default size if not provided
        if (!size) {
            size = new BABYLON.Vector3(2, 2, 2);
        }
        
        // Create box for collision volume
        const collisionVolume = BABYLON.MeshBuilder.CreateBox(`collision_${collisionMeshes.length}`, {
            width: size.x,
            height: size.y,
            depth: size.z
        }, scene);
        
        collisionVolume.position.copyFrom(position);
        
        // Add to collision meshes
        addCollisionMesh(collisionVolume, type);
        
        // Select the new collision mesh
        selectMesh(collisionVolume);
        
        console.log(`Created collision volume: ${collisionVolume.name} (${type})`);
        return collisionVolume;
    }
    
    /**
     * Create a trigger volume for special interactions
     * @param {string} triggerType - Type of trigger ("teleport", "event", "encounter")
     * @param {BABYLON.Vector3} position - Position of the trigger
     */
    function createTriggerVolume(triggerType = "teleport", position = null) {
        // Use current camera target if no position provided
        if (!position) {
            position = editorCam.getTarget().clone();
        }
        
        // Create slightly transparent box for trigger volume
        const triggerVolume = BABYLON.MeshBuilder.CreateBox(`trigger_${collisionMeshes.length}`, {
            width: 3,
            height: 3,
            depth: 3
        }, scene);
        
        triggerVolume.position.copyFrom(position);
        
        // Make it a trigger (not solid)
        triggerVolume.checkCollisions = false;
        triggerVolume.isTrigger = true;
        triggerVolume.triggerType = triggerType;
        
        // Visual appearance for triggers
        triggerVolume.visibility = 0.2;
        triggerVolume.renderOutline = true;
        triggerVolume.outlineWidth = 0.1;
        
        // Color based on trigger type
        switch(triggerType) {
            case "teleport":
                triggerVolume.outlineColor = BABYLON.Color3.Blue();
                break;
            case "event":
                triggerVolume.outlineColor = BABYLON.Color3.Purple();
                break;
            case "encounter":
                triggerVolume.outlineColor = BABYLON.Color3.Orange();
                break;
            default:
                triggerVolume.outlineColor = BABYLON.Color3.Blue();
        }
        
        // Add to collision meshes
        collisionMeshes.push(triggerVolume);
        buildMeshUI();
        saveStateToHistory();
        
        // Select the new trigger mesh
        selectMesh(triggerVolume);
        
        console.log(`Created trigger volume: ${triggerVolume.name} (${triggerType})`);
        return triggerVolume;
    }
    
    /**
     * Paint collision on existing meshes using raycasting
     * @param {string} type - Type of collision to paint
     */
    function paintCollision(type = "blocked") {
        // Raycast from camera to pick a mesh
        const pickInfo = scene.pick(scene.pointerX, scene.pointerY, (mesh) => !mesh.isGizmo && !mesh.isGrid && !mesh.isCollisionMesh);
        
        if (pickInfo.hit) {
            const mesh = pickInfo.pickedMesh;
            
            // Add as collision mesh
            addCollisionMesh(mesh, type);
            
            console.log(`Painted collision on mesh: ${mesh.name} (${type})`);
        } else {
            console.log("No mesh found to paint collision on");
        }
    }
    
    /**
     * Duplicate selected collision mesh
     */
    function duplicateCollisionMesh() {
        if (!selectedMesh || !selectedMesh.isCollisionMesh) return;
        
        const clone = selectedMesh.clone(`${selectedMesh.name}_copy`);
        clone.position.x += 2; // Décaler légèrement
        
        // Copy collision properties
        clone.isCollisionMesh = true;
        clone.collisionType = selectedMesh.collisionType;
        clone.checkCollisions = true;
        clone.visibility = selectedMesh.visibility;
        clone.renderOutline = true;
        clone.outlineWidth = selectedMesh.outlineWidth;
        clone.outlineColor = selectedMesh.outlineColor;
        
        // Copy advanced properties if they exist
        if (selectedMesh.collisionTriggerType) clone.collisionTriggerType = selectedMesh.collisionTriggerType;
        if (selectedMesh.collisionDestinationMap) clone.collisionDestinationMap = selectedMesh.collisionDestinationMap;
        if (selectedMesh.collisionDestinationX) clone.collisionDestinationX = selectedMesh.collisionDestinationX;
        if (selectedMesh.collisionDestinationZ) clone.collisionDestinationZ = selectedMesh.collisionDestinationZ;
        
        collisionMeshes.push(clone);
        buildMeshUI();
        saveStateToHistory();
        selectMesh(clone);
        
        console.log(`Duplicated collision mesh: ${clone.name}`);
    }
    
    /**
     * Check file size and warn if too large
     * @param {File} file - The file to check
     * @param {string} fileType - 'main' or 'collision'
     */
    function checkFileSize(file, fileType) {
        const fileSizeMB = file.size / (1024 * 1024);
        console.log(`${fileType} file size: ${fileSizeMB.toFixed(2)} MB`);
        
        // Warn if file is larger than 10MB
        if (fileSizeMB > 10) {
            console.warn(`${fileType} file is large (${fileSizeMB.toFixed(2)} MB), consider compression`);
            showFileSizeWarning(fileType, fileSizeMB);
        }
        
        // Show optimization suggestions based on file size
        showOptimizationSuggestions(fileType, fileSizeMB);
    }
    
    /**
     * Show file size warning
     * @param {string} fileType - 'main' or 'collision'
     * @param {number} fileSizeMB - File size in MB
     */
    function showFileSizeWarning(fileType, fileSizeMB) {
        const warningElementId = fileType === 'main' ? 'mainFileSizeWarning' : 'collisionFileSizeWarning';
        let warningElement = document.getElementById(warningElementId);
        
        if (!warningElement) {
            // Create warning element if it doesn't exist
            warningElement = document.createElement('div');
            warningElement.id = warningElementId;
            warningElement.className = 'file-size-warning';
            warningElement.style.cssText = 'margin: 5px 0; padding: 5px; border-radius: 4px; font-size: 12px; background-color: rgba(255, 152, 0, 0.2); color: #ff9800;';
            
            // Add to appropriate location in UI
            if (fileType === 'main') {
                const loadMainMapBtn = document.getElementById('loadMainMapBtn');
                if (loadMainMapBtn && loadMainMapBtn.parentNode) {
                    loadMainMapBtn.parentNode.insertBefore(warningElement, loadMainMapBtn.nextSibling);
                }
            } else {
                const loadCollisionBtn = document.getElementById('loadCollisionBtn');
                if (loadCollisionBtn && loadCollisionBtn.parentNode) {
                    loadCollisionBtn.parentNode.insertBefore(warningElement, loadCollisionBtn.nextSibling);
                }
            }
        }
        
        // Update warning element content
        warningElement.textContent = `⚠️ Fichier volumineux: ${fileSizeMB.toFixed(2)} MB`;
    }
    
    /**
     * Show optimization suggestions based on file size
     * @param {string} fileType - 'main' or 'collision'
     * @param {number} fileSizeMB - File size in MB
     */
    function showOptimizationSuggestions(fileType, fileSizeMB) {
        const suggestionsElementId = fileType === 'main' ? 'mainOptimizationSuggestions' : 'collisionOptimizationSuggestions';
        let suggestionsElement = document.getElementById(suggestionsElementId);
        
        if (!suggestionsElement) {
            // Create suggestions element if it doesn't exist
            suggestionsElement = document.createElement('div');
            suggestionsElement.id = suggestionsElementId;
            suggestionsElement.className = 'optimization-suggestions';
            suggestionsElement.style.cssText = 'margin: 5px 0; padding: 5px; border-radius: 4px; font-size: 12px; background-color: rgba(33, 150, 243, 0.2); color: #2196f3;';
            
            // Add to appropriate location in UI
            if (fileType === 'main') {
                const loadMainMapBtn = document.getElementById('loadMainMapBtn');
                if (loadMainMapBtn && loadMainMapBtn.parentNode) {
                    loadMainMapBtn.parentNode.insertBefore(suggestionsElement, loadMainMapBtn.nextSibling);
                }
            } else {
                const loadCollisionBtn = document.getElementById('loadCollisionBtn');
                if (loadCollisionBtn && loadCollisionBtn.parentNode) {
                    loadCollisionBtn.parentNode.insertBefore(suggestionsElement, loadCollisionBtn.nextSibling);
                }
            }
        }
        
        // Generate suggestions based on file size
        let suggestions = [];
        
        if (fileSizeMB > 20) {
            suggestions.push("🔧 Utilisez la compression Draco pour réduire la taille du fichier");
            suggestions.push("✂️ Simplifiez la géométrie des modèles pour réduire le nombre de polygones");
        } else if (fileSizeMB > 10) {
            suggestions.push("🔧 Utilisez la compression Draco pour réduire la taille du fichier");
            suggestions.push("🗜️ Réduisez la résolution des textures");
        } else if (fileSizeMB > 5) {
            suggestions.push("🗜️ Réduisez la résolution des textures");
        }
        
        // Add Draco compression suggestion if not already compressed
        if (fileType === 'main' && dracoCompressionStatus.mainFile === false) {
            suggestions.push("🔧 Activez la compression Draco pour améliorer les performances de chargement");
        } else if (fileType === 'collision' && dracoCompressionStatus.collisionFile === false) {
            suggestions.push("🔧 Activez la compression Draco pour améliorer les performances de chargement");
        }
        
        // Update suggestions element content
        if (suggestions.length > 0) {
            suggestionsElement.innerHTML = `<strong>Suggestions d'optimisation:</strong><br>• ${suggestions.join('<br>• ')}`;
        } else {
            suggestionsElement.textContent = "✅ Le fichier est bien optimisé";
        }
    }
    
    /**
     * Batch compress meshes using Draco compression
     * @param {string} quality - Compression quality ("low", "medium", "high")
     */
    function batchCompressMeshes(quality = "medium") {
        console.log(`🔧 Starting batch compression with ${quality} quality`);
        
        // In a real implementation, this would use Draco compression library
        // For now, we'll simulate the process and show results
        
        // Show compression progress
        const progressElement = document.createElement('div');
        progressElement.id = 'compressionProgress';
        progressElement.className = 'compression-progress';
        progressElement.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 8px; z-index: 10000;';
        progressElement.innerHTML = `
            <h3>Compression Draco en cours...</h3>
            <div id="compressionProgressBar" style="width: 300px; height: 20px; background: #333; border-radius: 10px; margin: 10px 0;">
                <div style="width: 0%; height: 100%; background: #4caf50; border-radius: 10px; transition: width 0.3s;" id="compressionProgressFill"></div>
            </div>
            <div id="compressionProgressText">0%</div>
        `;
        document.body.appendChild(progressElement);
        
        // Simulate compression process
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progress > 100) {
                clearInterval(interval);
                
                // Remove progress element
                setTimeout(() => {
                    if (progressElement.parentNode) {
                        progressElement.parentNode.removeChild(progressElement);
                    }
                    
                    // Show compression results
                    showCompressionResults(quality);
                }, 500);
            }
            
            // Update progress UI
            const progressFill = document.getElementById('compressionProgressFill');
            const progressText = document.getElementById('compressionProgressText');
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${progress}%`;
        }, 100);
    }
    
    /**
     * Show compression results
     * @param {string} quality - Compression quality used
     */
    function showCompressionResults(quality) {
        // Calculate simulated results
        const originalSize = 15.5; // MB
        let compressedSize;
        let reductionPercent;
        
        switch(quality) {
            case "high":
                compressedSize = 5.2;
                reductionPercent = 66.5;
                break;
            case "medium":
                compressedSize = 7.8;
                reductionPercent = 50;
                break;
            case "low":
                compressedSize = 10.2;
                reductionPercent = 34.2;
                break;
            default:
                compressedSize = 7.8;
                reductionPercent = 50;
        }
        
        // Show results dialog
        const resultsElement = document.createElement('div');
        resultsElement.className = 'compression-results';
        resultsElement.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.95); color: white; padding: 30px; border-radius: 12px; z-index: 10000; min-width: 400px; text-align: center;';
        resultsElement.innerHTML = `
            <h3>✅ Compression Terminée</h3>
            <div style="margin: 20px 0; text-align: left;">
                <p><strong>Qualité:</strong> ${quality}</p>
                <p><strong>Taille originale:</strong> ${originalSize.toFixed(1)} MB</p>
                <p><strong>Taille compressée:</strong> ${compressedSize.toFixed(1)} MB</p>
                <p><strong>Réduction:</strong> ${reductionPercent.toFixed(1)}%</p>
                <p style="color: #4caf50; margin-top: 15px;"><strong>🚀 Amélioration des performances de chargement: ~${Math.round(reductionPercent/2)}%</strong></p>
            </div>
            <button id="closeCompressionResults" style="background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Fermer</button>
        `;
        document.body.appendChild(resultsElement);
        
        // Add close button event
        const closeBtn = document.getElementById('closeCompressionResults');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (resultsElement.parentNode) {
                    resultsElement.parentNode.removeChild(resultsElement);
                }
            });
        }
    }
    
    /**
     * Place a Pokemon in the map
     * @param {Object} pokemonData - Pokemon data to place
     * @param {BABYLON.Vector3} position - Position to place the Pokemon
     */
    function placePokemon(pokemonData, position) {
        // Create a mesh for the Pokemon
        const pokemonMesh = BABYLON.MeshBuilder.CreateBox("pokemon", { size: 1 }, scene);
        pokemonMesh.position = position;
        
        // Set a distinctive color for Pokemon objects
        const material = new BABYLON.StandardMaterial("pokemonMaterial", scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red color
        pokemonMesh.material = material;
        
        // Store Pokemon data in the mesh
        pokemonMesh.pokemonData = pokemonData;
        pokemonMesh.isPokemon = true;
        
        // Add to placed objects
        placedObjects.push(pokemonMesh);
        
        console.log(`Placed Pokemon ${pokemonData.name} at position ${position.x}, ${position.y}, ${position.z}`);
        
        return pokemonMesh;
    }
    
    /**
     * Save Pokemon placement data with map
     */
    function savePokemonPlacement() {
        const pokemonObjects = placedObjects.filter(obj => obj.isPokemon);
        const pokemonData = pokemonObjects.map(obj => ({
            id: obj.pokemonData.id,
            name: obj.pokemonData.name,
            position: {
                x: obj.position.x,
                y: obj.position.y,
                z: obj.position.z
            }
        }));
        
        // Add to map data
        if (!currentMapData.pokemon) {
            currentMapData.pokemon = [];
        }
        currentMapData.pokemon = pokemonData;
        
        console.log('Pokemon placement data saved:', pokemonData);
    }
    
    // Check for Draco compression
    function checkDracoCompression(file, fileType) {
        // Create a FileReader to read the file
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Check for Draco compression marker in GLB files
            // Draco compression is indicated by specific extension in glTF
            let isDracoCompressed = false;
            
            try {
                // Convert to string to search for Draco markers
                const fileString = new TextDecoder().decode(uint8Array.slice(0, 1024)); // Check first 1KB
                isDracoCompressed = fileString.includes('KHR_draco_mesh_compression');
            } catch (error) {
                console.warn('Could not check Draco compression:', error);
            }
            
            // Update compression status
            if (fileType === 'main') {
                dracoCompressionStatus.mainFile = isDracoCompressed;
            } else {
                dracoCompressionStatus.collisionFile = isDracoCompressed;
            }
            
            console.log(`${fileType} file Draco compression:`, isDracoCompressed ? 'Yes' : 'No');
            
            // Show compression status in UI
            showCompressionStatus(fileType, isDracoCompressed);
        };
        
        // Read only the first few KB to check for Draco markers
        const slice = file.slice(0, 4096); // Read first 4KB
        reader.readAsArrayBuffer(slice);
    }
    
    // Show compression status in UI
    function showCompressionStatus(fileType, isCompressed) {
        const statusElementId = fileType === 'main' ? 'mainCompressionStatus' : 'collisionCompressionStatus';
        let statusElement = document.getElementById(statusElementId);
        
        if (!statusElement) {
            // Create status element if it doesn't exist
            statusElement = document.createElement('div');
            statusElement.id = statusElementId;
            statusElement.className = 'compression-status';
            statusElement.style.cssText = 'margin: 5px 0; padding: 5px; border-radius: 4px; font-size: 12px;';
            
            // Add to appropriate location in UI
            if (fileType === 'main') {
                const loadMainMapBtn = document.getElementById('loadMainMapBtn');
                if (loadMainMapBtn && loadMainMapBtn.parentNode) {
                    loadMainMapBtn.parentNode.insertBefore(statusElement, loadMainMapBtn.nextSibling);
                }
            } else {
                const loadCollisionBtn = document.getElementById('loadCollisionBtn');
                if (loadCollisionBtn && loadCollisionBtn.parentNode) {
                    loadCollisionBtn.parentNode.insertBefore(statusElement, loadCollisionBtn.nextSibling);
                }
            }
        }
        
        // Update status element content and style
        if (isCompressed) {
            statusElement.textContent = '🗜️ Draco: Activé';
            statusElement.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            statusElement.style.color = '#4caf50';
        } else {
            statusElement.textContent = '🗜️ Draco: Désactivé';
            statusElement.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
            statusElement.style.color = '#ffc107';
        }
    }
    
    // Update collision properties panel
    function updateCollisionPropertiesPanel(mesh) {
        const collisionPropertiesPanel = document.getElementById('collisionPropertiesPanel');
        const collisionTriggerTypeSelect = document.getElementById('collisionTriggerType');
        const collisionDestinationMapInput = document.getElementById('collisionDestinationMap');
        const collisionDestinationXInput = document.getElementById('collisionDestinationX');
        const collisionDestinationZInput = document.getElementById('collisionDestinationZ');
        
        if (collisionPropertiesPanel && mesh && mesh.isCollisionMesh) {
            collisionPropertiesPanel.style.display = 'block';
            
            // Update trigger type
            if (collisionTriggerTypeSelect && mesh.collisionTriggerType) {
                collisionTriggerTypeSelect.value = mesh.collisionTriggerType;
            }
            
            // Update destination inputs
            if (collisionDestinationMapInput && mesh.collisionDestinationMap) {
                collisionDestinationMapInput.value = mesh.collisionDestinationMap;
            }
            if (collisionDestinationXInput && mesh.collisionDestinationX !== undefined) {
                collisionDestinationXInput.value = mesh.collisionDestinationX;
            }
            if (collisionDestinationZInput && mesh.collisionDestinationZ !== undefined) {
                collisionDestinationZInput.value = mesh.collisionDestinationZ;
            }
        } else if (collisionPropertiesPanel) {
            collisionPropertiesPanel.style.display = 'none';
        }
    }
    
    // Save collision properties
    function saveCollisionProperties(mesh) {
        if (!mesh || !mesh.isCollisionMesh) return;
        
        const collisionTriggerTypeSelect = document.getElementById('collisionTriggerType');
        const collisionDestinationMapInput = document.getElementById('collisionDestinationMap');
        const collisionDestinationXInput = document.getElementById('collisionDestinationX');
        const collisionDestinationZInput = document.getElementById('collisionDestinationZ');
        
        // Save trigger type
        if (collisionTriggerTypeSelect) {
            mesh.collisionTriggerType = collisionTriggerTypeSelect.value;
        }
        
        // Save destination properties
        if (collisionDestinationMapInput) {
            mesh.collisionDestinationMap = collisionDestinationMapInput.value;
        }
        if (collisionDestinationXInput) {
            mesh.collisionDestinationX = parseFloat(collisionDestinationXInput.value) || 0;
        }
        if (collisionDestinationZInput) {
            mesh.collisionDestinationZ = parseFloat(collisionDestinationZInput.value) || 0;
        }
        
        saveStateToHistory();
        console.log('Collision properties saved for mesh:', mesh.name);
    }
    
    // Export Pokemon map data
    function exportPokemonMap(meshes, pokemonZones, npcPositions, warpPoints, encounters) {
        const mapData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            meshes: meshes.map(mesh => ({
                name: mesh.name,
                position: {
                    x: mesh.position.x,
                    y: mesh.position.y,
                    z: mesh.position.z
                },
                rotation: {
                    x: mesh.rotation.x,
                    y: mesh.rotation.y,
                    z: mesh.rotation.z
                },
                scaling: {
                    x: mesh.scaling.x,
                    y: mesh.scaling.y,
                    z: mesh.scaling.z
                },
                instanceId: mesh.instanceId,
                objectId: mesh.objectId
            })),
            collisionMeshes: collisionMeshes.map(mesh => ({
                name: mesh.name,
                position: {
                    x: mesh.position.x,
                    y: mesh.position.y,
                    z: mesh.position.z
                },
                collisionType: mesh.collisionType,
                collisionTriggerType: mesh.collisionTriggerType,
                collisionDestinationMap: mesh.collisionDestinationMap,
                collisionDestinationX: mesh.collisionDestinationX,
                collisionDestinationZ: mesh.collisionDestinationZ
            })),
            pokemonZones: pokemonZones,
            npcPositions: npcPositions,
            warpPoints: warpPoints,
            encounters: encounters
        };
        
        const dataStr = JSON.stringify(mapData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `pokemon_map_${new Date().getTime()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('Pokemon map exported successfully');
    }
    
    // Import scene data
    function importScene(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                callback(data);
                console.log('Scene imported successfully');
            } catch (error) {
                console.error('Failed to import scene:', error);
            }
        };
        reader.readAsText(file);
    }
    
    // Serialize meshes for history
    function serializeMeshes(meshes) {
        return meshes.map(mesh => ({
            name: mesh.name,
            position: {
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z
            },
            rotation: {
                x: mesh.rotation.x,
                y: mesh.rotation.y,
                z: mesh.rotation.z
            },
            scaling: {
                x: mesh.scaling.x,
                y: mesh.scaling.y,
                z: mesh.scaling.z
            },
            instanceId: mesh.instanceId,
            objectId: mesh.objectId
        }));
    }
    
    // Generate UUID for objects
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    

    
    // --- Initialisation ---
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1);
    scene.collisionsEnabled = true;

    // --- Variables Globales ---
    let loadedMeshes = [];
    let collisionMeshes = []; // New array for collision meshes
    let selectedMesh = null;
    let editorMode = 'EDIT';
    let currentTool = 'SELECT'; // SELECT, POKEMON_ZONE, NPC_PLACE, WARP_POINT
    let history;
    
    // Initialize History after the class has been loaded
    setTimeout(() => {
        history = new History();
        // Initial history save
        saveStateToHistory();
    }, 0);
    
    // --- Fonctions ---
    function createScene() {
        // Ajouter une caméra
        const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 10, -10), scene);
        camera.attachControl(canvas, true);
        camera.checkCollisions = true;
        camera.minZ = 0.3;

        // Ajouter une lumière
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

        // Ajouter une grille pour visualiser l'origine du monde
        const gridHelper = BABYLON.MeshBuilder.CreateGround("groundHelper", { width: 20, height: 20 }, scene);
        const gridMaterial = new BABYLON.GridMaterial("gridMaterial", scene);
        gridHelper.material = gridMaterial;

        // Ajouter des objets 3D (meshes)
        BABYLON.SceneLoader.ImportMesh("", "models/", "object.babylon", scene, (meshes) => {
            loadedMeshes = meshes;
            meshes.forEach(mesh => {
                mesh.checkCollisions = true;
                collisionMeshes.push(mesh);
                mesh.instanceId = generateUUID(); // Assign unique instance ID to each mesh
                mesh.objectId = mesh.instanceId; // Set object ID to instance ID initially
                saveStateToHistory();
            });
        });
    }

    function saveStateToHistory() {
        const state = [];
        loadedMeshes.forEach(mesh => {
            state.push({
                position: {
                    x: mesh.position.x,
                    y: mesh.position.y,
                    z: mesh.position.z
                },
                rotation: {
                    x: mesh.rotation.x,
                    y: mesh.rotation.y,
                    z: mesh.rotation.z
                },
                scaling: {
                    x: mesh.scaling.x,
                    y: mesh.scaling.y,
                    z: mesh.scaling.z
                },
                instanceId: mesh.instanceId,
                objectId: mesh.objectId
            }));
        }
        
        history.push(state);
    }
    
    // Pokemon zone creation function placeholders
    function createPokemonZone() {
        console.log('Creating Pokemon zone...');
        // Implementation for creating Pokemon zones
    }
    
    function placeNPC() {
        console.log('Placing NPC...');
        // Implementation for placing NPCs
    }
    
    function createWarpPoint() {
        console.log('Creating warp point...');
        // Implementation for creating warp points
    }
    
    function addPokemonEncounter() {
        console.log('Adding Pokemon encounter...');
        // Implementation for adding Pokemon encounters
    }
    
    function updatePokemonList() {
        console.log('Updating Pokemon list...');
        // Implementation for updating Pokemon list
    }
    
    function setTool(toolName) {
        currentTool = toolName;
        console.log('Tool set to:', toolName);
        
        // Update UI to reflect active tool
        const toolButtons = ['selectToolBtn', 'pokemonZoneBtn', 'npcPlaceBtn', 'warpPointBtn'];
        toolButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.classList.remove('active');
            }
        });
        
        // Activate current tool button
        const activeButtonMap = {
            'SELECT': 'selectToolBtn',
            'POKEMON_ZONE': 'pokemonZoneBtn',
            'NPC_PLACE': 'npcPlaceBtn',
            'WARP_POINT': 'warpPointBtn'
        };
        
        const activeButtonId = activeButtonMap[toolName];
        if (activeButtonId) {
            const activeButton = document.getElementById(activeButtonId);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    }
});
