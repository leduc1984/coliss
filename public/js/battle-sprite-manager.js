(function() {
    'use strict';

    const SPRITE_CONFIG = {
        basePath: '/poke-battle/battle/images/animated/pokemon/battlesprites/',
        files: {
            frontScale: 'table-front-scale.txt',
            backScale: 'table-back-scale.txt',
            summaryScale: 'table-summary-scale.txt',
            coordMods: 'table-coordinate-mods.txt'
        }
    };

    /**
     * Manages loading, caching, and configuration of Pokémon sprites for the battle system.
     */
    class BattleSpriteManager {
        constructor() {
            this.spriteCache = new Map();
            this.configCache = new Map();
            this.isInitialized = false;
        }

        async initialize() {
            if (this.isInitialized) return;
            console.log('🎮 Initializing Battle Sprite Manager...');
            
            try {
                const [frontScale, backScale, summaryScale, coordMods] = await Promise.all([
                    this.loadConfigFile(SPRITE_CONFIG.files.frontScale),
                    this.loadConfigFile(SPRITE_CONFIG.files.backScale),
                    this.loadConfigFile(SPRITE_CONFIG.files.summaryScale),
                    this.loadConfigFile(SPRITE_CONFIG.files.coordMods)
                ]);

                this.configCache.set('frontScale', this.parseScaleConfig(frontScale));
                this.configCache.set('backScale', this.parseScaleConfig(backScale));
                this.configCache.set('summaryScale', this.parseScaleConfig(summaryScale));
                this.configCache.set('coordMods', this.parseCoordConfig(coordMods));

                this.isInitialized = true;
                console.log('✅ Battle Sprite Manager initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize Battle Sprite Manager:', error);
                throw error; // Propagate error to be handled by the caller
            }
        }

        async loadConfigFile(filename) {
            const response = await fetch(`${SPRITE_CONFIG.basePath}${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load config file ${filename}: ${response.statusText}`);
            }
            return response.text();
        }

        parseScaleConfig(configText) {
            const config = new Map();
            configText.split('\n').forEach(line => {
                const [id, scale] = line.split('=');
                if (id && scale) {
                    config.set(parseInt(id.trim(), 10), parseFloat(scale.trim()));
                }
            });
            return config;
        }

        parseCoordConfig(configText) {
            const config = new Map();
            configText.split('\n').forEach(line => {
                if (line.trim() && !line.startsWith(';')) {
                    const [key, coords] = line.split('=');
                    if (key && coords) {
                        const [id, position] = key.split(',');
                        const [x, y, z] = coords.split(',').map(v => parseFloat(v.trim()));
                        const pokemonId = parseInt(id.trim(), 10);

                        if (!config.has(pokemonId)) {
                            config.set(pokemonId, {});
                        }
                        config.get(pokemonId)[position.trim()] = { x, y, z };
                    }
                }
            });
            return config;
        }

        generateSpriteFilename(pokemonId, position = 'front', shiny = false, gender = null) {
            const paddedId = String(pokemonId).padStart(3, '0');
            const variant = shiny ? 's' : 'n';
            const genderSuffix = gender ? `-${gender}` : '';
            return `${paddedId}-${position}-${variant}${genderSuffix}.gif`;
        }

        async loadPokemonSprite(pokemonId, position = 'front', shiny = false, gender = null) {
            await this.ensureInitialized();
            const filename = this.generateSpriteFilename(pokemonId, position, shiny, gender);
            const cacheKey = filename;

            if (this.spriteCache.has(cacheKey)) {
                return this.spriteCache.get(cacheKey);
            }

            try {
                const img = new Image();
                img.src = `${SPRITE_CONFIG.basePath}${filename}`;
                await img.decode(); // Use decode for modern async image loading

                const spriteData = {
                    element: img,
                    url: img.src,
                    scale: this.getSpriteScale(pokemonId, position),
                    coordinates: this.getSpriteCoordinates(pokemonId, position),
                };
                
                this.spriteCache.set(cacheKey, spriteData);
                return spriteData;
            } catch (error) {
                if (gender) { // Retry without gender if the gendered sprite fails
                    console.warn(`Sprite for ${filename} not found, retrying without gender.`);
                    return this.loadPokemonSprite(pokemonId, position, shiny, null);
                }
                console.error(`❌ Failed to load sprite ${filename}:`, error);
                throw error;
            }
        }

        getSpriteScale(pokemonId, position) {
            const configKey = `${position}Scale`;
            const scaleConfig = this.configCache.get(configKey);
            return scaleConfig?.get(pokemonId) || 1.0;
        }

        getSpriteCoordinates(pokemonId, position) {
            const coordConfig = this.configCache.get('coordMods');
            return coordConfig?.get(pokemonId)?.[position] || { x: 0, y: 0, z: 0 };
        }

        async preloadSprites(pokemonList) {
            await this.ensureInitialized();
            const loadPromises = pokemonList.flatMap(p => [
                this.loadPokemonSprite(p.id, 'front', p.shiny, p.gender),
                this.loadPokemonSprite(p.id, 'back', p.shiny, p.gender)
            ]);
            
            try {
                await Promise.all(loadPromises);
                console.log(`✅ Preloaded sprites for ${pokemonList.length} Pokémon`);
            } catch (error) {
                console.warn('⚠️ Some sprites failed to preload.', error);
            }
        }

        clearCache() {
            this.spriteCache.clear();
            console.log('🧹 Sprite cache cleared');
        }

        async ensureInitialized() {
            if (!this.isInitialized) {
                await this.initialize();
            }
        }
    }

    // Expose a single instance on the window object for other modules to use.
    window.battleSpriteManager = new BattleSpriteManager();

})();