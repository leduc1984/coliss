class PlayerController {
    constructor(playerMesh, camera, scene, socket, userRole = 'user') {
        this.player = playerMesh;
        this.camera = camera;
        this.scene = scene;
        this.socket = socket;
        this.userRole = userRole; // Store user role for movement behavior
        
        // Movement properties
        this.moveSpeed = 5.0;
        this.rotationSpeed = 3.0;
        this.isMoving = false;
        
        // Admin-specific movement properties
        this.isAdmin = userRole === 'admin' || userRole === 'co-admin';
        this.adminPreciseMovement = this.isAdmin; // Enable precise movement for admins
        
        // Input state
        this.inputMap = {};
        this.lastPosition = this.player.position.clone();
        this.lastRotation = this.player.rotation.clone();
        
        // Animation
        this.walkAnimation = null;
        this.idleAnimation = null;
        
        // Store reference to game manager for animations
        this.gameManager = window.gameManager;
        
        this.initializeControls();
        this.setupMovementLoop();
        
        console.log(`Player controller initialized for ${userRole} with ${this.adminPreciseMovement ? 'precise' : 'standard'} movement`);
    }

    initializeControls() {
        // Initialize input map
        this.inputMap = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            run: false
        };

        // Use direct keyboard event listeners for better compatibility
        window.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        window.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });

        // Setup Pokemon ORAS-style camera with locked target for smooth following
        this.setupORASCamera();
        
        console.log(`Player controls initialized for ${this.userRole} with enhanced ORAS camera`);
    }
    
    setupORASCamera() {
        // Setup Pokemon ORAS-style camera that follows player precisely
        console.log('🎮 Setting up ORAS-style camera');
        
        // Apply ORAS camera settings
        this.camera.alpha = -Math.PI / 2;   // -Math.PI / 2 (look straight ahead)
        this.camera.beta = Math.PI / 4;     // Math.PI / 4 (45 degrees, looking down)
        this.camera.radius = 25;            // 25 (distance between camera and player)
        
        // --- BUG FIX: Use lockedTarget for automatic camera following ---
        // This eliminates the conflict between manual camera updates and automatic following
        this.camera.lockedTarget = this.player;
        
        // Disable user camera controls
        this.camera.detachControl();
        
        // Lock ORAS camera constraints for fixed view
        this.camera.lowerAlphaLimit = -Math.PI / 2;
        this.camera.upperAlphaLimit = -Math.PI / 2;
        this.camera.lowerBetaLimit = Math.PI / 4;
        this.camera.upperBetaLimit = Math.PI / 4;
        this.camera.lowerRadiusLimit = 25;
        this.camera.upperRadiusLimit = 25;
        
        // Disable all camera movement for fixed ORAS view
        this.camera.inertia = 0;
        this.camera.angularSensibilityX = 0;
        this.camera.angularSensibilityY = 0;
        this.camera.panningSensibility = 0;
        this.camera.wheelPrecision = 0;
        this.camera.pinchPrecision = 0;
        
        console.log('✅ ORAS camera configured and locked to player');
    }

    /**
     * Update the camera reference
     * @param {BABYLON.Camera} newCamera - The new camera to use
     */
    updateCamera(newCamera) {
        // If called with a camera parameter, update to the new camera
        if (newCamera && newCamera !== this.camera) {
            console.log(`📷 Updating player controller camera from ${this.camera?.name || 'unknown'} to ${newCamera.name || 'unknown'}`);
            
            // Store the new camera
            this.camera = newCamera;
            
            // Apply ORAS camera settings to the new camera to maintain consistent gameplay
            if (window.gameManager && typeof window.gameManager.applyORASCameraSettings === 'function') {
                window.gameManager.applyORASCameraSettings(newCamera);
            }
            
            // --- BUG FIX: Apply lockedTarget to new camera ---
            this.camera.lockedTarget = this.player;
            
            console.log('✅ Player controller camera updated successfully');
        }
    }

    handleKeyDown(event) {
        // Vérifier si les contrôles sont désactivés
        if (window.gameManager && !window.gameManager.areControlsEnabled()) {
            console.log('🔕 Controls are disabled, ignoring key press');
            return; // Ne pas traiter les touches si les contrôles sont désactivés
        }
        
        // Comprehensive safety checks
        if (!event) {
            return; // Skip silently
        }
        
        // Ensure we have either code or key
        if (!event.code && !event.key) {
            return; // Skip silently
        }
        
        const keyCode = event.code || '';
        const keyLower = (event.key && typeof event.key === 'string') ? event.key.toLowerCase() : '';
        const identifier = keyCode || keyLower;
        
        if (!identifier) {
            return; // Skip silently
        }
        
        console.log(`🔑 Key pressed: ${identifier}`);
        
        switch(identifier) {
            case 'KeyW':
            case 'ArrowUp':
            case 'w':
                this.inputMap.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
            case 's':
                this.inputMap.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
            case 'a':
                this.inputMap.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
            case 'd':
                this.inputMap.right = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
            case 'Space':
            case 'shift':
            case ' ':
                this.inputMap.run = true;
                break;
            case 'KeyP': // Debug key
            case 'p':
                console.log('🔍 DEBUG INFO:');
                console.log('Player position:', this.player.position);
                console.log('Player rotation:', this.player.rotation);
                console.log('Camera alpha:', this.camera.alpha);
                console.log('Camera beta:', this.camera.beta);
                console.log('Camera radius:', this.camera.radius);
                console.log('Camera target:', this.camera.getTarget());
                break;
            case 'F1':
                // Toggle debug overlay
                const debugOverlay = document.getElementById('debug-overlay');
                if (debugOverlay) {
                    debugOverlay.classList.toggle('active');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'F5':
                // Refresh ORAS experience
                if (window.gameManager && window.gameManager.refreshORASExperience) {
                    console.log('🔄 Triggering ORAS experience refresh...');
                    window.gameManager.refreshORASExperience();
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'Digit0':
            case '0':
                // Start random Pokemon battle for testing
                this.startRandomBattle();
                if (event.preventDefault) event.preventDefault();
                break;
            case 'Digit8':
            case '8':
                // Start AI trainer battle for testing (admin only)
                if (this.isAdmin) {
                    console.log('🤖 Starting AI trainer battle for testing...');
                    this.startAITrainerBattle();
                } else {
                    console.log('🚫 Access denied: Admin privileges required for AI battles');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'Digit7':
            case '7':
                // Trigger grass encounter simulation (admin only)
                if (this.isAdmin) {
                    console.log('🌿 Simulating grass encounter...');
                    this.simulateGrassEncounter();
                } else {
                    console.log('🚫 Access denied: Admin privileges required for grass encounters');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'Digit6':
            case '6':
                // Show admin battle testing help
                if (this.isAdmin) {
                    this.showAdminBattleHelp();
                } else {
                    console.log('🚫 Access denied: Admin privileges required');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'Digit9':
            case '9':
                // Open map editor in new tab (admin only)
                if (this.isAdmin) {
                    console.log('🗺️ Opening Map Editor in new tab...');
                    window.open('/pokemon-map-editor/', '_blank');
                } else {
                    console.log('🚫 Access denied: Admin privileges required for map editor');
                }
                if (event.preventDefault) event.preventDefault();
                break;
        }
        
        // Prevent default browser behavior for game keys
        if (event.preventDefault && keyCode && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(keyCode)) {
            event.preventDefault();
        }
    }

    handleKeyUp(event) {
        // Vérifier si les contrôles sont désactivés
        if (window.gameManager && !window.gameManager.areControlsEnabled()) {
            return; // Ne pas traiter les touches si les contrôles sont désactivés
        }
        
        // Comprehensive safety checks
        if (!event) {
            return; // Skip silently
        }
        
        // Ensure we have either code or key
        if (!event.code && !event.key) {
            return; // Skip silently
        }
        
        const keyCode = event.code || '';
        const keyLower = (event.key && typeof event.key === 'string') ? event.key.toLowerCase() : '';
        const identifier = keyCode || keyLower;
        
        if (!identifier) {
            return; // Skip silently
        }
        
        switch(identifier) {
            case 'KeyW':
            case 'ArrowUp':
            case 'w':
                this.inputMap.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
            case 's':
                this.inputMap.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
            case 'a':
                this.inputMap.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
            case 'd':
                this.inputMap.right = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
            case 'Space':
            case 'shift':
            case ' ':
                this.inputMap.run = false;
                break;
        }
    }

    setupMovementLoop() {
        // Movement update loop
        this.scene.registerBeforeRender(() => {
            this.updateMovement();
            this.updateCamera();
            this.checkPositionChange();
            this.updateDebugInfo();
            this.updateMovementIndicator();
        });
    }

    updateMovement() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        let moved = false;
        
        // Phase 3: Implémentation du mouvement selon TODO spécifications ORAS
        // "Le mouvement doit être relatif à la direction de la caméra"
        let moveVector = BABYLON.Vector3.Zero();
        
        // Calculer la direction: Le mouvement doit être relatif à la direction de la caméra
        // Get camera's forward direction (where it's looking) - ORAS style calculation
        const cameraForward = this.camera.getForwardRay().direction;
        const cameraRight = BABYLON.Vector3.Cross(cameraForward, BABYLON.Vector3.Up());
        
        // Normalize directions and project to horizontal plane for ORAS movement
        const forwardDir = new BABYLON.Vector3(cameraForward.x, 0, cameraForward.z).normalize();
        const rightDir = new BABYLON.Vector3(cameraRight.x, 0, cameraRight.z).normalize();
        
        // TODO Phase 3: Mapping exact selon spécifications
        // "Quand le joueur appuie sur W (avancer), le personnage doit bouger dans la direction où la caméra regarde"
        if (this.inputMap.forward) {
            // W: Move in camera's forward direction (but on horizontal plane)
            moveVector.addInPlace(forwardDir);
            moved = true;
        }
        if (this.inputMap.backward) {
            // S: Move backward relative to camera direction
            moveVector.subtractInPlace(forwardDir);
            moved = true;
        }
        
        // "Quand il appuie sur A (gauche), il doit bouger à 90 degrés à gauche de la direction de la caméra"
        if (this.inputMap.left) {
            // A: Move 90 degrees left of camera direction
            moveVector.subtractInPlace(rightDir);
            moved = true;
        }
        if (this.inputMap.right) {
            // D: Move 90 degrees right of camera direction
            moveVector.addInPlace(rightDir);
            moved = true;
        }

        if (moved) {
            // Normalize diagonal movement for consistent speed
            if (moveVector.length() > 1) {
                moveVector.normalize();
            }

            // Apply speed modifiers
            let currentSpeed = this.moveSpeed;
            
            // Running speed bonus
            if (this.inputMap.run) {
                currentSpeed *= 1.5; // 50% faster when running
            }
            
            // Admin-specific speed adjustment for precise control
            if (this.adminPreciseMovement) {
                currentSpeed *= 0.8; // 20% slower for precise control
            }

            // Calculate movement with enhanced smoothness
            const movement = moveVector.scale(currentSpeed * deltaTime);

            // "Déplacer le personnage : Utilise la méthode playerMesh.moveWithCollisions(directionVector)"
            if (this.player.moveWithCollisions && typeof this.player.moveWithCollisions === 'function') {
                // Use Babylon.js collision system if available
                this.player.moveWithCollisions(movement);
            } else {
                // Manual movement for GLB models
                this.player.position.addInPlace(movement);
                
                // Enhanced boundary check to prevent going out of bounds
                const maxDistance = 50; // Maximum distance from origin
                if (this.player.position.length() > maxDistance) {
                    this.player.position.normalize().scaleInPlace(maxDistance);
                }
            }

            // "Orienter le personnage : Le modèle 3D du joueur doit pivoter pour faire face à la direction dans laquelle il se déplace"
            if (moveVector.length() > 0) {
                // Calculate target rotation based on movement direction
                const targetRotation = Math.atan2(moveVector.x, moveVector.z);
                
                if (this.adminPreciseMovement) {
                    // Instant rotation for admin precise control
                    this.player.rotation.y = targetRotation;
                } else {
                    // Smooth rotation transition for authentic ORAS feel
                    const currentY = this.player.rotation.y;
                    let diff = targetRotation - currentY;
                    
                    // Handle rotation wrap-around (choose shortest path)
                    if (Math.abs(diff) > Math.PI) {
                        diff = diff - Math.sign(diff) * 2 * Math.PI;
                    }
                    
                    // Apply smooth rotation with ORAS-appropriate speed
                    const rotationSpeedMultiplier = 4.0; // Quick but smooth rotation
                    this.player.rotation.y += diff * rotationSpeedMultiplier * deltaTime;
                }
            }

            this.isMoving = true;
        } else {
            // Stop moving
            this.isMoving = false;
        }

        // Update animation state with enhanced transitions (Phase 3: Gérer les animations de mouvement)
        this.updateAnimationState();
    }

    updateAnimationState() {
        // Phase 3: Gérer les animations de mouvement selon TODO
        // "Crée une variable d'état, par exemple isMoving."
        // "Quand le joueur appuie sur une touche de mouvement pour la première fois, 
        // arrête en fondu l'animation "idle" et lance en fondu l'animation "walk".
        // Quand le joueur relâche toutes les touches de mouvement, 
        // arrête en fondu l'animation "walk" et relance l'animation "idle"."
        
        if (!this.gameManager || !this.gameManager.setPlayerAnimation) {
            return; // Animation system not ready
        }
        
        if (this.isMoving) {
            // Choose between walk and run animation
            if (this.inputMap.run) {
                this.gameManager.setPlayerAnimation('run');
            } else {
                this.gameManager.setPlayerAnimation('walk');
            }
        } else {
            // Play idle animation when stationary
            this.gameManager.setPlayerAnimation('idle');
        }
    }

    checkPositionChange() {
        // Check if player position or rotation changed significantly
        const positionThreshold = 0.1;
        const rotationThreshold = 0.1;
        
        const positionChanged = BABYLON.Vector3.Distance(this.player.position, this.lastPosition) > positionThreshold;
        const rotationChanged = Math.abs(this.player.rotation.y - this.lastRotation.y) > rotationThreshold;
        
        if (positionChanged || rotationChanged) {
            // Send position update to server
            this.sendPositionUpdate();
            
            // Update last known position/rotation
            this.lastPosition = this.player.position.clone();
            this.lastRotation = this.player.rotation.clone();
        }
    }

    sendPositionUpdate() {
        if (this.socket && this.socket.connected) {
            const positionData = {
                position: {
                    x: this.player.position.x,
                    y: this.player.position.y,
                    z: this.player.position.z
                },
                rotation: {
                    x: this.player.rotation.x,
                    y: this.player.rotation.y,
                    z: this.player.rotation.z
                },
                isMoving: this.isMoving,
                isRunning: this.inputMap.run || false
            };
            
            this.socket.emit('player_move', positionData);
        }
    }

    // Teleport player to specific position (for map transitions, etc.)
    teleportTo(position, rotation = null) {
        this.player.position = new BABYLON.Vector3(position.x, position.y, position.z);
        
        if (rotation) {
            this.player.rotation = new BABYLON.Vector3(rotation.x, rotation.y, rotation.z);
        }
        
        // With lockedTarget, we don't need to manually update the camera target
        // The camera will automatically follow the player
        // Send position update
        this.sendPositionUpdate();
        
        console.log('Player teleported to:', position);
    }

    // Get current player state
    getPlayerState() {
        return {
            position: this.player.position,
            rotation: this.player.rotation,
            isMoving: this.isMoving,
            isRunning: this.inputMap.run || false
        };
    }

    // Set movement speed (useful for different terrains, status effects, etc.)
    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }

    // Enable/disable player controls
    setControlsEnabled(enabled) {
        if (enabled) {
            // Re-initialize keyboard event listeners
            this.initializeControls();
        } else {
            // Clear input map when disabled
            this.inputMap = {
                forward: false,
                backward: false,
                left: false,
                right: false,
                run: false
            };
        }
    }
    
    // Debug system for orientation troubleshooting
    updateDebugInfo() {
        // Update debug overlay if visible
        const debugOverlay = document.getElementById('debug-overlay');
        if (!debugOverlay || !debugOverlay.classList.contains('active')) {
            return;
        }
        
        const pos = this.player.position;
        const rot = this.player.rotation;
        
        const posEl = document.getElementById('debug-position');
        const rotEl = document.getElementById('debug-rotation');
        const camEl = document.getElementById('debug-camera');
        const movEl = document.getElementById('debug-moving');
        
        if (posEl) posEl.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        if (rotEl) rotEl.textContent = `${(rot.y * 180 / Math.PI).toFixed(1)}°`;
        if (camEl) camEl.textContent = `α: ${(this.camera.alpha * 180 / Math.PI).toFixed(1)}°, β: ${(this.camera.beta * 180 / Math.PI).toFixed(1)}°, r: ${this.camera.radius.toFixed(1)}`;
        if (movEl) movEl.textContent = this.isMoving ? (this.inputMap.run ? 'Running' : 'Walking') : 'Idle';
    }
    
    updateMovementIndicator() {
        // Update movement direction arrows
        const arrows = {
            up: document.getElementById('arrow-up'),
            down: document.getElementById('arrow-down'),
            left: document.getElementById('arrow-left'),
            right: document.getElementById('arrow-right')
        };
        
        const center = document.getElementById('movement-center');
        
        // Update arrow states
        if (arrows.up) arrows.up.classList.toggle('active', this.inputMap.forward);
        if (arrows.down) arrows.down.classList.toggle('active', this.inputMap.backward);
        if (arrows.left) arrows.left.classList.toggle('active', this.inputMap.left);
        if (arrows.right) arrows.right.classList.toggle('active', this.inputMap.right);
        
        // Update center state
        if (center) {
            center.classList.toggle('running', this.inputMap.run);
        }
    }
    
    /**
     * Start a random Pokemon battle for testing
     */
    startRandomBattle() {
        console.log('🎮 Starting random Pokemon battle for testing...');
        
        try {
            // Generate random wild Pokemon data
            const wildPokemon = this.generateRandomWildPokemon();
            
            // Start pokengine battle in main game
            if (window.gameManager && typeof window.gameManager.startPokengineBattle === 'function') {
                console.log('💫 Starting pokengine battle with wild Pokemon:', wildPokemon.name);
                window.gameManager.startPokengineBattle({
                    type: 'wild',
                    wildPokemon: wildPokemon,
                    environment: this.getCurrentEnvironment()
                });
            } else {
                // Fallback to integrated battle system
                if (window.gameManager && typeof window.gameManager.startIntegratedBattle === 'function') {
                    console.log('💫 Starting integrated battle with wild Pokemon:', wildPokemon.name);
                    window.gameManager.startIntegratedBattle({
                        type: 'wild',
                        wildPokemon: wildPokemon,
                        environment: this.getCurrentEnvironment()
                    });
                } else {
                    // Fallback: Use alert with Pokemon info for now
                    alert(`💫 Wild Pokemon Battle!\n\nA wild ${wildPokemon.name} (Lv.${wildPokemon.level}) appeared!\n\nMoves: ${wildPokemon.moves.join(', ')}\n\n(Battle system will be implemented here)`);
                    console.log('Battle data:', wildPokemon);
                }
            }
            
        } catch (error) {
            console.error('❌ Error starting random battle:', error);
            alert('Failed to start battle. Check console for details.');
        }
    }
    
    /**
     * Start AI trainer battle for testing
     */
    startAITrainerBattle() {
        console.log('🤖 Starting AI trainer battle for testing...');
        
        try {
            // Generate AI trainer data
            const aiTrainer = this.generateRandomAITrainer();
            
            // Start pokengine battle in main game
            if (window.gameManager && typeof window.gameManager.startPokengineBattle === 'function') {
                console.log('💫 Starting pokengine AI trainer battle:', aiTrainer.name);
                window.gameManager.startPokengineBattle({
                    type: 'trainer',
                    opponent: aiTrainer,
                    environment: this.getCurrentEnvironment()
                });
            } else {
                // Fallback to integrated battle system
                if (window.gameManager && typeof window.gameManager.startIntegratedBattle === 'function') {
                    console.log('💫 Starting AI trainer battle:', aiTrainer.name);
                    window.gameManager.startIntegratedBattle({
                        type: 'trainer',
                        opponent: aiTrainer,
                        environment: this.getCurrentEnvironment()
                    });
                } else {
                    // Fallback: Use alert for now
                    alert(`🤖 AI Trainer Battle!\n\nTrainer ${aiTrainer.name} wants to battle!\n\nTeam: ${aiTrainer.team.map(p => `${p.name} (Lv.${p.level})`).join(', ')}\n\n(AI battle system will be implemented here)`);
                    console.log('AI Trainer data:', aiTrainer);
                }
            }
            
        } catch (error) {
            console.error('❌ Error starting AI trainer battle:', error);
            alert('Failed to start AI trainer battle. Check console for details.');
        }
    }
    
    /**
     * Simulate grass encounter for testing
     */
    simulateGrassEncounter() {
        console.log('🌿 Simulating grass encounter...');
        
        // Simulate walking in grass with random encounter chance
        const encounterChance = 0.8; // 80% chance for testing
        
        if (Math.random() < encounterChance) {
            // Generate grass-appropriate Pokemon
            const grassPokemon = this.generateGrassWildPokemon();
            
            // Start pokengine battle in main game
            if (window.gameManager && typeof window.gameManager.startPokengineBattle === 'function') {
                console.log('🌿 Starting pokengine grass encounter:', grassPokemon.name);
                window.gameManager.startPokengineBattle({
                    type: 'wild_grass',
                    wildPokemon: grassPokemon,
                    environment: 'tall_grass'
                });
            } else {
                // Fallback to integrated battle system
                if (window.gameManager && typeof window.gameManager.startIntegratedBattle === 'function') {
                    console.log('🌿 Grass encounter triggered:', grassPokemon.name);
                    window.gameManager.startIntegratedBattle({
                        type: 'wild_grass',
                        wildPokemon: grassPokemon,
                        environment: 'tall_grass'
                    });
                } else {
                    alert(`🌿 Grass Encounter!\n\nYou encountered a wild ${grassPokemon.name} (Lv.${grassPokemon.level}) in the tall grass!\n\n(Grass encounter system will be implemented here)`);
                    console.log('Grass Pokemon data:', grassPokemon);
                }
            }
        } else {
            console.log('🌿 No encounter this time...');
            alert('🌿 You walked through the grass, but no Pokemon appeared.');
        }
    }
    
    /**
     * Generate random AI trainer for battle testing
     */
    generateRandomAITrainer() {
        const trainerNames = [
            'Bug Catcher Jake', 'Youngster Ben', 'Lass Emma', 'Hiker Mike',
            'Fisherman Bob', 'Camper Alex', 'Picnicker Sarah', 'Sailor Jack',
            'School Kid Lisa', 'Rich Boy Tom', 'Lady Grace', 'Gentleman Victor'
        ];
        
        const trainerTypes = [
            { type: 'bug', favorites: ['bug'] },
            { type: 'normal', favorites: ['normal'] },
            { type: 'water', favorites: ['water'] },
            { type: 'fire', favorites: ['fire'] },
            { type: 'grass', favorites: ['grass'] },
            { type: 'electric', favorites: ['electric'] }
        ];
        
        const selectedName = trainerNames[Math.floor(Math.random() * trainerNames.length)];
        const selectedType = trainerTypes[Math.floor(Math.random() * trainerTypes.length)];
        const teamSize = Math.floor(Math.random() * 3) + 1; // 1-3 Pokemon
        
        const team = [];
        for (let i = 0; i < teamSize; i++) {
            const pokemon = this.generateRandomWildPokemon();
            // Adjust level to be slightly higher for trainer battles
            pokemon.level += Math.floor(Math.random() * 3) + 2; // +2 to +5 levels
            pokemon.stats = this.calculateStatsForLevel(pokemon, pokemon.level);
            pokemon.currentHp = pokemon.stats.hp;
            team.push(pokemon);
        }
        
        return {
            name: selectedName,
            type: selectedType.type,
            team: team,
            isAI: true
        };
    }
    
    /**
     * Generate grass-specific wild Pokemon
     */
    generateGrassWildPokemon() {
        // Common grass Pokemon
        const grassPokemon = [
            { id: 16, name: 'Pidgey', type1: 'normal', type2: 'flying' },
            { id: 19, name: 'Rattata', type1: 'normal', type2: null },
            { id: 10, name: 'Caterpie', type1: 'bug', type2: null },
            { id: 13, name: 'Weedle', type1: 'bug', type2: 'poison' },
            { id: 25, name: 'Pikachu', type1: 'electric', type2: null },
            { id: 43, name: 'Oddish', type1: 'grass', type2: 'poison' },
            { id: 69, name: 'Bellsprout', type1: 'grass', type2: 'poison' },
            { id: 21, name: 'Spearow', type1: 'normal', type2: 'flying' }
        ];
        
        const randomPokemon = grassPokemon[Math.floor(Math.random() * grassPokemon.length)];
        const level = Math.floor(Math.random() * 8) + 3; // Level 3-10 for grass encounters
        
        const baseStats = {
            hp: Math.floor(15 + level * 2.5),
            attack: Math.floor(8 + level * 2),
            defense: Math.floor(8 + level * 2),
            speed: Math.floor(8 + level * 2)
        };
        
        return {
            ...randomPokemon,
            level: level,
            stats: baseStats,
            currentHp: baseStats.hp,
            moves: this.generateRandomMoves(randomPokemon.type1, randomPokemon.type2),
            status: 'normal',
            isWild: true,
            encounterType: 'grass'
        };
    }
    
    /**
     * Show admin battle testing help overlay
     */
    showAdminBattleHelp() {
        // Remove existing help overlay if present
        const existingHelp = document.getElementById('admin-battle-help');
        if (existingHelp) {
            existingHelp.remove();
            return; // Toggle off
        }
        
        const helpOverlay = document.createElement('div');
        helpOverlay.id = 'admin-battle-help';
        helpOverlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #FFD700;
            z-index: 9999;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-width: 400px;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        `;
        
        helpOverlay.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h3 style="color: #FFD700; margin: 0; font-size: 16px;">🔧 Admin Battle Testing</h3>
                <p style="color: #ccc; margin: 5px 0; font-size: 10px;">Press 6 again to close</p>
            </div>
            
            <div style="border-top: 1px solid #444; padding-top: 10px;">
                <h4 style="color: #4ECDC4; margin: 5px 0;">🎮 Battle Controls:</h4>
                <p style="margin: 3px 0;"><strong>0</strong> - Random Wild Pokemon Battle</p>
                <p style="margin: 3px 0;"><strong>8</strong> - AI Trainer Battle (Admin Only)</p>
                <p style="margin: 3px 0;"><strong>7</strong> - Grass Encounter Simulation (Admin Only)</p>
                
                <h4 style="color: #4ECDC4; margin: 10px 0 5px 0;">🗺️ Map Controls:</h4>
                <p style="margin: 3px 0;"><strong>1</strong> - Admin Map Selector (Admin Only)</p>
                <p style="margin: 3px 0;"><strong>9</strong> - Open Map Editor (Admin Only)</p>
                
                <h4 style="color: #4ECDC4; margin: 10px 0 5px 0;">📷 Camera Controls:</h4>
                <p style="margin: 3px 0;"><strong>C</strong> - Toggle First Person View</p>
                <p style="margin: 3px 0;"><strong>V</strong> - Cinematic View</p>
                <p style="margin: 3px 0;"><strong>R</strong> - Reset ORAS Camera</p>
                <p style="margin: 3px 0;"><strong>F5</strong> - Refresh ORAS Experience</p>
                
                <h4 style="color: #4ECDC4; margin: 10px 0 5px 0;">🔧 Debug:</h4>
                <p style="margin: 3px 0;"><strong>P</strong> - Debug Position Info</p>
                <p style="margin: 3px 0;"><strong>F1</strong> - Toggle Debug Overlay</p>
            </div>
            
            <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #444;">
                <button onclick="document.getElementById('admin-battle-help').remove()" style="
                    background: #dc3545; color: white; border: none; padding: 5px 15px;
                    border-radius: 3px; cursor: pointer; font-size: 11px;
                ">Close Help</button>
            </div>
        `;
        
        document.body.appendChild(helpOverlay);
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (document.getElementById('admin-battle-help')) {
                helpOverlay.remove();
            }
        }, 30000);
        
        console.log('🔧 Admin battle testing help displayed');
    }
    
    /**
     * Generate random wild Pokemon for battle testing
     */
    generateRandomWildPokemon() {
        // List of common Pokemon for testing
        const commonPokemon = [
            { id: 1, name: 'Bulbasaur', type1: 'grass', type2: 'poison' },
            { id: 4, name: 'Charmander', type1: 'fire', type2: null },
            { id: 7, name: 'Squirtle', type1: 'water', type2: null },
            { id: 25, name: 'Pikachu', type1: 'electric', type2: null },
            { id: 16, name: 'Pidgey', type1: 'normal', type2: 'flying' },
            { id: 19, name: 'Rattata', type1: 'normal', type2: null },
            { id: 10, name: 'Caterpie', type1: 'bug', type2: null },
            { id: 129, name: 'Magikarp', type1: 'water', type2: null },
            { id: 41, name: 'Zubat', type1: 'poison', type2: 'flying' },
            { id: 74, name: 'Geodude', type1: 'rock', type2: 'ground' }
        ];
        
        // Select random Pokemon
        const randomPokemon = commonPokemon[Math.floor(Math.random() * commonPokemon.length)];
        
        // Generate random level (5-15 for testing)
        const level = Math.floor(Math.random() * 11) + 5;
        
        // Generate basic stats based on level
        const baseStats = {
            hp: Math.floor(20 + level * 3),
            attack: Math.floor(10 + level * 2),
            defense: Math.floor(10 + level * 2),
            speed: Math.floor(10 + level * 2)
        };
        
        return {
            ...randomPokemon,
            level: level,
            stats: baseStats,
            currentHp: baseStats.hp,
            moves: this.generateRandomMoves(randomPokemon.type1, randomPokemon.type2),
            status: 'normal',
            isWild: true
        };
    }
    
    /**
     * Generate random moves for a Pokemon based on types
     */
    generateRandomMoves(type1, type2) {
        const moveSets = {
            normal: ['Tackle', 'Quick Attack', 'Body Slam', 'Take Down'],
            fire: ['Ember', 'Flame Wheel', 'Fire Spin', 'Flamethrower'],
            water: ['Water Gun', 'Bubble', 'Water Pulse', 'Surf'],
            electric: ['Thunder Shock', 'Spark', 'Thunder Wave', 'Thunderbolt'],
            grass: ['Vine Whip', 'Razor Leaf', 'Sleep Powder', 'Solar Beam'],
            poison: ['Poison Sting', 'Sludge', 'Toxic', 'Poison Gas'],
            flying: ['Gust', 'Wing Attack', 'Aerial Ace', 'Air Slash'],
            bug: ['String Shot', 'Bug Bite', 'Leech Life', 'Pin Missile'],
            rock: ['Rock Throw', 'Rock Slide', 'Stealth Rock', 'Stone Edge'],
            ground: ['Mud Shot', 'Earthquake', 'Dig', 'Earth Power']
        };
        
        const moves = [];
        
        // Add moves from primary type
        if (moveSets[type1]) {
            const primaryMoves = moveSets[type1];
            moves.push(primaryMoves[Math.floor(Math.random() * primaryMoves.length)]);
            if (primaryMoves.length > 1 && Math.random() > 0.5) {
                moves.push(primaryMoves[Math.floor(Math.random() * primaryMoves.length)]);
            }
        }
        
        // Add moves from secondary type
        if (type2 && moveSets[type2] && Math.random() > 0.3) {
            const secondaryMoves = moveSets[type2];
            moves.push(secondaryMoves[Math.floor(Math.random() * secondaryMoves.length)]);
        }
        
        // Add normal moves if needed
        while (moves.length < 2) {
            const normalMoves = moveSets.normal;
            const randomMove = normalMoves[Math.floor(Math.random() * normalMoves.length)];
            if (!moves.includes(randomMove)) {
                moves.push(randomMove);
            }
        }
        
        // Limit to 4 moves maximum
        return moves.slice(0, 4);
    }
    
    /**
     * Get current environment for battle background
     */
    getCurrentEnvironment() {
        // Determine environment based on current map
        const currentMap = window.gameManager?.currentMapName || 'house_inside';
        
        const environmentMap = {
            'house_inside': 'indoor',
            'drewfort': 'city',
            'fortree_city': 'forest',
            'slateport_city': 'city',
            'sootopolis_city': 'water',
            'shoal_cave_entrance_low': 'cave',
            'shoal_cave_ice_room': 'ice_cave',
            'granite_cave': 'cave',
            'fallarbor_town': 'town',
            'matrix': 'special'
        };
        
        return environmentMap[currentMap] || 'field';
    }
    
    /**
     * Handle battle end events
     */
    onBattleEnd() {
        console.log('🏆 Battle ended - returning to overworld');
        
        // Re-enable player controls if they were disabled
        if (window.gameManager && typeof window.gameManager.enableControls === 'function') {
            window.gameManager.enableControls();
        }
        
        // Focus back to main game window
        if (window.focus) {
            window.focus();
        }
        
        // Optional: Play victory/defeat sound or show results
        // This could be expanded based on battle results
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerController;
}