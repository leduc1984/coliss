/**
 * Système de Grille Avancé pour l'Éditeur de Cartes Pokémon
 * Fournit des fonctionnalités d'accrochage précis et de grille configurable
 */
class GridSystem {
    constructor(scene) {
        this.scene = scene;
        this.gridSize = 1.0;
        this.subdivisions = 10;
        this.snapEnabled = true;
        this.vertexSnapEnabled = false;
        this.rotationSnapAngle = Math.PI / 8; // 22.5 degrés
        this.scaleSnapIncrement = 0.1;
        this.isShiftPressed = false;
        
        // Grilles multiples pour différents niveaux de détail
        this.mainGrid = null;
        this.subGrid = null;
        
        this.setupKeyboardListeners();
        this.createAdvancedGrid();
    }
    
    /**
     * Créer une grille avancée avec plusieurs niveaux de détail
     */
    createAdvancedGrid() {
        // Dispose de l'ancienne grille si elle existe
        this.disposeGrids();
        
        // Grille principale (grosses lignes)
        this.mainGrid = BABYLON.MeshBuilder.CreateGround("mainGrid", 
            { width: 1000, height: 1000, subdivisions: 100 }, this.scene);
        
        // Grille secondaire (lignes fines)
        this.subGrid = BABYLON.MeshBuilder.CreateGround("subGrid", 
            { width: 1000, height: 1000, subdivisions: 1000 }, this.scene);
        
        this.applyGridMaterial();
        this.setupGridProperties();
        
        console.log('Grille avancée créée avec succès');
    }
    
    /**
     * Appliquer les matériaux appropriés aux grilles
     */
    applyGridMaterial() {
        // Matériau pour la grille principale
        const mainGridMaterial = new BABYLON.StandardMaterial("mainGridMat", this.scene);
        mainGridMaterial.wireframe = true;
        mainGridMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        mainGridMaterial.alpha = 0.8;
        this.mainGrid.material = mainGridMaterial;
        
        // Matériau pour la sous-grille
        const subGridMaterial = new BABYLON.StandardMaterial("subGridMat", this.scene);
        subGridMaterial.wireframe = true;
        subGridMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        subGridMaterial.alpha = 0.3;
        this.subGrid.material = subGridMaterial;
    }
    
    /**
     * Configurer les propriétés des grilles
     */
    setupGridProperties() {
        [this.mainGrid, this.subGrid].forEach(grid => {
            grid.checkCollisions = true;
            grid.isPickable = false;
            grid.receiveShadows = false;
            grid.position.y = -0.01; // Légèrement en dessous du terrain
        });
        
        // La sous-grille est légèrement plus bas
        this.subGrid.position.y = -0.02;
    }
    
