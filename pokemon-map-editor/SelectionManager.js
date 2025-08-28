/**
 * Gestionnaire de Sélection Multiple et Groupement pour l'Éditeur de Cartes
 * Permet la sélection multiple, la sélection par boîte, et le groupement d'objets
 */
class SelectionManager {
    constructor(scene, canvas) {
        this.scene = scene;
        this.canvas = canvas;
        this.selectedObjects = new Set();
        this.selectionBox = null;
        this.isBoxSelecting = false;
        this.groups = new Map();
        this.groupCounter = 0;
        
        // Points de début et fin pour la sélection par boîte
        this.boxSelectionStart = null;
        this.boxSelectionEnd = null;
        
        // État des touches modificatrices
        this.isCtrlPressed = false;
        this.isShiftPressed = false;
        
        // Matériaux pour la visualisation
        this.selectedMaterial = null;
        this.groupMaterial = null;
        
        this.setupSelectionControls();
        this.createMaterials();
    }
    
    /**
     * Créer les matériaux pour la visualisation de sélection
     */
    createMaterials() {
        // Matériau pour les objets sélectionnés
        this.selectedMaterial = new BABYLON.StandardMaterial("selectedMat", this.scene);
        this.selectedMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0); // Jaune
        this.selectedMaterial.alpha = 0.3;
        
