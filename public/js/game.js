class GameManager {
    constructor() {
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.player = null;
        this.currentMap = null;
        this.currentMapName = 'matrix1'; // Track current map name
        this.socket = null;
        this.user = null;
        this.isInitialized = false;
        this.otherPlayers = new Map();
        this.teleportPromptShown = false; // Prevent multiple prompts
        this.controlsDisabled = false; // Pour gérer la désactivation des contrôles
        this.disabledBy = new Set(); // Qui a désactivé les contrôles (ex: 'chat', 'battle')
        this.loadingProgress = 0; // Track loading progress
        
        // Fade transition properties
        this.fadePlane = null;
        this.fadeMaterial = null;
        this.isFading = false;
        this.fadeDirection = null; // 'in' or 'out'
        
        // Preloading system
        this.preloadedMaps = new Map(); // Map of preloaded map data
        this.adjacentMaps = new Map(); // Map of adjacent maps for current map
        this.preloadingEnabled = true; // Whether preloading is enabled
        
        // Performance profiling
        this.performanceMetrics = {
            loadingTimes: [], // History of loading times
            assetLoadTimes: new Map(), // Load times for individual assets
            frameRates: [], // Frame rate history
            memoryUsage: [] // Memory usage history
        };
        this.profilingEnabled = true; // Whether profiling is enabled
        this.loadingStartTime = null; // Start time of current loading operation
    }

    async initialize(user, token) {
        this.user = user;
        
        try {
            // Start profiling initialization
            this.startProfiling('Game Initialization');
            
            // Show loading progress
            this.updateLoadingText('Initializing 3D engine...');
            this.updateLoadingProgress(10);
            
            // Initialize Babylon.js
            await this.initializeBabylon();
            this.updateLoadingProgress(30, 'Connecting to server...');
            
            // Initialize socket connection
            await this.initializeSocket(token);
            this.updateLoadingProgress(50, 'Loading map...');
            
            // --- BUG FIX: Load the map defined for the character or default map ---
            // Ensure we use a valid map name and provide detailed logging
            const startMap = this.user.character?.currentMap || 'matrix1';
            console.log(`🗺️ Starting to load map: ${startMap} for user ${this.user.username}`);
            try {
                await this.loadMap(startMap);
                console.log(`✅ Successfully loaded map: ${startMap}`);
            } catch (mapError) {
                console.error(`❌ Failed to load map ${startMap}:`, mapError);
                // Fallback to matrix1 if the character's map fails to load
                if (startMap !== 'matrix1') {
                    console.log(`🔄 Attempting to load fallback map: matrix1`);
                    await this.loadMap('matrix1');
                }
            }
            this.updateLoadingProgress(70, 'Creating player...');
            
            // Create player
            await this.createPlayer();
            this.updateLoadingProgress(80, 'Setting up controls...');
            
            // Setup controls and UI
            this.setupControls();
            this.setupUI();
            this.updateLoadingProgress(90);
            
            // Start the game
            this.startGame();
            this.updateLoadingProgress(100, 'Starting game...');
            
            // End profiling
            this.endProfiling('Game Initialization');
            
        } catch (error) {
            console.error('Game initialization error:', error);
            this.showError('Failed to start game. Please refresh and try again.');
        }
    }

    /**
     * Start performance profiling
     * @param {string} operation - Name of the operation being profiled
     */
    startProfiling(operation) {
        if (!this.profilingEnabled) return;
        
        this.loadingStartTime = performance.now();
        console.log(`⏱️ Starting profiling for: ${operation}`);
    }

    /**
     * End performance profiling and record metrics
     * @param {string} operation - Name of the operation being profiled
     */
    endProfiling(operation) {
        if (!this.profilingEnabled || !this.loadingStartTime) return;
        
        const endTime = performance.now();
        const duration = endTime - this.loadingStartTime;
        
        // Store in performance metrics
        this.performanceMetrics.loadingTimes.push({
            operation: operation,
            duration: duration,
            timestamp: new Date()
        });
        
        console.log(`⏱️ Profiling complete for: ${operation} (${duration.toFixed(2)}ms)`);
        
        // Reset start time
        this.loadingStartTime = null;
    }

    async initializeBabylon() {
        const canvas = document.getElementById('gameCanvas');
        
        // Create engine with WebGL error handling
        this.engine = new BABYLON.Engine(canvas, true, {
            antialias: true,
            adaptToDeviceRatio: true,
            preserveDrawingBuffer: true,
            stencil: true
        });
        
        // Handle WebGL context lost
        this.engine.onContextLostObservable.add(() => {
            console.warn('⚠️ WebGL context lost');
        });
        
        this.engine.onContextRestoredObservable.add(() => {
            console.log('✅ WebGL context restored');
        });
        
        // Create scene with shader validation
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.5, 0.8, 1.0, 1.0); // Sky blue
        
        // Enable shader validation (only if observable exists)
        if (this.scene.onMaterialCompileObservable) {
            this.scene.onMaterialCompileObservable.add((material) => {
                if (!material.isReady()) {
                    console.warn('⚠️ Material not ready:', material.name);
                }
            });
        }
        
        // Handle shader compilation errors (only if observable exists)
        if (this.scene.onShaderCompileObservable) {
            this.scene.onShaderCompileObservable.add((shader) => {
                if (shader.error) {
                    console.error('❌ Shader compilation error:', shader.error);
                }
            });
        }
        
        // Enable physics with fallback
        try {
            if (typeof CANNON !== 'undefined' && CANNON.World && CANNON.Vec3) {
                // Try to create the CannonJS plugin first
                try {
                    const cannonPlugin = new BABYLON.CannonJSPlugin(true, 10, CANNON);
                    this.scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), cannonPlugin);
                    console.log('✅ Physics engine enabled with Cannon.js');
                } catch (pluginError) {
                    console.warn('⚠️ CannonJSPlugin creation failed:', pluginError.message);
                    throw pluginError; // Re-throw to use fallback
                }
            } else {
                // Use Babylon.js built-in physics (Ammo.js fallback)
                console.log('⚠️ CANNON.js not available, using basic collision detection');
                // We'll handle collisions manually without physics engine
                this.useManualCollisions = true;
            }
        } catch (error) {
            console.warn('⚠️ Physics initialization failed, using manual collision detection:', error.message);
            this.useManualCollisions = true;
        }
        
        // Verify physics is enabled before proceeding
        if (!this.scene.isPhysicsEnabled()) {
            console.warn('⚠️ Physics not enabled. Please use scene.enablePhysics(...) before creating impostors.');
            this.useManualCollisions = true;
        }
        
        // Create camera (Pokemon ORAS-style optimized view)
        this.camera = new BABYLON.ArcRotateCamera(
            "playerCamera",
            -Math.PI / 2, // Alpha (horizontal rotation) - directly behind player
            Math.PI / 3.5,  // Beta (50 degrees for authentic ORAS view)
            8,           // Distance - authentic ORAS distance
            BABYLON.Vector3.Zero(),
            this.scene
        );
        
        // Phase 1: Configuration de la caméra ORAS selon TODO
        // "Définir la position initiale : Configure la caméra avec les paramètres suivants pour obtenir la vue 3/4 en plongée typique du style ORAS"
        
        // Cible (target) : BABYLON.Vector3.Zero() au départ - already set above
        
        // Alpha (angle horizontal) : -Math.PI / 2 (regarde droit derrière le joueur)
        this.camera.alpha = -Math.PI / 2;
        
        // Beta (angle vertical) : Math.PI / 3.5 (un angle de ~50 degrés, regardant vers le bas)
        this.camera.beta = Math.PI / 3.5;
        
        // Radius (distance) : 8 (authentic ORAS distance)
        this.camera.radius = 8;
        
        // TODO Correction: Ensure camera always looks at player
        // camera.lockedTarget = player;  // Forces the camera to always look at the player mesh
        // Note: This will be set after player is created
        
        // Pokemon ORAS camera characteristics (optimized for immersive experience)
        this.camera.lowerBetaLimit = Math.PI / 3.5;   // Lock at 50 degrees
        this.camera.upperBetaLimit = Math.PI / 3.5;   // Lock at 50 degrees
        this.camera.lowerRadiusLimit = 8;          // Authentic ORAS distance
        this.camera.upperRadiusLimit = 8;          // Authentic ORAS distance
        this.camera.lowerAlphaLimit = -Math.PI / 2; // Lock horizontal rotation
        this.camera.upperAlphaLimit = -Math.PI / 2; // Lock horizontal rotation
        
        // ORAS smooth movement characteristics (enhanced for cinematic feel)
        this.camera.inertia = 0;                 // No inertia for fixed ORAS camera
        this.camera.angularSensibilityX = 0;     // No rotation for fixed ORAS camera
        this.camera.angularSensibilityY = 0;     // No rotation for fixed ORAS camera
        this.camera.panningSensibility = 0;      // No panning for fixed ORAS camera
        
        // ORAS-style smooth transitions
        this.camera.wheelPrecision = 0;          // No zoom for fixed ORAS camera
        this.camera.pinchPrecision = 0;          // No mobile zoom for fixed ORAS camera
        
        // Enable ORAS camera modes
        this.cameraMode = 'fixed_oras';          // Fixed ORAS view
        this.cameraTransitioning = false;
        this.originalCameraSettings = {
            alpha: this.camera.alpha,
            beta: this.camera.beta,
            radius: this.camera.radius
        };
        
        // ORAS camera following configuration
        this.orasFollowConfig = {
            followSpeed: 0.1,      // Smooth following speed
            targetOffset: new BABYLON.Vector3(0, 1.5, 0), // Look at player center
            maintainDistance: true, // Keep consistent distance
            smoothRotation: true   // Smooth camera transitions
        };
        
        this.camera.setTarget(BABYLON.Vector3.Zero());
        
        // Phase 1: Désactiver les contrôles utilisateur
        // "Désactiver les contrôles utilisateur : Le joueur ne doit pas pouvoir déplacer la caméra. Assure-toi que les contrôles par défaut sont détachés : camera.detachControl()"
        this.camera.detachControl();
        
        // Lighting setup for Pokemon ORAS style
        const hemisphericLight = new BABYLON.HemisphericLight(
            "hemisphericLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        
        hemisphericLight.intensity = 0.8;
        hemisphericLight.diffuse = new BABYLON.Color3(1, 1, 1);
        hemisphericLight.specular = new BABYLON.Color3(1, 1, 1);
        hemisphericLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        
        // Enhanced directional light for ORAS-style shadows
        const directionalLight = new BABYLON.DirectionalLight(
            "directionalLight",
            new BABYLON.Vector3(-1, -1, -1),
            this.scene
        );
        
        directionalLight.intensity = 0.7;
        directionalLight.position = new BABYLON.Vector3(10, 20, 10);
        
        // Enhanced shadow generator for better visual quality (with error handling)
        try {
            const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurScale = 2;
            this.shadowGenerator = shadowGenerator;
        } catch (shadowError) {
            console.warn('⚠️ Shadow generator creation failed:', shadowError.message);
            // Continue without shadows if creation fails
        }
        
        // Environment setup (with error handling)
        try {
            // Add a skybox for a more complete environment
            const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this.scene);
            const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://www.babylonjs-playground.com/textures/skybox", this.scene);
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;
        } catch (environmentError) {
            console.warn('⚠️ Environment setup failed:', environmentError.message);
            // Continue without environment if setup fails
        }
        
        // Register render loop
        this.engine.runRenderLoop(() => {
            if (this.scene) {
                this.scene.render();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.engine) {
                this.engine.resize();
            }
        });
        
        console.log('🎮 Babylon.js engine initialized with ORAS-style camera');
    }

    async initializeSocket(token) {
        return new Promise((resolve, reject) => {
            this.socket = io();
            window.socket = this.socket;
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                
                // Authenticate with server
                this.socket.emit('authenticate', {
                    token: token,
                    user: this.user
                });
            });
            
            this.socket.on('authenticated', (data) => {
                console.log('Authenticated successfully');
                resolve();
            });
            
            this.socket.on('auth_error', (error) => {
                console.error('Authentication error:', error);
                reject(new Error('Authentication failed'));
            });
            
            // Player movement events
            this.socket.on('player_moved', (data) => {
                this.updateOtherPlayer(data);
            });
            
            this.socket.on('player_joined', (data) => {
                this.addOtherPlayer(data);
            });
            
            this.socket.on('player_left', (data) => {
                this.removeOtherPlayer(data.userId);
            });
            
            // Handle other players already in the map
            this.socket.on('other_players', (players) => {
                console.log('Loading existing players:', players.length);
                players.forEach(player => {
                    this.addOtherPlayer(player);
                });
            });
            
            // Battle events
            this.socket.on('battle_action_result', (data) => {
                this.handleBattleActionResult(data);
            });
            
            this.socket.on('battle_update', (data) => {
                this.handleBattleUpdate(data);
            });
            
            this.socket.on('battle_end', (data) => {
                this.handleBattleEnd(data);
            });
            
            // Connection error handling with auto-reconnect
            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                // Auto-reconnect after 2 seconds
                setTimeout(() => {
                    if (!this.socket.connected) {
                        this.socket.connect();
                    }
                }, 2000);
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(new Error('Failed to connect to server'));
            });
        });
    }

    /**
     * Load assets with progress tracking
     * @param {Array} assetConfigs - Array of asset configurations to load
     * @returns {Promise} Promise that resolves when all assets are loaded
     */
    async loadAssetsWithProgress(assetConfigs) {
        return new Promise((resolve, reject) => {
            const assetsManager = new BABYLON.AssetsManager(this.scene);
            let totalAssets = assetConfigs.length;
            let loadedAssets = 0;
            
            // Create tasks for each asset
            assetConfigs.forEach((config, index) => {
                let task;
                
                switch(config.type) {
                    case 'mesh':
                        task = assetsManager.addMeshTask(`meshTask_${index}`, config.rootUrl || "", config.sceneFilename, config.path);
                        break;
                    case 'texture':
                        task = assetsManager.addTextureTask(`textureTask_${index}`, config.url);
                        break;
                    case 'binary':
                        task = assetsManager.addBinaryFileTask(`binaryTask_${index}`, config.url);
                        break;
                    default:
                        console.warn(`Unknown asset type: ${config.type}`);
                        return;
                }
                
                // Set up success callback
                task.onSuccess = (task) => {
                    loadedAssets++;
                    const progress = Math.floor((loadedAssets / totalAssets) * 100);
                    this.updateLoadingProgress(30 + Math.floor(progress * 0.4), `Loading assets: ${loadedAssets}/${totalAssets}`);
                    console.log(`✅ Loaded asset: ${config.path || config.url}`);
                };
                
                // Set up error callback
                task.onError = (task, message, exception) => {
                    console.error(`❌ Error loading asset:`, config.path || config.url, message, exception);
                };
            });
            
            // Set up completion callback
            assetsManager.onFinish = (tasksSuccess, tasksError) => {
                if (tasksError.length > 0) {
                    console.error(`❌ Failed to load ${tasksError.length} assets`);
                    reject(new Error(`Failed to load ${tasksError.length} assets`));
                } else {
                    console.log(`✅ All ${totalAssets} assets loaded successfully`);
                    resolve();
                }
            };
            
            // Start loading
            assetsManager.load();
        });
    }

    // ORAS Dynamic Camera System
    triggerCinematicView(target = null, duration = 2000) {
        if (this.cameraTransitioning) return;
        
        this.cameraTransitioning = true;
        this.cameraMode = 'cinematic';
        
        // Store current camera position
        this.originalCameraSettings = {
            alpha: this.camera.alpha,
            beta: this.camera.beta,
            radius: this.camera.radius,
            target: this.camera.getTarget().clone()
        };
        
        // ORAS cinematic zoom-in
        const cinematicSettings = {
            alpha: this.camera.alpha + (Math.random() - 0.5) * 0.3, // Slight angle variation
            beta: Math.PI / 4, // Lower angle for dramatic effect
            radius: 6 // Close-up like ORAS cities
        };
        
        // Smooth transition to cinematic view
        this.animateCameraTransition(cinematicSettings, duration / 2);
        
        // Return to normal after duration
        setTimeout(() => {
            this.returnToNormalView(duration / 2);
        }, duration);
    }
    
    triggerFirstPersonView() {
        if (this.cameraTransitioning) return;
        
        this.cameraTransitioning = true;
        this.cameraMode = 'first_person';
        
        // Store current settings
        this.originalCameraSettings = {
            alpha: this.camera.alpha,
            beta: this.camera.beta,
            radius: this.camera.radius,
            target: this.camera.getTarget().clone()
        };
        
        // First-person camera settings (like Pokemon Center counter view)
        const firstPersonSettings = {
            alpha: this.camera.alpha,
            beta: Math.PI / 2.1, // Almost horizontal view
            radius: 2 // Very close
        };
        
        this.animateCameraTransition(firstPersonSettings, 1000);
        
        console.log('🎥 First-person view activated (press C again to exit)');
    }
    
    returnToNormalView(duration = 1000) {
        if (!this.originalCameraSettings) return;
        
        this.animateCameraTransition(this.originalCameraSettings, duration);
        
        setTimeout(() => {
            this.cameraMode = 'normal';
            this.cameraTransitioning = false;
        }, duration);
    }
    
    animateCameraTransition(targetSettings, duration) {
        // Smooth camera transitions using Babylon.js animations
        const frameRate = 60;
        const totalFrames = (duration / 1000) * frameRate;
        
        // Alpha animation
        const alphaAnimation = BABYLON.Animation.CreateAndStartAnimation(
            "cameraAlpha",
            this.camera,
            "alpha",
            frameRate,
            totalFrames,
            this.camera.alpha,
            targetSettings.alpha,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            new BABYLON.CubicEase(),
            () => {}
        );
        
        // Beta animation
        const betaAnimation = BABYLON.Animation.CreateAndStartAnimation(
            "cameraBeta",
            this.camera,
            "beta",
            frameRate,
            totalFrames,
            this.camera.beta,
            targetSettings.beta,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            new BABYLON.CubicEase(),
            () => {}
        );
        
        // Radius animation
        const radiusAnimation = BABYLON.Animation.CreateAndStartAnimation(
            "cameraRadius",
            this.camera,
            "radius",
            frameRate,
            totalFrames,
            this.camera.radius,
            targetSettings.radius,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            new BABYLON.CubicEase(),
            () => {}
        );
    }
    
    setupORAScameraControls() {
        // ORAS-style camera controls with comprehensive error handling
        window.addEventListener('keydown', (event) => {
            // Comprehensive safety checks
            if (!event) {
                console.warn('Camera control event is undefined');
                return;
            }
            
            // Check if event has either key or code property
            if (!event.key && !event.code) {
                return; // Skip silently instead of logging warning
            }
            
            // Use code as primary identifier, fall back to key
            let keyIdentifier = event.code;
            if (!keyIdentifier && event.key && typeof event.key === 'string') {
                keyIdentifier = event.key.toLowerCase();
            }
            
            if (!keyIdentifier) {
                console.warn('No valid key identifier found');
                return;
            }
            
            switch(keyIdentifier) {
                case 'KeyC':
                case 'c': // Toggle first-person view
                    if (this.cameraMode === 'first_person') {
                        this.returnToNormalView();
                    } else if (this.cameraMode === 'normal') {
                        this.triggerFirstPersonView();
                    }
                    break;
                    
                case 'KeyV':
                case 'v': // Trigger cinematic view
                    if (this.cameraMode === 'normal') {
                        this.triggerCinematicView();
                    }
                    break;
                    
                case 'KeyR':
                case 'r': // Reset camera to optimal ORAS angle
                    if (this.cameraMode === 'normal') {
                        this.resetToORASAngle();
                    }
                    break;
            }
        });
    }
    
    /**
     * Apply ORAS camera settings to a camera
     * @param {BABYLON.Camera} camera - The camera to apply settings to
     */
    applyORASCameraSettings(camera) {
        if (!camera || !(camera instanceof BABYLON.ArcRotateCamera)) {
            console.warn('Cannot apply ORAS settings to non-ArcRotateCamera');
            return;
        }
        
        // Apply ORAS camera characteristics (optimized for immersive experience)
        camera.lowerBetaLimit = Math.PI / 4;   // Lock at 45 degrees
        camera.upperBetaLimit = Math.PI / 4;   // Lock at 45 degrees
        camera.lowerRadiusLimit = 25;          // Increased distance for matrix1 map
        camera.upperRadiusLimit = 25;          // Increased distance for matrix1 map
        camera.lowerAlphaLimit = -Math.PI / 2; // Lock horizontal rotation
        camera.upperAlphaLimit = -Math.PI / 2; // Lock horizontal rotation
        
        // ORAS smooth movement characteristics (enhanced for cinematic feel)
        camera.inertia = 0;                 // No inertia for fixed ORAS camera
        camera.angularSensibilityX = 0;     // No rotation for fixed ORAS camera
        camera.angularSensibilityY = 0;     // No rotation for fixed ORAS camera
        camera.panningSensibility = 0;      // No panning for fixed ORAS camera
        
        // ORAS-style smooth transitions
        camera.wheelPrecision = 0;          // No zoom for fixed ORAS camera
        camera.pinchPrecision = 0;          // No mobile zoom for fixed ORAS camera
        
        // Set the camera target to follow the player
        if (this.player) {
            camera.setTarget(this.player.position.add(new BABYLON.Vector3(0, 1.5, 0)));
        }
        
        console.log('✅ Applied ORAS camera settings to map camera');
    }

    resetToORASAngle() {
        const orasSettings = {
            alpha: -Math.PI / 2,
            beta: Math.PI / 4,  // Changed from Math.PI / 3.5 to Math.PI / 4 for consistency
            radius: 25          // Changed from 8 to 25 for consistency with ORAS settings
        };
        
        this.animateCameraTransition(orasSettings, 1000);
        console.log('🎥 Camera reset to optimal ORAS angle');
    }
    
    showCameraInstructions() {
        // Debug overlay removed as requested - was causing issues
        console.log('📷 Camera controls available: C (first-person), V (cinematic), R (reset)');
    }

    /**
     * Define adjacent maps for preloading
     * @param {string} currentMap - Current map name
     * @returns {Array} Array of adjacent map names
     */
    getAdjacentMaps(currentMap) {
        const adjacencyMap = {
            'house_inside': ['drewfort'],
            'drewfort': ['house_inside', 'fortree_city'],
            'fortree_city': ['drewfort', 'slateport_city'],
            'slateport_city': ['fortree_city', 'sootopolis_city'],
            'sootopolis_city': ['slateport_city'],
            'matrix': ['drewfort']
        };
        
        return adjacencyMap[currentMap] || [];
    }
    
    /**
     * Preload adjacent maps
     * @param {string} currentMap - Current map name
     */
    async preloadAdjacentMaps(currentMap) {
        if (!this.preloadingEnabled) return;
        
        const adjacentMaps = this.getAdjacentMaps(currentMap);
        console.log(`🗺️ Preloading adjacent maps for ${currentMap}:`, adjacentMaps);
        
        // Preload each adjacent map
        for (const mapName of adjacentMaps) {
            try {
                // Skip if already preloaded
                if (this.preloadedMaps.has(mapName)) {
                    console.log(`⏭️ Map ${mapName} already preloaded, skipping`);
                    continue;
                }
                
                // Define map configurations
                const mapConfigs = {
                    'house_inside': {
                        path: `/pokemon-map-editor/assets/maps/male_house_inside/house.glb`
                    },
                    'drewfort': {
                        path: `/pokemon-map-editor/assets/maps/Drewfort/drewfort.glb`
                    },
                    'fortree_city': {
                        path: `/pokemon-map-editor/assets/maps/Fortree City/fortree.glb`
                    },
                    'slateport_city': {
                        path: `/pokemon-map-editor/assets/maps/Slateport City/Slateport City.glb`
                    },
                    'sootopolis_city': {
                        path: `/pokemon-map-editor/assets/maps/Sootopolis City/Sootopolis City.glb`
                    },
                    'matrix': {
                        path: `/pokemon-map-editor/assets/maps/perso/matrix/matrix1.glb`
                    }
                };
                
                const mapConfig = mapConfigs[mapName];
                if (!mapConfig) {
                    console.warn(`⚠️ No configuration found for map: ${mapName}`);
                    continue;
                }
                
                console.log(`📥 Preloading map: ${mapName}`);
                
                // Use fetch API to download the map file without parsing it
                const response = await fetch(mapConfig.path);
                if (!response.ok) {
                    throw new Error(`Failed to fetch map ${mapName}: ${response.status} ${response.statusText}`);
                }
                
                // Get the array buffer
                const arrayBuffer = await response.arrayBuffer();
                
                // Store preloaded data
                this.preloadedMaps.set(mapName, {
                    data: arrayBuffer,
                    timestamp: Date.now(),
                    size: arrayBuffer.byteLength
                });
                
                console.log(`✅ Preloaded map ${mapName} (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
                
                // Update adjacent maps tracking
                this.adjacentMaps.set(mapName, this.getAdjacentMaps(mapName));
                
            } catch (error) {
                console.error(`❌ Failed to preload map ${mapName}:`, error);
            }
        }
    }
    
    /**
     * Clear old preloaded maps to free memory
     * @param {number} maxAge - Maximum age in milliseconds (default 5 minutes)
     */
    clearOldPreloadedMaps(maxAge = 5 * 60 * 1000) {
        const now = Date.now();
        let clearedCount = 0;
        
        for (const [mapName, mapData] of this.preloadedMaps.entries()) {
            if (now - mapData.timestamp > maxAge) {
                this.preloadedMaps.delete(mapName);
                clearedCount++;
                console.log(`🗑️ Cleared old preloaded map: ${mapName}`);
            }
        }
        
        if (clearedCount > 0) {
            console.log(`🧹 Cleared ${clearedCount} old preloaded maps`);
        }
    }
    
    /**
     * Get preloaded map data
     * @param {string} mapName - Name of the map
     * @returns {ArrayBuffer|null} Preloaded map data or null if not available
     */
    getPreloadedMapData(mapName) {
        const mapData = this.preloadedMaps.get(mapName);
        return mapData ? mapData.data : null;
    }
    
    /**
     * Check if a map is preloaded
     * @param {string} mapName - Name of the map
     * @returns {boolean} Whether the map is preloaded
     */
    isMapPreloaded(mapName) {
        return this.preloadedMaps.has(mapName);
    }

    async loadMap(mapName) {
        try {
            // Start profiling map loading
            this.startProfiling(`Load Map: ${mapName}`);
            
            // Clear existing map and collision meshes
            if (this.currentMap) {
                this.currentMap.dispose();
            }
            if (this.currentCollisionMeshes) {
                this.currentCollisionMeshes.forEach(mesh => mesh.dispose());
                this.currentCollisionMeshes = [];
            }
            
            // Define map configurations
            const mapConfigs = {
                'house_inside': {
                    path: `/pokemon-map-editor/assets/maps/male_house_inside/house.glb`,
                    rotation: Math.PI // 180 degrees rotation to face the proper direction
                },
                'drewfort': {
                    path: `/pokemon-map-editor/assets/maps/Drewfort/drewfort.glb`
                },
                'fortree_city': {
                    path: `/pokemon-map-editor/assets/maps/Fortree City/Fortree City.glb`
                },
                'slateport_city': {
                    path: `/pokemon-map-editor/assets/maps/Slateport City/Slateport City.glb`
                },
                'sootopolis_city': {
                    path: `/pokemon-map-editor/assets/maps/Sootopolis City/Sootopolis City.glb`
                },
                'shoal_cave_entrance_low': {
                    path: `/pokemon-map-editor/assets/maps/Shoal cave/Entrance Room (Low Tide).glb`
                },
                'shoal_cave_ice_room': {
                    path: `/pokemon-map-editor/assets/maps/Shoal cave/Ice Room.glb`
                },
                'granite_cave': {
                    path: `/pokemon-map-editor/assets/maps/Granite Cave Origin Room/Granite Cave Origin Room.glb`
                },
                'fallarbor_town': {
                    path: `/pokemon-map-editor/assets/maps/Fallarbor Town/Fallarbor Town.glb`
                },
                'castle_village': {
                    path: `/pokemon-map-editor/assets/maps/castle village/castle_village_scene.glb`
                },
                'soaring_overworld': {
                    path: `/pokemon-map-editor/assets/maps/soaring overworld/soaring.glb`
                },
                'lavaridge_town': {
                    path: `/pokemon-map-editor/assets/maps/Lavaridge Town/Lavaridge Town.glb`
                },
                'matrix': {
                    path: `/pokemon-map-editor/assets/maps/perso/matrix/matrix1.glb`,
                    collisionPath: `/pokemon-map-editor/assets/maps/perso/matrix/matrix1_collision.glb`,
                    rotation: -Math.PI / 2, // 90 degrees LEFT rotation
                    isLargeMap: true
                },
                'matrix1': {
                    path: `/pokemon-map-editor/assets/maps/perso/matrix/matrix1.glb`,
                    collisionPath: `/pokemon-map-editor/assets/maps/perso/matrix/matrix1_collision.glb`,
                    rotation: -Math.PI / 2, // 90 degrees LEFT rotation
                    isLargeMap: true,
                    cameraSettings: {
                        alpha: -Math.PI / 2,
                        beta: Math.PI / 4,
                        radius: 25
                    }
                }
            };
            
            // Get map configuration or use default
            const mapConfig = mapConfigs[mapName] || mapConfigs['house_inside'];
            
            console.log(`🗺️ Loading map: ${mapName}`);
            if (mapConfig.collisionPath) {
                console.log(`🔒 Map has separate collision file: ${mapConfig.collisionPath}`);
            }
            
            // Update loading progress
            this.updateLoadingProgress(55, `Loading map: ${mapName}...`);
            
            // Check if map is preloaded
            let mapData = this.getPreloadedMapData(mapName);
            let usePreloaded = false;
            
            if (mapData) {
                console.log(`⚡ Using preloaded map data for ${mapName}`);
                usePreloaded = true;
                this.updateLoadingProgress(60, `Using preloaded data...`);
            }
            
            // Use incremental loading with SceneLoader.Append for better performance
            const loadStartTime = performance.now();
            const result = await new Promise((resolve, reject) => {
                if (usePreloaded && mapData) {
                    // Load from preloaded data
                    const blob = new Blob([mapData], { type: 'model/gltf-binary' });
                    const url = URL.createObjectURL(blob);
                    
                    const assetLoadStartTime = performance.now();
                    BABYLON.SceneLoader.ImportMesh(
                        null, 
                        "", 
                        url, 
                        this.scene,
                        (meshes, particleSystems, skeletons, animationGroups, transformNodes, geometries, lights, cameras) => {
                            const assetLoadTime = performance.now() - assetLoadStartTime;
                            URL.revokeObjectURL(url);
                            console.log(`✅ Preloaded map loaded: ${meshes.length} meshes, ${cameras.length} cameras`);
                            this.recordAssetLoadTime(`${mapName} (preloaded)`, assetLoadTime);
                            resolve({ loadedMeshes: meshes, loadedCameras: cameras });
                        },
                        null,
                        (scene, message, exception) => {
                            URL.revokeObjectURL(url);
                            console.error(`❌ Error loading preloaded map:`, message, exception);
                            reject(new Error(`Failed to load preloaded map: ${message}`));
                        },
                        ".glb"
                    );
                } else {
                    // Load normally
                    const assetsManager = new BABYLON.AssetsManager(this.scene);
                    
                    // Add main map as a mesh task
                    console.log(`🔍 Loading map from path: ${mapConfig.path}`);
                    const meshTask = assetsManager.addMeshTask("mapTask", "", mapConfig.path, "");
                    
                    meshTask.onSuccess = (task) => {
                        const assetLoadTime = performance.now() - loadStartTime;
                        console.log(`✅ Main map loaded: ${task.loadedMeshes.length} meshes`);
                        // Asset load time recorded: ${assetLoadTime}ms
                        resolve(task);
                    };
                    
                    meshTask.onError = (task, message, exception) => {
                        console.error(`❌ Error loading main map:`, message, exception);
                        console.error(`❌ Failed path: ${mapConfig.path}`);
                        console.error(`❌ Map name: ${mapName}`);
                        reject(new Error(`Failed to load main map: ${message}`));
                    };
                    
                    // Start loading
                    assetsManager.load();
                }
            });
            
            if (result.loadedMeshes.length > 0) {
                this.currentMap = result.loadedMeshes[0];
                this.currentMapName = mapName;
                
                // Apply map-specific transformations
                if (mapConfig.rotation) {
                    result.loadedMeshes.forEach(mesh => {
                        if (mesh.name !== '__root__') {
                            mesh.rotation.y = mapConfig.rotation;
                        }
                    });
                    console.log(`🔄 Applied rotation to ${mapName}`);
                }
                
                // Find and set camera from loaded assets
                let mapCamera = null;
                if (result.loadedCameras && result.loadedCameras.length > 0) {
                    // Look for a camera with a specific name first
                    mapCamera = result.loadedCameras.find(camera => 
                        camera.name && (camera.name.includes('MapCamera') || camera.name.includes('mapCamera'))
                    );
                    
                    // If no specific camera found, use the first one
                    if (!mapCamera && result.loadedCameras.length > 0) {
                        mapCamera = result.loadedCameras[0];
                        console.log(`📷 Using first camera from map: ${mapCamera.name}`);
                    }
                }
                
                // If we found a camera in the map, use it
                if (mapCamera) {
                    console.log(`📷 Found camera in map: ${mapCamera.name}`);
                    this.camera = mapCamera;
                    this.scene.activeCamera = mapCamera;
                    
                    // Apply ORAS camera settings to maintain consistent gameplay experience
                    this.applyORASCameraSettings(mapCamera);
                    
                    // Update player controller with new camera if it exists
                    if (this.playerController) {
                        this.playerController.updateCamera(mapCamera);
                    }
                } else {
                    console.log('📷 No camera found in map, using default ORAS camera');
                    // Keep using the default ORAS camera that was set up during initialization
                    // Apply specific camera settings for matrix1 map if needed
                    if (mapConfig.cameraSettings && this.camera) {
                        this.camera.alpha = mapConfig.cameraSettings.alpha;
                        this.camera.beta = mapConfig.cameraSettings.beta;
                        this.camera.radius = mapConfig.cameraSettings.radius;
                        console.log('🔧 Applied specific camera settings for matrix1 map');
                    }
                }
                
                // Update loading progress
                this.updateLoadingProgress(65, 'Setting up collisions...');
                
                // Load separate collision file if specified
                if (mapConfig.collisionPath) {
                    await this.loadCollisionMeshes(mapConfig.collisionPath);
                } else {
                    // Setup collision and interaction for regular maps
                    this.setupMapCollisions(result.loadedMeshes);
                }
                
                // Add invisible walls around the map perimeter to prevent escape
                this.createMapBoundaries();
                
                // Start preloading adjacent maps
                if (this.preloadingEnabled) {
                    setTimeout(() => {
                        this.preloadAdjacentMaps(mapName);
                    }, 1000); // Delay to ensure current map is fully loaded
                }
                
                console.log(`✅ Map loaded successfully: ${mapName}`);
                this.updateLoadingProgress(75, 'Map loaded successfully');
            } else {
                throw new Error('No meshes found in map file');
            }
            
            // End profiling
            this.endProfiling(`Load Map: ${mapName}`);
            
        } catch (error) {
            console.error('Map loading error:', error);
            
            // Create fallback environment
            this.createFallbackEnvironment();
        }
    }
    
    /**
     * Load map with incremental loading using SceneLoader.Append
     * @param {string} mapName - Name of the map to load
     */
    async loadMapIncremental(mapName) {
        try {
            // Clear existing map and collision meshes
            if (this.currentMap) {
                this.currentMap.dispose();
            }
            if (this.currentCollisionMeshes) {
                this.currentCollisionMeshes.forEach(mesh => mesh.dispose());
                this.currentCollisionMeshes = [];
            }
            
            // Define map configurations
            const mapConfigs = {
                'house_inside': {
                    path: `/pokemon-map-editor/assets/maps/male_house_inside/house.glb`,
                    rotation: Math.PI // 180 degrees rotation to face the proper direction
                },
                'drewfort': {
                    path: `/pokemon-map-editor/assets/maps/Drewfort/drewfort.glb`
                },
                'matrix': {
                    path: `/pokemon-map-editor/assets/maps/perso/matrix/matrix1.glb`,
                    collisionPath: `/pokemon-map-editor/assets/maps/perso/matrix/matrix1_collision.glb`,
                    rotation: -Math.PI / 2, // 90 degrees LEFT rotation
                    isLargeMap: true
                }
            };
            
            // Get map configuration or use default
            const mapConfig = mapConfigs[mapName] || mapConfigs['house_inside'];
            
            console.log(`🗺️ Incrementally loading map: ${mapName}`);
            
            // Update loading progress
            this.updateLoadingProgress(55, `Loading map: ${mapName}...`);
            
            // Use SceneLoader.Append for incremental loading
            const result = await new Promise((resolve, reject) => {
                let loadedMeshes = [];
                let loadedMaterials = [];
                let loadedTextures = [];
                let loadedSkeletons = [];
                
                // Progress tracking
                let totalTasks = 0;
                let completedTasks = 0;
                
                // Callback for when each asset is loaded
                const onAssetLoaded = () => {
                    completedTasks++;
                    const progress = 55 + Math.floor((completedTasks / Math.max(totalTasks, 1)) * 10);
                    this.updateLoadingProgress(progress, `Loading assets: ${completedTasks}/${totalTasks}`);
                };
                
                // Append the scene incrementally
                BABYLON.SceneLoader.Append(
                    "", 
                    mapConfig.path, 
                    this.scene,
                    (scene) => {
                        // Success callback
                        console.log(`✅ Map appended successfully: ${mapName}`);
                        resolve({
                            meshes: loadedMeshes,
                            materials: loadedMaterials,
                            textures: loadedTextures,
                            skeletons: loadedSkeletons
                        });
                    },
                    (progress) => {
                        // Progress callback
                        if (progress.lengthComputable) {
                            const percentComplete = (progress.loaded / progress.total) * 100;
                            this.updateLoadingProgress(55 + Math.floor(percentComplete * 0.2), `Downloading: ${Math.round(percentComplete)}%`);
                        }
                    },
                    (scene, message, exception) => {
                        // Error callback
                        console.error(`❌ Error appending map:`, message, exception);
                        reject(new Error(`Failed to append map: ${message}`));
                    },
                    ".glb"
                );
            });
            
            // Process loaded assets
            if (result.meshes && result.meshes.length > 0) {
                this.currentMap = result.meshes[0];
                this.currentMapName = mapName;
                
                // Apply map-specific transformations
                if (mapConfig.rotation) {
                    result.meshes.forEach(mesh => {
                        if (mesh.name !== '__root__') {
                            mesh.rotation.y = mapConfig.rotation;
                        }
                    });
                    console.log(`🔄 Applied rotation to ${mapName}`);
                }
                
                // Update loading progress
                this.updateLoadingProgress(75, 'Setting up collisions...');
                
                // Load separate collision file if specified
                if (mapConfig.collisionPath) {
                    await this.loadCollisionMeshesIncremental(mapConfig.collisionPath);
                } else {
                    // Setup collision and interaction for regular maps
                    this.setupMapCollisions(result.meshes);
                }
                
                // Add invisible walls around the map perimeter to prevent escape
                this.createMapBoundaries();
                
                console.log(`✅ Map loaded successfully: ${mapName}`);
                this.updateLoadingProgress(85, 'Map loaded successfully');
            } else {
                throw new Error('No meshes found in map file');
            }
            
        } catch (error) {
            console.error('Map loading error:', error);
            
            // Create fallback environment
            this.createFallbackEnvironment();
        }
    }
    
    async loadCollisionMeshes(collisionPath) {
        try {
            console.log(`🔒 Loading collision meshes from: ${collisionPath}`);
            
            // Try ImportMeshAsync with proper path handling
            try {
                // First try with direct path
                const collisionResult = await BABYLON.SceneLoader.ImportMeshAsync(
                    null,
                    "",
                    collisionPath,
                    this.scene
                );
                
                if (collisionResult.meshes.length > 0) {
                    this.currentCollisionMeshes = collisionResult.meshes;
                    this.setupCollisionMeshes(collisionResult.meshes);
                    console.log(`✅ Collision meshes loaded: ${collisionResult.meshes.length} meshes`);
                    return;
                }
            } catch (firstError) {
                console.log(`⚠️ First attempt to load collision meshes failed: ${firstError.message}`);
                console.log(`🔄 Trying alternative path format...`);
                
                // Try with rootUrl and sceneFilename separated
                try {
                    const lastSlash = collisionPath.lastIndexOf('/');
                    const rootUrl = collisionPath.substring(0, lastSlash + 1);
                    const fileName = collisionPath.substring(lastSlash + 1);
                    
                    console.log(`🔍 Trying with rootUrl: ${rootUrl}, fileName: ${fileName}`);
                    
                    const collisionResult = await BABYLON.SceneLoader.ImportMeshAsync(
                        null,
                        rootUrl,
                        fileName,
                        this.scene
                    );
                    
                    if (collisionResult.meshes.length > 0) {
                        this.currentCollisionMeshes = collisionResult.meshes;
                        this.setupCollisionMeshes(collisionResult.meshes);
                        console.log(`✅ Collision meshes loaded with alternative method: ${collisionResult.meshes.length} meshes`);
                        return;
                    }
                } catch (secondError) {
                    throw new Error(`Both loading methods failed: ${firstError.message} | ${secondError.message}`);
                }
            }
        } catch (error) {
            console.error('Collision loading error:', error);
            console.log('⚠️ Continuing without separate collision meshes');
        }
    }
    
    setupCollisionMeshes(meshes) {
        // Setup collision properties
        meshes.forEach(mesh => {
            if (mesh.name !== '__root__') {
                // Make collision meshes invisible but solid
                mesh.visibility = 0;
                mesh.checkCollisions = true;
                
                // Check for special interaction meshes
                if (mesh.name.toLowerCase().includes('stair') || 
                    mesh.name.toLowerCase().includes('escalier') ||
                    mesh.name.toLowerCase().includes('teleport')) {
                    
                    mesh.checkCollisions = false;
                    this.setupStairTeleport(mesh);
                } else {
                    // Setup physics for collision
                    if (!this.useManualCollisions) {
                        try {
                            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                                mesh,
                                BABYLON.PhysicsImpostor.MeshImpostor,
                                { mass: 0, restitution: 0 },
                                this.scene
                            );
                        } catch (error) {
                            console.warn('Collision physics impostor creation failed for mesh:', mesh.name);
                        }
                    }
                }
            }
        });
    }
    /**
     * Load collision meshes incrementally
     * @param {string} collisionPath - Path to collision file
     */
    async loadCollisionMeshesIncremental(collisionPath) {
        try {
            console.log(`🔒 Incrementally loading collision meshes from: ${collisionPath}`);
            
            const collisionResult = await new Promise((resolve, reject) => {
                let loadedMeshes = [];
                
                BABYLON.SceneLoader.Append(
                    "", 
                    collisionPath, 
                    this.scene,
                    (scene) => {
                        // Success callback
                        console.log(`✅ Collision meshes appended successfully`);
                        resolve({ meshes: loadedMeshes });
                    },
                    (progress) => {
                        // Progress callback
                        if (progress.lengthComputable) {
                            const percentComplete = (progress.loaded / progress.total) * 100;
                            this.updateLoadingProgress(80 + Math.floor(percentComplete * 0.1), `Loading collisions: ${Math.round(percentComplete)}%`);
                        }
                    },
                    (scene, message, exception) => {
                        // Error callback
                        console.error(`❌ Error appending collision meshes:`, message, exception);
                        reject(new Error(`Failed to append collision meshes: ${message}`));
                    },
                    ".glb"
                );
            });
            
            if (collisionResult.meshes.length > 0) {
                this.currentCollisionMeshes = collisionResult.meshes;
                
                // Setup collision properties
                collisionResult.meshes.forEach(mesh => {
                    if (mesh.name !== '__root__') {
                        // Make collision meshes invisible but solid
                        mesh.visibility = 0;
                        mesh.checkCollisions = true;
                        
                        // Check for special interaction meshes
                        if (mesh.name.toLowerCase().includes('stair') || 
                            mesh.name.toLowerCase().includes('escalier') ||
                            mesh.name.toLowerCase().includes('teleport')) {
                            
                            mesh.checkCollisions = false;
                            this.setupStairTeleport(mesh);
                        } else {
                            // Setup physics for collision
                            if (!this.useManualCollisions) {
                                try {
                                    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                                        mesh,
                                        BABYLON.PhysicsImpostor.MeshImpostor,
                                        { mass: 0, restitution: 0 },
                                        this.scene
                                    );
                                } catch (error) {
                                    console.warn('Collision physics impostor creation failed for mesh:', mesh.name);
                                }
                            }
                        }
                    }
                });
                
                console.log(`✅ Collision meshes loaded: ${collisionResult.meshes.length} meshes`);
            }
            
        } catch (error) {
            console.error('Collision loading error:', error);
            console.log('⚠️ Continuing without separate collision meshes');
        }
    }
    
    setupMapCollisions(meshes) {
        // Setup collision and interaction for maps without separate collision files
        meshes.forEach(mesh => {
            if (mesh.name !== '__root__') {
                // Enable collisions for all meshes (walls, floors, etc.)
                mesh.checkCollisions = true;
                
                // Special handling for stairs/teleporters
                if (mesh.name.toLowerCase().includes('stair') || 
                    mesh.name.toLowerCase().includes('escalier') ||
                    mesh.name.toLowerCase().includes('teleport')) {
                    
                    // Make stairs interactable but not solid
                    mesh.checkCollisions = false;
                    this.setupStairTeleport(mesh);
                } else {
                    // Regular collision for walls, furniture, etc.
                    if (!this.useManualCollisions) {
                        try {
                            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                                mesh,
                                BABYLON.PhysicsImpostor.MeshImpostor,
                                { mass: 0, restitution: 0 },
                                this.scene
                            );
                        } catch (error) {
                            console.warn('Physics impostor creation failed for mesh:', mesh.name);
                        }
                    }
                }
            }
        });
    }

    createFallbackEnvironment() {
        console.log('Creating fallback environment due to map loading failure');
        
        // Update loading indicator
        document.getElementById('currentMap').textContent = 'Error: Failed to load map';
        
        // Create a simple room
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, this.scene);
        ground.checkCollisions = true;
        
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.4);
        ground.material = groundMaterial;
        
        // Create a visible error indicator
        const errorSign = BABYLON.MeshBuilder.CreatePlane("errorSign", {width: 8, height: 4}, this.scene);
        errorSign.position = new BABYLON.Vector3(0, 3, 0);
        const errorMaterial = new BABYLON.StandardMaterial("errorMaterial", this.scene);
        errorMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        errorMaterial.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
        errorSign.material = errorMaterial;
        
        // Create walls
        const wallHeight = 5;
        const wallThickness = 0.5;
        
        const walls = [
            { name: "northWall", size: [20, wallHeight, wallThickness], position: [0, wallHeight/2, 10] },
            { name: "southWall", size: [20, wallHeight, wallThickness], position: [0, wallHeight/2, -10] },
            { name: "eastWall", size: [wallThickness, wallHeight, 20], position: [10, wallHeight/2, 0] },
            { name: "westWall", size: [wallThickness, wallHeight, 20], position: [-10, wallHeight/2, 0] }
        ];
        
        walls.forEach(wall => {
            const wallMesh = BABYLON.MeshBuilder.CreateBox(wall.name, {
                width: wall.size[0],
                height: wall.size[1],
                depth: wall.size[2]
            }, this.scene);
            
            wallMesh.position = new BABYLON.Vector3(wall.position[0], wall.position[1], wall.position[2]);
            wallMesh.checkCollisions = true;
            
            const wallMaterial = new BABYLON.StandardMaterial(wall.name + "Material", this.scene);
            wallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.6);
            wallMesh.material = wallMaterial;
        });
    }
    
    createMapBoundaries() {
        // Create invisible collision walls around the map to prevent escape
        const boundarySize = 100; // Large boundary
        const wallHeight = 10;
        const wallThickness = 1;
        
        const boundaries = [
            { name: "northBoundary", size: [boundarySize, wallHeight, wallThickness], position: [0, wallHeight/2, boundarySize/2] },
            { name: "southBoundary", size: [boundarySize, wallHeight, wallThickness], position: [0, wallHeight/2, -boundarySize/2] },
            { name: "eastBoundary", size: [wallThickness, wallHeight, boundarySize], position: [boundarySize/2, wallHeight/2, 0] },
            { name: "westBoundary", size: [wallThickness, wallHeight, boundarySize], position: [-boundarySize/2, wallHeight/2, 0] }
        ];
        
        boundaries.forEach(boundary => {
            const boundaryMesh = BABYLON.MeshBuilder.CreateBox(boundary.name, {
                width: boundary.size[0],
                height: boundary.size[1],
                depth: boundary.size[2]
            }, this.scene);
            
            boundaryMesh.position = new BABYLON.Vector3(boundary.position[0], boundary.position[1], boundary.position[2]);
            boundaryMesh.checkCollisions = true;
            
            // Make boundaries invisible but solid
            boundaryMesh.visibility = 0;
            
            // Add physics for solid collision
            if (!this.useManualCollisions) {
                try {
                    boundaryMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                        boundaryMesh,
                        BABYLON.PhysicsImpostor.BoxImpostor,
                        { mass: 0, restitution: 0 },
                        this.scene
                    );
                } catch (error) {
                    console.warn('Boundary physics impostor creation failed:', error.message);
                }
            }
        });
        
        console.log('Map boundaries created to prevent escape');
    }
    
    setupStairTeleport(stairMesh) {
        // Create trigger zone around stairs for teleportation
        const triggerZone = BABYLON.MeshBuilder.CreateBox("stairTrigger_" + stairMesh.name, {
            width: 3,
            height: 4,
            depth: 3
        }, this.scene);
        
        triggerZone.position = stairMesh.position.clone();
        triggerZone.visibility = 0; // Invisible trigger
        triggerZone.checkCollisions = false;
        
        // Store teleport destination based on current map
        triggerZone.teleportDestination = this.currentMapName === 'house_inside' ? 'drewfort' : 'house_inside';
        
        // Setup collision detection for teleportation
        this.scene.registerBeforeRender(() => {
            if (this.player && triggerZone) {
                const distance = BABYLON.Vector3.Distance(this.player.position, triggerZone.position);
                
                if (distance < 2.0) { // Player is close to stairs
                    // Show teleport prompt
                    this.showTeleportPrompt(triggerZone.teleportDestination);
                }
            }
        });
        
        console.log('Stair teleport setup for:', stairMesh.name);
    }
    
    showTeleportPrompt(destination) {
        // Only show prompt once per approach
        if (this.teleportPromptShown) return;
        this.teleportPromptShown = true;
        
        // Create UI prompt
        const promptElement = document.createElement('div');
        promptElement.id = 'teleportPrompt';
        promptElement.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                z-index: 1000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <h3>🚀 Téléportation Disponible</h3>
                <p>Voulez-vous vous téléporter à <strong>${destination === 'drewfort' ? 'Drewfort' : 'Maison'}?</strong></p>
                <button id="teleportYes" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    margin: 5px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                ">Oui (Espace)</button>
                <button id="teleportNo" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    margin: 5px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                ">Non (Échap)</button>
            </div>
        `;
        
        document.body.appendChild(promptElement);
        
        // Handle teleport choice
        document.getElementById('teleportYes').onclick = () => {
            this.teleportToMap(destination);
            this.closeTeleportPrompt();
        };
        
        document.getElementById('teleportNo').onclick = () => {
            this.closeTeleportPrompt();
        };
        
        // Keyboard shortcuts
        const keyHandler = (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.teleportToMap(destination);
                this.closeTeleportPrompt();
                document.removeEventListener('keydown', keyHandler);
            } else if (event.code === 'Escape') {
                event.preventDefault();
                this.closeTeleportPrompt();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        
        document.addEventListener('keydown', keyHandler);
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            this.closeTeleportPrompt();
        }, 10000);
    }
    
    closeTeleportPrompt() {
        const prompt = document.getElementById('teleportPrompt');
        if (prompt) {
            prompt.remove();
        }
        this.teleportPromptShown = false;
    }
    
    async teleportToMap(mapName) {
        try {
            console.log(`🚀 Starting teleportation to: ${mapName}`);
            
            // Start fade out transition
            await this.fadeOut(500);
            
            // Show loading message
            this.updateLoadingText(`Téléportation vers ${mapName === 'drewfort' ? 'Drewfort' : mapName}...`);
            
            // Temporarily show loading screen
            document.getElementById('loading-screen').classList.add('active');
            document.getElementById('game-screen').classList.remove('active');
            
            // Load new map
            console.log(`🗺️ Loading map: ${mapName}`);
            await this.loadMap(mapName);
            
            // Set player position based on destination
            let spawnPosition;
            if (mapName === 'drewfort') {
                spawnPosition = { x: 0, y: 1, z: 0 }; // Center of Drewfort
            } else if (mapName === 'house_inside') {
                spawnPosition = { x: 0, y: 1, z: 0 }; // Center of house
            } else {
                spawnPosition = { x: 0, y: 1, z: 0 }; // Default spawn
            }
            
            // Teleport player
            if (this.playerController) {
                this.playerController.teleportTo(spawnPosition);
                console.log(`📍 Player teleported to:`, spawnPosition);
            }
            
            // Notify server of map change
            if (this.socket) {
                this.socket.emit('map_change', mapName);
            }
            
            // Hide loading screen with delay
            setTimeout(() => {
                document.getElementById('loading-screen').classList.remove('active');
                document.getElementById('game-screen').classList.add('active');
                
                // Start fade in transition
                this.fadeIn(500);
                
                console.log(`✅ Teleportation completed successfully to: ${mapName}`);
            }, 1000);
            
        } catch (error) {
            console.error('❌ Teleportation error:', error);
            this.showError(`Échec de la téléportation vers ${mapName}. Veuillez réessayer.`);
            
            // Ensure we fade back in even if there's an error
            setTimeout(() => {
                document.getElementById('loading-screen').classList.remove('active');
                document.getElementById('game-screen').classList.add('active');
                this.fadeIn(500);
            }, 500);
        }
    }
    
    /**
     * Create fade plane for transitions
     */
    createFadePlane() {
        if (this.fadePlane) return; // Already created
        
        // Create a plane that covers the entire screen
        this.fadePlane = BABYLON.MeshBuilder.CreatePlane("fadePlane", {
            width: 2, 
            height: 2
        }, this.scene);
        
        // Position it in front of the camera
        this.fadePlane.position = new BABYLON.Vector3(0, 0, 1);
        
        // Create material for the fade plane
        this.fadeMaterial = new BABYLON.StandardMaterial("fadeMaterial", this.scene);
        this.fadeMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0); // Black
        this.fadeMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0); // Black
        this.fadeMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
        this.fadeMaterial.alpha = 0; // Start transparent
        this.fadeMaterial.zOffset = -1; // Render on top
        this.fadeMaterial.disableDepthWrite = true; // Don't affect depth buffer
        
        this.fadePlane.material = this.fadeMaterial;
        
        // Make it always face the camera
        this.fadePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        // Parent it to the camera so it moves with the camera
        this.fadePlane.parent = this.camera;
        
        console.log('Fade plane created for transitions');
    }
    
    /**
     * Fade in transition
     * @param {number} duration - Duration in milliseconds
     */
    async fadeIn(duration = 500) {
        if (this.isFading) return;
        
        this.createFadePlane();
        this.isFading = true;
        this.fadeDirection = 'in';
        
        return new Promise((resolve) => {
            const startAlpha = 1.0;
            const endAlpha = 0.0;
            const startTime = Date.now();
            
            const updateFade = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out function for smoother transition
                const easeProgress = 1 - Math.pow(1 - progress, 2);
                const currentAlpha = startAlpha - (startAlpha - endAlpha) * easeProgress;
                
                if (this.fadeMaterial) {
                    this.fadeMaterial.alpha = currentAlpha;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(updateFade);
                } else {
                    this.isFading = false;
                    this.fadeDirection = null;
                    resolve();
                }
            };
            
            updateFade();
        });
    }
    
    /**
     * Fade out transition
     * @param {number} duration - Duration in milliseconds
     */
    async fadeOut(duration = 500) {
        if (this.isFading) return;
        
        this.createFadePlane();
        this.isFading = true;
        this.fadeDirection = 'out';
        
        return new Promise((resolve) => {
            const startAlpha = 0.0;
            const endAlpha = 1.0;
            const startTime = Date.now();
            
            const updateFade = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease in function for smoother transition
                const easeProgress = progress * progress;
                const currentAlpha = startAlpha + (endAlpha - startAlpha) * easeProgress;
                
                if (this.fadeMaterial) {
                    this.fadeMaterial.alpha = currentAlpha;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(updateFade);
                } else {
                    this.isFading = false;
                    this.fadeDirection = null;
                    resolve();
                }
            };
            
            updateFade();
        });
    }

    async createPlayer() {
    try {
        console.log('🎮 Phase 2: Chargement et configuration du joueur');
        this.updateLoadingText('Chargement du modèle joueur Calem...');

        // Use specific model for admin "leduc"
        let modelFileName = 'calem/calem.glb';
        if (this.user?.username === 'leduc' && (this.user?.role === 'admin' || this.user?.role === 'co-admin')) {
            modelFileName = 'calem/leduc/kaido.glb';
            console.log('👑 Chargement du modèle spécial Kaido pour l\'administrateur leduc');
        }
        console.log('👤 Chargement du modèle Calem pour l\'utilisateur:', this.user?.username || 'unknown');

        // Charger le modèle GLB
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "", 
            "/pokemon-map-editor/assets/player/", 
            modelFileName, 
            this.scene
        );

        console.log('📊 Résultats du chargement du modèle Calem:', {
            meshes: result.meshes.length,
            transformNodes: result.transformNodes?.length || 0,
            animationGroups: result.animationGroups?.length || 0,
            skeletons: result.skeletons?.length || 0
        });

        if (result.meshes.length === 0) throw new Error(`Aucun mesh trouvé dans ${modelFileName}`);

        // Définir le mesh principal
        this.player = result.meshes[0];
        if (result.transformNodes && result.transformNodes.length > 0) this.player = result.transformNodes[0];

        // Échelle et position
        this.player.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);

        let spawnPosition = new BABYLON.Vector3(0, 1, 0);
        if (this.currentMapName === 'matrix1') spawnPosition = new BABYLON.Vector3(-14.33, 1.0, -25.22);
        else if (this.currentMapName === 'castle_village') spawnPosition = new BABYLON.Vector3(0, 1.0, 0);
        else if (this.currentMapName === 'soaring_overworld') spawnPosition = new BABYLON.Vector3(0, 5.0, 0);

        console.log('📍 Spawning player at position:', spawnPosition);
        this.player.position = spawnPosition;
        this.player.visibility = 1.0;

        if (this.player.getChildMeshes) {
            this.player.getChildMeshes().forEach(mesh => {
                mesh.visibility = 1.0;
                mesh.receiveShadows = true;
            });
        }

        // Collisions et physique
        // Only create physics impostor if physics is enabled
        if (this.scene.isPhysicsEnabled()) {
            this.player.physicsImpostor = new BABYLON.PhysicsImpostor(
                this.player, 
                BABYLON.PhysicsImpostor.CapsuleImpostor, 
                { mass: 1, restitution: 0.1, friction: 0.5 }, 
                this.scene
            );
            if (this.player.physicsImpostor.physicsBody) this.player.physicsImpostor.physicsBody.angularDamping = 0.9;
        } else {
            console.log('⚠️ Physics not enabled, using manual collision detection');
        }
        
        this.player.checkCollisions = true;
        this.player.ellipsoid = new BABYLON.Vector3(0.4, 0.8, 0.4);
        this.player.ellipsoidOffset = new BABYLON.Vector3(0, 0.8, 0);

        // Animations
        this.setupPlayerAnimations(result.animationGroups);

        // Caméra ORAS style
        this.camera.alpha = -Math.PI / 2;
        this.camera.beta = Math.PI / 4;
        this.camera.radius = 25;
        this.camera.lockedTarget = this.player;

        // PlayerController with fallback mechanism
        try {
            if (typeof PlayerController === 'undefined' && typeof window.PlayerController !== 'undefined') {
                PlayerController = window.PlayerController;
                console.log('🔧 Using PlayerController from window object');
            }
            
            if (typeof PlayerController === 'undefined') {
                throw new Error('PlayerController is not defined');
            }
            
            const userRole = this.user?.role || 'user';
            this.playerController = new PlayerController(this.player, this.camera, this.scene, this.socket, userRole);
            console.log('✅ PlayerController instantiated successfully');

        } catch (error) {
            console.error('❌ Failed to instantiate PlayerController:', error);
            
            // Fallback implementation
            this.playerController = {
                player: this.player,
                camera: this.camera,
                scene: this.scene,
                socket: this.socket,
                updateCamera: function() {},
                getPlayerState: function() { 
                    return { position: this.player.position, rotation: this.player.rotation }; 
                },
                // Add other required methods with minimal implementation
                initializeControls: function() {},
                setupMovementLoop: function() {},
                updateMovement: function() {},
                updateAnimationState: function() {},
                checkPositionChange: function() {},
                sendPositionUpdate: function() {},
                teleportTo: function(position, rotation = null) {
                    this.player.position = new BABYLON.Vector3(position.x, position.y, position.z);
                    if (rotation) {
                        this.player.rotation = new BABYLON.Vector3(rotation.x, rotation.y, rotation.z);
                    }
                },
                setMoveSpeed: function(speed) {},
                setControlsEnabled: function(enabled) {}
            };
            
            console.log('⚠️ Using fallback PlayerController implementation');
        }

        console.log('✅ Modèle 3D Calem chargé avec succès');

    } catch (error) {
        console.warn('❌ Échec du chargement du modèle Calem:', error);

        // Création fallback
        this.player = BABYLON.MeshBuilder.CreateCapsule("player", { radius: 0.4, height: 1.8 }, this.scene);
        this.player.position = this.currentMapName === 'matrix1' ? new BABYLON.Vector3(-14.33, 1, -25.22) : new BABYLON.Vector3(0, 1, 0);
        this.player.checkCollisions = true;

        // Only create physics impostor if physics is enabled
        if (this.scene.isPhysicsEnabled()) {
            this.player.physicsImpostor = new BABYLON.PhysicsImpostor(
                this.player, 
                BABYLON.PhysicsImpostor.CapsuleImpostor, 
                { mass: 1, restitution: 0.1, friction: 0.5 }, 
                this.scene
            );
        }

        if (typeof this.setupFallbackPlayerAnimations === 'function') {
            this.setupFallbackPlayerAnimations();
        } else {
            console.warn('⚠️ Animation fallback non définie');
        }

        // PlayerController with fallback mechanism (fallback player)
        try {
            if (typeof PlayerController === 'undefined' && typeof window.PlayerController !== 'undefined') {
                PlayerController = window.PlayerController;
                console.log('🔧 Using PlayerController from window object');
            }
            
            if (typeof PlayerController === 'undefined') {
                throw new Error('PlayerController is not defined');
            }
            
            const userRole = this.user?.role || 'user';
            this.playerController = new PlayerController(this.player, this.camera, this.scene, this.socket, userRole);
            console.log('✅ PlayerController instantiated successfully for fallback player');

        } catch (error) {
            console.error('❌ Failed to instantiate PlayerController for fallback player:', error);
            
            // Fallback implementation
            this.playerController = {
                player: this.player,
                camera: this.camera,
                scene: this.scene,
                socket: this.socket,
                updateCamera: function() {},
                getPlayerState: function() { 
                    return { position: this.player.position, rotation: this.player.rotation }; 
                },
                // Add other required methods with minimal implementation
                initializeControls: function() {},
                setupMovementLoop: function() {},
                updateMovement: function() {},
                updateAnimationState: function() {},
                checkPositionChange: function() {},
                sendPositionUpdate: function() {},
                teleportTo: function(position, rotation = null) {
                    this.player.position = new BABYLON.Vector3(position.x, position.y, position.z);
                    if (rotation) {
                        this.player.rotation = new BABYLON.Vector3(rotation.x, rotation.y, rotation.z);
                    }
                },
                setMoveSpeed: function(speed) {},
                setControlsEnabled: function(enabled) {}
            };
            
            console.log('⚠️ Using fallback PlayerController implementation for fallback player');
        }
        console.log('⚠️ Joueur fallback créé avec succès');
    }
}


    // Helper method to check if an animation group is valid
    isAnimationValid(animationGroup) {
        return animationGroup && !animationGroup.isDisposed;
    }

    setupPlayerAnimations(animationGroups) {
        if (!animationGroups || animationGroups.length === 0) {
            console.log('⚠️ No animations found in Calem model - creating fallback animation system');
            // Create a fallback animation system for models without animations
            this.playerAnimations = {
                idle: null,
                walk: null,
                run: null
            };
            this.currentPlayerAnimation = 'idle';
            return;
        }
        
        // Validate that animation groups are still valid before using them
        const validAnimationGroups = animationGroups.filter(group => group && !group.isDisposed);
        if (validAnimationGroups.length === 0) {
            console.log('⚠️ No valid animations found in Calem model - creating fallback animation system');
            this.playerAnimations = {
                idle: null,
                walk: null,
                run: null
            };
            this.currentPlayerAnimation = 'idle';
            return;
        }
        
        console.log('🎬 Found', animationGroups.length, 'animation groups in Calem model');
        
        // Store animation references
        this.playerAnimations = {
            idle: null,
            walk: null,
            run: null
        };
        
        // Enhanced animation detection for Calem model
        validAnimationGroups.forEach((animGroup, index) => {
            // Check if animation group is still valid
            if (!animGroup || animGroup.isDisposed) {
                return;
            }
            
            const animName = animGroup.name.toLowerCase();
            console.log(`Animation ${index}: "${animGroup.name}" (${animGroup.from}-${animGroup.to})`);
            
            // Enhanced detection patterns for common Calem animation names
            if (animName.includes('idle') || animName.includes('stand') || animName.includes('rest') || 
                animName.includes('breathing') || animName.includes('default')) {
                this.playerAnimations.idle = animGroup;
                console.log('✅ Idle animation found:', animGroup.name);
            } else if (animName.includes('walk') || animName.includes('move') || animName.includes('step') ||
                      animName.includes('walking') || animName.includes('locomotion')) {
                this.playerAnimations.walk = animGroup;
                console.log('✅ Walk animation found:', animGroup.name);
            } else if (animName.includes('run') || animName.includes('sprint') || animName.includes('dash') ||
                      animName.includes('running') || animName.includes('jog')) {
                this.playerAnimations.run = animGroup;
                console.log('✅ Run animation found:', animGroup.name);
            }
        });
        
        // Enhanced fallback system for Calem model
        if (!this.playerAnimations.idle && validAnimationGroups.length > 0) {
            // Try to find the most suitable idle animation
            const idleCandidate = validAnimationGroups.find(anim => 
                anim.name.toLowerCase().includes('idle') ||
                anim.name.toLowerCase().includes('stand') ||
                anim.name.toLowerCase().includes('default')
            ) || validAnimationGroups[0];
            
            // Check if the idle candidate is still valid
            if (idleCandidate && !idleCandidate.isDisposed) {
                this.playerAnimations.idle = idleCandidate;
                console.log('🔄 Using animation as idle:', idleCandidate.name);
            }
        }
        
        if (!this.playerAnimations.walk) {
            // Try to find the most suitable walk animation
            const walkCandidate = validAnimationGroups.find(anim => 
                anim.name.toLowerCase().includes('walk') ||
                anim.name.toLowerCase().includes('move')
            );
            
            if (walkCandidate && !walkCandidate.isDisposed) {
                this.playerAnimations.walk = walkCandidate;
                console.log('🔄 Using animation as walk:', walkCandidate.name);
            } else if (validAnimationGroups.length > 1) {
                const secondAnim = validAnimationGroups[1];
                if (secondAnim && !secondAnim.isDisposed) {
                    this.playerAnimations.walk = secondAnim;
                    console.log('🔄 Using second animation as walk:', secondAnim.name);
                }
            } else if (this.playerAnimations.idle && !this.playerAnimations.idle.isDisposed) {
                this.playerAnimations.walk = this.playerAnimations.idle;
                console.log('🔄 Using idle animation as walk fallback');
            }
        }
        
        if (!this.playerAnimations.run) {
            // Try to find the most suitable run animation
            const runCandidate = validAnimationGroups.find(anim => 
                anim.name.toLowerCase().includes('run') ||
                anim.name.toLowerCase().includes('sprint')
            );
            
            if (runCandidate && !runCandidate.isDisposed) {
                this.playerAnimations.run = runCandidate;
                console.log('🔄 Using animation as run:', runCandidate.name);
            } else if (this.playerAnimations.walk && !this.playerAnimations.walk.isDisposed) {
                this.playerAnimations.run = this.playerAnimations.walk;
                console.log('🔄 Using walk animation as run fallback');
            } else if (this.playerAnimations.idle && !this.playerAnimations.idle.isDisposed) {
                this.playerAnimations.run = this.playerAnimations.idle;
                console.log('🔄 Using idle animation as run fallback');
            }
        }
        
        // Phase 2: Initialiser l'Animation Mixer
        // "Arrête toutes les animations par défaut (animationGroup.stop()) et lance l'animation "idle" en boucle."
        // Start all animations, but only give weight to idle
        if (this.playerAnimations.idle && !this.playerAnimations.idle.isDisposed) {
            this.playerAnimations.idle.start(true, 1.0, this.playerAnimations.idle.from, this.playerAnimations.idle.to, false);
            this.playerAnimations.idle.setWeightForAllAnimatables(1.0);
            this.currentPlayerAnimation = 'idle';
        }

        if (this.playerAnimations.walk && !this.playerAnimations.walk.isDisposed) {
            this.playerAnimations.walk.start(true, 1.2, this.playerAnimations.walk.from, this.playerAnimations.walk.to, false);
            this.playerAnimations.walk.setWeightForAllAnimatables(0.0);
        }

        if (this.playerAnimations.run && !this.playerAnimations.run.isDisposed) {
            this.playerAnimations.run.start(true, 1.5, this.playerAnimations.run.from, this.playerAnimations.run.to, false);
            this.playerAnimations.run.setWeightForAllAnimatables(0.0);
        }
        
        console.log('🎬 Calem animation system initialized successfully!');
    }

    // Method to change player animation with smooth transitions
    setPlayerAnimation(animationType) {
        if (!this.playerAnimations || this.currentPlayerAnimation === animationType) {
            return;
        }

        const targetAnim = this.playerAnimations[animationType];
        if (!targetAnim || targetAnim.isDisposed) {
            console.warn(`⚠️ Animation type "${animationType}" not found or disposed.`);
            return;
        }

        // Use animation blending for smooth transitions
        const currentAnim = this.playerAnimations[this.currentPlayerAnimation];
        
        if (currentAnim && !currentAnim.isDisposed) {
            BABYLON.Animation.CreateAndStartAnimation(
                `anim_weight_out_${this.currentPlayerAnimation}`,
                currentAnim,
                'weight',
                30,
                10,
                currentAnim.weight,
                0,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }
        
        BABYLON.Animation.CreateAndStartAnimation(
            `anim_weight_in_${animationType}`,
            targetAnim,
            'weight',
            30,
            10,
            targetAnim.weight,
            1,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        this.currentPlayerAnimation = animationType;
    }

    setupControls() {
        // Controls are handled by PlayerController
        console.log('Controls initialized');
    }

    setupUI() {
        // Safely update player role display
        const playerRoleElement = document.getElementById('playerRole');
        if (playerRoleElement) {
            playerRoleElement.textContent = this.user.role;
            playerRoleElement.className = `role-badge role-${this.user.role}`;
        }
        
        // Show admin controls if user is admin or co-admin
        if (this.user.role === 'admin' || this.user.role === 'co-admin') {
            const adminControlsElement = document.getElementById('adminControls');
            if (adminControlsElement) {
                adminControlsElement.style.display = 'block';
            }
            
            // Initialize admin map selector
            if (window.AdminMapSelector) {
                window.adminMapSelector = new AdminMapSelector(this, this.socket);
                console.log('🗺️ Admin map selector initialized');
            }
        }
        
        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.authManager.logout();
            });
        }
        
        console.log('UI initialized');
    }

    async addOtherPlayer(playerData) {
        if (this.otherPlayers.has(playerData.userId)) {
            return; // Player already exists
        }
        
        let otherPlayer;
        
        try {
            // Use specific model for admin "leduc"
            let modelFileName = 'calem/calem.glb';
            let modelDescription = 'Calem player';
            
            if (playerData.username === 'leduc' && (playerData.role === 'admin' || playerData.role === 'co-admin')) {
                modelFileName = 'calem/leduc/kaido.glb';
                modelDescription = 'Kaido admin model';
                console.log('👑 Loading special Kaido model for admin leduc');
            } else {
                console.log('👤 Loading Calem model for player:', playerData.username);
            }
            
            // Try to load the Calem 3D model for all players
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", // Import all meshes
                "/pokemon-map-editor/assets/player/", // Use absolute path to ensure consistency
                modelFileName,
                this.scene
            );
            
            if (result.meshes.length > 0) {
                otherPlayer = result.meshes[0];
                if (result.transformNodes && result.transformNodes.length > 0) {
                    otherPlayer = result.transformNodes[0];
                }
                
                console.log(`✅ Loaded Calem model for player:`, playerData.username);
            } else {
                throw new Error('No meshes in GLB');
            }
        } catch (error) {
            console.log(`⚠️ Failed to load Calem model for player ${playerData.username}, using fallback`, error);
            // Fallback to simple capsule
            otherPlayer = BABYLON.MeshBuilder.CreateCapsule(`player_${playerData.userId}`, {
                radius: 0.5,
                height: 1.8
            }, this.scene);
            
            // Different color/material for other players based on role
            const otherPlayerMaterial = new BABYLON.StandardMaterial(`playerMaterial_${playerData.userId}`, this.scene);
            if (playerData.role === 'admin' || playerData.role === 'co-admin') {
                otherPlayerMaterial.diffuseColor = new BABYLON.Color3(1, 0.8, 0); // Gold for admin
            } else {
                otherPlayerMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2); // Red for regular users
            }
            otherPlayer.material = otherPlayerMaterial;
        }
        
        // Set position
        otherPlayer.position = new BABYLON.Vector3(
            playerData.position.x,
            playerData.position.y,
            playerData.position.z
        );
        
        // Add name tag with role-appropriate styling
        const nameTag = this.createNameTag(playerData.username, playerData.role);
        nameTag.parent = otherPlayer;
        nameTag.position.y = 2.5;
        
        this.otherPlayers.set(playerData.userId, {
            mesh: otherPlayer,
            nameTag: nameTag,
            userData: playerData
        });
        
        console.log('Added other player:', playerData.username, 'Role:', playerData.role);
    }

    updateOtherPlayer(playerData) {
        const player = this.otherPlayers.get(playerData.userId);
        if (player) {
            // Smooth movement animation
            const targetPosition = new BABYLON.Vector3(
                playerData.position.x,
                playerData.position.y,
                playerData.position.z
            );
            
            BABYLON.Animation.CreateAndStartAnimation(
                "playerMove",
                player.mesh,
                "position",
                30, // 30 FPS
                10, // 10 frames (1/3 second)
                player.mesh.position,
                targetPosition,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
        }
    }

    removeOtherPlayer(userId) {
        const player = this.otherPlayers.get(userId);
        if (player) {
            player.mesh.dispose();
            player.nameTag.dispose();
            this.otherPlayers.delete(userId);
            console.log('Removed other player:', userId);
        }
    }

    createNameTag(username, role = 'user') {
        // Create a plane for the name tag
        const nameTag = BABYLON.MeshBuilder.CreatePlane("nameTag", {size: 2}, this.scene);
        
        // Determine colors based on role
        let textColor = "#FFFFFF"; // Default white
        let backgroundColor = "transparent";
        let fontStyle = "bold 24px Arial";
        
        if (role === 'admin' || role === 'co-admin') {
            textColor = "#FFD700"; // Gold for admin
            fontStyle = "bold 26px Arial"; // Slightly larger for admin
        }
        
        // Create dynamic texture for text
        const nameTexture = new BABYLON.DynamicTexture("nameTexture", {width: 256, height: 64}, this.scene);
        nameTexture.hasAlpha = true;
        nameTexture.drawText(username, null, null, fontStyle, textColor, backgroundColor, true);
        
        const nameMaterial = new BABYLON.StandardMaterial("nameMaterial", this.scene);
        nameMaterial.diffuseTexture = nameTexture;
        nameMaterial.emissiveTexture = nameTexture;
        nameTag.material = nameMaterial;
        
        // Make name tag always face camera
        nameTag.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        return nameTag;
    }

    
    /**
     * Trigger admin battle for testing purposes
     * @param {string} battleType - Type of battle ('wild', 'pvp_ai')
     */
    triggerAdminBattle(battleType) {
        console.log(`🔧 Admin triggering ${battleType} battle...`);
        
        if (this.player && this.player.startRandomBattle) {
            if (battleType === 'wild') {
                this.player.startRandomBattle();
            } else if (battleType === 'pvp_ai') {
                this.startAIBattle();
            }
        } else {
            console.warn('❌ Player or battle system not available');
        }
    }
    
    /**
     * Start AI battle simulation for testing
     */
    startAIBattle() {
        console.log('🤖 Starting AI battle simulation...');
        
        const aiTrainer = {
            name: 'AI Trainer',
            pokemon: this.generateRandomTeam()
        };
        
        this.startIntegratedBattle({
            type: 'pvp_ai',
            opponent: aiTrainer,
            environment: this.getCurrentEnvironment()
        });
    }
    
    /**
     * Generate random Pokemon team for AI
     */
    generateRandomTeam() {
        const team = [];
        const teamSize = Math.floor(Math.random() * 3) + 1; // 1-3 Pokemon
        
        for (let i = 0; i < teamSize; i++) {
            if (this.player && this.player.generateRandomWildPokemon) {
                team.push(this.player.generateRandomWildPokemon());
            }
        }
        
        return team;
    }
    
    /**
     * Get current environment for battles
     */
    getCurrentEnvironment() {
        return this.currentMapName || 'unknown';
    }

    /**
     * Start integrated battle system inside the main game
     * @param {Object} battleData - Battle configuration data
     */
    startIntegratedBattle(battleData) {
        console.log('💫 Starting integrated battle...', battleData);
        
        try {
            // Disable game controls during battle
            this.disableControls('battle');
            
            // Hide game UI elements
            this.showBattleInterface(battleData);
            
            // Initialize battle state
            this.currentBattle = {
                type: battleData.type,
                wildPokemon: battleData.wildPokemon,
                opponent: battleData.opponent,
                environment: battleData.environment,
                turn: 'player',
                battlePhase: 'start'
            };
            
            // Emit to server for real-time battle if it's PvP
            if (battleData.type === 'pvp_ai' && this.socket) {
                this.socket.emit('battle_start_ai', {
                    battleData: battleData,
                    userId: this.userId
                });
            }
            
            console.log('✅ Integrated battle started successfully');
            
        } catch (error) {
            console.error('❌ Error starting integrated battle:', error);
            this.enableControls('battle');
        }
    }
    
    /**
     * Start a pokengine battle
     * @param {Object} battleData - Battle configuration data
     */
    async startPokengineBattle(battleData) {
        try {
            console.log('⚔️ Starting pokengine battle...', battleData);
            
            // Disable game controls during battle
            this.disableControls('battle');
            
            // Create battle container if it doesn't exist
            let battleContainer = document.getElementById('battle-container');
            if (!battleContainer) {
                battleContainer = document.createElement('div');
                battleContainer.id = 'battle-container';
                battleContainer.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100;';
                document.body.appendChild(battleContainer);
            }
            
            // Initialize BattleModule if not already done
            if (!this.battleModule) {
                this.battleModule = new BattleModule(battleContainer);
                
                // Set up event listeners for the battle module
                this.setupBattleModuleEvents();
            }
            
            // Show battle container
            battleContainer.style.display = 'block';
            
            // Start the battle
            await this.battleModule.startBattle(battleData);
            
            // Store current battle data
            this.currentBattle = battleData;
            
            console.log('⚔️ Pokengine battle started successfully');
            
        } catch (error) {
            console.error('❌ Error starting pokengine battle:', error);
            this.enableControls('battle');
            alert('Failed to start battle. Check console for details.');
        }
    }
    
    /**
     * Set up event listeners for the battle module
     */
    setupBattleModuleEvents() {
        if (!this.battleModule) return;
        
        // Listen for battle start
        this.battleModule.on('battle_started', (data) => {
            console.log('⚔️ BattleModule: Battle started', data);
        });
        
        // Listen for battle end
        this.battleModule.on('battle_ended', () => {
            console.log('⚔️ BattleModule: Battle ended');
            this.endPokengineBattle();
        });
        
        // Listen for battle actions
        this.battleModule.on('battle_action', (data) => {
            console.log('⚔️ BattleModule: Battle action', data);
            // Forward action to server through socket
            if (this.socket) {
                this.socket.emit('battle_action', data);
            }
        });
        
        // Listen for battle errors
        this.battleModule.on('battle_error', (data) => {
            console.error('⚔️ BattleModule: Battle error', data);
            this.endPokengineBattle();
        });
        
        // Listen for battle state updates
        this.battleModule.on('battle_state_updated', (data) => {
            console.log('⚔️ BattleModule: Battle state updated', data);
        });
    }
    
    /**
     * End the current pokengine battle
     */
    endPokengineBattle() {
        console.log('⚔️ Ending pokengine battle...');
        
        // Hide battle container
        const battleContainer = document.getElementById('battle-container');
        if (battleContainer) {
            battleContainer.style.display = 'none';
        }
        
        // End battle in module
        if (this.battleModule) {
            this.battleModule.endBattle();
        }
        
        // Re-enable game controls
        this.enableControls('battle');
        
        // Clear battle state
        this.currentBattle = null;
        
        console.log('⚔️ Pokengine battle ended successfully');
    }
    
    /**
     * Update battle state with server data
     * @param {Object} battleState - Current battle state from server
     */
    updateBattleState(battleState) {
        if (this.battleModule) {
            this.battleModule.updateBattleState(battleState);
        }
    }
    
    /**
     * Process a battle action from the server
     * @param {Object} actionData - Action data from server
     */
    processBattleAction(actionData) {
        // This would be called when receiving battle actions from the server
        console.log('🎮 Processing battle action from server:', actionData);
    }

    /**
     * Handle battle action result from server
     * @param {Object} data - Battle action result data
     */
    handleBattleActionResult(data) {
        console.log('🎮 Battle action result received:', data);
        
        // Update battle state if battle module exists
        if (this.battleModule) {
            this.battleModule.updateBattleState(data);
        }
    }
    
    /**
     * Handle battle update from server
     * @param {Object} data - Battle update data
     */
    handleBattleUpdate(data) {
        console.log('🎮 Battle update received:', data);
        
        // Update battle state if battle module exists
        if (this.battleModule) {
            this.battleModule.updateBattleState(data);
        }
    }
    
    /**
     * Handle battle end from server
     * @param {Object} data - Battle end data
     */
    handleBattleEnd(data) {
        console.log('🎮 Battle end received:', data);
        
        // End battle if battle module exists
        if (this.battleModule) {
            this.endPokengineBattle();
        }
    }

    /**
     * Show battle interface
     * @param {Object} battleData - Battle data
     */
    showBattleInterface(battleData) {
        // Create battle overlay if it doesn't exist
        let battleOverlay = document.getElementById('battle-overlay');
        if (!battleOverlay) {
            battleOverlay = document.createElement('div');
            battleOverlay.id = 'battle-overlay';
            battleOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                font-family: 'Pokemon', Arial, sans-serif;
            `;
            document.body.appendChild(battleOverlay);
        }
        
        // Create battle content based on battle type
        if (battleData.type === 'wild' || battleData.type === 'wild_grass') {
            this.showWildBattleInterface(battleOverlay, battleData);
        } else if (battleData.type === 'trainer') {
            this.showTrainerBattleInterface(battleOverlay, battleData);
        } else {
            this.showGenericBattleInterface(battleOverlay, battleData);
        }
        
        // Add ESC key listener for battle
        const escapeListener = (event) => {
            if (event.key === 'Escape') {
                this.battleAction('run');
            }
        };
        document.addEventListener('keydown', escapeListener);
        battleOverlay.escapeListener = escapeListener;
        
        battleOverlay.style.display = 'flex';
    }
    
    /**
     * Show wild Pokemon battle interface
     */
    showWildBattleInterface(battleOverlay, battleData) {
        const wild = battleData.wildPokemon;
        const encounterText = battleData.type === 'wild_grass' ? 
            `You encountered a wild ${wild.name} in the tall grass!` : 
            `A wild ${wild.name} appeared!`;
            
        battleOverlay.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h1 style="font-size: 2.5em; margin-bottom: 20px; color: #FFD700;">💫 Wild Pokemon Battle!</h1>
                
                <div style="background: rgba(0,0,0,0.7); padding: 30px; border-radius: 15px; margin: 20px; max-width: 600px;">
                    <h2 style="color: #FF6B6B; margin-bottom: 15px;">${encounterText}</h2>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                        <div>
                            <h3 style="color: #4ECDC4;">Pokemon Info</h3>
                            <p><strong>Name:</strong> ${wild.name}</p>
                            <p><strong>Level:</strong> ${wild.level}</p>
                            <p><strong>Type:</strong> ${wild.type1}${wild.type2 ? '/' + wild.type2 : ''}</p>
                            <p><strong>HP:</strong> ${wild.currentHp}/${wild.stats.hp}</p>
                            ${wild.encounterType ? `<p><strong>Environment:</strong> ${wild.encounterType}</p>` : ''}
                        </div>
                        
                        <div>
                            <h3 style="color: #45B7D1;">Available Moves</h3>
                            ${wild.moves.map((move, index) => `<p>${index + 1}. ${move}</p>`).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <button onclick="window.gameManager.battleAction('fight')" style="
                            background: #28a745; color: white; border: none; padding: 15px 30px; 
                            margin: 10px; border-radius: 8px; font-size: 1.2em; cursor: pointer;
                        ">💪 Fight</button>
                        
                        <button onclick="window.gameManager.battleAction('run')" style="
                            background: #dc3545; color: white; border: none; padding: 15px 30px; 
                            margin: 10px; border-radius: 8px; font-size: 1.2em; cursor: pointer;
                        ">🏃 Run Away</button>
                    </div>
                    
                    <div style="margin-top: 20px; font-size: 0.9em; color: #ccc;">
                        <p>Environment: ${battleData.environment}</p>
                        <p>Press ESC or click "Run Away" to exit battle</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Show trainer battle interface
     */
    showTrainerBattleInterface(battleOverlay, battleData) {
        const trainer = battleData.opponent;
        
        battleOverlay.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h1 style="font-size: 2.5em; margin-bottom: 20px; color: #FFD700;">⚔️ Trainer Battle!</h1>
                
                <div style="background: rgba(0,0,0,0.7); padding: 30px; border-radius: 15px; margin: 20px; max-width: 700px;">
                    <h2 style="color: #FF6B6B; margin-bottom: 15px;">${trainer.name} wants to battle!</h2>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                        <div>
                            <h3 style="color: #4ECDC4;">Trainer Info</h3>
                            <p><strong>Name:</strong> ${trainer.name}</p>
                            <p><strong>Type:</strong> ${trainer.type || 'Mixed'}</p>
                            <p><strong>Team Size:</strong> ${trainer.team.length} Pokemon</p>
                            ${trainer.isAI ? '<p style="color: #FFD700;"><strong>AI Trainer</strong></p>' : ''}
                        </div>
                        
                        <div>
                            <h3 style="color: #45B7D1;">Trainer's Team</h3>
                            ${trainer.team.map((pokemon, index) => 
                                `<p>${index + 1}. ${pokemon.name} (Lv.${pokemon.level})</p>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <button onclick="window.gameManager.battleAction('fight')" style="
                            background: #28a745; color: white; border: none; padding: 15px 30px; 
                            margin: 10px; border-radius: 8px; font-size: 1.2em; cursor: pointer;
                        ">⚔️ Accept Challenge</button>
                        
                        <button onclick="window.gameManager.battleAction('run')" style="
                            background: #dc3545; color: white; border: none; padding: 15px 30px; 
                            margin: 10px; border-radius: 8px; font-size: 1.2em; cursor: pointer;
                        ">🚫 Decline Battle</button>
                    </div>
                    
                    <div style="margin-top: 20px; font-size: 0.9em; color: #ccc;">
                        <p>Environment: ${battleData.environment}</p>
                        <p>Press ESC to decline battle</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Show generic battle interface for other battle types
     */
    showGenericBattleInterface(battleOverlay, battleData) {
        battleOverlay.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h1 style="font-size: 2.5em; margin-bottom: 20px; color: #FFD700;">💫 Pokemon Battle!</h1>
                
                <div style="background: rgba(0,0,0,0.7); padding: 30px; border-radius: 15px; margin: 20px; max-width: 600px;">
                    <h2 style="color: #FF6B6B; margin-bottom: 15px;">Battle Type: ${battleData.type}</h2>
                    
                    <p style="color: #ccc; margin: 20px 0;">Battle system is being prepared...</p>
                    
                    <div style="margin-top: 30px;">
                        <button onclick="window.gameManager.battleAction('fight')" style="
                            background: #28a745; color: white; border: none; padding: 15px 30px; 
                            margin: 10px; border-radius: 8px; font-size: 1.2em; cursor: pointer;
                        ">💪 Start Battle</button>
                        
                        <button onclick="window.gameManager.battleAction('run')" style="
                            background: #dc3545; color: white; border: none; padding: 15px 30px; 
                            margin: 10px; border-radius: 8px; font-size: 1.2em; cursor: pointer;
                        ">🚫 Cancel</button>
                    </div>
                    
                    <div style="margin-top: 20px; font-size: 0.9em; color: #ccc;">
                        <p>Environment: ${battleData.environment}</p>
                        <p>Press ESC to cancel battle</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Handle battle actions
     * @param {string} action - Action type (fight, run, etc.)
     */
    battleAction(action) {
        console.log(`🎮 Battle action: ${action}`);
        
        switch(action) {
            case 'fight':
                this.processBattleFight();
                break;
            case 'run':
                this.processBattleRun();
                break;
            default:
                console.warn('Unknown battle action:', action);
        }
    }
    
    /**
     * Process fight action in battle
     */
    processBattleFight() {
        if (this.currentBattle.type === 'trainer') {
            this.processTrainerBattleFight();
        } else {
            this.processWildBattleFight();
        }
    }
    
    /**
     * Process fight action in wild battle
     */
    processWildBattleFight() {
        const wild = this.currentBattle.wildPokemon;
        const playerMove = wild.moves[Math.floor(Math.random() * wild.moves.length)];
        
        // Simulate battle outcome
        const outcomes = [
            `You used ${playerMove}! It's super effective!`,
            `You used ${playerMove}! It was not very effective...`,
            `You used ${playerMove}! A critical hit!`,
            `You used ${playerMove}! The wild ${wild.name} fainted!`,
            `The wild ${wild.name} used ${wild.moves[Math.floor(Math.random() * wild.moves.length)]}!`
        ];
        
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        // Show battle result
        const battleOverlay = document.getElementById('battle-overlay');
        if (battleOverlay) {
            battleOverlay.innerHTML += `
                <div style="background: rgba(0,0,0,0.9); padding: 20px; border-radius: 10px; margin-top: 20px;">
                    <h3 style="color: #FFD700;">💫 Battle Result</h3>
                    <p>${outcome}</p>
                    <button onclick="window.gameManager.endBattle()" style="
                        background: #17a2b8; color: white; border: none; padding: 10px 20px; 
                        border-radius: 5px; margin-top: 10px; cursor: pointer;
                    ">Continue</button>
                </div>
            `;
        }
    }
    
    /**
     * Process fight action in trainer battle
     */
    processTrainerBattleFight() {
        const trainer = this.currentBattle.opponent;
        const currentPokemon = trainer.team[0]; // First Pokemon for simplicity
        
        // Simulate trainer battle
        const battleEvents = [
            `${trainer.name} sent out ${currentPokemon.name}!`,
            `You used Tackle! It's effective!`,
            `${currentPokemon.name} used ${currentPokemon.moves[0]}!`,
            `It's a fierce battle!`,
            `${trainer.isAI ? 'AI' : 'Trainer'} ${trainer.name} is defeated!`
        ];
        
        const event = battleEvents[Math.floor(Math.random() * battleEvents.length)];
        
        // Show trainer battle result
        const battleOverlay = document.getElementById('battle-overlay');
        if (battleOverlay) {
            battleOverlay.innerHTML += `
                <div style="background: rgba(0,0,0,0.9); padding: 20px; border-radius: 10px; margin-top: 20px;">
                    <h3 style="color: #FFD700;">⚔️ Trainer Battle</h3>
                    <p>${event}</p>
                    <button onclick="window.gameManager.endBattle()" style="
                        background: #17a2b8; color: white; border: none; padding: 10px 20px; 
                        border-radius: 5px; margin-top: 10px; cursor: pointer;
                    ">Continue</button>
                </div>
            `;
        }
    }
    
    /**
     * Process run action in battle
     */
    processBattleRun() {
        if (this.currentBattle.type === 'trainer') {
            this.processTrainerBattleRun();
        } else {
            this.processWildBattleRun();
        }
    }
    
    /**
     * Process run action in wild battle
     */
    processWildBattleRun() {
        const wild = this.currentBattle.wildPokemon;
        const runSuccess = Math.random() > 0.3; // 70% success rate
        
        if (runSuccess) {
            const messages = [
                `You ran away from the wild ${wild.name}!`,
                `You escaped safely!`,
                `Got away safely!`
            ];
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            this.showBattleMessage(message, () => {
                this.endBattle();
            });
        } else {
            this.showBattleMessage(`Can't escape! The wild ${wild.name} blocked your path!`, () => {
                // Continue battle
            });
        }
    }
    
    /**
     * Process run action in trainer battle
     */
    processTrainerBattleRun() {
        const trainer = this.currentBattle.opponent;
        
        if (trainer.isAI) {
            this.showBattleMessage(`You declined the AI trainer battle with ${trainer.name}.`, () => {
                this.endBattle();
            });
        } else {
            this.showBattleMessage(`You can't run away from a trainer battle!`, () => {
                // Continue battle - trainer battles can't be escaped
            });
        }
    }
    
    /**
     * Show battle message
     * @param {string} message - Message to show
     * @param {Function} callback - Callback after message
     */
    showBattleMessage(message, callback) {
        const battleOverlay = document.getElementById('battle-overlay');
        if (battleOverlay) {
            battleOverlay.innerHTML += `
                <div style="background: rgba(0,0,0,0.9); padding: 20px; border-radius: 10px; margin-top: 20px;">
                    <p style="color: #FFD700;">${message}</p>
                    <button onclick="this.onclick = null; this.parentElement.remove(); ${callback ? 'arguments[0]();' : ''}" style="
                        background: #17a2b8; color: white; border: none; padding: 10px 20px; 
                        border-radius: 5px; margin-top: 10px; cursor: pointer;
                    ">OK</button>
                </div>
            `;
        }
    }
    
    /**
     * End the current battle
     */
    endBattle() {
        console.log('🏆 Ending battle...');
        
        // Remove battle overlay
        const battleOverlay = document.getElementById('battle-overlay');
        if (battleOverlay) {
            // Remove escape listener
            if (battleOverlay.escapeListener) {
                document.removeEventListener('keydown', battleOverlay.escapeListener);
            }
            battleOverlay.remove();
        }
        
        // Re-enable game controls
        this.enableControls('battle');
        
        // Clear battle state
        this.currentBattle = null;
        
        console.log('✅ Battle ended successfully');
    }

    
    setEditorTool(toolName) {
        // Remove active class from all tool buttons
        const toolButtons = document.querySelectorAll('.editor-btn');
        toolButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected tool
        const toolButton = document.getElementById(`${toolName}ToolBtn`);
        if (toolButton) {
            toolButton.classList.add('active');
            toolButton.style.background = '#007acc';
        }
        
        this.currentEditorTool = toolName;
        
        const statusText = document.getElementById('editorStatusText');
        if (statusText) {
            statusText.textContent = `Active tool: ${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`;
        }
        
        console.log(`🛠️ Editor tool changed to: ${toolName}`);
    }
    
    saveCurrentMap() {
        // Placeholder for save functionality
        console.log('💾 Saving current map...');
        
        const statusText = document.getElementById('editorStatusText');
        if (statusText) {
            statusText.textContent = 'Save functionality - Coming soon!';
        }
        
        // In a full implementation, this would serialize the scene and save it
    }
    
    exportMapData() {
        try {
            // Create export data
            const exportData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                meshes: [],
                collisions: [],
                pokemonZones: []
            };
            
            // Add mesh data
            if (this.loadedEditorMeshes) {
                this.loadedEditorMeshes.forEach(mesh => {
                    if (mesh.name !== '__root__') {
                        exportData.meshes.push({
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
                            }
                        });
                    }
                });
            }
            
            // Create and download file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `map_export_${Date.now()}.json`;
            link.click();
            
            URL.revokeObjectURL(link.href);
            
            const statusText = document.getElementById('editorStatusText');
            if (statusText) {
                statusText.textContent = 'Map data exported successfully!';
            }
            
            console.log('✅ Map data exported successfully');
            
        } catch (error) {
            console.error('❌ Error exporting map data:', error);
            const statusText = document.getElementById('editorStatusText');
            if (statusText) {
                statusText.textContent = 'Error exporting map data';
            }
        }
    }
    
    startGame() {
        // Hide loading screen and show game
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        
        // Update current map indicator
        const mapIndicator = document.getElementById('currentMap');
        if (mapIndicator && this.currentMapName) {
            mapIndicator.textContent = this.currentMapName;
            console.log(`🗺️ Map indicator updated to: ${this.currentMapName}`);
        } else {
            console.warn('⚠️ Could not update map indicator', {
                indicator: !!mapIndicator,
                mapName: this.currentMapName
            });
        }
        
        // Ensure chat panel is visible
        const chatPanel = document.getElementById('chat-panel');
        if (chatPanel) {
            chatPanel.style.display = 'block';
            console.log('💬 Chat panel made visible');
        } else {
            console.error('⚠️ Chat panel element not found');
        }
    }

    handleResize() {
        // Update canvas size when window is resized
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.engine) {
            this.engine.resize();
        }
        
        // Initialize chat manager with socket
        if (window.chatManager && this.socket) {
            console.log('💬 Initializing chat manager with socket...');
            try {
                window.chatManager.initialize(this.socket);
                console.log('✅ Chat manager initialized successfully');
            } catch (error) {
                console.error('❌ Chat initialization error:', error);
            }
        } else {
            console.error('⚠️ Chat manager or socket not available:', {
                chatManager: !!window.chatManager,
                socket: !!this.socket,
                chatManagerType: typeof window.chatManager,
                socketType: typeof this.socket
            });
            
            // Try to create chat manager if it doesn't exist
            if (!window.chatManager && typeof ChatManager !== 'undefined') {
                console.log('💬 Creating new ChatManager instance...');
                window.chatManager = new ChatManager();
                if (this.socket) {
                    window.chatManager.initialize(this.socket);
                }
            }
        }
        
        this.isInitialized = true;
        console.log('Game started successfully!');
    }

    updateLoadingText(text) {
        const loadingElement = document.getElementById('loading-text');
        if (loadingElement) {
            loadingElement.textContent = text;
        }
    }
    
    /**
     * Update loading progress bar
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} message - Optional message to display
     */
    updateLoadingProgress(progress, message = null) {
        // Clamp progress between 0 and 100
        this.loadingProgress = Math.max(0, Math.min(100, progress));
        
        // Update progress bar
        const progressBar = document.getElementById('loading-progress-bar');
        const progressText = document.getElementById('loading-progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${this.loadingProgress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(this.loadingProgress)}%`;
        }
        
        // Update text if provided
        if (message) {
            this.updateLoadingText(message);
        }
        
        console.log(`Loading progress: ${this.loadingProgress}% ${message || ''}`);
    }

    showError(message) {
        const loadingElement = document.getElementById('loading-text');
        if (loadingElement) {
            loadingElement.textContent = `Error: ${message}`;
            loadingElement.style.color = '#ff6b6b';
        }
    }
    
    /**
     * Désactive les contrôles du jeu temporairement
     * @param {string} source - Source de la désactivation (ex: 'chat', 'battle')
     */
    disableControls(source = 'unknown') {
        this.disabledBy.add(source);
        this.controlsDisabled = true;
        console.log(`🚫 Contrôles désactivés par: ${source}`);
    }
    
    /**
     * Réactive les contrôles du jeu
     * @param {string} source - Source qui libère les contrôles
     */
    enableControls(source = 'unknown') {
        this.disabledBy.delete(source);
        
        // Ne réactiver que si plus aucune source ne bloque
        if (this.disabledBy.size === 0) {
            this.controlsDisabled = false;
            console.log(`✅ Contrôles réactivés (libéré par: ${source})`);
        } else {
            console.log(`⏳ Contrôles toujours désactivés par: ${Array.from(this.disabledBy).join(', ')}`);
        }
    }
    
    /**
     * Vérifie si les contrôles sont actifs
     */
    areControlsEnabled() {
        return !this.controlsDisabled;
    }
    
    /**
     * Refresh the game with improved ORAS settings
     */
    async refreshORASExperience() {
        try {
            console.log('🔄 Refreshing game with Pokemon ORAS improvements...');
            
            // Show loading overlay
            document.getElementById('loading-screen').classList.add('active');
            document.getElementById('game-screen').classList.remove('active');
            this.updateLoadingText('Applying Pokemon ORAS improvements...');
            
            // Wait a moment for UI update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Load Slateport City as the new default map
            await this.loadMap('slateport_city');
            this.updateLoadingText('Loading Calem player model...');
            
            // Recreate player with improved settings
            await this.createPlayer();
            this.updateLoadingText('Setting up Pokemon ORAS camera...');
            
            // Apply final camera improvements
            this.camera.radius = 12;
            this.camera.beta = Math.PI / 4;
            this.camera.alpha = -Math.PI / 2;
            this.camera.setTarget(this.player.position.add(new BABYLON.Vector3(0, 1.8, 0)));
            
            console.log('✅ Pokemon ORAS experience improved!');
            console.log('📍 Now in Slateport City with Calem model');
            console.log('🎥 Enhanced ORAS camera activated');
            
            // Hide loading and show game
            document.getElementById('loading-screen').classList.remove('active');
            document.getElementById('game-screen').classList.add('active');
            
        } catch (error) {
            console.error('❌ Error refreshing ORAS experience:', error);
            this.showError('Failed to apply improvements. Please refresh the page.');
        }
    }
}

// Initialize game manager
document.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});