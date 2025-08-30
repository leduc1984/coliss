// PlayerController Unit Tests
describe('PlayerController', () => {
    let playerController;
    let mockPlayer;
    let mockCamera;
    let mockScene;
    let mockSocket;

    beforeEach(() => {
        // Mock player mesh
        mockPlayer = {
            position: new BABYLON.Vector3(0, 0, 0),
            rotation: new BABYLON.Vector3(0, 0, 0),
            physicsImpostor: {
                setLinearVelocity: jest.fn(),
                getLinearVelocity: jest.fn().mockReturnValue(new BABYLON.Vector3(0, 0, 0))
            }
        };

        // Mock camera
        mockCamera = {
            alpha: -Math.PI / 2,
            beta: Math.PI / 3.5,
            radius: 8,
            lockedTarget: null,
            detachControl: jest.fn(),
            getForwardRay: jest.fn().mockReturnValue({
                direction: new BABYLON.Vector3(0, 0, -1)
            }),
            getTarget: jest.fn().mockReturnValue(new BABYLON.Vector3(0, 0, 0))
        };

        // Mock scene
        mockScene = {
            getEngine: jest.fn().mockReturnValue({
                getDeltaTime: jest.fn().mockReturnValue(16)
            }),
            activeCamera: {
                upVector: new BABYLON.Vector3(0, 1, 0)
            },
            registerBeforeRender: jest.fn()
        };

        // Mock socket
        mockSocket = {
            connected: true,
            emit: jest.fn()
        };

        // Create PlayerController instance
        playerController = new PlayerController(mockPlayer, mockCamera, mockScene, mockSocket);
    });

    describe('World-relative movement', () => {
        test('should move player north when forward key is pressed', () => {
            // Set up input
            playerController.inputMap.forward = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves in positive Z direction (north)
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ z: expect.toBeGreaterThan(0) })
            );
        });

        test('should move player south when backward key is pressed', () => {
            // Set up input
            playerController.inputMap.backward = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves in negative Z direction (south)
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ z: expect.toBeLessThan(0) })
            );
        });

        test('should move player west when left key is pressed', () => {
            // Set up input
            playerController.inputMap.left = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves in negative X direction (west)
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ x: expect.toBeLessThan(0) })
            );
        });

        test('should move player east when right key is pressed', () => {
            // Set up input
            playerController.inputMap.right = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves in positive X direction (east)
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ x: expect.toBeGreaterThan(0) })
            );
        });
    });

    describe('Player rotation', () => {
        test('should face north (0°) at start', () => {
            expect(playerController.player.rotation.y).toBe(0);
        });

        test('should rotate player to face north when moving forward', () => {
            // Set up input
            playerController.inputMap.forward = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Player should rotate to face north (0 radians)
            expect(playerController.player.rotation.y).toBe(0);
        });

        test('should rotate player to face south when moving backward', () => {
            // Set up input
            playerController.inputMap.backward = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Player should rotate to face south (π radians)
            expect(Math.abs(playerController.player.rotation.y - Math.PI)).toBeLessThan(0.1);
        });

        test('should rotate player to face west when moving left', () => {
            // Set up input
            playerController.inputMap.left = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Player should rotate to face west (-π/2 radians)
            expect(Math.abs(playerController.player.rotation.y + Math.PI / 2)).toBeLessThan(0.1);
        });

        test('should rotate player to face east when moving right', () => {
            // Set up input
            playerController.inputMap.right = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Player should rotate to face east (π/2 radians)
            expect(Math.abs(playerController.player.rotation.y - Math.PI / 2)).toBeLessThan(0.1);
        });
    });

    describe('ORAS camera setup', () => {
        test('should configure camera with ORAS settings', () => {
            expect(mockCamera.alpha).toBe(-Math.PI / 2);
            expect(mockCamera.beta).toBe(Math.PI / 3.5);
            expect(mockCamera.radius).toBe(8);
        });

        test('should lock camera to player', () => {
            expect(mockCamera.lockedTarget).toBe(mockPlayer);
        });

        test('should disable manual camera controls', () => {
            expect(mockCamera.detachControl).toHaveBeenCalled();
            expect(mockCamera.inertia).toBe(0);
            expect(mockCamera.angularSensibilityX).toBe(0);
            expect(mockCamera.angularSensibilityY).toBe(0);
            expect(mockCamera.panningSensibility).toBe(0);
            expect(mockCamera.wheelPrecision).toBe(0);
            expect(mockCamera.pinchPrecision).toBe(0);
        });
    });
});