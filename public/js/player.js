(function() {
    'use strict';

    // --- Input Manager ---
    class InputManager {
        constructor(playerController) {
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
})();