/**
 * Pokemon Sprite Manager
 * Manages Pokemon battle sprites from the assets/battlesprites directory
 */
class PokemonSpriteManager {
    constructor() {
        this.spriteCache = new Map();
        this.pokemonData = null;
        this.spriteData = null;
    }

    /**
     * Load JSON sprite index to allow more optimized selection later on.
     * Also includes optional game name prefix which gets converted
     * to URL directory by splitting game on "-"
     * @returns true or error, null before fully done or failure to get all sources.
     */
    async initialize(gamePrefix='') {
        if (this.spriteData) {return;}
        
        const spriteDataResult = gamePrefix.match("master-game") ? 
            await fetch('/poke-battle/battle/images/animated/pokemon/battlesprites/master-game.json') :
            await fetch('/poke-battle/battle/images/animated/pokemon/battlesprites/sprites.json');
        const spriteData = await spriteDataResult.json();

        const gameDir = gamePrefix.split('-').join('/');
        const pokemonDataResult = await fetch(`/${gameDir}/assets/pokemon.json`);
        const pokemonData = await pokemonDataResult.json();

        this.spriteData = spriteData;
        this.pokemonData = pokemonData;

        return true;
    }

    /**
     * Get sprite path for a Pokemon based on its ID
     */
    getPokemonSpritePath(id) {
        // Use the battle sprites from poke-battle directory
        return `/poke-battle/battle/images/animated/pokemon/battlesprites/${id}-front-s.gif`;
    }

    /**
     * Get box icon path for a Pokemon based on its ID
     */
    getBoxIconPath(id) {
        // Use the correct path to monster icons
        return `/pokemon-map-editor/assets/box/sprites/monstericons/icon_${id}.png`;
    }

    /**
     * Get sprite paths for a Pokemon by ID
     */
    async getPokemonSprites(pokemonId) {
        const id = parseInt(pokemonId);
        
        if (this.spriteCache.has(id)) {
            return this.spriteCache.get(id);
        }

        // Create sprites object with paths to actual sprite images
        const basePath = this.getPokemonSpritePath(id);
        const sprites = {
            front: basePath,
            frontShiny: `/poke-battle/battle/images/animated/pokemon/battlesprites/${id}-front-s-shiny.gif`,
            back: `/poke-battle/battle/images/animated/pokemon/battlesprites/${id}-back-s.gif`,
            backShiny: `/poke-battle/battle/images/animated/pokemon/battlesprites/${id}-back-s-shiny.gif`,
            // Box sprites for PC and Pokedex using the correct path
            boxSprite: this.getBoxIconPath(id)
        };
        
        this.spriteCache.set(id, sprites);
        return sprites;
    }

    /**
     * Get default sprites structure as fallback
     */
    getDefaultSprites(pokemonId) {
        const id = parseInt(pokemonId);
        return {
            front: this.getPokemonSpritePath(id),
            frontShiny: `/poke-battle/battle/images/animated/pokemon/battlesprites/${id}-front-s-shiny.gif`,
            back: `/poke-battle/battle/images/animated/pokemon/battlesprites/${id}-back-s.gif`,
            backShiny: `/poke-battle/battle/images/animated/pokemon/battlesprites/${id}-back-s-shiny.gif`,
            boxSprite: this.getBoxIconPath(id)
        };
    }

    /**
     * Get all available Pokemon from the sprite data
     */
    getAvailablePokemon() {
        return Object.values(this.pokemonData);
    }

