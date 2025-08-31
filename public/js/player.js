(function() {
    'use strict';

<<<<<<< HEAD
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
        
        // Apply ORAS camera settings (authentic Pokemon ORAS characteristics)
        this.camera.alpha = -Math.PI / 2;    // Behind player, facing north
        this.camera.beta = Math.PI / 3.5;    // Characteristic 50-degree viewing angle
        this.camera.radius = 8;              // Authentic ORAS distance
        
        // --- BUG FIX: Use lockedTarget for automatic camera following ---
        // This eliminates the conflict between manual camera updates and automatic following
        this.camera.lockedTarget = this.player;
        
        // Disable user camera controls
        this.camera.detachControl();
        
        // Lock ORAS camera constraints for fixed view
        this.camera.lowerRadiusLimit = 8;
        this.camera.upperRadiusLimit = 8;
        
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
                console.log('Player rotation (radians):', this.player.rotation);
                console.log('Player rotation (degrees):', {
                    x: (this.player.rotation.x * 180 / Math.PI).toFixed(2),
                    y: (this.player.rotation.y * 180 / Math.PI).toFixed(2),
                    z: (this.player.rotation.z * 180 / Math.PI).toFixed(2)
                });
                console.log('Camera alpha (radians):', this.camera.alpha);
                console.log('Camera alpha (degrees):', (this.camera.alpha * 180 / Math.PI).toFixed(2));
                console.log('Camera beta (radians):', this.camera.beta);
                console.log('Camera beta (degrees):', (this.camera.beta * 180 / Math.PI).toFixed(2));
                console.log('Camera radius:', this.camera.radius);
                console.log('Camera target:', this.camera.getTarget());
                console.log('Movement state:', this.isMoving ? (this.inputMap.run ? 'Running' : 'Walking') : 'Idle');
                console.log('Input map:', this.inputMap);
                break;
            case 'F1':
                // Toggle debug overlay
                const debugOverlay = document.getElementById('debug-overlay');
                if (debugOverlay) {
                    debugOverlay.classList.toggle('active');
                }
                if (event.preventDefault) event.preventDefault();
                break;
            case 'F2':
                // Launch Babylon.js Inspector to investigate visual objects
                if (this.scene && this.scene.debugLayer) {
                    if (this.scene.debugLayer.isVisible()) {
                        this.scene.debugLayer.hide();
                    } else {
                        this.scene.debugLayer.show();
                    }
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
        
        // World-relative movement (Pokemon style)
        let moveVector = BABYLON.Vector3.Zero();
        
        if (this.inputMap.forward) {
            moveVector.z += 1; // Move north (positive Z)
            moved = true;
        }
        if (this.inputMap.backward) {
            moveVector.z -= 1; // Move south (negative Z)  
            moved = true;
        }
        if (this.inputMap.left) {
            moveVector.x += 1; // Move east (positive X) - Fix: changed from -= to +=
            moved = true;
        }
        if (this.inputMap.right) {
            moveVector.x -= 1; // Move west (negative X) - Fix: changed from += to -=
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

            // Use physics impostor if available, otherwise use direct position manipulation
            if (this.player.physicsImpostor) {
                const velocity = moveVector.scale(currentSpeed);
                this.player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(velocity.x, this.player.physicsImpostor.getLinearVelocity().y, velocity.z));
            } else {
                // Manual movement when physics is not available
                const movement = moveVector.scale(currentSpeed * deltaTime);
                this.player.position.addInPlace(movement);
            }

            // Fixed rotation calculation using world coordinates
            const targetRotation = Math.atan2(moveVector.x, moveVector.z);
            const currentY = this.player.rotation.y;
            let diff = targetRotation - currentY;
            if (Math.abs(diff) > Math.PI) {
                diff = diff - Math.sign(diff) * 2 * Math.PI;
            }
            const rotationSpeedMultiplier = 8.0;
            this.player.rotation.y += diff * rotationSpeedMultiplier * deltaTime;

            this.isMoving = true;
        } else {
            // Use physics impostor if available, otherwise use direct position manipulation
            if (this.player.physicsImpostor) {
                // Check if getLinearVelocity returns a valid value before using it
                const currentVelocity = this.player.physicsImpostor.getLinearVelocity();
                if (currentVelocity) {
                    this.player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, currentVelocity.y || 0, 0));
                } else {
                    // If no velocity is available, just set it to zero with y=0
                    this.player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
                }
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
        
        // Reset physics velocity if physics is enabled
        if (this.player.physicsImpostor) {
            this.player.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
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
=======
    // --- Input Manager ---
    class InputManager {
        constructor(playerController) {
>>>>>>> fd63a9deaee7b81a36ca4e0b566595344472f5ca
            this.inputMap = {
                forward: false,
                backward: false,
                left: false,
                right: false,
                run: false,
            };
            this.playerController = playerController;
            this.isAdmin = playerController.userRole === 'admin' || playerController.userRole === 'co-admin';

            window.addEventListener('keydown', (e) => this.handleKeyDown(e));
            window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        }

        handleKeyDown(event) {
            if (!this.playerController.gameManager.areControlsEnabled()) return;
            
            const key = event.key.toLowerCase();
            switch (key) {
                case 'w': case 'arrowup': this.inputMap.forward = true; break;
                case 's': case 'arrowdown': this.inputMap.backward = true; break;
                case 'a': case 'arrowleft': this.inputMap.left = true; break;
                case 'd': case 'arrowright': this.inputMap.right = true; break;
                case 'shift': case ' ': this.inputMap.run = true; break;
            }

            if (this.isAdmin) this.handleAdminKeys(key, event);
        }

        handleKeyUp(event) {
            if (!this.playerController.gameManager.areControlsEnabled()) return;

            const key = event.key.toLowerCase();
            switch (key) {
                case 'w': case 'arrowup': this.inputMap.forward = false; break;
                case 's': case 'arrowdown': this.inputMap.backward = false; break;
                case 'a': case 'arrowleft': this.inputMap.left = false; break;
                case 'd': case 'arrowright': this.inputMap.right = false; break;
                case 'shift': case ' ': this.inputMap.run = false; break;
            }
        }

        handleAdminKeys(key, event) {
            switch(key) {
                case '7': this.playerController.simulateGrassEncounter(); event.preventDefault(); break;
                case '8': this.playerController.startAITrainerBattle(); event.preventDefault(); break;
                case '9': window.open('/pokemon-map-editor/', '_blank'); event.preventDefault(); break;
                case '0': this.playerController.startRandomBattle(); event.preventDefault(); break;
            }
        }
    }

    // --- Animation State Machine ---
    class AnimationState {
        constructor(playerController) {
            this.playerController = playerController;
            this.gameManager = playerController.gameManager;
            this.currentState = 'idle';
        }

        setState(newState) {
            if (this.currentState === newState) return;

            this.gameManager.setPlayerAnimation(newState);
            this.currentState = newState;
        }

        update(isMoving, isRunning) {
            if (isMoving) {
                this.setState(isRunning ? 'run' : 'walk');
            } else {
                this.setState('idle');
            }
        }
    }

    // --- Player Controller ---
    class PlayerController {
        constructor(playerMesh, camera, scene, socket, userRole = 'user', gameManager) {
            this.player = playerMesh;
            this.camera = camera;
            this.scene = scene;
            this.socket = socket;
            this.userRole = userRole;
            this.gameManager = gameManager; // Decoupled from window.gameManager

            this.moveSpeed = 5.0;
            this.isMoving = false;
            this.lastPosition = this.player.position.clone();
            this.lastRotation = this.player.rotation.clone();

            this.inputManager = new InputManager(this);
            this.animationState = new AnimationState(this);

            this.initialize();
        }

        initialize() {
            this.setupORASCamera();
            this.setupMovementLoop();
            console.log(`Player controller initialized for ${this.userRole}.`);
        }

        setupORASCamera() {
            this.camera.lockedTarget = this.player;
            this.camera.detachControl();
            console.log('✅ ORAS camera locked to player.');
        }

        setupMovementLoop() {
            this.scene.registerBeforeRender(() => {
                this.updateMovement();
                this.checkPositionChange();
            });
        }

        updateMovement() {
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
            const moveVector = new BABYLON.Vector3.Zero();
            const input = this.inputManager.inputMap;

            const cameraForward = this.camera.getForwardRay().direction;
            const forwardDir = new BABYLON.Vector3(cameraForward.x, 0, cameraForward.z).normalize();
            const rightDir = new BABYLON.Vector3.Cross(this.scene.activeCamera.upVector, cameraForward).normalize();

            if (input.forward) moveVector.addInPlace(forwardDir);
            if (input.backward) moveVector.subtractInPlace(forwardDir);
            if (input.left) moveVector.addInPlace(rightDir);
            if (input.right) moveVector.subtractInPlace(rightDir);

            this.isMoving = moveVector.length() > 0.1;

            if (this.isMoving) {
                moveVector.normalize();
                const currentSpeed = this.moveSpeed * (input.run ? 1.8 : 1);

                if (this.player.physicsImpostor) {
                    const velocity = moveVector.scale(currentSpeed);
                    this.player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(velocity.x, this.player.physicsImpostor.getLinearVelocity().y, velocity.z));
                }

                const targetRotation = Math.atan2(moveVector.x, moveVector.z);
                this.player.rotation.y = BABYLON.Scalar.LerpAngle(this.player.rotation.y, targetRotation, 0.1);
            } else {
                if (this.player.physicsImpostor) {
                    this.player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, this.player.physicsImpostor.getLinearVelocity().y, 0));
                }
            }

            this.animationState.update(this.isMoving, input.run);
        }

        checkPositionChange() {
            const posChanged = BABYLON.Vector3.DistanceSquared(this.player.position, this.lastPosition) > 0.01;
            const rotChanged = Math.abs(this.player.rotation.y - this.lastRotation.y) > 0.01;

            if (posChanged || rotChanged) {
                this.sendPositionUpdate();
                this.lastPosition.copyFrom(this.player.position);
                this.lastRotation.copyFrom(this.player.rotation);
            }
        }

        sendPositionUpdate() {
            if (this.socket && this.socket.connected) {
                this.socket.emit('player_move', this.getPlayerState());
            }
        }

        getPlayerState() {
            return {
                position: { x: this.player.position.x, y: this.player.position.y, z: this.player.position.z },
                rotation: { x: this.player.rotation.x, y: this.player.rotation.y, z: this.player.rotation.z },
                isMoving: this.isMoving,
                isRunning: this.inputManager.inputMap.run,
            };
        }

        teleportTo(position, rotation = null) {
            this.player.position.copyFrom(position);
            if (rotation) this.player.rotation.copyFrom(rotation);
            this.sendPositionUpdate();
            console.log('Player teleported to:', position);
        }

        // --- Battle related methods (to be moved to a BattleManager) ---
        startRandomBattle() {
            console.log('Starting random battle...');
            // This would ideally be handled by a dedicated BattleManager
            // For now, we keep it simple
            if (this.gameManager && this.gameManager.startPokengineBattle) {
                this.gameManager.startPokengineBattle({ type: 'wild', wildPokemon: this.generateRandomWildPokemon() });
            }
        }
        
<<<<<<< HEAD
        const pos = this.player.position;
        const rot = this.player.rotation;
        
        const posEl = document.getElementById('debug-position');
        const rotEl = document.getElementById('debug-rotation');
        const camEl = document.getElementById('debug-camera');
        const movEl = document.getElementById('debug-moving');
        
        if (posEl) posEl.textContent = `X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
        if (rotEl) rotEl.textContent = `${(rot.y * 180 / Math.PI).toFixed(1)}°`; // Convert to degrees
        if (camEl) camEl.textContent = `α: ${(this.camera.alpha * 180 / Math.PI).toFixed(1)}°, β: ${(this.camera.beta * 180 / Math.PI).toFixed(1)}°, r: ${this.camera.radius.toFixed(1)}`; // Convert to degrees
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
     * Open the Map Editor in a panel or iframe with window controls
     */
    openMapEditorPanel() {
        if (!this.isAdmin) {
            console.log('🚫 Access denied: Admin privileges required for Map Editor');
            return;
        }

        console.log('🗺️ Opening Map Editor panel...');

        // Check if panel already exists
        let mapEditorPanel = document.getElementById('mapEditorPanel');
        if (mapEditorPanel) {
            mapEditorPanel.style.display = 'flex';
            return;
        }

        // Create panel container
        mapEditorPanel = document.createElement('div');
        mapEditorPanel.id = 'mapEditorPanel';
        mapEditorPanel.className = 'admin-panel';
        mapEditorPanel.style.position = 'fixed';
        mapEditorPanel.style.top = '0';
        mapEditorPanel.style.left = '0';
        mapEditorPanel.style.width = '100%';
        mapEditorPanel.style.height = '100%';
        mapEditorPanel.style.zIndex = '1000';
        mapEditorPanel.style.display = 'flex';
        mapEditorPanel.style.flexDirection = 'column';
        mapEditorPanel.style.backgroundColor = '#1a1a1a';

        // Create iframe for the map editor
        const iframe = document.createElement('iframe');
        iframe.id = 'mapEditorIframe';
        iframe.src = '/pokemon-map-editor/';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.flexGrow = '1';

        // Add iframe to panel
        mapEditorPanel.appendChild(iframe);

        // Add panel to body
        document.body.appendChild(mapEditorPanel);

        // Listen for messages from the iframe
        window.addEventListener('message', this.handleMapEditorMessages.bind(this));

        console.log('✅ Map Editor panel opened');
    }

    /**
     * Handle messages from the Map Editor iframe
     */
    handleMapEditorMessages(event) {
        if (!event.data || typeof event.data !== 'object') return;

        // Support both 'action' and 'type' properties for backward compatibility
        const messageType = event.data.action || event.data.type;
        const mapEditorPanel = document.getElementById('mapEditorPanel');

        switch(messageType) {
            case 'minimizeMapEditor':
                if (mapEditorPanel) {
                    // Create minimized indicator
                    if (!document.getElementById('minimizedMapEditor')) {
                        const indicator = document.createElement('div');
                        indicator.id = 'minimizedMapEditor';
                        indicator.textContent = 'Map Editor (Minimized)';
                        indicator.style.position = 'fixed';
                        indicator.style.bottom = '10px';
                        indicator.style.right = '10px';
                        indicator.style.backgroundColor = '#2a2a2a';
                        indicator.style.color = 'white';
                        indicator.style.padding = '8px 15px';
                        indicator.style.borderRadius = '4px';
                        indicator.style.cursor = 'pointer';
                        indicator.style.zIndex = '999';
                        indicator.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
                        indicator.style.display = 'flex';
                        indicator.style.alignItems = 'center';
                        indicator.style.gap = '8px';
                        indicator.style.fontSize = '14px';
                        
                        // Add restore icon
                        indicator.innerHTML = `
                            <span>🗺️</span>
                            <span>Map Editor (Minimized)</span>
                        `;
                        
                        indicator.addEventListener('click', () => {
                            indicator.remove();
                            if (mapEditorPanel) mapEditorPanel.style.display = 'flex';
                        });
                        
                        document.body.appendChild(indicator);
                    }
                    
                    mapEditorPanel.style.display = 'none';
                }
                break;
                
            case 'closeMapEditor':
                if (mapEditorPanel) {
                    // Confirm before closing
                    if (confirm('Are you sure you want to close the Map Editor? Unsaved changes will be lost.')) {
                        mapEditorPanel.remove();
                        const indicator = document.getElementById('minimizedMapEditor');
                        if (indicator) indicator.remove();
                    }
                }
                break;
                
            case 'fullscreenMapEditor':
                if (mapEditorPanel) {
                    // Toggle fullscreen mode
                    if (!document.fullscreenElement) {
                        // Enter fullscreen
                        if (mapEditorPanel.requestFullscreen) {
                            mapEditorPanel.requestFullscreen();
                        } else if (mapEditorPanel.webkitRequestFullscreen) { // Safari
                            mapEditorPanel.webkitRequestFullscreen();
                        } else if (mapEditorPanel.msRequestFullscreen) { // IE11
                            mapEditorPanel.msRequestFullscreen();
                        }
                    } else {
                        // Exit fullscreen
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        } else if (document.webkitExitFullscreen) { // Safari
                            document.webkitExitFullscreen();
                        } else if (document.msExitFullscreen) { // IE11
                            document.msExitFullscreen();
                        }
                    }
                }
                break;
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
=======
        startAITrainerBattle() {
            console.log('Starting AI trainer battle...');
            if (this.gameManager && this.gameManager.startPokengineBattle) {
                this.gameManager.startPokengineBattle({ type: 'trainer', opponent: this.generateRandomAITrainer() });
            }
        }

        simulateGrassEncounter() {
            console.log('Simulating grass encounter...');
            if (Math.random() < 0.8 && this.gameManager && this.gameManager.startPokengineBattle) {
                this.gameManager.startPokengineBattle({ type: 'wild_grass', wildPokemon: this.generateGrassWildPokemon() });
>>>>>>> fd63a9deaee7b81a36ca4e0b566595344472f5ca
            } else {
                console.log('No encounter this time.');
            }
        }
        
        // These pokemon generation methods are temporary and should be moved to a data/service layer
        generateRandomWildPokemon() { return { id: 1, name: 'Bulbasaur', level: 5, type1: 'grass', type2: 'poison' }; }
        generateRandomAITrainer() { return { name: 'AI Trainer', team: [this.generateRandomWildPokemon()] }; }
        generateGrassWildPokemon() { return { id: 16, name: 'Pidgey', level: 3, type1: 'normal', type2: 'flying' }; }
    }

    // Export PlayerController to be used in game.js
    if (typeof window !== 'undefined') {
        window.PlayerController = PlayerController;
    }
<<<<<<< HEAD
    
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
        // Extended move sets with at least 13 moves per type
        const moveSets = {
            normal: [
                'Tackle', 'Quick Attack', 'Scratch', 'Pound', 'Double Slap', 
                'Comet Punch', 'Mega Punch', 'Fire Punch', 'Ice Punch', 'Thunder Punch',
                'Slash', 'Body Slam', 'Take Down', 'Double-Edge', 'Hyper Beam'
            ],
            fire: [
                'Ember', 'Scratch', 'Fire Fang', 'Fire Spin', 'Flame Wheel', 
                'Flame Burst', 'Fire Blast', 'Flamethrower', 'Eruption', 'Heat Wave',
                'Inferno', 'Lava Plume', 'Magma Storm', 'Overheat'
            ],
            water: [
                'Water Gun', 'Bubble', 'Water Pulse', 'Aqua Jet', 'Bubble Beam',
                'Brine', 'Scald', 'Surf', 'Hydro Pump', 'Water Spout',
                'Aqua Tail', 'Crabhammer', 'Muddy Water', 'Origin Pulse'
            ],
            electric: [
                'Thunder Shock', 'Thunder Wave', 'Spark', 'Thunder Fang', 'Shock Wave',
                'Charge Beam', 'Thunderbolt', 'Thunder', 'Volt Tackle', 'Zap Cannon',
                'Discharge', 'Electro Ball', 'Thunder Punch', 'Wild Charge'
            ],
            grass: [
                'Vine Whip', 'Absorb', 'Mega Drain', 'Razor Leaf', 'Giga Drain',
                'Seed Bomb', 'Petal Dance', 'Solar Beam', 'Wood Hammer', 'Leaf Blade',
                'Energy Ball', 'Leaf Storm', 'Power Whip', 'Sleep Powder'
            ],
            poison: [
                'Poison Sting', 'Acid', 'Poison Fang', 'Poison Tail', 'Sludge',
                'Smog', 'Sludge Bomb', 'Poison Jab', 'Gunk Shot', 'Cross Poison',
                'Toxic', 'Venoshock', 'Acid Spray', 'Belch'
            ],
            flying: [
                'Gust', 'Peck', 'Wing Attack', 'Air Cutter', 'Aerial Ace',
                'Air Slash', 'Drill Peck', 'Sky Attack', 'Hurricane', 'Bounce',
                'Brave Bird', 'Oblivion Wing', 'Roost', 'Tailwind'
            ],
            bug: [
                'Bug Bite', 'String Shot', 'Bug Buzz', 'Fury Cutter', 'Leech Life',
                'Pin Missile', 'Signal Beam', 'X-Scissor', 'Bug Bite', 'Steamroller',
                'Megahorn', 'Struggle Bug', 'U-Turn', 'Sticky Web'
            ],
            rock: [
                'Rock Throw', 'Rock Slide', 'Rock Tomb', 'Rock Blast', 'Ancient Power',
                'Stone Edge', 'Rock Polish', 'Rock Wrecker', 'Head Smash', 'Smack Down',
                'Rollout', 'Stealth Rock', 'Sandstorm', 'Diamond Storm'
            ],
            ground: [
                'Mud Shot', 'Mud Slap', 'Dig', 'Magnitude', 'Earth Power',
                'Mud Bomb', 'Bulldoze', 'Earthquake', 'Fissure', 'Sand Tomb',
                'Drill Run', 'Bone Club', 'Bonemerang', 'Precipice Blades'
            ],
            fighting: [
                'Karate Chop', 'Low Kick', 'Double Kick', 'Jump Kick', 'Rolling Kick',
                'Brick Break', 'Focus Blast', 'Close Combat', 'High Jump Kick', 'Cross Chop',
                'Drain Punch', 'Dynamic Punch', 'Hammer Arm', 'Aura Sphere'
            ],
            psychic: [
                'Confusion', 'Psybeam', 'Psywave', 'Psychic', 'Psyshock',
                'Extrasensory', 'Zen Headbutt', 'Future Sight', 'Dream Eater', 'Teleport',
                'Calm Mind', 'Psycho Cut', 'Stored Power', 'Synchronoise'
            ],
            ice: [
                'Powder Snow', 'Ice Shard', 'Aurora Beam', 'Ice Beam', 'Blizzard',
                'Icy Wind', 'Hail', 'Ice Punch', 'Avalanche', 'Ice Fang',
                'Sheer Cold', 'Freeze-Dry', 'Glaciate', 'Icicle Crash'
            ],
            ghost: [
                'Lick', 'Night Shade', 'Shadow Sneak', 'Confuse Ray', 'Shadow Ball',
                'Hex', 'Ominous Wind', 'Curse', 'Destiny Bond', 'Nightmare',
                'Phantom Force', 'Shadow Claw', 'Grudge', 'Moongeist Beam'
            ],
            dragon: [
                'Twister', 'Dragon Breath', 'Dragon Rage', 'Dragon Pulse', 'Dragon Claw',
                'Dragon Rush', 'Dragon Tail', 'Outrage', 'Draco Meteor', 'Roar of Time',
                'Core Enforcer', 'Clanging Scales', 'Dragon Hammer', 'Devastating Drake'
            ],
            dark: [
                'Bite', 'Pursuit', 'Feint Attack', 'Crunch', 'Dark Pulse',
                'Night Slash', 'Sucker Punch', 'Foul Play', 'Nasty Plot', 'Assurance',
                'Embargo', 'Punishment', 'Thief', 'Wicked Blow'
            ],
            steel: [
                'Metal Claw', 'Iron Defense', 'Bullet Punch', 'Metal Sound', 'Iron Head',
                'Steel Wing', 'Flash Cannon', 'Iron Tail', 'Metal Burst', 'Heavy Slam',
                'Autotomize', 'Shift Gear', 'Gear Grind', 'Sunsteel Strike'
            ],
            fairy: [
                'Fairy Wind', 'Charm', 'Disarming Voice', 'Draining Kiss', 'Moonblast',
                'Dazzling Gleam', 'Play Rough', 'Fairy Tail', 'Light of Ruin', 'Sparkling Aria',
                'Floral Healing', 'Nature\'s Madness', 'Decorate', 'Spirit Break'
            ]
        };
        
        const moves = [];
        
        // Add moves from primary type (1-2 moves)
        if (moveSets[type1]) {
            const primaryMoves = moveSets[type1];
            // Add 1-2 moves from primary type
            const primaryMoveCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < primaryMoveCount && moves.length < 4; i++) {
                const randomMove = primaryMoves[Math.floor(Math.random() * primaryMoves.length)];
                if (!moves.includes(randomMove)) {
                    moves.push(randomMove);
                }
            }
        }
        
        // Add moves from secondary type (0-2 moves)
        if (type2 && moveSets[type2]) {
            const secondaryMoves = moveSets[type2];
            // Add 0-2 moves from secondary type
            const secondaryMoveCount = Math.floor(Math.random() * 3);
            for (let i = 0; i < secondaryMoveCount && moves.length < 4; i++) {
                const randomMove = secondaryMoves[Math.floor(Math.random() * secondaryMoves.length)];
                if (!moves.includes(randomMove)) {
                    moves.push(randomMove);
                }
            }
        }
        
        // Add one action-based move with 30% probability
        if (Math.random() < 0.3 && moveSets.action && moves.length < 4) {
            const actionMoves = moveSets.action;
            const randomMove = actionMoves[Math.floor(Math.random() * actionMoves.length)];
            if (!moves.includes(randomMove)) {
                moves.push(randomMove);
            }
        }
        
        // Fill remaining slots with normal moves
        while (moves.length < 4) {
            const normalMoves = moveSets.normal;
            const randomMove = normalMoves[Math.floor(Math.random() * normalMoves.length)];
            if (!moves.includes(randomMove)) {
                moves.push(randomMove);
            }
        }
        
        // Ensure we have exactly 4 moves
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

// Enhanced export at the end of player.js
(function(global) {
    'use strict';
    
    // CommonJS export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PlayerController;
    }
    
    // AMD export
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return PlayerController;
        });
    }
    
    // Global export
    global.PlayerController = PlayerController;
    
    console.log('PlayerController exported successfully, type:', typeof global.PlayerController);
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);
=======
})();
>>>>>>> fd63a9deaee7b81a36ca4e0b566595344472f5ca
