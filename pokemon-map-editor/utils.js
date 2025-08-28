/**
 * Génère un identifiant unique simple.
 * @returns {string} Un ID unique.
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Gère l'historique des actions pour les fonctions Undo/Redo.
 */
class History {
    constructor() {
        this.stack = [];
        this.position = -1;
    }

    push(state) {
        if (this.position < this.stack.length - 1) {
            this.stack = this.stack.slice(0, this.position + 1);
        }
        this.stack.push(state);
        this.position++;
    }

    undo() {
        if (this.position > 0) {
            this.position--;
        }
        return this.stack.length > 0 ? JSON.parse(JSON.stringify(this.stack[this.position])) : null;
    }

    redo() {
        if (this.position < this.stack.length - 1) {
            this.position++;
        }
        return this.stack.length > 0 ? JSON.parse(JSON.stringify(this.stack[this.position])) : null;
    }
}

/**
 * Convertit un tableau de meshes en un objet JSON sérialisable.
 */
function serializeMeshes(meshes) {
    return meshes
        .filter(mesh => !mesh.isGrid)
        .map(mesh => {
            const baseData = {
                instanceId: mesh.instanceId,
                objectId: mesh.objectId,
                name: mesh.name,
                position: mesh.position.asArray(),
                rotationQuaternion: mesh.rotationQuaternion ? mesh.rotationQuaternion.asArray() : new BABYLON.Quaternion.FromEulerVector(mesh.rotation).asArray(),
                scaling: mesh.scaling.asArray(),
                checkCollisions: mesh.checkCollisions,
                collisionType: mesh.collisionType || "blocked"
            };
            
            // Add collision mesh specific data
            if (mesh.isCollisionMesh) {
                baseData.isCollisionMesh = true;
                baseData.visibility = mesh.visibility;
            }
            
            // Add Pokemon-specific data
            if (mesh.isPokemonZone) {
                baseData.isPokemonZone = true;
                baseData.zoneType = mesh.zoneType;
                baseData.zoneName = mesh.zoneName;
            }
            
            if (mesh.isNPC) {
                baseData.isNPC = true;
                baseData.npcType = mesh.npcType;
                baseData.npcName = mesh.npcName;
            }
            
            if (mesh.isWarpPoint) {
                baseData.isWarpPoint = true;
                baseData.targetMap = mesh.targetMap;
                baseData.targetPosition = mesh.targetPosition;
            }
            
            return baseData;
        });
}

/**
 * Export complete Pokemon MMO map data
 */
function exportPokemonMap(meshes, pokemonZones, npcPositions, warpPoints, pokemonEncounters) {
    const mapData = {
        version: "1.0",
        mapType: "pokemon_mmo",
        timestamp: new Date().toISOString(),
        meshes: serializeMeshes(meshes),
        pokemonZones: pokemonZones.map(zone => ({
            ...zone,
            encounters: pokemonEncounters[zone.name] || []
        })),
        npcPositions: npcPositions,
        warpPoints: warpPoints,
        pokemonEncounters: pokemonEncounters,
        // Add Pokemon data summary
        pokemonSummary: {
            totalZones: pokemonZones.length,
            totalEncounterTypes: Object.keys(pokemonEncounters).reduce((sum, zone) => 
                sum + (pokemonEncounters[zone]?.length || 0), 0),
            zoneTypes: [...new Set(pokemonZones.map(z => z.type))]
        }
    };
    
    const jsonString = JSON.stringify(mapData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pokemon_map_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Pokemon map exported with encounter data:', mapData.pokemonSummary);
}

/**
 * Déclenche le téléchargement d'un fichier JSON.
 */
function exportScene(meshes) {
    const serializedData = serializeMeshes(meshes);
    const jsonString = JSON.stringify(serializedData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "map_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Lit un fichier JSON de l'utilisateur.
 */
function importScene(file, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target.result);
            callback(json);
        } catch (e) {
            alert("Erreur: Le fichier JSON est invalide.");
        }
    };
    reader.readAsText(file);
}