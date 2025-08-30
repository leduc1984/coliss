// CameraSystem Unit Tests
describe('CameraSystem', () => {
    let gameManager;
    let mockEngine;
    let mockScene;
    let mockCamera;

    beforeEach(() => {
        // Mock engine
        mockEngine = {
            runRenderLoop: jest.fn(),
            resize: jest.fn()
        };

        // Mock scene
        mockScene = {
            clearColor: new BABYLON.Color4(0.5, 0.8, 1.0, 1.0)
        };

        // Mock camera
        mockCamera = {
            alpha: -Math.PI / 2,
            beta: Math.PI / 3.5,
            radius: 8,
            lockedTarget: null,
            detachControl: jest.fn(),
            setTarget: jest.fn(),
            lowerBetaLimit: 0,
            upperBetaLimit: 0,
            lowerRadiusLimit: 0,
            upperRadiusLimit: 0,
            lowerAlphaLimit: 0,
            upperAlphaLimit: 0,
            inertia: 0,
            angularSensibilityX: 0,
            angularSensibilityY: 0,
            panningSensibility: 0,
            wheelPrecision: 0,
            pinchPrecision: 0
        };

        // Mock BABYLON engine and camera constructors
        global.BABYLON = {
            Engine: jest.fn().mockImplementation(() => mockEngine),
            Scene: jest.fn().mockImplementation(() => mockScene),
            ArcRotateCamera: jest.fn().mockImplementation(() => mockCamera),
            Vector3: {
                Zero: jest.fn().mockReturnValue({ x: 0, y: 0, z: 0 }),
                Zero: () => ({ x: 0, y: 0, z: 0 })
            },
            Color4: jest.fn(),
            HemisphericLight: jest.fn(),
            DirectionalLight: jest.fn()
        };

        // Create GameManager instance
        gameManager = new GameManager();
    });

    describe('ORAS camera initialization', () => {
        test('should create camera with ORAS settings', async () => {
            // Initialize Babylon
            await gameManager.initializeBabylon();
            
            // Check camera parameters
            expect(BABYLON.ArcRotateCamera).toHaveBeenCalledWith(
                "playerCamera",
                -Math.PI / 2,    // Alpha
                Math.PI / 3.5,   // Beta
                8,               // Radius
                expect.any(Object), // Target
                mockScene
            );
        });

        test('should configure camera with correct ORAS parameters', async () => {
            // Initialize Babylon
            await gameManager.initializeBabylon();
            
            // Check ORAS camera settings
            expect(mockCamera.alpha).toBe(-Math.PI / 2);
            expect(mockCamera.beta).toBe(Math.PI / 3.5);
            expect(mockCamera.radius).toBe(8);
        });

        test('should lock camera constraints for fixed ORAS view', async () => {
            // Initialize Babylon
            await gameManager.initializeBabylon();
            
            // Check camera constraints
            expect(mockCamera.lowerBetaLimit).toBe(Math.PI / 3.5);
            expect(mockCamera.upperBetaLimit).toBe(Math.PI / 3.5);
            expect(mockCamera.lowerRadiusLimit).toBe(8);
            expect(mockCamera.upperRadiusLimit).toBe(8);
            expect(mockCamera.lowerAlphaLimit).toBe(-Math.PI / 2);
            expect(mockCamera.upperAlphaLimit).toBe(-Math.PI / 2);
        });

        test('should disable manual camera controls', async () => {
            // Initialize Babylon
            await gameManager.initializeBabylon();
            
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

    describe('Camera following', () => {
        test('should set camera target to zero vector initially', async () => {
            // Initialize Babylon
            await gameManager.initializeBabylon();
            
            // Check that camera target is set
            expect(mockCamera.setTarget).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0, z: 0 }));
        });
    });
});