        // Matériau pour la boîte de sélection
        this.selectionBoxMaterial = new BABYLON.StandardMaterial("selectionBoxMat", this.scene);
        this.selectionBoxMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 1); // Bleu
        this.selectionBoxMaterial.alpha = 0.2;
        this.selectionBoxMaterial.wireframe = true;
    }
    
    /**
     * Configurer les contrôles de sélection
     */
    setupSelectionControls() {
        // Écouteurs de clavier
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Control') {
                this.isCtrlPressed = true;
            }
            if (event.key === 'Shift') {
                this.isShiftPressed = true;
            }
            
            // Raccourcis clavier
            if (event.ctrlKey) {
                switch(event.key.toLowerCase()) {
                    case 'a':
                        event.preventDefault();
                        this.selectAll();
                        break;
                    case 'g':
                        event.preventDefault();
                        this.groupSelected();
                        break;
                    case 'u':
                        event.preventDefault();
                        this.ungroupSelected();
                        break;
                    case 'c':
                        event.preventDefault();
                        this.copySelected();
                        break;
                    case 'v':
                        event.preventDefault();
                        this.pasteObjects();
                        break;
                    case 'd':
                        event.preventDefault();
                        this.duplicateSelected();
                        break;
                }
            }
            
            if (event.key === 'Delete') {
                this.deleteSelected();
            }
        });
        
        window.addEventListener('keyup', (event) => {
            if (event.key === 'Control') {
                this.isCtrlPressed = false;
            }
            if (event.key === 'Shift') {
                this.isShiftPressed = false;
            }
        });
        
        // Écouteurs de souris pour la sélection par boîte
        this.canvas.addEventListener('mousedown', (event) => {
            if (event.button === 0 && this.isShiftPressed) { // Clic gauche + Shift
                this.startBoxSelection(event);
            }
        });
        
        this.canvas.addEventListener('mousemove', (event) => {
            if (this.isBoxSelecting) {
                this.updateBoxSelection(event);
            }
        });
        
        this.canvas.addEventListener('mouseup', (event) => {
            if (this.isBoxSelecting) {
                this.endBoxSelection();
            }
        });
    }
    
    /**
     * Démarrer la sélection par boîte
     */
    startBoxSelection(event) {
        this.isBoxSelecting = true;
        
        // Convertir les coordonnées de la souris en coordonnées du monde
        const pickInfo = this.scene.pick(event.offsetX, event.offsetY);
        if (pickInfo.hit && pickInfo.pickedPoint) {
            this.boxSelectionStart = pickInfo.pickedPoint.clone();
            
            // Créer la boîte de sélection visuelle
            this.selectionBox = BABYLON.MeshBuilder.CreateBox("selectionBox", { size: 0.1 }, this.scene);
            this.selectionBox.material = this.selectionBoxMaterial;
            this.selectionBox.position = this.boxSelectionStart.clone();
        }
    }
    
    /**
     * Mettre à jour la sélection par boîte
     */
    updateBoxSelection(event) {
        if (!this.isBoxSelecting || !this.selectionBox || !this.boxSelectionStart) return;
        
        const pickInfo = this.scene.pick(event.offsetX, event.offsetY);
        if (pickInfo.hit && pickInfo.pickedPoint) {
            this.boxSelectionEnd = pickInfo.pickedPoint.clone();
            
            // Calculer la taille et position de la boîte
            const center = this.boxSelectionStart.add(this.boxSelectionEnd).scale(0.5);
            const size = this.boxSelectionEnd.subtract(this.boxSelectionStart).abs();
            
            this.selectionBox.position = center;
            this.selectionBox.scaling = size.scale(1);
            
            // Sélectionner les objets dans la boîte
            this.selectObjectsInBox(this.boxSelectionStart, this.boxSelectionEnd);
        }
    }
    
    /**
     * Terminer la sélection par boîte
     */
    endBoxSelection() {
        this.isBoxSelecting = false;
        
        if (this.selectionBox) {
            this.selectionBox.dispose();
            this.selectionBox = null;
        }
        
        this.boxSelectionStart = null;
        this.boxSelectionEnd = null;
    }
    
    /**
     * Sélectionner les objets dans une boîte délimitante
     */
    selectObjectsInBox(startPoint, endPoint) {
        const min = BABYLON.Vector3.Minimize(startPoint, endPoint);
        const max = BABYLON.Vector3.Maximum(startPoint, endPoint);
        
        // Si ce n'est pas Ctrl, vider la sélection actuelle
        if (!this.isCtrlPressed) {
            this.clearSelection();
        }
        
        this.scene.meshes.forEach(mesh => {
            if (mesh.isSelectable !== false && 
                !mesh.name.includes('grid') && 
                !mesh.name.includes('selectionBox') &&
                this.isInBoundingBox(mesh, min, max)) {
                this.addToSelection(mesh);
            }
        });
    }
    
    /**
     * Vérifier si un mesh est dans une boîte délimitante
     */
    isInBoundingBox(mesh, min, max) {
        const position = mesh.getAbsolutePosition();
        return position.x >= min.x && position.x <= max.x &&
               position.y >= min.y && position.y <= max.y &&
               position.z >= min.z && position.z <= max.z;
    }
    
    /**
     * Ajouter un objet à la sélection
     */
    addToSelection(mesh) {
        if (!mesh || this.selectedObjects.has(mesh)) return;
        
        this.selectedObjects.add(mesh);
        this.highlightMesh(mesh, true);
        this.onSelectionChanged();
    }
    
    /**
     * Retirer un objet de la sélection
     */
    removeFromSelection(mesh) {
        if (!mesh || !this.selectedObjects.has(mesh)) return;
        
        this.selectedObjects.delete(mesh);
        this.highlightMesh(mesh, false);
        this.onSelectionChanged();
    }
    
    /**
     * Basculer la sélection d'un objet
     */
    toggleSelection(mesh) {
        if (this.selectedObjects.has(mesh)) {
            this.removeFromSelection(mesh);
        } else {
            this.addToSelection(mesh);
        }
    }
    
    /**
     * Vider la sélection
     */
    clearSelection() {
        this.selectedObjects.forEach(mesh => {
            this.highlightMesh(mesh, false);
        });
        this.selectedObjects.clear();
        this.onSelectionChanged();
    }
    
    /**
     * Sélectionner tous les objets
     */
    selectAll() {
        this.clearSelection();
        this.scene.meshes.forEach(mesh => {
            if (mesh.isSelectable !== false && 
                !mesh.name.includes('grid') && 
                !mesh.name.includes('selectionBox')) {
                this.addToSelection(mesh);
            }
        });
    }
    
    /**
     * Mettre en surbrillance un mesh
     */
    highlightMesh(mesh, highlight) {
        if (highlight) {
            mesh.renderOutline = true;
            mesh.outlineWidth = 0.1;
            mesh.outlineColor = BABYLON.Color3.Yellow();
        } else {
            mesh.renderOutline = false;
        }
    }
    
    /**
     * Grouper les objets sélectionnés
     */
    groupSelected() {
        if (this.selectedObjects.size < 2) {
            console.warn('Sélectionnez au moins 2 objets pour créer un groupe');
            return null;
        }
        
        this.groupCounter++;
        const groupName = `group_${this.groupCounter}`;
        const group = new BABYLON.TransformNode(groupName, this.scene);
        
        // Calculer le centre du groupe
        const positions = Array.from(this.selectedObjects).map(mesh => mesh.position);
        const center = positions.reduce((sum, pos) => sum.add(pos), BABYLON.Vector3.Zero()).scale(1 / positions.length);
        group.position = center;
        
        // Assigner les objets au groupe
        const objects = Array.from(this.selectedObjects);
        objects.forEach(obj => {
            obj.setParent(group);
        });
        
        // Stocker les informations du groupe
        this.groups.set(groupName, {
            node: group,
            objects: objects,
            created: new Date()
        });
        
        // Vider la sélection et sélectionner le groupe
        this.clearSelection();
        this.addToSelection(group);
        
        console.log(`Groupe "${groupName}" créé avec ${objects.length} objets`);
        return group;
    }
    
    /**
     * Dégrouper les objets sélectionnés
     */
    ungroupSelected() {
        this.selectedObjects.forEach(selected => {
            if (selected instanceof BABYLON.TransformNode && this.groups.has(selected.name)) {
                const groupInfo = this.groups.get(selected.name);
                
                // Libérer les objets du groupe
                groupInfo.objects.forEach(obj => {
                    obj.setParent(null);
                });
                
                // Supprimer le groupe
                selected.dispose();
                this.groups.delete(selected.name);
                
                console.log(`Groupe "${selected.name}" supprimé`);
            }
        });
        
        this.clearSelection();
    }
    
    /**
     * Copier les objets sélectionnés
     */
    copySelected() {
        if (this.selectedObjects.size === 0) return;
        
        this.clipboard = Array.from(this.selectedObjects).map(mesh => {
            return {
                name: mesh.name,
                position: mesh.position.clone(),
                rotation: mesh.rotation.clone(),
                scaling: mesh.scaling.clone(),
                // Ajouter d'autres propriétés selon les besoins
            };
        });
        
        console.log(`${this.clipboard.length} objets copiés`);
    }
    
    /**
     * Coller les objets
     */
    pasteObjects() {
        if (!this.clipboard || this.clipboard.length === 0) {
            console.warn('Aucun objet à coller');
            return;
        }
        
        this.clearSelection();
        
        this.clipboard.forEach(data => {
            // Ici, nous devons implémenter la logique de création d'objet
            // basée sur les données copiées
            console.log(`Collage de ${data.name} à la position`, data.position);
        });
    }
    
    /**
     * Dupliquer les objets sélectionnés
     */
    duplicateSelected() {
        if (this.selectedObjects.size === 0) return;
        
        const offset = new BABYLON.Vector3(2, 0, 2); // Décalage pour les duplicatas
        const newObjects = [];
        
        this.selectedObjects.forEach(mesh => {
            if (mesh.clone) {
                const duplicate = mesh.clone(mesh.name + '_copy');
                duplicate.position = mesh.position.add(offset);
                newObjects.push(duplicate);
            }
        });
        
        // Sélectionner les nouveaux objets
        this.clearSelection();
        newObjects.forEach(obj => this.addToSelection(obj));
        
        console.log(`${newObjects.length} objets dupliqués`);
    }
    
    /**
     * Supprimer les objets sélectionnés
     */
    deleteSelected() {
        if (this.selectedObjects.size === 0) return;
        
        const count = this.selectedObjects.size;
        this.selectedObjects.forEach(mesh => {
            // Supprimer du groupe s'il en fait partie
            if (mesh.parent && this.groups.has(mesh.parent.name)) {
                const groupInfo = this.groups.get(mesh.parent.name);
                const index = groupInfo.objects.indexOf(mesh);
                if (index > -1) {
                    groupInfo.objects.splice(index, 1);
                }
            }
            
            mesh.dispose();
        });
        
        this.selectedObjects.clear();
        this.onSelectionChanged();
        
        console.log(`${count} objets supprimés`);
    }
    
    /**
     * Obtenir les objets sélectionnés
     */
    getSelectedObjects() {
        return Array.from(this.selectedObjects);
    }
    
    /**
     * Événement déclenché quand la sélection change
     */
    onSelectionChanged() {
        // Émettre un événement personnalisé
        const event = new CustomEvent('selectionChanged', {
            detail: {
                selectedCount: this.selectedObjects.size,
                selectedObjects: this.getSelectedObjects()
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Nettoyer les ressources
     */
    dispose() {
        this.clearSelection();
        
        if (this.selectionBox) {
            this.selectionBox.dispose();
        }
        
        if (this.selectedMaterial) {
            this.selectedMaterial.dispose();
        }
        
        if (this.selectionBoxMaterial) {
            this.selectionBoxMaterial.dispose();
        }
        
        this.groups.clear();
    }
}

// Export pour utilisation dans d'autres modules
window.SelectionManager = SelectionManager;