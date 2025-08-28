/**
 * Pokemon Data Manager
 * Manages Pokemon data from local API and encounter systems
 */
class PokemonDataManager {
    constructor() {
        this.pokemonList = [];
        this.pokemonData = new Map();
        this.typeData = new Map();
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    /**
     * Load all Pokemon data from the local API
     */
    async loadPokemonData() {
        try {
            console.log('Loading Pokemon data from local API...');
            
            // First, let's load some basic Pokemon for now
            const basicPokemon = [
                'pikachu', 'charizard', 'blastoise', 'venusaur', 'pidgey', 'rattata',
                'caterpie', 'weedle', 'spearow', 'ekans', 'sandshrew', 'nidoran-f',
                'nidoran-m', 'clefairy', 'vulpix', 'jigglypuff', 'zubat', 'oddish',
                'paras', 'venonat', 'diglett', 'meowth', 'psyduck', 'mankey',
                'growlithe', 'poliwag', 'abra', 'machop', 'bellsprout', 'tentacool'
            ];

            this.totalCount = basicPokemon.length;
            
            for (const pokemonName of basicPokemon) {
                try {
                    const response = await fetch(`../api/pokemons/${pokemonName}.json`);
                    if (response.ok) {
                        const data = await response.json();
                        this.pokemonData.set(pokemonName, data);
                        this.pokemonList.push({
                            name: pokemonName,
                            id: data.id,
                            displayName: this.formatPokemonName(pokemonName),
                            types: data.types?.map(t => t.type.name) || []
                        });
                        this.loadedCount++;
                    }
                } catch (error) {
                    console.warn(`Failed to load ${pokemonName}:`, error);
                }
            }

            // Sort by ID
            this.pokemonList.sort((a, b) => a.id - b.id);
            console.log(`Loaded ${this.loadedCount}/${this.totalCount} Pokemon`);
            
            // Load type data
            await this.loadTypeData();
            
            return this.pokemonList;
        } catch (error) {
            console.error('Error loading Pokemon data:', error);
            return [];
        }
    }

    /**
     * Load Pokemon type data
     */
    async loadTypeData() {
        const types = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 
                      'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
                      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
        
        for (const typeName of types) {
            try {
                const response = await fetch(`../api/types/${typeName}.json`);
                if (response.ok) {
                    const data = await response.json();
                    this.typeData.set(typeName, data);
                }
            } catch (error) {
                console.warn(`Failed to load type ${typeName}:`, error);
            }
        }
    }

    /**
     * Format Pokemon name for display
     */
    formatPokemonName(name) {
        return name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Get Pokemon data by name
     */
    getPokemonData(name) {
        return this.pokemonData.get(name);
    }

    /**
     * Get Pokemon list for UI
     */
    getPokemonList() {
        return this.pokemonList;
    }

    /**
     * Get Pokemon suitable for a zone type
     */
    getPokemonForZoneType(zoneType) {
        switch (zoneType) {
            case 'grass':
                return this.pokemonList.filter(p => 
                    p.types.includes('normal') || 
                    p.types.includes('grass') || 
                    p.types.includes('bug') ||
                    p.types.includes('flying')
                );
            case 'water':
                return this.pokemonList.filter(p => 
                    p.types.includes('water') || 
                    p.types.includes('flying')
                );
            case 'cave':
                return this.pokemonList.filter(p => 
                    p.types.includes('rock') || 
                    p.types.includes('ground') || 
                    p.types.includes('dark') ||
                    p.types.includes('ghost')
                );
            case 'special':
                return this.pokemonList.filter(p => 
                    p.types.includes('psychic') || 
                    p.types.includes('dragon') || 
                    p.types.includes('fairy')
                );
            default:
                return this.pokemonList;
        }
    }

    /**
     * Generate encounter table for a zone
     */
    generateEncounterTable(encounters) {
        // Normalize rates to 100%
        const totalRate = encounters.reduce((sum, enc) => sum + enc.rate, 0);
        
        return encounters.map(encounter => ({
            pokemon: encounter.pokemon,
            pokemonData: this.getPokemonData(encounter.pokemon),
            minLevel: encounter.minLevel,
            maxLevel: encounter.maxLevel,
            rate: (encounter.rate / totalRate) * 100,
            originalRate: encounter.rate
        }));
    }

    /**
     * Simulate a Pokemon encounter
     */
    simulateEncounter(encounterTable) {
        if (!encounterTable || encounterTable.length === 0) {
            return null;
        }

        const random = Math.random() * 100;
        let cumulative = 0;

        for (const encounter of encounterTable) {
            cumulative += encounter.rate;
            if (random <= cumulative) {
                const level = Math.floor(Math.random() * 
                    (encounter.maxLevel - encounter.minLevel + 1)) + encounter.minLevel;
                
                return {
                    pokemon: encounter.pokemon,
                    level: level,
                    pokemonData: encounter.pokemonData
                };
            }
        }

        // Fallback to first encounter
        return {
            pokemon: encounterTable[0].pokemon,
            level: encounterTable[0].minLevel,
            pokemonData: encounterTable[0].pokemonData
        };
    }
}

// Pokemon Encounter Manager for specific zones
class PokemonEncounterManager {
    constructor() {
        this.zoneEncounters = new Map();
    }

    /**
     * Add encounter to a zone
     */
    addEncounter(zoneName, pokemon, minLevel, maxLevel, rate) {
        if (!this.zoneEncounters.has(zoneName)) {
            this.zoneEncounters.set(zoneName, []);
        }

        const encounters = this.zoneEncounters.get(zoneName);
        encounters.push({
            pokemon: pokemon,
            minLevel: minLevel,
            maxLevel: maxLevel,
            rate: rate
        });

        this.zoneEncounters.set(zoneName, encounters);
    }

    /**
     * Remove encounter from zone
     */
    removeEncounter(zoneName, index) {
        if (this.zoneEncounters.has(zoneName)) {
            const encounters = this.zoneEncounters.get(zoneName);
            encounters.splice(index, 1);
            this.zoneEncounters.set(zoneName, encounters);
        }
    }

    /**
     * Get encounters for zone
     */
    getZoneEncounters(zoneName) {
        return this.zoneEncounters.get(zoneName) || [];
    }

    /**
     * Get all zone encounters data
     */
    getAllZoneEncounters() {
        const result = {};
        for (const [zoneName, encounters] of this.zoneEncounters) {
            result[zoneName] = encounters;
        }
        return result;
    }

    /**
     * Load zone encounters from data
     */
    loadZoneEncounters(data) {
        this.zoneEncounters.clear();
        for (const [zoneName, encounters] of Object.entries(data)) {
            this.zoneEncounters.set(zoneName, encounters);
        }
    }
}

// Global instances
const pokemonDataManager = new PokemonDataManager();
const pokemonEncounterManager = new PokemonEncounterManager();