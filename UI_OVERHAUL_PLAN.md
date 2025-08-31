# UI Overhaul Implementation Plan

## Overview
This document outlines the plan for implementing a major UI overhaul by extracting and adapting the HTML, CSS, and UI-specific JavaScript from the [new_design/](file:///C:/Users/Leduc/Desktop/projet/new_design) folder into the main project.

## Phase 1: Preparation and Integration of Assets

### Task 1.1: Copy CSS and JavaScript Assets
- Copy the styling and functionality assets from [new_design/](file:///C:/Users/Leduc/Desktop/projet/new_design) to the main project's asset directory
- Since there's no CSS file in [new_design/](file:///C:/Users/Leduc/Desktop/projet/new_design), we'll need to extract the styling from the components

### Task 1.2: Link New Assets
- Add Tailwind CSS CDN link to the main project's index.html
- Add necessary font links
- Add custom scrollbar styling

## Phase 2: Replace Chat Component

### Task 2.1: Replace Chat HTML Structure
- Extract the chat window structure from [ChatWindow.tsx](file:///C:/Users/Leduc/Desktop/projet/new_design/components/ChatWindow.tsx)
- Replace the existing chat HTML in the main project

### Task 2.2: Reconnect Existing Chat Logic
- Preserve all existing chat logic (sending messages, processing commands, receiving messages)
- Re-attach event listeners and DOM element references to the new HTML structure
- Ensure the sendMessage function is connected to the new send button element

### Task 2.3: Enable Draggable Functionality
- Apply the draggable functionality to the new chat window's main container div

## Phase 3: Migrate Other UI Components

### Task 3.1: Migrate Pokédex
- Extract the Pokédex HTML structure from [PokedexWindow.jsx](file:///C:/Users/Leduc/Desktop/projet/new_design/components/PokedexWindow.jsx)
- Replace the old Pokédex HTML in the main project (if it exists)
- Reconnect the main project's logic for fetching and displaying Pokémon data to the new structure
- Make the new Pokédex panel draggable

### Task 3.2: Integrate Main Icon Bar
- Extract the HTML for the bottom icon bar from [ActionBar.tsx](file:///C:/Users/Leduc/Desktop/projet/new_design/components/ActionBar.tsx)
- Add it to the main project's HTML
- Connect its buttons to toggle the visibility of corresponding windows

### Task 3.3: Harmonize Map Editor Style
- Apply CSS classes and styles from the new design to existing Map Editor elements
- Make the Map Editor visually consistent with the new dark theme

## Implementation Steps

### Step 1: Add Tailwind CSS and Fonts
1. Add Tailwind CSS CDN to index.html
2. Add Google Fonts links
3. Add custom scrollbar styling

### Step 2: Create Draggable Component
1. Convert [Draggable.tsx](file:///C:/Users/Leduc/Desktop/projet/new_design/components/Draggable.tsx) to vanilla JavaScript
2. Add it to the main project's JavaScript files

### Step 3: Update Chat Window
1. Replace existing chat HTML with new structure
2. Update CSS classes to match Tailwind styling
3. Reconnect existing JavaScript logic
4. Add draggable functionality

### Step 4: Add Action Bar
1. Create HTML structure for the bottom icon bar
2. Add JavaScript to handle button clicks
3. Connect buttons to toggle windows

### Step 5: Update Map Editor (Style Only)
1. Apply new CSS classes to existing Map Editor elements
2. Ensure visual consistency with the new theme

## Files to Modify

1. [public/index.html](file:///C:/Users/Leduc/Desktop/projet/public/index.html) - Add Tailwind CSS, fonts, and new HTML structure
2. [public/js/draggable.js](file:///C:/Users/Leduc/Desktop/projet/public/js/draggable.js) - Update with new draggable functionality
3. [public/js/chat.js](file:///C:/Users/Leduc/Desktop/projet/public/js/chat.js) - Reconnect to new HTML structure
4. [public/js/main.js](file:///C:/Users/Leduc/Desktop/projet/public/js/main.js) - Add action bar functionality
5. [pokemon-map-editor/editor.js](file:///C:/Users/Leduc/Desktop/projet/pokemon-map-editor/editor.js) - Apply new styling (if needed)

## Key Considerations

1. Preserve all existing game logic and API calls
2. Ensure all event listeners are properly reconnected
3. Maintain compatibility with existing functionality
4. Test thoroughly to ensure no features are broken
5. Keep the existing authentication and game initialization flow intact