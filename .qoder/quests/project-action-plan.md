# Pokemon ORAX - Bug Fixes & Feature Development Action Plan

## Overview
This document outlines the action plan for stabilizing and enhancing the Pokemon ORAX MMO game. The plan is divided into three phases, with Phase 1 addressing critical stability issues that must be resolved before proceeding with gameplay improvements and new feature development.

## Repository Type
Full-Stack Application using Node.js/Express backend with PostgreSQL database and Babylon.js frontend for 3D rendering.

## Phase 1: Application Stabilization (Critical Bug Fixes)

### Task 1.1: Resolve the 404 Not Found Error
**Objective**: Fix the 404 (Not Found) error for the API endpoint `/api/editor/map-objects`.

**Architecture**:
- The server uses Express.js routing with modular route files
- Map editor routes should be defined in appropriate route files
- API endpoints follow REST conventions

**Implementation Plan**:
1. Create a new GET route handler for `/api/editor/map-objects` in the appropriate route file
2. Implement the route to return an empty JSON array `[]` with a 200 OK status code as a temporary fix
3. Later, update the route to fetch and return actual map object data from the database

**Files to Modify**:
- `server.js` or appropriate route file in the `routes/` directory

### Task 1.2: Debug and Fix ReferenceError: Cannot access 'History' before initialization
**Objective**: Correct the initialization order error in `editor.js`.

**Architecture**:
- The editor uses a class-based structure with a History management system
- Classes are defined at the end of the file but referenced earlier
- The History class is defined at the end of `editor.js` but referenced near the beginning

**Implementation Plan**:
1. Locate the History class definition in `pokemon-map-editor/editor.js` (around line 1940)
2. Move the History class definition to the top of the file or before its first usage
3. Ensure the class is fully defined before any code attempts to create an instance of it

**Files to Modify**:
- `pokemon-map-editor/editor.js`

### Task 1.3: Debug and Fix ReferenceError: initWindowControls is not defined
**Objective**: Ensure the `initWindowControls` function is loaded before it is called.

**Architecture**:
- The editor uses multiple JavaScript files loaded via script tags in `index.html`
- Functions must be defined before they are called
- Script loading order is critical for proper initialization

**Implementation Plan**:
1. Search for the `initWindowControls` function definition in all project files
2. If the function is not defined anywhere, implement it or remove the call
3. If defined in a separate file, ensure that file's script tag is placed before `editor.js` in `pokemon-map-editor/index.html`

**Files to Modify**:
- `pokemon-map-editor/index.html` (adjust script loading order)
- Possibly create or modify a JavaScript file containing the `initWindowControls` function

## Phase 2: Player Experience & Visuals (Core Gameplay)

### Task 2.1: Implement Canvas Responsiveness
**Objective**: Make the 3D game view automatically resize to fit the browser window.

**Architecture**:
- The game uses Babylon.js engine for 3D rendering
- Window resize events should trigger engine resize operations
- Event listeners are already partially implemented in `main.js`

**Implementation Plan**:
1. Add a window.addEventListener for the 'resize' event in the game initialization
2. In the event handler callback function, call the Babylon.js engine.resize() method
3. Ensure the resize handler is properly bound to the game engine instance

**Files to Modify**:
- `public/js/main.js` or `public/js/game.js`

### Task 2.2: Configure the Player Camera
**Objective**: Set up the camera to follow the player from an angle similar to Pokémon Omega Ruby/Alpha Sapphire.

**Architecture**:
- The game uses Babylon.js ArcRotateCamera for player following
- Camera settings are managed in the PlayerController class
- ORAS-style camera configuration is already partially implemented

**Implementation Plan**:
1. Use a Babylon.js ArcRotateCamera with appropriate settings
2. Set the camera's target to the player's mesh (`camera.setTarget(playerMesh)`)
3. Adjust the camera's alpha, beta, and radius properties to achieve the desired angle and distance
4. Ensure the camera's target position is continuously updated to the player's current position in the game loop

**Files to Modify**:
- `public/js/player.js`

### Task 2.3: Correct Player Character Scale
**Objective**: Increase the size of the player model to be appropriate for the scene.

**Architecture**:
- Player models are loaded and managed by the GameManager
- Model scaling is controlled through Babylon.js mesh properties
- Scaling should be applied after model loading is complete

**Implementation Plan**:
1. Locate the code where the player's 3D model is loaded into the scene
2. After the model is loaded, access its scaling property
3. Set a new scale vector (e.g., `playerMesh.scaling = new BABYLON.Vector3(10, 10, 10)`)
4. Adjust the values as needed for proper visual appearance

**Files to Modify**:
- `public/js/game.js`

### Task 2.4: Invert Player Movement Controls
**Objective**: Fix the keyboard input so that the 'A' key moves the player left and the 'D' key moves the player right.

**Architecture**:
- Player movement is handled in the PlayerController class
- Keyboard input is mapped to movement directions
- WASD keys are mapped to forward/left/backward/right movements

