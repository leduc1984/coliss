/**
 * Intégration des Modules Avancés pour l'Éditeur de Cartes Pokémon
 * Connecte tous les nouveaux systèmes à l'éditeur existant
 */
class AdvancedEditorIntegration {
    constructor() {
        this.gridSystem = null;
        this.selectionManager = null;
        this.prefabManager = null;
        this.eventEditor = null;
        this.measureTool = null;
        
        this.isInitialized = false;
        this.currentTool = 'SELECT';
        
        // Références aux éléments de l'éditeur existant
        this.scene = null;
        this.canvas = null;
        this.engine = null;
        this.gizmoManager = null;
        
        // Données d'état
        this.activeMeasurements = [];
        this.snapSettings = {
            grid: true,
            vertex: false,
            rotation: false,
            scale: false
        };
    }
    
    /**
     * Initialiser l'intégration avec l'éditeur existant
     */
    initialize(scene, canvas, engine, gizmoManager) {
        if (this.isInitialized) {
            console.warn('L\'intégration avancée est déjà initialisée');
            return;
        }
        
        this.scene = scene;
        this.canvas = canvas;
        this.engine = engine;
        this.gizmoManager = gizmoManager;
        
        // Initialiser les nouveaux systèmes
        this.initializeAdvancedSystems();
        
        // Configurer les interactions
        this.setupAdvancedControls();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        
        // Créer l'interface utilisateur étendue
        this.createAdvancedUI();
        
        this.isInitialized = true;
        console.log('🚀 Intégration avancée de l\'éditeur initialisée avec succès');
    }
    
    /**
     * Initialiser tous les systèmes avancés
     */
    initializeAdvancedSystems() {
        // Système de grille avancé
        this.gridSystem = new GridSystem(this.scene);
        
        // Gestionnaire de sélection multiple
        this.selectionManager = new SelectionManager(this.scene, this.canvas);
        
        // Gestionnaire de préfabriqués
        this.prefabManager = new PrefabManager(this.scene, this.engine);
        
        // Éditeur d'événements
        this.eventEditor = new EventEditor(this.scene);
        
        // Outil de mesure
        this.measureTool = new MeasureTool(this.scene, this.gridSystem);
        
        console.log('✅ Tous les systèmes avancés initialisés');
    }
    
    /**
     * Configurer les contrôles avancés
     */
    setupAdvancedControls() {
        // Intégrer l'accrochage avec les gizmos existants
        this.enhanceGizmoManager();
        
        // Configurer la détection de collision pour les outils
        this.setupToolCollisionDetection();
        
        // Intégrer avec le système de picking existant
        this.enhancePickingSystem();
    }
    
    /**
     * Améliorer le gestionnaire de gizmos avec l'accrochage
     */
    enhanceGizmoManager() {
        if (!this.gizmoManager) return;
        
        // Position Gizmo avec accrochage
        if (this.gizmoManager.gizmos.positionGizmo) {
            this.gizmoManager.gizmos.positionGizmo.onDragObservable.add((info) => {
                if (this.snapSettings.grid && info.dragPlanePoint) {
                    const snappedPosition = this.gridSystem.snapToGrid(info.dragPlanePoint);
                    info.dragPlanePoint.copyFrom(snappedPosition);
                }
                
                if (this.snapSettings.vertex && info.dragPlanePoint) {
                    const targetMesh = this.findNearestMesh(info.dragPlanePoint);
                    if (targetMesh) {
                        const snappedPosition = this.gridSystem.snapToVertex(targetMesh, info.dragPlanePoint);
                        info.dragPlanePoint.copyFrom(snappedPosition);
                    }
                }
            });
        }
        
        // Rotation Gizmo avec accrochage
        if (this.gizmoManager.gizmos.rotationGizmo) {
            this.gizmoManager.gizmos.rotationGizmo.onDragObservable.add((info) => {
                if (this.snapSettings.rotation) {
                    // Implémenter l'accrochage de rotation
                    const snapAngle = Math.PI / 8; // 22.5 degrés
                    if (info.dragPlaneNormal) {
                        const snappedAngle = this.gridSystem.snapRotation(info.dragPlaneNormal);
                        info.dragPlaneNormal = snappedAngle;
                    }
                }
            });
        }
        
        // Scale Gizmo avec accrochage
        if (this.gizmoManager.gizmos.scaleGizmo) {
            this.gizmoManager.gizmos.scaleGizmo.onDragObservable.add((info) => {
                if (this.snapSettings.scale && info.dragDistance) {
                    const snappedScale = this.gridSystem.snapScale(info.dragDistance);
                    info.dragDistance = snappedScale;
                }
            });
        }
    }
    
