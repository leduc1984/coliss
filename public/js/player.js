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
        this.camera.alpha = -Math.PI / 2.5; // Angled 3/4 view
        this.camera.beta = Math.PI / 5;     // Lowered angle for a more dynamic view
        this.camera.radius = 20;            // Closer to the player
        
        // --- BUG FIX: Use lockedTarget for automatic camera following ---
        // This eliminates the conflict between manual camera updates and automatic following
        this.camera.lockedTarget = this.player;
        
        // Disable user camera controls
        this.camera.detachControl();
        
        // Lock ORAS camera constraints for fixed view
        this.camera.lowerRadiusLimit = 15;
        this.camera.upperRadiusLimit = 30;
        
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
            // Admin tool shortcuts - only available to admin users
            case 'Digit1':
            case '1':
                // Open UI Editor (admin only)
                if (this.isAdmin) {
                    console.log('🎨 Opening UI Editor panel...');
                    this.openAdminToolPanel('UI Editor', '/dev-tools/ui-editor/');
                } else {
                    console.log('🚫 Access denied: Admin privileges required for UI Editor');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'Digit2':
            case '2':
                // Open Map Editor (admin only)
                if (this.isAdmin) {
                    console.log('🗺️ Opening Map Editor panel...');
                    this.openAdminToolPanel('Map Editor', '/pokemon-map-editor/');
                } else {
                    console.log('🚫 Access denied: Admin privileges required for Map Editor');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'Digit0':
            case '0':
                // Open Admin Panel (admin only)
                if (this.isAdmin) {
                    console.log('🔧 Opening Admin Panel...');
                    this.openAdminToolPanel('Admin Panel', '/dev-tools/admin-panel/');
                } else {
                    console.log('🚫 Access denied: Admin privileges required for Admin Panel');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'KeyM':
            case 'm':
                // Open Monster Editor (admin only)
                if (this.isAdmin) {
                    console.log('👾 Opening Monster Editor panel...');
                    this.openAdminToolPanel('Monster Editor', '/dev-tools/monster-editor/');
                } else {
                    console.log('🚫 Access denied: Admin privileges required for Monster Editor');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'KeyL':
            case 'l':
                // Open Dialogue Editor (admin only)
                if (this.isAdmin) {
                    console.log('💬 Opening Dialogue Editor panel...');
                    this.openAdminToolPanel('Dialogue Editor', '/dev-tools/dialogue-editor/');
                } else {
                    console.log('🚫 Access denied: Admin privileges required for Dialogue Editor');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'Digit9':
            case '9':
                // Open map editor in new tab (admin only) - keep existing behavior
                if (this.isAdmin) {
                    console.log('🗺️ Opening Map Editor in new tab...');
                    window.open('/pokemon-map-editor/', '_blank');
                } else {
                    console.log('🚫 Access denied: Admin privileges required for map editor');
                }
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
            case 'Digit5':
            case '5':
                // Start random Pokemon battle for testing (moved from 0)
                this.startRandomBattle();
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
            this.checkPositionChange();
            this.updateDebugInfo();
            this.updateMovementIndicator();
        });
    }

    updateMovement() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        let moved = false;
        
        let moveVector = BABYLON.Vector3.Zero();
        
        const cameraForward = this.camera.getForwardRay().direction;
        const cameraRight = BABYLON.Vector3.Cross(this.scene.activeCamera.upVector, cameraForward);
        
        const forwardDir = new BABYLON.Vector3(cameraForward.x, 0, cameraForward.z).normalize();
        const rightDir = new BABYLON.Vector3(cameraRight.x, 0, cameraRight.z).normalize();
        
        if (this.inputMap.forward) {
            moveVector.addInPlace(forwardDir);
            moved = true;
        }
        if (this.inputMap.backward) {
            moveVector.subtractInPlace(forwardDir);
            moved = true;
        }
        if (this.inputMap.left) {
            moveVector.addInPlace(rightDir);
            moved = true;
        }
        if (this.inputMap.right) {
            moveVector.subtractInPlace(rightDir);
            moved = true;
        }

        if (moved) {
            if (moveVector.length() > 1) {
                moveVector.normalize();
            }

            let currentSpeed = this.moveSpeed;
            if (this.inputMap.run) {
                currentSpeed *= 1.8; // Slightly faster run
            }

            if (this.player.physicsImpostor) {
                const velocity = moveVector.scale(currentSpeed);
                this.player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(velocity.x, this.player.physicsImpostor.getLinearVelocity().y, velocity.z));
            }

            if (moveVector.length() > 0) {
                const targetRotation = Math.atan2(moveVector.x, moveVector.z);
                const currentY = this.player.rotation.y;
                let diff = targetRotation - currentY;
                if (Math.abs(diff) > Math.PI) {
                    diff = diff - Math.sign(diff) * 2 * Math.PI;
                }
                const rotationSpeedMultiplier = 8.0;
                this.player.rotation.y += diff * rotationSpeedMultiplier * deltaTime;
            }

            this.isMoving = true;
        } else {
            if (this.player.physicsImpostor) {
                this.player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, this.player.physicsImpostor.getLinearVelocity().y, 0));
            }
            this.isMoving = false;
        }

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
     * Open an admin tool panel in an iframe overlay
     * @param {string} toolName - Name of the tool
     * @param {string} toolPath - Path to the tool
     */
    openAdminToolPanel(toolName, toolPath) {
        // Remove existing tool panel if present
        const existingPanel = document.getElementById('admin-tool-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Create tool panel container
        const panel = document.createElement('div');
        panel.id = 'admin-tool-panel';
        panel.className = 'admin-tool-panel';
        
        // Create panel header
        const header = document.createElement('div');
        header.className = 'admin-tool-header';
        header.innerHTML = `
            <span class="admin-tool-title">🔧 ${toolName}</span>
            <button id="close-tool-panel" class="admin-tool-close-btn">&times;</button>
        `;
        
        // Create iframe for tool content
        const iframe = document.createElement('iframe');
        iframe.className = 'admin-tool-iframe';
        iframe.src = toolPath;
        iframe.title = `${toolName} - Admin Tool`;
        
        // Assemble panel
        panel.appendChild(header);
        panel.appendChild(iframe);
        document.body.appendChild(panel);
        
        // Add event listeners
        const closeBtn = panel.querySelector('#close-tool-panel');
        closeBtn.addEventListener('click', () => {
            panel.remove();
        });
        
        // Close panel with Escape key
        const keydownHandler = (e) => {
            if (e.key === 'Escape') {
                panel.remove();
                document.removeEventListener('keydown', keydownHandler);
            }
        };
        document.addEventListener('keydown', keydownHandler);
        
        console.log(`✅ ${toolName} panel opened`);
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
     * Show an interactive admin menu for battle testing.
     */
    showAdminBattleHelp() {
        // Remove existing menu if present
        const existingMenu = document.getElementById('admin-battle-menu');
        if (existingMenu) {
            existingMenu.remove();
            return; // Toggle off
        }
        
        const menuOverlay = document.createElement('div');
        menuOverlay.id = 'admin-battle-menu';
        menuOverlay.className = 'admin-menu-overlay'; // Use a class for styling

        menuOverlay.innerHTML = `
            <div class="admin-menu-panel">
                <div class="admin-menu-header">
                    <h3>🔧 Admin Battle Test Menu</h3>
                    <button id="close-admin-menu" class="admin-menu-close-btn">&times;</button>
                </div>
                <div class="admin-menu-content">
                    <p>Select a battle type to initiate.</p>
                    <button class="admin-menu-btn" data-action="wild">Start Wild Battle</button>
                    <button class="admin-menu-btn" data-action="grass">Simulate Grass Encounter</button>
                    <button class="admin-menu-btn" data-action="trainer">Start AI Trainer Battle</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(menuOverlay);

        const closeMenu = () => {
            menuOverlay.remove();
            document.removeEventListener('keydown', keydownHandler);
        };

        const keydownHandler = (e) => {
            if (e.key === 'Escape') {
                closeMenu();
            }
        };

        menuOverlay.querySelector('#close-admin-menu').addEventListener('click', closeMenu);
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                closeMenu();
            }
        });
        document.addEventListener('keydown', keydownHandler);

        menuOverlay.querySelector('.admin-menu-content').addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                closeMenu();
                switch (action) {
                    case 'wild':
                        this.startRandomBattle();
                        break;
                    case 'grass':
                        this.simulateGrassEncounter();
                        break;
                    case 'trainer':
                        this.startAITrainerBattle();
                        break;
                }
            }
        });
        
        console.log('🔧 Admin battle testing menu displayed');
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