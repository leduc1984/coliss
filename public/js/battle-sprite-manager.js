/**
 * Gestionnaire de sprites Pokémon pour le système de bataille
 * Gère le chargement, l'échelle et le positionnement des sprites animés
 */
class BattleSpriteManager {
    constructor() {
        this.spriteCache = new Map();
        this.configCache = new Map();
        this.basePath = '/poke-battle/battle/images/animated/pokemon/battlesprites/';
        this.isInitialized = false;
        
        // Configurations par défaut
        this.defaultScale = {
            front: 1.0,
            back: 1.0,
            summary: 1.0
        };
        
        this.defaultCoords = {
            x: 0,
            y: 0,
            z: 0
        };
    }

    /**
     * Initialise le gestionnaire en chargeant les fichiers de configuration
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('🎮 Initializing Battle Sprite Manager...');
            
            // Charger les fichiers de configuration en parallèle
            const [frontScale, backScale, summaryScale, coordMods] = await Promise.all([
                this.loadConfigFile('table-front-scale.txt'),
                this.loadConfigFile('table-back-scale.txt'), 
                this.loadConfigFile('table-summary-scale.txt'),
                this.loadConfigFile('table-coordinate-mods.txt')
            ]);

            // Parser et stocker les configurations
            this.configCache.set('frontScale', this.parseScaleConfig(frontScale));
            this.configCache.set('backScale', this.parseScaleConfig(backScale));
            this.configCache.set('summaryScale', this.parseScaleConfig(summaryScale));
            this.configCache.set('coordMods', this.parseCoordConfig(coordMods));
            
            this.isInitialized = true;
            console.log('✅ Battle Sprite Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Battle Sprite Manager:', error);
            throw error;
        }
    }

    /**
     * Charge un fichier de configuration depuis le serveur
     */
    async loadConfigFile(filename) {
        try {
            const response = await fetch(`${this.basePath}${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Failed to load config file ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Parse les fichiers de configuration d'échelle (format: id=scale)
     */
    parseScaleConfig(configText) {
        const config = new Map();
        const lines = configText.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            const [id, scale] = line.split('=');
            if (id && scale) {
                config.set(parseInt(id.trim()), parseFloat(scale.trim()));
            }
        }
        
        return config;
    }

    /**
     * Parse le fichier de coordonnées (format: id,position=x,y,z)
     */
    parseCoordConfig(configText) {
        const config = new Map();
        const lines = configText.split('\n').filter(line => line.trim() && !line.startsWith(';'));
        
        for (const line of lines) {
            const [key, coords] = line.split('=');
            if (key && coords) {
                const [id, position] = key.split(',');
                const [x, y, z] = coords.split(',').map(v => parseFloat(v.trim()));
                
                if (!isNaN(parseInt(id)) && position && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
                    const pokemonId = parseInt(id.trim());
                    const pos = position.trim();
                    
                    if (!config.has(pokemonId)) {
                        config.set(pokemonId, {});
                    }
                    
                    config.get(pokemonId)[pos] = { x, y, z };
                }
            }
        }
        
        return config;
    }

    /**
     * Génère le nom de fichier pour un sprite Pokémon
     */
    generateSpriteFilename(pokemonId, position = 'front', shiny = false, gender = null) {
        const paddedId = pokemonId.toString().padStart(3, '0');
        const variant = shiny ? 's' : 'n';
        const genderSuffix = gender ? `-${gender}` : '';
        
        return `${paddedId}-${position}-${variant}${genderSuffix}.gif`;
    }

    /**
     * Charge un sprite Pokémon avec gestion du cache
     */
    async loadPokemonSprite(pokemonId, position = 'front', shiny = false, gender = null) {
        await this.ensureInitialized();
        
        const filename = this.generateSpriteFilename(pokemonId, position, shiny, gender);
        const cacheKey = `${pokemonId}-${position}-${shiny ? 's' : 'n'}-${gender || 'default'}`;
        
        // Vérifier le cache
        if (this.spriteCache.has(cacheKey)) {
            return this.spriteCache.get(cacheKey);
        }
        
        try {
            // Créer l'élément image
            const img = new Image();
            const spriteData = await new Promise((resolve, reject) => {
                img.onload = () => {
                    const sprite = {
                        element: img,
                        filename: filename,
                        url: `${this.basePath}${filename}`,
                        pokemonId: pokemonId,
                        position: position,
                        shiny: shiny,
                        gender: gender,
                        scale: this.getSpriteScale(pokemonId, position),
                        coordinates: this.getSpriteCoordinates(pokemonId, position),
                        dimensions: {
                            width: img.naturalWidth,
                            height: img.naturalHeight
                        }
                    };
                    resolve(sprite);
                };
                
                img.onerror = () => {
                    reject(new Error(`Failed to load sprite: ${filename}`));
                };
                
                img.src = `${this.basePath}${filename}`;
            });
            
            // Mettre en cache
            this.spriteCache.set(cacheKey, spriteData);
            
            console.log(`✅ Loaded sprite: ${filename}`);
            return spriteData;
            
        } catch (error) {
            console.error(`❌ Failed to load sprite ${filename}:`, error);
            
            // Tenter de charger une version alternative sans genre
            if (gender) {
                console.log(`🔄 Retrying without gender for ${pokemonId}`);
                return this.loadPokemonSprite(pokemonId, position, shiny, null);
            }
            
            throw error;
        }
    }

    /**
     * Obtient l'échelle pour un sprite
     */
    getSpriteScale(pokemonId, position) {
        const configKey = position === 'back' ? 'backScale' : 
                         position === 'summary' ? 'summaryScale' : 'frontScale';
        
        const scaleConfig = this.configCache.get(configKey);
        return scaleConfig?.get(pokemonId) || this.defaultScale[position] || 1.0;
    }

    /**
     * Obtient les coordonnées de positionnement pour un sprite
     */
    getSpriteCoordinates(pokemonId, position) {
        const coordConfig = this.configCache.get('coordMods');
        const pokemonCoords = coordConfig?.get(pokemonId);
        
        if (pokemonCoords && pokemonCoords[position]) {
            return pokemonCoords[position];
        }
        
        return { ...this.defaultCoords };
    }

    /**
     * Calcule la position finale d'un sprite sur l'écran de bataille
     */
    calculateBattlePosition(pokemonId, position, baseX, baseY) {
        const scale = this.getSpriteScale(pokemonId, position);
        const coords = this.getSpriteCoordinates(pokemonId, position);
        
        return {
            x: baseX + (coords.x * 100), // Convertir en pixels
            y: baseY + (coords.y * 100),
            z: coords.z,
            scale: scale
        };
    }

    /**
     * Crée un élément DOM pour afficher un sprite dans la bataille
     */
    createBattleSprite(spriteData, baseX, baseY) {
        const position = this.calculateBattlePosition(
            spriteData.pokemonId, 
            spriteData.position, 
            baseX, 
            baseY
        );
        
        const spriteElement = document.createElement('img');
        spriteElement.src = spriteData.url;
        spriteElement.className = `battle-sprite pokemon-${spriteData.pokemonId} position-${spriteData.position}`;
        
        // Appliquer les styles de positionnement
        spriteElement.style.cssText = `
            position: absolute;
            left: ${position.x}px;
            top: ${position.y}px;
            transform: scale(${position.scale});
            transform-origin: center bottom;
            image-rendering: pixelated;
            z-index: ${100 + Math.round(position.z * 10)};
            max-width: 200px;
            height: auto;
        `;
        
        return {
            element: spriteElement,
            data: spriteData,
            position: position
        };
    }

    /**
     * Précharge plusieurs sprites pour optimiser les performances
     */
    async preloadSprites(pokemonList) {
        await this.ensureInitialized();
        
        const loadPromises = [];
        
        for (const pokemon of pokemonList) {
            const { id, shiny = false, gender = null } = pokemon;
            
            // Précharger front et back
            loadPromises.push(
                this.loadPokemonSprite(id, 'front', shiny, gender),
                this.loadPokemonSprite(id, 'back', shiny, gender)
            );
        }
        
        try {
            await Promise.all(loadPromises);
            console.log(`✅ Preloaded sprites for ${pokemonList.length} Pokémon`);
        } catch (error) {
            console.warn('⚠️ Some sprites failed to preload:', error);
        }
    }

    /**
     * Vide le cache des sprites pour libérer la mémoire
     */
    clearCache() {
        this.spriteCache.clear();
        console.log('🧹 Sprite cache cleared');
    }

    /**
     * S'assure que le gestionnaire est initialisé
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    /**
     * Obtient des informations sur le cache
     */
    getCacheInfo() {
        return {
            spriteCount: this.spriteCache.size,
            configCount: this.configCache.size,
            isInitialized: this.isInitialized
        };
    }
}

// Instance globale
window.battleSpriteManager = new BattleSpriteManager();