    /**
     * Configurer la détection de collision pour les outils
     */
    setupToolCollisionDetection() {
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    this.handlePointerDown(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERUP:
                    this.handlePointerUp(pointerInfo);
                    break;
                case BABYLON.PointerEventTypes.POINTERMOVE:
                    this.handlePointerMove(pointerInfo);
                    break;
            }
        });
    }
    
    /**
     * Gérer les événements de pointeur down
     */
    handlePointerDown(pointerInfo) {
        const pickResult = pointerInfo.pickInfo;
        
        switch (this.currentTool) {
            case 'MULTI_SELECT':
                this.handleMultiSelectDown(pickResult);
                break;
            case 'MEASURE':
                this.handleMeasureDown(pickResult);
                break;
            case 'PREFAB_PLACE':
                this.handlePrefabPlace(pickResult);
                break;
        }
    }
    
    /**
     * Gérer les événements de pointeur move
     */
    handlePointerMove(pointerInfo) {
        const pickResult = pointerInfo.pickInfo;
        
        switch (this.currentTool) {
            case 'MULTI_SELECT':
                // Handle multi-select box drawing if active
                if (this.selectionManager && this.selectionManager.isBoxSelectionActive) {
                    this.selectionManager.updateBoxSelection(pointerInfo.event);
                }
                break;
            case 'MEASURE':
                // Show measurement preview
                if (this.measureTool && this.measureTool.isActive) {
                    this.measureTool.showMeasurePreview(pickResult.pickedPoint);
                }
                break;
            case 'PREFAB_PLACE':
                // Show placement preview
                if (this.prefabManager && this.selectedPrefab) {
                    this.prefabManager.showPlacementPreview(pickResult.pickedPoint);
                }
                break;
        }
    }
    
    /**
     * Gérer les événements de pointeur up
     */
    handlePointerUp(pointerInfo) {
        const pickResult = pointerInfo.pickInfo;
        
        switch (this.currentTool) {
            case 'MULTI_SELECT':
                // Complete box selection if active
                if (this.selectionManager && this.selectionManager.isBoxSelectionActive) {
                    this.selectionManager.completeBoxSelection();
                }
                break;
            case 'MEASURE':
                // Complete measurement if active
                if (this.measureTool && this.measureTool.isActive) {
                    this.measureTool.completeMeasurement();
                }
                break;
            case 'PREFAB_PLACE':
                // No specific action needed on pointer up for prefab placement
                break;
        }
    }
    
    /**
     * Gérer la sélection multiple
     */
    handleMultiSelectDown(pickResult) {
        if (pickResult.hit && pickResult.pickedMesh) {
            const mesh = pickResult.pickedMesh;
            
            // Vérifier les modificateurs de clavier
            const isCtrlPressed = this.selectionManager.isCtrlPressed;
            const isShiftPressed = this.selectionManager.isShiftPressed;
            
            if (isCtrlPressed) {
                this.selectionManager.toggleSelection(mesh);
            } else if (isShiftPressed) {
                // Commencer la sélection par boîte
                if (pickResult.event) {
                    this.selectionManager.startBoxSelection(pickResult.event);
                }
            } else {
                this.selectionManager.clearSelection();
                this.selectionManager.addToSelection(mesh);
            }
        }
    }
    
    /**
     * Gérer l'outil de mesure
     */
    handleMeasureDown(pickResult) {
        if (pickResult.hit && pickResult.pickedPoint) {
            this.measureTool.addMeasurePoint(pickResult.pickedPoint);
        }
    }
    
    /**
     * Gérer le placement de préfabriqués
     */
    handlePrefabPlace(pickResult) {
        if (pickResult.hit && pickResult.pickedPoint && this.selectedPrefab) {
            const position = this.gridSystem.snapToGrid(pickResult.pickedPoint);
            this.prefabManager.instantiatePrefab(this.selectedPrefab, position);
        }
    }
    
    /**
     * Configurer les écouteurs d'événements
     */
    setupEventListeners() {
        // Écouter les changements de sélection
        window.addEventListener('selectionChanged', (event) => {
            this.updateSelectionUI(event.detail);
        });
        
        // Écouter les mises à jour de la bibliothèque de préfabriqués
        window.addEventListener('prefabLibraryUpdated', (event) => {
            this.updatePrefabUI(event.detail);
        });
        
        // Écouter les événements de grille
        window.addEventListener('gridSettingsChanged', (event) => {
            this.updateGridSettings(event.detail);
        });
    }
    
    /**
     * Configurer les raccourcis clavier
     */
    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (event) => {
            // Raccourcis globaux
            if (event.ctrlKey) {
                switch (event.key.toLowerCase()) {
                    case 'g':
                        event.preventDefault();
                        this.groupSelectedObjects();
                        break;
                    case 'u':
                        event.preventDefault();
                        this.ungroupSelectedObjects();
                        break;
                    case 's':
                        event.preventDefault();
                        this.saveProject();
                        break;
                    case 'z':
                        event.preventDefault();
                        if (event.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                }
            }
            
            // Raccourcis sans modificateur
            switch (event.key) {
                case 'Delete':
                    this.deleteSelectedObjects();
                    break;
                case 'Escape':
                    this.cancelCurrentOperation();
                    break;
                case 'g':
                    if (!event.ctrlKey) this.toggleGrid();
                    break;
                case 'x':
                    this.toggleSnapSettings('grid');
                    break;
                case 'v':
                    this.toggleSnapSettings('vertex');
                    break;
                case 'r':
                    this.toggleSnapSettings('rotation');
                    break;
                case 's':
                    if (!event.ctrlKey) this.toggleSnapSettings('scale');
                    break;
            }
        });
    }
    
    /**
     * Créer l'interface utilisateur avancée
     */
    createAdvancedUI() {
        this.createGridControls();
        this.createSnapControls();
        this.createStatusIndicators();
        this.setupToolButtons();
    }
    
    /**
     * Créer les contrôles de grille
     */
    createGridControls() {
        const rightPanel = document.getElementById('right-panel');
        if (!rightPanel) return;
        
        const gridControlsHTML = `
            <div class="grid-controls">
                <h4>Contrôles de Grille</h4>
                <div class="grid-size-control">
                    <label>Taille:</label>
                    <input type="number" id="gridSizeInput" value="1" min="0.1" step="0.1">
                </div>
                <div class="snap-toggles">
                    <div class="snap-toggle active" id="snapGrid" data-snap="grid">Grille</div>
                    <div class="snap-toggle" id="snapVertex" data-snap="vertex">Vertex</div>
                    <div class="snap-toggle" id="snapRotation" data-snap="rotation">Rotation</div>
                    <div class="snap-toggle" id="snapScale" data-snap="scale">Échelle</div>
                </div>
            </div>
        `;
        
        rightPanel.insertAdjacentHTML('beforeend', gridControlsHTML);
        
        // Événements
        document.getElementById('gridSizeInput').addEventListener('change', (e) => {
            this.gridSystem.setGridSize(parseFloat(e.target.value));
        });
        
        document.querySelectorAll('.snap-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const snapType = toggle.getAttribute('data-snap');
                this.toggleSnapSettings(snapType);
                toggle.classList.toggle('active');
            });
        });
    }
    
    /**
     * Créer les indicateurs de statut
     */
    createStatusIndicators() {
        const statusHTML = `
            <div class="status-indicators">
                <div class="status-indicator" id="gridStatus">Grille: ON</div>
                <div class="status-indicator" id="snapStatus">Snap: Grille</div>
                <div class="status-indicator" id="selectionStatus">Sélection: 0</div>
                <div class="status-indicator" id="toolStatus">Outil: Sélectionner</div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', statusHTML);
    }
    
    /**
     * Configurer les boutons d'outils
     */
    setupToolButtons() {
        // Bouton sélection multiple
        const multiSelectBtn = document.getElementById('multiSelectBtn');
        if (multiSelectBtn) {
            multiSelectBtn.addEventListener('click', () => {
                this.setTool('MULTI_SELECT');
            });
        }
        
        // Bouton préfabriqués
        const prefabBtn = document.getElementById('prefabBtn');
        if (prefabBtn) {
            prefabBtn.addEventListener('click', () => {
                this.setTool('PREFAB');
                this.showPrefabPanel();
            });
        }
        
        // Bouton outil de mesure
        const measureBtn = document.getElementById('measureToolBtn');
        if (measureBtn) {
            measureBtn.addEventListener('click', () => {
                this.setTool('MEASURE');
            });
        }
        
        // Bouton éditeur d'événements
        const eventEditorBtn = document.getElementById('eventEditorBtn');
        if (eventEditorBtn) {
            eventEditorBtn.addEventListener('click', () => {
                this.setTool('EVENT_EDITOR');
                if (this.eventEditor) {
                    this.eventEditor.toggleVisibility();
                }
            });
        }
        
        // Boutons des panneaux de préfabriqués
        this.setupPrefabPanelButtons();
        
        // Boutons de sélection multiple
        this.setupMultiSelectButtons();
        
        // Boutons d'outil de mesure
        this.setupMeasureToolButtons();
    }
    
    /**
     * Configurer les boutons du panel de préfabriqués
     */
    setupPrefabPanelButtons() {
        const createPrefabBtn = document.getElementById('createPrefabBtn');
        if (createPrefabBtn) {
            createPrefabBtn.addEventListener('click', () => {
                this.createPrefabFromSelection();
            });
        }
        
        const importPrefabBtn = document.getElementById('importPrefabBtn');
        if (importPrefabBtn) {
            importPrefabBtn.addEventListener('click', () => {
                this.importPrefabs();
            });
        }
        
        const exportPrefabBtn = document.getElementById('exportPrefabBtn');
        if (exportPrefabBtn) {
            exportPrefabBtn.addEventListener('click', () => {
                this.prefabManager.exportPrefabs();
            });
        }
    }
    
    /**
     * Configurer les boutons de sélection multiple
     */
    setupMultiSelectButtons() {
        const groupBtn = document.getElementById('groupSelectedBtn');
        if (groupBtn) {
            groupBtn.addEventListener('click', () => {
                this.selectionManager.groupSelected();
            });
        }
        
        const ungroupBtn = document.getElementById('ungroupSelectedBtn');
        if (ungroupBtn) {
            ungroupBtn.addEventListener('click', () => {
                this.selectionManager.ungroupSelected();
            });
        }
        
        const duplicateBtn = document.getElementById('duplicateSelectedBtn');
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => {
                this.selectionManager.duplicateSelected();
            });
        }
        
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.selectionManager.deleteSelected();
            });
        }
    }
    
    /**
     * Configurer les boutons d'outil de mesure
     */
    setupMeasureToolButtons() {
        const startMeasureBtn = document.getElementById('startMeasureBtn');
        if (startMeasureBtn) {
            startMeasureBtn.addEventListener('click', () => {
                this.measureTool.startNewMeasurement();
            });
        }
        
        const clearMeasuresBtn = document.getElementById('clearMeasuresBtn');
        if (clearMeasuresBtn) {
            clearMeasuresBtn.addEventListener('click', () => {
                this.measureTool.clearAllMeasurements();
            });
        }
    }
    
    /**
     * Définir l'outil actuel
     */
    setTool(toolName) {
        this.currentTool = toolName;
        
        // Mettre à jour l'interface
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tool-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        
        // Afficher le panel approprié
        switch (toolName) {
            case 'MULTI_SELECT':
                document.getElementById('multiSelectBtn')?.classList.add('active');
                document.getElementById('multiSelectPanel').style.display = 'block';
                break;
            case 'PREFAB':
                document.getElementById('prefabBtn')?.classList.add('active');
                document.getElementById('prefabPanel').style.display = 'block';
                break;
            case 'MEASURE':
                document.getElementById('measureToolBtn')?.classList.add('active');
                document.getElementById('measurePanel').style.display = 'block';
                break;
            case 'EVENT_EDITOR':
                document.getElementById('eventEditorBtn')?.classList.add('active');
                // Event editor has its own UI, no panel to show
                break;
        }
        
        // Mettre à jour le statut
        this.updateStatusIndicator('toolStatus', `Outil: ${toolName}`);
    }
    
    /**
     * Basculer les paramètres d'accrochage
     */
    toggleSnapSettings(type) {
        this.snapSettings[type] = !this.snapSettings[type];
        
        // Mettre à jour le système de grille
        switch (type) {
            case 'grid':
                this.gridSystem.setSnapEnabled(this.snapSettings.grid);
                break;
            case 'vertex':
                this.gridSystem.setVertexSnapEnabled(this.snapSettings.vertex);
                break;
        }
        
        // Mettre à jour l'indicateur de statut
        const activeSnaps = Object.keys(this.snapSettings)
            .filter(key => this.snapSettings[key])
            .join(', ');
        this.updateStatusIndicator('snapStatus', `Snap: ${activeSnaps || 'Aucun'}`);
    }
    
    /**
     * Créer un préfabriqué à partir de la sélection
     */
    async createPrefabFromSelection() {
        const selectedObjects = this.selectionManager.getSelectedObjects();
        
        if (selectedObjects.length === 0) {
            alert('Sélectionnez au moins un objet pour créer un préfabriqué');
            return;
        }
        
        const name = prompt('Nom du préfabriqué:');
        if (!name) return;
        
        try {
            const prefab = await this.prefabManager.createPrefab(name, selectedObjects);
            console.log('Préfabriqué créé:', prefab);
            alert(`Préfabriqué "${name}" créé avec succès !`);
        } catch (error) {
            console.error('Erreur lors de la création du préfabriqué:', error);
            alert('Erreur lors de la création du préfabriqué');
        }
    }
    
    /**
     * Mettre à jour un indicateur de statut
     */
    updateStatusIndicator(id, text) {
        const indicator = document.getElementById(id);
        if (indicator) {
            indicator.textContent = text;
        }
    }
    
    /**
     * Mettre à jour l'interface de sélection
     */
    updateSelectionUI(selectionData) {
        const countElement = document.getElementById('selectionCount');
        if (countElement) {
            countElement.textContent = `${selectionData.selectedCount} objets sélectionnés`;
        }
        
        this.updateStatusIndicator('selectionStatus', `Sélection: ${selectionData.selectedCount}`);
    }
    
    /**
     * Trouver le mesh le plus proche d'une position
     */
    findNearestMesh(position) {
        let nearestMesh = null;
        let minDistance = Infinity;
        
        this.scene.meshes.forEach(mesh => {
            if (mesh.isSelectable !== false && !mesh.name.includes('grid')) {
                const distance = BABYLON.Vector3.Distance(position, mesh.getAbsolutePosition());
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestMesh = mesh;
                }
            }
        });
        
        return nearestMesh;
    }
    
    /**
     * Nettoyer les ressources
     */
    dispose() {
        if (this.gridSystem) this.gridSystem.dispose();
        if (this.selectionManager) this.selectionManager.dispose();
        if (this.prefabManager) this.prefabManager.dispose();
        if (this.eventEditor) this.eventEditor.dispose();
        if (this.measureTool) this.measureTool.dispose();
        
        // Supprimer les indicateurs de statut
        const statusIndicators = document.querySelector('.status-indicators');
        if (statusIndicators) {
            statusIndicators.remove();
        }
        
        this.isInitialized = false;
        console.log('🧹 Intégration avancée nettoyée');
    }
}

/**
 * Outil de Mesure Simple
 */
class MeasureTool {
    constructor(scene, gridSystem) {
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.measurements = [];
        this.currentMeasurement = null;
        this.isActive = false;
    }
    
    startNewMeasurement() {
        this.isActive = true;
        this.currentMeasurement = {
            points: [],
            lines: [],
            labels: []
        };
    }
    
    addMeasurePoint(point) {
        if (!this.isActive || !this.currentMeasurement) return;
        
        const snappedPoint = this.gridSystem.snapToGrid(point);
        this.currentMeasurement.points.push(snappedPoint);
        
        if (this.currentMeasurement.points.length === 2) {
            this.completeMeasurement();
        }
    }
    
    completeMeasurement() {
        if (!this.currentMeasurement || this.currentMeasurement.points.length < 2) return;
        
        const measureData = this.gridSystem.createMeasureTool(
            this.currentMeasurement.points[0],
            this.currentMeasurement.points[1]
        );
        
        this.measurements.push(measureData);
        this.currentMeasurement = null;
        this.isActive = false;
        
        this.updateMeasureList();
    }
    
    clearAllMeasurements() {
        this.measurements.forEach(measurement => {
            measurement.dispose();
        });
        this.measurements = [];
        this.updateMeasureList();
    }
    
    updateMeasureList() {
        const measureList = document.getElementById('measureList');
        if (!measureList) return;
        
        measureList.innerHTML = '';
        
        this.measurements.forEach((measurement, index) => {
            const measureItem = document.createElement('div');
            measureItem.className = 'measure-item';
            measureItem.innerHTML = `
                <span>Mesure ${index + 1}</span>
                <span class="measure-distance">${measurement.distance.toFixed(2)} unités</span>
            `;
            measureList.appendChild(measureItem);
        });
    }
    
    dispose() {
        this.clearAllMeasurements();
    }
}

// Rendre disponible globalement
window.AdvancedEditorIntegration = AdvancedEditorIntegration;
window.MeasureTool = MeasureTool;