**Implementation Plan**:
1. Find the function or code block that handles keyboard input for player movement
2. Locate the key mapping logic for 'a' and 'd' keys
3. Swap the logic associated with these keycodes or key identifiers

**Files to Modify**:
- `public/js/player.js`

### Task 2.5: Investigate and Remove Unwanted Visual Objects
**Objective**: Identify and hide the floating yellow object in the sky.

**Architecture**:
- The game uses Babylon.js scene graph for object management
- Objects can be identified and manipulated through the Babylon.js inspector
- Meshes can be disabled or removed from the scene programmatically

**Implementation Plan**:
1. Implement a way to launch the Babylon.js Inspector in the scene (e.g., `scene.debugLayer.show()`)
2. Use the inspector to click on and identify the yellow object
3. Once the object's name is known, find it in the code and either:
   - Disable it (`mesh.setEnabled(false)`)
   - Remove it from the scene entirely

**Files to Modify**:
- Debug functionality may need to be added to `public/js/game.js`

## Phase 3: UI Editor Development (Major New Feature)

### Task 3.1: Create an API Service Layer
**Objective**: Develop a reusable module for the UI editor to communicate with the game's backend API.

**Architecture**:
- The game uses a RESTful API architecture with Express.js backend
- Frontend services should use the fetch API for communication
- API endpoints follow consistent naming conventions

**Implementation Plan**:
1. Create a JavaScript class or module named `APIService`
2. Implement a method like `fetchData(endpoint)` that takes an API path as an argument
3. This method should use the fetch API to make a GET request to the backend
4. Return the parsed JSON data from the API response

**Files to Create**:
- New file in `pokemon-map-editor/` directory for the API service

### Task 3.2: Develop a UI Component System
**Objective**: Create the basic building blocks for the editor's interface.

**Architecture**:
- UI components should follow a modular, reusable design pattern
- Drag-and-drop functionality requires event handling and DOM manipulation
- Component properties should be editable through a properties panel

**Implementation Plan**:
1. Define a library of reusable UI components (e.g., Panel, Label, Image, List, Grid)
2. Implement a drag-and-drop interface for adding these components to a design canvas
3. Create a properties panel that displays the options for the currently selected component

**Files to Create**:
- New files in `pokemon-map-editor/` directory for UI components

### Task 3.3: Implement the Data Binding System
**Objective**: Allow UI components to be dynamically populated with data from the API.

**Architecture**:
- Data binding requires mapping API responses to UI component properties
- User interface should allow specifying data sources for components
- Property mapping should be flexible and user-configurable

**Implementation Plan**:
1. In the properties panel, add a "Data Source" or "Binding" field for components like lists and grids
2. When a user enters an API endpoint into this field, use the APIService to fetch the data
3. Allow the user to map properties from the returned data to the component's visual elements

**Files to Modify**:
- UI component files created in Task 3.2

### Task 3.4: Develop the JSON Export/Import Functionality
**Objective**: Enable the editor to save and load UI designs.

**Architecture**:
- UI layouts need to be serialized to JSON format
- JSON structure should capture all component properties and relationships
- Import functionality should reconstruct the UI from saved JSON

**Implementation Plan**:
1. Create a function that serializes the current UI layout into a structured JSON object
2. Implement an "Export" button to download this JSON file
3. Create a corresponding "Import" function that can parse a JSON file and reconstruct the UI in the editor

**Files to Modify**:
- Editor files in `pokemon-map-editor/` directory

## Data Models & API Endpoints

### Current API Endpoints
- `/api/auth` - Authentication routes
- `/api/game` - Game state and character management
- `/api/admin` - Administrative functions
- `/api/pokemon` - Pokemon data access
- `/api/health` - Server health check

### Proposed New Endpoints
- `/api/editor/map-objects` - Map object data for editor (to be implemented in Task 1.1)

## Business Logic Layer

### Editor Initialization Sequence
1. DOM Content Loaded event triggers initialization
2. Canvas and engine are created
3. Scene is initialized with lighting and grid
4. UI components are initialized
5. Event listeners are attached
6. Render loop is started

### Player Movement Logic
1. Keyboard events update input map
2. Game loop checks input map state
3. Player position is updated based on input and speed
4. Camera follows player position
5. Server is notified of position changes via Socket.IO

### Camera Management
1. ArcRotateCamera is configured with ORAS-style settings
2. Camera target is locked to player mesh
3. Camera parameters (alpha, beta, radius) are set for proper viewing angle
4. Camera updates are synchronized with player movement

## Middleware & Interceptors
- Authentication middleware for protected routes
- CORS middleware for cross-origin requests
- Helmet middleware for security headers
- Rate limiting middleware for API protection

## Testing Strategy

### Unit Testing
- Test individual components in isolation
- Mock API responses for service layer testing
- Validate data transformation logic

### Integration Testing
- Test API endpoints with database interactions
- Verify Socket.IO communication between client and server
- Test editor functionality with backend services

### End-to-End Testing
- Simulate user interactions with the game client
- Verify complete workflows from login to gameplay
- Test editor functionality including save/load operations