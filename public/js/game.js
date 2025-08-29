// IIFE to encapsulate the game logic and avoid global scope pollution
(function() {
    'use strict';

    // --- Configuration Object ---
    const Config = {
        DEFAULT_MAP: 'matrix1',
        PLAYER_MODEL_PATH: 'calem/calem.glb',
        PLAYER_MODEL_SCALE: new BABYLON.Vector3(1.5, 1.5, 1.5),
        PLAYER_CAPSULE_IMPOSTOR: { mass: 1, restitution: 0.1, friction: 0.5 },
        PLAYER_COLLISION_ELLIPSOID: new BABYLON.Vector3(0.4, 0.8, 0.4),
        PLAYER_COLLISION_ELLIPSOID_OFFSET: new BABYLON.Vector3(0, 0.8, 0),
        
        MAP_CONFIGS: {
            'house_inside': { path: '/pokemon-map-editor/assets/maps/male_house_inside/house.glb', rotation: Math.PI },
            'drewfort': { path: '/pokemon-map-editor/assets/maps/Drewfort/drewfort.glb' },
            'fortree_city': { path: '/pokemon-map-editor/assets/maps/Fortree City/Fortree City.glb' },
            'slateport_city': { path: '/pokemon-map-editor/assets/maps/Slateport City/Slateport City.glb' },
            'sootopolis_city': { path: '/pokemon-map-editor/assets/maps/Sootopolis City/Sootopolis City.glb' },
            'shoal_cave_entrance_low': { path: '/pokemon-map-editor/assets/maps/Shoal cave/Entrance Room (Low Tide).glb' },
            'shoal_cave_ice_room': { path: '/pokemon-map-editor/assets/maps/Shoal cave/Ice Room.glb' },
            'granite_cave': { path: '/pokemon-map-editor/assets/maps/Granite Cave Origin Room/Granite Cave Origin Room.glb' },
            'fallarbor_town': { path: '/pokemon-map-editor/assets/maps/Fallarbor Town/Fallarbor Town.glb' },
            'castle_village': { path: '/pokemon-map-editor/assets/maps/castle village/castle_village_scene.glb' },
            'soaring_overworld': { path: '/pokemon-map-editor/assets/maps/soaring overworld/soaring.glb' },
            'lavaridge_town': { path: '/pokemon-map-editor/assets/maps/Lavaridge Town/Lavaridge Town.glb' },
            'matrix': { path: '/pokemon-map-editor/assets/maps/perso/matrix/matrix1.glb', collisionPath: '/pokemon-map-editor/assets/maps/perso/matrix/matrix1_collision.glb', rotation: -Math.PI / 2, isLargeMap: true },
            'matrix1': {
                path: '/pokemon-map-editor/assets/maps/perso/matrix/matrix1.glb',
                collisionPath: '/pokemon-map-editor/assets/maps/perso/matrix/matrix1_collision.glb',
                rotation: -Math.PI / 2,
                isLargeMap: true,
                cameraSettings: { alpha: -Math.PI / 2, beta: Math.PI / 4, radius: 25 }
            }
        },
        
        ADJACENCY_MAP: {
            'house_inside': ['drewfort'],
            'drewfort': ['house_inside', 'fortree_city'],
            'fortree_city': ['drewfort', 'slateport_city'],
            'slateport_city': ['fortree_city', 'sootopolis_city'],
            'sootopolis_city': ['slateport_city'],
            'matrix': ['drewfort']
        },

        ORAS_CAMERA_SETTINGS: {
            alpha: -Math.PI / 2,
            beta: Math.PI / 4,
            radius: 25,
            lowerBetaLimit: Math.PI / 4,
            upperBetaLimit: Math.PI / 4,
            lowerRadiusLimit: 25,
            upperRadiusLimit: 25,
            lowerAlphaLimit: -Math.PI / 2,
            upperAlphaLimit: -Math.PI / 2,
            inertia: 0,
            angularSensibilityX: 0,
            angularSensibilityY: 0,
            panningSensibility: 0,
            wheelPrecision: 0,
            pinchPrecision: 0,
        },
    };

    class GameManager {
        constructor() {
            this.engine = null;
            this.scene = null;
            this.camera = null;
            this.player = null;
            this.playerController = null;
            this.currentMap = null;
            this.currentMapName = Config.DEFAULT_MAP;
            this.socket = null;
            this.user = null;
            this.isInitialized = false;
            this.otherPlayers = new Map();
            this.controlsDisabled = false;
            this.disabledBy = new Set();
            this.loadingProgress = 0;

            // TODO: These should be moved to their own manager classes in a future refactoring
            this.teleportPromptShown = false;
            this.fadePlane = null;
            this.fadeMaterial = null;
            this.isFading = false;
        }

        async initialize(user, token) {
            this.user = user;
            
            try {
                this.updateLoadingProgress(10, 'Initializing 3D engine...');
                await this.initializeBabylon();

                this.updateLoadingProgress(30, 'Connecting to server...');
                await this.initializeSocket(token);

                this.updateLoadingProgress(50, 'Loading map...');
                const startMap = this.user.character?.currentMap || Config.DEFAULT_MAP;
                await this.loadMap(startMap);

                this.updateLoadingProgress(70, 'Creating player...');
                await this.createPlayer();

                this.updateLoadingProgress(80, 'Setting up controls and UI...');
                this.setupUI();

                this.updateLoadingProgress(100, 'Starting game...');
                this.startGame();
            } catch (error) {
                console.error('Game initialization error:', error);
                this.showError('Failed to start the game. Please refresh and try again.');
            }
        }

        async initializeBabylon() {
            const canvas = document.getElementById('gameCanvas');
            this.engine = new BABYLON.Engine(canvas, true, { antialias: true, adaptToDeviceRatio: true, preserveDrawingBuffer: true, stencil: true });
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.clearColor = new BABYLON.Color4(0.5, 0.8, 1.0, 1.0);

            this.setupPhysics();
            this.setupCamera();
            this.setupLighting();
            this.setupEnvironment();

            this.engine.runRenderLoop(() => {
                if (this.scene) this.scene.render();
            });

            window.addEventListener('resize', () => {
                if (this.engine) this.engine.resize();
            });

            console.log('🎮 Babylon.js engine initialized.');
        }
        
        setupPhysics() {
            try {
                if (typeof CANNON !== 'undefined') {
                    const cannonPlugin = new BABYLON.CannonJSPlugin(true, 10, CANNON);
                    this.scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), cannonPlugin);
                    console.log('✅ Physics engine enabled with Cannon.js');
                } else {
                    console.warn('⚠️ CANNON.js not available, using basic collision detection.');
                    this.useManualCollisions = true;
                }
            } catch (error) {
                console.warn('⚠️ Physics initialization failed:', error.message);
                this.useManualCollisions = true;
            }
        }

        setupCamera() {
            this.camera = new BABYLON.ArcRotateCamera("playerCamera", 0, 0, 0, BABYLON.Vector3.Zero(), this.scene);
            Object.assign(this.camera, Config.ORAS_CAMERA_SETTINGS);
            this.camera.setTarget(BABYLON.Vector3.Zero());
            this.camera.detachControl();
            console.log('📷 ORAS-style camera configured.');
        }
        
        setupLighting() {
            const hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 1, 0), this.scene);
            hemisphericLight.intensity = 0.8;

            const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -1, -1), this.scene);
            directionalLight.intensity = 0.7;
            directionalLight.position = new BABYLON.Vector3(10, 20, 10);
            
            try {
                this.shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
                this.shadowGenerator.useBlurExponentialShadowMap = true;
                this.shadowGenerator.blurScale = 2;
            } catch (e) {
                console.warn('⚠️ Shadow generator creation failed:', e.message);
            }
        }
        
        setupEnvironment() {
            try {
                const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this.scene);
                const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
                skyboxMaterial.backFaceCulling = false;
                skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://www.babylonjs-playground.com/textures/skybox", this.scene);
                skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
                skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
                skybox.material = skyboxMaterial;
            } catch (e) {
                console.warn('⚠️ Skybox setup failed:', e.message);
            }
        }

        async initializeSocket(token) {
            return new Promise((resolve, reject) => {
                this.socket = io({
                    auth: { token }
                });
                window.socket = this.socket; // For legacy access if needed

                this.socket.on('connect', () => console.log('✅ Connected to server'));
                this.socket.on('authenticated', () => {
                    console.log('🔒 Authenticated successfully');
                    this.setupSocketListeners();
                    resolve();
                });
                this.socket.on('auth_error', (error) => reject(new Error(`Authentication failed: ${error}`)));
                this.socket.on('connect_error', (error) => reject(new Error(`Connection failed: ${error}`)));
            });
        }
        
        setupSocketListeners() {
            this.socket.on('player_moved', (data) => this.updateOtherPlayer(data));
            this.socket.on('player_joined', (data) => this.addOtherPlayer(data));
            this.socket.on('player_left', (data) => this.removeOtherPlayer(data.userId));
            this.socket.on('other_players', (players) => players.forEach(p => this.addOtherPlayer(p)));
            // TODO: Move battle events to a BattleManager
            this.socket.on('battle_update', (data) => this.handleBattleUpdate(data));
        }

        async loadMap(mapName) {
            const mapConfig = Config.MAP_CONFIGS[mapName] || Config.MAP_CONFIGS[Config.DEFAULT_MAP];
            if (!mapConfig) {
                throw new Error(`Map configuration not found for "${mapName}"`);
            }
            
            console.log(`🗺️ Loading map: ${mapName}`);
            this.updateLoadingProgress(55, `Loading map: ${mapName}...`);

            // Clear previous map
            if (this.currentMap) this.currentMap.dispose();
            if (this.currentCollisionMeshes) this.currentCollisionMeshes.forEach(m => m.dispose());

            const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", mapConfig.path, this.scene);
            if (result.meshes.length === 0) throw new Error('No meshes found in map file');

            this.currentMap = result.meshes[0];
            this.currentMapName = mapName;

            // Apply transformations and setup collisions
            if (mapConfig.rotation) {
                result.meshes.forEach(mesh => { if (mesh.name !== '__root__') mesh.rotation.y = mapConfig.rotation; });
            }
            
            if (mapConfig.collisionPath) {
                await this.loadCollisionMeshes(mapConfig.collisionPath);
            } else {
                this.setupMapCollisions(result.meshes);
            }
            
            this.createMapBoundaries();
            console.log(`✅ Map loaded: ${mapName}`);
        }

        async loadCollisionMeshes(collisionPath) {
            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", collisionPath, this.scene);
                this.currentCollisionMeshes = result.meshes;
                this.setupMapCollisions(result.meshes, true);
                console.log(`🔒 Collision meshes loaded: ${result.meshes.length}`);
            } catch (error) {
                console.error('Collision loading error:', error);
            }
        }

        setupMapCollisions(meshes, isCollisionLayer = false) {
            meshes.forEach(mesh => {
                if (mesh.name === '__root__') return;
                
                mesh.checkCollisions = true;
                if (isCollisionLayer) mesh.visibility = 0;

                if (mesh.name.toLowerCase().includes('stair') || mesh.name.toLowerCase().includes('teleport')) {
                    mesh.checkCollisions = false;
                    this.setupStairTeleport(mesh);
                } else if (!this.useManualCollisions) {
                    try {
                        mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, restitution: 0 }, this.scene);
                    } catch (e) {
                        console.warn('Physics impostor creation failed for mesh:', mesh.name);
                    }
                }
            });
        }
        
        createMapBoundaries() {
            // Simplified boundary creation
            const size = 200;
            const createWall = (name, position, scaling) => {
                const wall = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
                wall.scaling = scaling;
                wall.position = position;
                wall.checkCollisions = true;
                wall.isVisible = false;
            };
            createWall("northBoundary", new BABYLON.Vector3(0, 0, size/2), new BABYLON.Vector3(size, 20, 1));
            createWall("southBoundary", new BABYLON.Vector3(0, 0, -size/2), new BABYLON.Vector3(size, 20, 1));
            createWall("eastBoundary", new BABYLON.Vector3(size/2, 0, 0), new BABYLON.Vector3(1, 20, size));
            createWall("westBoundary", new BABYLON.Vector3(-size/2, 0, 0), new BABYLON.Vector3(1, 20, size));
        }

        async createPlayer() {
            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync("", "/pokemon-map-editor/assets/player/", Config.PLAYER_MODEL_PATH, this.scene);
                if (result.meshes.length === 0) throw new Error('Player model has no meshes.');

                this.player = result.meshes[0];
                this.player.scaling = Config.PLAYER_MODEL_SCALE;
                this.player.position = new BABYLON.Vector3(-14.33, 1.0, -25.22); // Default spawn
                this.player.getChildMeshes().forEach(m => m.visibility = 1.0);

                this.player.physicsImpostor = new BABYLON.PhysicsImpostor(this.player, BABYLON.PhysicsImpostor.CapsuleImpostor, Config.PLAYER_CAPSULE_IMPOSTOR, this.scene);
                this.player.checkCollisions = true;
                this.player.ellipsoid = Config.PLAYER_COLLISION_ELLIPSOID;
                this.player.ellipsoidOffset = Config.PLAYER_COLLISION_ELLIPSOID_OFFSET;

                this.setupPlayerAnimations(result.animationGroups);
                this.camera.lockedTarget = this.player;

                const userRole = this.user?.role || 'user';
                this.playerController = new PlayerController(this.player, this.camera, this.scene, this.socket, userRole);
                console.log(`✅ Player created for ${userRole}`);
            } catch (error) {
                console.error(`❌ Failed to load player model: ${error.message}`);
                this.createFallbackPlayer();
            }
        }
        
        createFallbackPlayer() {
            this.player = BABYLON.MeshBuilder.CreateCapsule("player", { radius: 0.4, height: 1.8 }, this.scene);
            this.player.position = new BABYLON.Vector3(0, 1, 0);
            this.player.checkCollisions = true;
            this.playerController = new PlayerController(this.player, this.camera, this.scene, this.socket, 'user');
            console.log(`⚠️ Created fallback player.`);
        }

        setupPlayerAnimations(animationGroups) {
            // Simplified animation setup
            this.playerAnimations = {
                idle: animationGroups.find(ag => ag.name.toLowerCase().includes('idle')),
                walk: animationGroups.find(ag => ag.name.toLowerCase().includes('walk')),
                run: animationGroups.find(ag => ag.name.toLowerCase().includes('run')),
            };

            Object.values(this.playerAnimations).forEach(anim => {
                if (anim) {
                    anim.start(true, 1.0, anim.from, anim.to, false);
                    anim.setWeightForAllAnimatables(0);
                }
            });

            if (this.playerAnimations.idle) {
                this.playerAnimations.idle.setWeightForAllAnimatables(1);
                this.currentPlayerAnimation = 'idle';
            }
        }

        setPlayerAnimation(type) {
            if (!this.playerAnimations || this.currentPlayerAnimation === type) return;

            const currentAnim = this.playerAnimations[this.currentPlayerAnimation];
            const nextAnim = this.playerAnimations[type];

            if (currentAnim) currentAnim.setWeightForAllAnimatables(0);
            if (nextAnim) nextAnim.setWeightForAllAnimatables(1);
            
            this.currentPlayerAnimation = type;
        }
        
        setupUI() {
            document.getElementById('playerRole').textContent = this.user.role;
            document.getElementById('playerRole').className = `role-badge role-${this.user.role}`;
            
            if (this.user.role === 'admin' || this.user.role === 'co-admin') {
                const adminControls = document.getElementById('adminControls');
                if (adminControls) {
                    adminControls.style.display = 'block';
                }
                if (window.AdminMapSelector) {
                    window.adminMapSelector = new AdminMapSelector(this, this.socket);
                }
            }
            
            document.getElementById('logoutBtn').addEventListener('click', () => window.authManager.logout());
        }

        async addOtherPlayer(playerData) {
            if (this.otherPlayers.has(playerData.userId)) return;
            
            const modelFile = (playerData.role === 'admin' || playerData.role === 'co-admin') ? 'admin.glb' : 'player.glb';
            let otherPlayer;
            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync("", "/pokemon-map-editor/assets/player/", modelFile, this.scene);
                otherPlayer = result.meshes[0];
            } catch (e) {
                otherPlayer = BABYLON.MeshBuilder.CreateCapsule(`player_${playerData.userId}`, { radius: 0.5, height: 1.8 }, this.scene);
            }
            
            otherPlayer.position = new BABYLON.Vector3(playerData.position.x, playerData.position.y, playerData.position.z);
            const nameTag = this.createNameTag(playerData.username, playerData.role);
            nameTag.parent = otherPlayer;
            nameTag.position.y = 2.5;
            
            this.otherPlayers.set(playerData.userId, { mesh: otherPlayer, nameTag: nameTag });
        }

        updateOtherPlayer(playerData) {
            const player = this.otherPlayers.get(playerData.userId);
            if (player) {
                const targetPosition = new BABYLON.Vector3(playerData.position.x, playerData.position.y, playerData.position.z);
                BABYLON.Animation.CreateAndStartAnimation("playerMove", player.mesh, "position", 30, 10, player.mesh.position, targetPosition);
            }
        }

        removeOtherPlayer(userId) {
            const player = this.otherPlayers.get(userId);
            if (player) {
                player.mesh.dispose();
                player.nameTag.dispose();
                this.otherPlayers.delete(userId);
            }
        }

        createNameTag(username, role = 'user') {
            const nameTag = BABYLON.MeshBuilder.CreatePlane("nameTag", {size: 2}, this.scene);
            const nameTexture = new BABYLON.DynamicTexture("nameTexture", {width: 256, height: 64}, this.scene);
            nameTexture.hasAlpha = true;
            nameTexture.drawText(username, null, null, "bold 24px Arial", role === 'admin' ? '#FFD700' : '#FFFFFF', "transparent", true);
            
            const nameMaterial = new BABYLON.StandardMaterial("nameMaterial", this.scene);
            nameMaterial.diffuseTexture = nameTexture;
            nameMaterial.emissiveTexture = nameTexture;
            nameTag.material = nameMaterial;
            nameTag.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
            
            return nameTag;
        }

        startGame() {
            document.getElementById('loading-screen').classList.remove('active');
            document.getElementById('game-screen').classList.add('active');
            document.getElementById('currentMap').textContent = this.currentMapName;
            document.getElementById('chat-panel').style.display = 'block';
            console.log('🚀 Game started successfully!');
        }

        updateLoadingProgress(progress, message = null) {
            this.loadingProgress = Math.max(0, Math.min(100, progress));
            const progressBar = document.getElementById('loading-progress-bar');
            if (progressBar) progressBar.style.width = `${this.loadingProgress}%`;
            if (message) this.updateLoadingText(message);
        }

        updateLoadingText(text) {
            const loadingElement = document.getElementById('loading-text');
            if (loadingElement) loadingElement.textContent = text;
        }

        showError(message) {
            const loadingElement = document.getElementById('loading-text');
            if (loadingElement) {
                loadingElement.textContent = `Error: ${message}`;
                loadingElement.style.color = '#ff6b6b';
            }
        }

        disableControls(source = 'unknown') {
            this.disabledBy.add(source);
            this.controlsDisabled = true;
        }
        
        enableControls(source = 'unknown') {
            this.disabledBy.delete(source);
            if (this.disabledBy.size === 0) {
                this.controlsDisabled = false;
            }
        }
        
        areControlsEnabled() {
            return !this.controlsDisabled;
        }
        
        // --- Battle related methods to be moved to a BattleManager ---
        handleBattleUpdate(data) {
            console.log('Battle update received:', data);
            if (this.battleModule) {
                this.battleModule.updateBattleState(data);
            }
        }

        // ... other battle methods ...
    }

    // Initialize game manager
    document.addEventListener('DOMContentLoaded', () => {
        window.gameManager = new GameManager();
    });

})();