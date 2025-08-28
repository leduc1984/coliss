/**
 * Gestionnaire de Préfabriqués pour l'Éditeur de Cartes
 * Permet de créer, sauvegarder et instancier des préfabriqués avec miniatures
 */
class PrefabManager {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.prefabs = new Map();
        this.prefabLibrary = [];
        this.thumbnailSize = 128;
        this.prefabCounter = 0;
        
        // Scene temporaire pour la génération de miniatures
        this.thumbnailScene = null;
        this.thumbnailCamera = null;
        
        this.initializeThumbnailScene();
        this.loadPrefabLibrary();
    }
    
    /**
     * Initialiser la scène pour les miniatures
     */
    initializeThumbnailScene() {
        // Créer une scène séparée pour les miniatures
        this.thumbnailScene = new BABYLON.Scene(this.engine);
        this.thumbnailScene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.2, 1);
        
        // Caméra pour les miniatures
        this.thumbnailCamera = new BABYLON.ArcRotateCamera(
            "thumbnailCamera", 
            Math.PI / 4, 
            Math.PI / 3, 
            10, 
            BABYLON.Vector3.Zero(), 
            this.thumbnailScene
        );
        
        // Éclairage pour les miniatures
        const thumbnailLight = new BABYLON.HemisphericLight(
            "thumbnailLight", 
            new BABYLON.Vector3(0, 1, 0), 
            this.thumbnailScene
        );
        thumbnailLight.intensity = 1.2;
        
        // Lumière directionnelle pour les ombres
        const dirLight = new BABYLON.DirectionalLight(
            "thumbnailDirLight", 
            new BABYLON.Vector3(-1, -1, -1), 
            this.thumbnailScene
        );
        dirLight.intensity = 0.8;
    }
    
    /**
     * Créer un préfabriqué à partir d'objets sélectionnés
     */
    async createPrefab(name, objects, category = 'custom', tags = []) {
        if (!objects || objects.length === 0) {
            throw new Error('Aucun objet fourni pour créer le préfabriqué');
        }
        
        this.prefabCounter++;
        const prefabId = `prefab_${this.prefabCounter}`;
        
        // Sérialiser les objets
        const serializedObjects = this.serializeObjects(objects);
        
        // Calculer la boîte englobante
        const boundingBox = this.calculateBoundingBox(objects);
        
        // Générer la miniature
        const thumbnail = await this.generateThumbnail(objects);
        
        const prefabData = {
            id: prefabId,
            name: name,
            category: category,
            tags: tags,
            objects: serializedObjects,
            thumbnail: thumbnail,
            boundingBox: boundingBox,
            objectCount: objects.length,
            created: new Date().toISOString()
        };
        
        // Stocker le préfabriqué
        this.prefabs.set(prefabId, prefabData);
        this.prefabLibrary.push(prefabData);
        
        // Sauvegarder dans le localStorage
        this.savePrefabToStorage(prefabData);
        
        // Mettre à jour l'UI
        this.updatePrefabUI();
        
        console.log(`Préfabriqué "${name}" créé avec ${objects.length} objets`);
        return prefabData;
    }
    
    /**
     * Sérialiser les objets pour stockage
     */
    serializeObjects(objects) {
        return objects.map(obj => {
            const data = {
                name: obj.name,
                id: obj.id,
                position: {
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                },
                rotation: {
                    x: obj.rotation.x,
                    y: obj.rotation.y,
                    z: obj.rotation.z
                },
                scaling: {
                    x: obj.scaling.x,
                    y: obj.scaling.y,
                    z: obj.scaling.z
                },
                visible: obj.isVisible,
                enabled: obj.isEnabled(),
                metadata: obj.metadata || {}
            };
            
            // Ajouter des propriétés spécifiques selon le type
            if (obj.material) {
                data.material = {
                    name: obj.material.name,
                    diffuseColor: obj.material.diffuseColor,
                    specularColor: obj.material.specularColor
                };
            }
            
            // Propriétés Pokemon MMO spécifiques
            if (obj.isPokemonZone) {
                data.pokemonZone = {
                    zoneType: obj.zoneType,
                    zoneName: obj.zoneName,
                    encounters: obj.encounters || []
                };
            }
            
            if (obj.isNPC) {
                data.npc = {
                    npcType: obj.npcType,
                    dialogue: obj.dialogue,
                    sprite: obj.sprite
                };
            }
            
            if (obj.isWarpPoint) {
                data.warpPoint = {
                    targetMap: obj.targetMap,
                    targetX: obj.targetX,
                    targetZ: obj.targetZ
                };
            }
            
            return data;
        });
    }
    
    /**
     * Calculer la boîte englobante d'un groupe d'objets
     */
    calculateBoundingBox(objects) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        
        objects.forEach(obj => {
            const boundingInfo = obj.getBoundingInfo();
            const min = boundingInfo.boundingBox.minimumWorld;
            const max = boundingInfo.boundingBox.maximumWorld;
            
            minX = Math.min(minX, min.x);
            minY = Math.min(minY, min.y);
            minZ = Math.min(minZ, min.z);
            maxX = Math.max(maxX, max.x);
            maxY = Math.max(maxY, max.y);
            maxZ = Math.max(maxZ, max.z);
        });
        
        return {
            min: { x: minX, y: minY, z: minZ },
            max: { x: maxX, y: maxY, z: maxZ },
            size: { 
                x: maxX - minX, 
                y: maxY - minY, 
                z: maxZ - minZ 
            }
        };
    }
    
    /**
     * Générer une miniature pour un groupe d'objets
     */
    async generateThumbnail(objects) {
        // Nettoyer la scène de miniature
        this.clearThumbnailScene();
        
        // Cloner les objets dans la scène de miniature
        const clonedObjects = [];
        objects.forEach(obj => {
            if (obj.clone) {
                const clone = obj.clone(`thumb_${obj.name}`, null);
                clone.setParent(null);
                clonedObjects.push(clone);
            }
        });
        
        // Centrer et ajuster la caméra
        this.adjustThumbnailCamera(clonedObjects);
        
        // Rendre la scène
        this.thumbnailScene.render();
        
        // Capturer l'image
        return new Promise((resolve) => {
            BABYLON.Tools.ToBlob(this.engine.getRenderingCanvas(), (blob) => {
                const url = URL.createObjectURL(blob);
                resolve(url);
            }, undefined, undefined, this.thumbnailSize, this.thumbnailSize);
        });
    }
    
    /**
     * Ajuster la caméra pour les miniatures
     */
    adjustThumbnailCamera(objects) {
        if (objects.length === 0) return;
        
        // Calculer le centre et la taille des objets
        const boundingBox = this.calculateBoundingBox(objects);
        const center = new BABYLON.Vector3(
            (boundingBox.min.x + boundingBox.max.x) / 2,
            (boundingBox.min.y + boundingBox.max.y) / 2,
            (boundingBox.min.z + boundingBox.max.z) / 2
        );
        
        const size = Math.max(boundingBox.size.x, boundingBox.size.y, boundingBox.size.z);
        
        // Positionner la caméra
        this.thumbnailCamera.setTarget(center);
        this.thumbnailCamera.radius = size * 2;
        this.thumbnailCamera.alpha = Math.PI / 4;
        this.thumbnailCamera.beta = Math.PI / 3;
    }
    
    /**
     * Nettoyer la scène de miniature
     */
    clearThumbnailScene() {
        this.thumbnailScene.meshes.slice().forEach(mesh => {
            if (mesh.name.startsWith('thumb_')) {
                mesh.dispose();
            }
        });
    }
    
    /**
     * Instancier un préfabriqué dans la scène
     */
    instantiatePrefab(prefabId, position = BABYLON.Vector3.Zero()) {
        const prefab = this.prefabs.get(prefabId);
        if (!prefab) {
            console.error(`Préfabriqué ${prefabId} non trouvé`);
            return null;
        }
        
        const instances = [];
        const offset = position;
        
        prefab.objects.forEach(objData => {
            const instance = this.deserializeObject(objData);
            if (instance) {
                // Appliquer l'offset de position
                instance.position.addInPlace(offset);
                instances.push(instance);
            }
        });
        
        // Créer un groupe pour les instances
        const groupName = `${prefab.name}_instance_${Date.now()}`;
        const group = new BABYLON.TransformNode(groupName, this.scene);
        group.position = position;
        
        // Assigner les instances au groupe
        instances.forEach(instance => {
            instance.setParent(group);
        });
        
        console.log(`Préfabriqué "${prefab.name}" instancié avec ${instances.length} objets`);
        return {
            group: group,
            instances: instances,
            prefabData: prefab
        };
    }
    
    /**
     * Désérialiser un objet à partir de données
     */
    deserializeObject(objData) {
        let mesh = null;
        
        // Créer l'objet basé sur son type
        if (objData.pokemonZone) {
            // Recréer une zone Pokémon
            mesh = BABYLON.MeshBuilder.CreateBox(objData.name, { size: 5 }, this.scene);
            mesh.isPokemonZone = true;
            mesh.zoneType = objData.pokemonZone.zoneType;
            mesh.zoneName = objData.pokemonZone.zoneName;
            mesh.encounters = objData.pokemonZone.encounters;
            
            // Matériau de zone
            const zoneMaterial = new BABYLON.StandardMaterial(objData.name + '_mat', this.scene);
            zoneMaterial.diffuseColor = this.getZoneColor(objData.pokemonZone.zoneType);
            zoneMaterial.alpha = 0.3;
            mesh.material = zoneMaterial;
            
        } else if (objData.npc) {
            // Recréer un PNJ
            mesh = BABYLON.MeshBuilder.CreateBox(objData.name, { size: 2 }, this.scene);
            mesh.isNPC = true;
            mesh.npcType = objData.npc.npcType;
            mesh.dialogue = objData.npc.dialogue;
            mesh.sprite = objData.npc.sprite;
            
        } else if (objData.warpPoint) {
            // Recréer un point de téléportation
            mesh = BABYLON.MeshBuilder.CreateSphere(objData.name, { diameter: 2 }, this.scene);
            mesh.isWarpPoint = true;
            mesh.targetMap = objData.warpPoint.targetMap;
            mesh.targetX = objData.warpPoint.targetX;
            mesh.targetZ = objData.warpPoint.targetZ;
            
        } else {
            // Objet générique (nécessiterait un système de chargement d'assets)
            mesh = BABYLON.MeshBuilder.CreateBox(objData.name, { size: 1 }, this.scene);
        }
        
        if (mesh) {
            // Appliquer les transformations
            mesh.position = new BABYLON.Vector3(
                objData.position.x,
                objData.position.y,
                objData.position.z
            );
            mesh.rotation = new BABYLON.Vector3(
                objData.rotation.x,
                objData.rotation.y,
                objData.rotation.z
            );
            mesh.scaling = new BABYLON.Vector3(
                objData.scaling.x,
                objData.scaling.y,
                objData.scaling.z
            );
            
            mesh.isVisible = objData.visible;
            mesh.setEnabled(objData.enabled);
            mesh.metadata = objData.metadata;
        }
        
        return mesh;
    }
    
    /**
     * Obtenir la couleur d'une zone Pokémon
     */
    getZoneColor(zoneType) {
        const colors = {
            'grass': new BABYLON.Color3(0, 1, 0),
            'water': new BABYLON.Color3(0, 0, 1),
            'cave': new BABYLON.Color3(0.5, 0.3, 0.1),
            'mountain': new BABYLON.Color3(0.7, 0.7, 0.7)
        };
        return colors[zoneType] || new BABYLON.Color3(1, 1, 1);
    }
    
    /**
     * Sauvegarder un préfabriqué dans le localStorage
     */
    savePrefabToStorage(prefabData) {
        const existingPrefabs = JSON.parse(localStorage.getItem('pokemonMapPrefabs') || '[]');
        existingPrefabs.push(prefabData);
        localStorage.setItem('pokemonMapPrefabs', JSON.stringify(existingPrefabs));
    }
    
    /**
     * Charger la bibliothèque de préfabriqués
     */
    loadPrefabLibrary() {
        try {
            const storedPrefabs = JSON.parse(localStorage.getItem('pokemonMapPrefabs') || '[]');
            storedPrefabs.forEach(prefabData => {
                this.prefabs.set(prefabData.id, prefabData);
                this.prefabLibrary.push(prefabData);
            });
            
            console.log(`${this.prefabLibrary.length} préfabriqués chargés`);
        } catch (error) {
            console.error('Erreur lors du chargement des préfabriqués:', error);
        }
    }
    
    /**
     * Supprimer un préfabriqué
     */
    deletePrefab(prefabId) {
        const prefab = this.prefabs.get(prefabId);
        if (!prefab) return false;
        
        // Supprimer de la mémoire
        this.prefabs.delete(prefabId);
        
        // Supprimer de la bibliothèque
        const index = this.prefabLibrary.findIndex(p => p.id === prefabId);
        if (index > -1) {
            this.prefabLibrary.splice(index, 1);
        }
        
        // Révoquer l'URL de la miniature
        if (prefab.thumbnail) {
            URL.revokeObjectURL(prefab.thumbnail);
        }
        
        // Mettre à jour le stockage
        localStorage.setItem('pokemonMapPrefabs', JSON.stringify(this.prefabLibrary));
        
        // Mettre à jour l'UI
        this.updatePrefabUI();
        
        console.log(`Préfabriqué "${prefab.name}" supprimé`);
        return true;
    }
    
    /**
     * Rechercher des préfabriqués
     */
    searchPrefabs(query, category = null, tags = []) {
        return this.prefabLibrary.filter(prefab => {
            let matches = true;
            
            // Recherche par nom
            if (query) {
                matches = matches && prefab.name.toLowerCase().includes(query.toLowerCase());
            }
            
            // Filtrage par catégorie
            if (category) {
                matches = matches && prefab.category === category;
            }
            
            // Filtrage par tags
            if (tags.length > 0) {
                matches = matches && tags.some(tag => prefab.tags.includes(tag));
            }
            
            return matches;
        });
    }
    
    /**
     * Obtenir toutes les catégories disponibles
     */
    getCategories() {
        const categories = new Set(this.prefabLibrary.map(p => p.category));
        return Array.from(categories);
    }
    
    /**
     * Obtenir tous les tags disponibles
     */
    getTags() {
        const tags = new Set();
        this.prefabLibrary.forEach(prefab => {
            prefab.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }
    
    /**
     * Mettre à jour l'interface utilisateur des préfabriqués
     */
    updatePrefabUI() {
        const event = new CustomEvent('prefabLibraryUpdated', {
            detail: {
                prefabs: this.prefabLibrary,
                categories: this.getCategories(),
                tags: this.getTags()
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Exporter les préfabriqués vers un fichier
     */
    exportPrefabs() {
        const exportData = {
            version: '1.0',
            exported: new Date().toISOString(),
            prefabs: this.prefabLibrary
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pokemon_map_prefabs.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    /**
     * Importer des préfabriqués depuis un fichier
     */
    async importPrefabs(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (!importData.prefabs || !Array.isArray(importData.prefabs)) {
                        throw new Error('Format de fichier invalide');
                    }
                    
                    let imported = 0;
                    importData.prefabs.forEach(prefabData => {
                        if (!this.prefabs.has(prefabData.id)) {
                            this.prefabs.set(prefabData.id, prefabData);
                            this.prefabLibrary.push(prefabData);
                            imported++;
                        }
                    });
                    
                    // Sauvegarder
                    localStorage.setItem('pokemonMapPrefabs', JSON.stringify(this.prefabLibrary));
                    this.updatePrefabUI();
                    
                    resolve(imported);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Nettoyer les ressources
     */
    dispose() {
        // Nettoyer la scène de miniature
        if (this.thumbnailScene) {
            this.thumbnailScene.dispose();
        }
        
        // Révoquer toutes les URLs de miniatures
        this.prefabLibrary.forEach(prefab => {
            if (prefab.thumbnail) {
                URL.revokeObjectURL(prefab.thumbnail);
            }
        });
        
        this.prefabs.clear();
        this.prefabLibrary = [];
    }
}

// Export pour utilisation dans d'autres modules
window.PrefabManager = PrefabManager;