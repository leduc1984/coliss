/**
 * Pokemon Sprite Manager
 * Manages Pokemon battle sprites from the assets/battlesprites directory
 */
class PokemonSpriteManager {
    constructor() {
        this.spriteCache = new Map();
        this.availableSprites = new Map();
        this.loadPromise = null;
    }

    /**
     * Initialize the sprite manager
     */
    async initialize() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this.loadAvailableSprites();
        return this.loadPromise;
    }

    /**
     * Load available sprites from the server
     */
    async loadAvailableSprites() {
        try {
            console.log('Loading available Pokemon sprites...');
            const response = await fetch('/api/pokemon/list');
            
            if (!response.ok) {
                throw new Error(`Failed to load sprite list: ${response.status}`);
            }
            
            const pokemonList = await response.json();
            
            pokemonList.forEach(pokemon => {
                this.availableSprites.set(pokemon.id, {
                    id: pokemon.id,
                    name: pokemon.name,
                    hasSprites: pokemon.hasSprites,
                    defaultSpritePath: pokemon.spritePath
                });
            });

            console.log(`Loaded ${this.availableSprites.size} Pokemon with sprites`);
            return this.availableSprites;
        } catch (error) {
            console.error('Error loading sprites:', error);
            throw error;
        }
    }

    /**
     * Get sprite paths for a Pokemon by ID
     */
    async getPokemonSprites(pokemonId) {
        const id = parseInt(pokemonId);
        
        if (this.spriteCache.has(id)) {
            return this.spriteCache.get(id);
        }

        try {
            const response = await fetch(`/api/pokemon/sprites/${id}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load sprites for Pokemon ${id}`);
            }
            
            const sprites = await response.json();
            this.spriteCache.set(id, sprites);
            return sprites;
        } catch (error) {
            console.error(`Error loading sprites for Pokemon ${id}:`, error);
            return this.getDefaultSprites(id);
        }
    }

    /**
     * Get default sprites structure
     */
    getDefaultSprites(pokemonId) {
        const id = parseInt(pokemonId);
        return {
            front: `/assets/battlesprites/${id}-front-s.gif`,
            frontShiny: `/assets/battlesprites/${id}-front-s.gif`,
            back: null,
            backShiny: null,
            frontFemale: null,
            frontMale: null
        };
    }

    /**
     * Get the best available front sprite for a Pokemon
     */
    async getBestFrontSprite(pokemonId, options = {}) {
        const sprites = await this.getPokemonSprites(pokemonId);
        const { shiny = false, gender = null } = options;

        // Priority order for sprite selection
        if (shiny) {
            if (gender === 'female' && sprites.frontShinyFemale) return sprites.frontShinyFemale;
            if (gender === 'male' && sprites.frontShinyMale) return sprites.frontShinyMale;
            if (sprites.frontShiny) return sprites.frontShiny;
        }

        if (gender === 'female' && sprites.frontFemale) return sprites.frontFemale;
        if (gender === 'male' && sprites.frontMale) return sprites.frontMale;
        if (sprites.front) return sprites.front;
        if (sprites.frontShiny) return sprites.frontShiny;

        // Fallback to default
        return this.getDefaultSprites(pokemonId).front;
    }

    /**
     * Check if a Pokemon has sprites available
     */
    hasPokemonSprites(pokemonId) {
        const id = parseInt(pokemonId);
        return this.availableSprites.has(id);
    }

    /**
     * Get list of Pokemon with available sprites
     */
    getAvailablePokemon() {
        return Array.from(this.availableSprites.values())
            .sort((a, b) => a.id - b.id);
    }

    /**
     * Create an HTML image element for a Pokemon sprite
     */
    async createSpriteElement(pokemonId, options = {}) {
        const {
            width = 96,
            height = 96,
            className = 'pokemon-sprite',
            shiny = false,
            gender = null,
            title = null
        } = options;

        const spritePath = await this.getBestFrontSprite(pokemonId, { shiny, gender });
        
        const img = document.createElement('img');
        img.src = spritePath;
        img.className = className;
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
        img.style.imageRendering = 'pixelated'; // Keep pixel art crisp
        img.style.objectFit = 'contain';
        
        if (title) {
            img.title = title;
            img.alt = title;
        } else {
            img.alt = `Pokemon ${pokemonId}`;
        }

        // Add error handling
        img.onerror = () => {
            console.warn(`Failed to load sprite for Pokemon ${pokemonId}, using fallback`);
            img.src = this.getDefaultSprites(pokemonId).front;
        };

        return img;
    }

    /**
     * Create a sprite selector UI element
     */
    async createSpriteSelector(containerId, callback) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        await this.initialize();
        
        const pokemonList = this.getAvailablePokemon();
        container.innerHTML = '<div class="sprite-selector-header">Select Pokemon:</div>';

        const gridContainer = document.createElement('div');
        gridContainer.className = 'sprite-grid';
        gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 5px;
            max-height: 300px;
            overflow-y: auto;
            padding: 10px;
            background: #1a1a1a;
            border-radius: 5px;
        `;

        for (const pokemon of pokemonList.slice(0, 151)) { // First 151 Pokemon
            const spriteContainer = document.createElement('div');
            spriteContainer.className = 'sprite-option';
            spriteContainer.style.cssText = `
                text-align: center;
                cursor: pointer;
                padding: 5px;
                border-radius: 3px;
                border: 2px solid transparent;
                transition: all 0.2s;
            `;

            spriteContainer.addEventListener('mouseenter', () => {
                spriteContainer.style.borderColor = '#0078d4';
                spriteContainer.style.backgroundColor = '#2a2a2a';
            });

            spriteContainer.addEventListener('mouseleave', () => {
                spriteContainer.style.borderColor = 'transparent';
                spriteContainer.style.backgroundColor = 'transparent';
            });

            spriteContainer.addEventListener('click', () => {
                if (callback) {
                    callback(pokemon.id, pokemon);
                }
            });

            try {
                const spriteImg = await this.createSpriteElement(pokemon.id, {
                    width: 64,
                    height: 64,
                    title: `#${pokemon.id}`
                });

                const label = document.createElement('div');
                label.textContent = `#${pokemon.id}`;
                label.style.cssText = `
                    font-size: 10px;
                    color: #ccc;
                    margin-top: 2px;
                `;

                spriteContainer.appendChild(spriteImg);
                spriteContainer.appendChild(label);
                gridContainer.appendChild(spriteContainer);
            } catch (error) {
                console.warn(`Failed to create sprite for Pokemon ${pokemon.id}`);
            }
        }

        container.appendChild(gridContainer);
    }

    /**
     * Preload commonly used sprites
     */
    async preloadCommonSprites() {
        const commonPokemon = [1, 4, 7, 25, 150, 151]; // Starter Pokemon + Pikachu + Legendaries
        
        const preloadPromises = commonPokemon.map(async (id) => {
            try {
                await this.getPokemonSprites(id);
            } catch (error) {
                console.warn(`Failed to preload Pokemon ${id}`);
            }
        });

        await Promise.all(preloadPromises);
        console.log('Common sprites preloaded');
    }
}

// Global sprite manager instance
const pokemonSpriteManager = new PokemonSpriteManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await pokemonSpriteManager.initialize();
        console.log('Pokemon Sprite Manager initialized successfully');
        
        // Preload common sprites in background
        pokemonSpriteManager.preloadCommonSprites();
    } catch (error) {
        console.error('Failed to initialize Pokemon Sprite Manager:', error);
    }
});