    /**
     * Get the best front sprite for a Pokemon
     */
    async getBestFrontSprite(pokemonId, options = {}) {
        const {
            shiny = false,
            gender = null,
            useBoxSprite = false
        } = options;

        const sprites = await this.getPokemonSprites(pokemonId);
        let spritePath = sprites.front;

        if (shiny) {
            spritePath = sprites.frontShiny;
        }

        if (useBoxSprite) {
            spritePath = sprites.boxSprite;
        }

        return spritePath;
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

        // Add view toggle buttons
        const viewToggleContainer = document.createElement('div');
        viewToggleContainer.className = 'view-toggle-container';
        viewToggleContainer.style.cssText = `
            display: flex;
            justify-content: center;
            margin-bottom: 10px;
        `;

        const battleViewBtn = document.createElement('button');
        battleViewBtn.textContent = 'Battle Sprites';
        battleViewBtn.className = 'view-toggle-btn active';
        battleViewBtn.style.cssText = `
            padding: 5px 10px;
            margin: 0 5px;
            border: none;
            border-radius: 4px;
            background: #4a4a4a;
            color: white;
            cursor: pointer;
        `;

        const boxViewBtn = document.createElement('button');
        boxViewBtn.textContent = 'Box Sprites';
        boxViewBtn.className = 'view-toggle-btn';
        boxViewBtn.style.cssText = `
            padding: 5px 10px;
            margin: 0 5px;
            border: none;
            border-radius: 4px;
            background: #333;
            color: #ccc;
            cursor: pointer;
        `;

        viewToggleContainer.appendChild(battleViewBtn);
        viewToggleContainer.appendChild(boxViewBtn);
        container.appendChild(viewToggleContainer);

        // Create sprite grid
        const gridContainer = document.createElement('div');
        gridContainer.className = 'sprite-grid';
        gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 5px;
            max-height: 400px;
            overflow-y: auto;
            padding: 10px;
            background: #1a1a1a;
            border-radius: 5px;
        `;

        // Track current view mode
        let useBoxSprites = false;

        // Function to update the grid with appropriate sprites
        const updateGrid = async () => {
            gridContainer.innerHTML = '';
            
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
                    background: rgba(20, 20, 20, 0.6);
                `;

                spriteContainer.addEventListener('mouseenter', () => {
                    spriteContainer.style.borderColor = '#0078d4';
                    spriteContainer.style.backgroundColor = '#2a2a2a';
                });

                spriteContainer.addEventListener('mouseleave', () => {
                    spriteContainer.style.borderColor = 'transparent';
                    spriteContainer.style.backgroundColor = 'rgba(20, 20, 20, 0.6)';
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
                        title: `#${pokemon.id} ${pokemon.name}`,
                        useBoxSprite: useBoxSprites
                    });

                    const label = document.createElement('div');
                    label.textContent = pokemon.name.length > 10 
                        ? `#${pokemon.id} ${pokemon.name.substring(0, 8)}...` 
                        : `#${pokemon.id} ${pokemon.name}`;
                    label.style.cssText = `
                        font-size: 11px;
                        color: #ccc;
                        margin-top: 4px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    `;

                    spriteContainer.appendChild(spriteImg);
                    spriteContainer.appendChild(label);
                    gridContainer.appendChild(spriteContainer);
                } catch (error) {
                    console.warn(`Failed to create sprite for Pokemon ${pokemon.id}`, error);
                }
            }
        };

        // Add toggle button event listeners
        battleViewBtn.addEventListener('click', () => {
            useBoxSprites = false;
            battleViewBtn.className = 'view-toggle-btn active';
            battleViewBtn.style.background = '#4a4a4a';
            battleViewBtn.style.color = 'white';
            boxViewBtn.className = 'view-toggle-btn';
            boxViewBtn.style.background = '#333';
            boxViewBtn.style.color = '#ccc';
            updateGrid();
        });

        boxViewBtn.addEventListener('click', () => {
            useBoxSprites = true;
            boxViewBtn.className = 'view-toggle-btn active';
            boxViewBtn.style.background = '#4a4a4a';
            boxViewBtn.style.color = 'white';
            battleViewBtn.className = 'view-toggle-btn';
            battleViewBtn.style.background = '#333';
            battleViewBtn.style.color = '#ccc';
            updateGrid();
        });

        // Initial grid population
        await updateGrid();
        container.appendChild(gridContainer);
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
            title = null,
            useBoxSprite = false
        } = options;

        const spritePath = await this.getBestFrontSprite(pokemonId, { 
            shiny, 
            gender,
            useBoxSprite
        });
        
        const img = document.createElement('img');
        img.src = spritePath;
        img.className = className + (useBoxSprite ? ' box-sprite' : ' battle-sprite');
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
        img.style.imageRendering = useBoxSprite ? 'pixelated' : 'auto'; // Keep pixel art crisp for box sprites
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
            // Try to use the master pokedex image as fallback
            img.src = '/pokemon-map-editor/assets/box/master_pokedex.png';
            // Adjust the CSS to show only the relevant portion of the master image
            if (useBoxSprite) {
                const id = parseInt(pokemonId);
                // Calculate position in the sprite sheet based on ID
                // This is an approximate calculation and might need adjustment based on the actual sprite sheet
                const row = Math.floor((id - 1) / 25);
                const col = (id - 1) % 25;
                img.style.objectFit = 'none';
                img.style.objectPosition = `-${col * 32}px -${row * 32}px`;
                img.style.width = '32px';
                img.style.height = '32px';
                img.style.transform = 'scale(2)';
                img.style.transformOrigin = 'center';
                img.style.imageRendering = 'pixelated';
            }
        };

        return img;
    }
}