    /**
     * Configurer les écouteurs de clavier pour les modificateurs
     */
    setupKeyboardListeners() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Shift') {
                this.isShiftPressed = true;
            }
        });
        
        window.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.isShiftPressed = false;
            }
        });
    }
    
    /**
     * Accrocher une position à la grille
     */
    snapToGrid(position) {
        if (!this.snapEnabled) return position;
        
        const snappedX = Math.round(position.x / this.gridSize) * this.gridSize;
        const snappedZ = Math.round(position.z / this.gridSize) * this.gridSize;
        
        return new BABYLON.Vector3(snappedX, position.y, snappedZ);
    }
    
    /**
     * Accrocher une position aux vertices d'un mesh
     */
    snapToVertex(mesh, position) {
        if (!this.vertexSnapEnabled || !mesh) return position;
        
        const vertices = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (!vertices) return position;
        
        let closestVertex = position;
        let minDistance = Infinity;
        const snapDistance = 2.0; // Distance maximale pour l'accrochage
        
        for (let i = 0; i < vertices.length; i += 3) {
            const vertex = new BABYLON.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
            const worldVertex = BABYLON.Vector3.TransformCoordinates(vertex, mesh.getWorldMatrix());
            const distance = BABYLON.Vector3.Distance(position, worldVertex);
            
            if (distance < minDistance && distance < snapDistance) {
                minDistance = distance;
                closestVertex = worldVertex;
            }
        }
        
        return closestVertex;
    }
    
    /**
     * Accrocher un angle de rotation
     */
    snapRotation(angle) {
        if (!this.isShiftPressed) return angle;
        
        return Math.round(angle / this.rotationSnapAngle) * this.rotationSnapAngle;
    }
    
    /**
     * Accrocher une valeur d'échelle
     */
    snapScale(scale) {
        if (!this.isShiftPressed) return scale;
        
        return Math.round(scale / this.scaleSnapIncrement) * this.scaleSnapIncrement;
    }
    
    /**
     * Changer la taille de la grille
     */
    setGridSize(size) {
        this.gridSize = Math.max(0.1, size);
        this.updateGridVisual();
    }
    
    /**
     * Activer/désactiver l'accrochage à la grille
     */
    setSnapEnabled(enabled) {
        this.snapEnabled = enabled;
    }
    
    /**
     * Activer/désactiver l'accrochage aux vertices
     */
    setVertexSnapEnabled(enabled) {
        this.vertexSnapEnabled = enabled;
    }
    
    /**
     * Basculer la visibilité de la grille
     */
    toggleVisibility() {
        const visible = this.mainGrid.isVisible;
        this.mainGrid.isVisible = !visible;
        this.subGrid.isVisible = !visible;
        
        return !visible;
    }
    
    /**
     * Mettre à jour l'affichage de la grille
     */
    updateGridVisual() {
        // Recalculer les subdivisions basées sur la taille de grille
        const newSubdivisions = Math.max(10, 1000 / this.gridSize);
        
        // Recréer les grilles avec les nouvelles subdivisions
        this.createAdvancedGrid();
    }
    
    /**
     * Obtenir le point d'intersection avec la grille
     */
    getGridIntersection(ray) {
        const pickResult = this.scene.pickWithRay(ray, (mesh) => {
            return mesh === this.mainGrid || mesh === this.subGrid;
        });
        
        if (pickResult.hit && pickResult.pickedPoint) {
            return this.snapToGrid(pickResult.pickedPoint);
        }
        
        return null;
    }
    
    /**
     * Créer une zone de mesure entre deux points
     */
    createMeasureTool(startPoint, endPoint) {
        const distance = BABYLON.Vector3.Distance(startPoint, endPoint);
        const midPoint = BABYLON.Vector3.Center(startPoint, endPoint);
        
        // Créer une ligne de mesure
        const measureLine = BABYLON.MeshBuilder.CreateLines("measureLine", {
            points: [startPoint, endPoint]
        }, this.scene);
        
        measureLine.color = new BABYLON.Color3(1, 1, 0); // Jaune
        
        // Ajouter du texte de distance
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const measureText = new BABYLON.GUI.TextBlock();
        measureText.text = `${distance.toFixed(2)} unités`;
        measureText.color = "yellow";
        measureText.fontSize = 14;
        
        advancedTexture.addControl(measureText);
        
        // Positionner le texte au milieu de la ligne
        const worldToScreen = BABYLON.Vector3.Project(
            midPoint,
            BABYLON.Matrix.Identity(),
            this.scene.getTransformMatrix(),
            this.scene.activeCamera.viewport.toGlobal(
                this.scene.getEngine().getRenderWidth(),
                this.scene.getEngine().getRenderHeight()
            )
        );
        
        measureText.leftInPixels = worldToScreen.x;
        measureText.topInPixels = worldToScreen.y;
        
        return {
            line: measureLine,
            text: measureText,
            distance: distance,
            dispose: () => {
                measureLine.dispose();
                measureText.dispose();
            }
        };
    }
    
    /**
     * Nettoyer les ressources
     */
    disposeGrids() {
        if (this.mainGrid) {
            this.mainGrid.dispose();
            this.mainGrid = null;
        }
        if (this.subGrid) {
            this.subGrid.dispose();
            this.subGrid = null;
        }
    }
    
    /**
     * Nettoyer complètement le système
     */
    dispose() {
        this.disposeGrids();
        
        // Retirer les écouteurs d'événements
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
    }
}

// Export pour utilisation dans d'autres modules
window.GridSystem = GridSystem;