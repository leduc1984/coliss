// CameraPlayerIntegration Unit Tests
describe('CameraPlayerIntegration', () => {
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

    describe('Movement and rotation synchronization', () => {
        test('should move and rotate player correctly when moving north', () => {
            // Set up input
            playerController.inputMap.forward = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves north
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    x: 0,
                    y: 0,
                    z: expect.toBeGreaterThan(0) 
                })
            );
            
            // Check that player rotates to face north
            expect(playerController.player.rotation.y).toBe(0);
        });

        test('should move and rotate player correctly when moving south', () => {
            // Set up input
            playerController.inputMap.backward = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves south
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    x: 0,
                    y: 0,
                    z: expect.toBeLessThan(0) 
                })
            );
            
            // Check that player rotates to face south
            expect(Math.abs(playerController.player.rotation.y - Math.PI)).toBeLessThan(0.1);
        });

        test('should move and rotate player correctly when moving west', () => {
            // Set up input
            playerController.inputMap.left = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves west
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    x: expect.toBeLessThan(0),
                    y: 0,
                    z: 0
                })
            );
            
            // Check that player rotates to face west
            expect(Math.abs(playerController.player.rotation.y + Math.PI / 2)).toBeLessThan(0.1);
        });

        test('should move and rotate player correctly when moving east', () => {
            // Set up input
            playerController.inputMap.right = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves east
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    x: expect.toBeGreaterThan(0),
                    y: 0,
                    z: 0
                })
            );
            
            // Check that player rotates to face east
            expect(Math.abs(playerController.player.rotation.y - Math.PI / 2)).toBeLessThan(0.1);
        });
    });

    describe('Camera following player', () => {
        test('should lock camera to player', () => {
            // Check that camera is locked to player
            expect(mockCamera.lockedTarget).toBe(mockPlayer);
        });

        test('should maintain ORAS camera settings while following player', () => {
            // Check ORAS camera settings
            expect(mockCamera.alpha).toBe(-Math.PI / 2);
            expect(mockCamera.beta).toBe(Math.PI / 3.5);
            expect(mockCamera.radius).toBe(8);
        });

        test('should disable manual camera controls', () => {
            // Check that manual controls are disabled
            expect(mockCamera.detachControl).toHaveBeenCalled();
            expect(mockCamera.inertia).toBe(0);
            expect(mockCamera.angularSensibilityX).toBe(0);
            expect(mockCamera.angularSensibilityY).toBe(0);
            expect(mockCamera.panningSensibility).toBe(0);
            expect(mockCamera.wheelPrecision).toBe(0);
            expect(mockCamera.pinchPrecision).toBe(0);
        });
    });

    describe('Diagonal movement', () => {
        test('should move and rotate player correctly when moving northeast', () => {
            // Set up input
            playerController.inputMap.forward = true;
            playerController.inputMap.right = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves northeast
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    x: expect.toBeGreaterThan(0),
                    y: 0,
                    z: expect.toBeGreaterThan(0) 
                })
            );
            
            // Check that player rotates to face northeast (π/4 radians)
            expect(Math.abs(playerController.player.rotation.y - Math.PI / 4)).toBeLessThan(0.1);
        });

        test('should move and rotate player correctly when moving southwest', () => {
            // Set up input
            playerController.inputMap.backward = true;
            playerController.inputMap.left = true;
            
            // Update movement
            playerController.updateMovement();
            
            // Check that player moves southwest
            expect(mockPlayer.physicsImpostor.setLinearVelocity).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    x: expect.toBeLessThan(0),
                    y: 0,
                    z: expect.toBeLessThan(0) 
                })
            );
            
            // Check that player rotates to face southwest (-3π/4 radians)
            expect(Math.abs(playerController.player.rotation.y + 3 * Math.PI / 4)).toBeLessThan(0.1);
        });
    });
});