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
            console.log('Loading Pokemon data from local hardcoded list...');
            
            // Use a bigger list of Pokemon for better selection options
            const pokemonList = [
                { id: 1, name: 'bulbasaur', types: ['grass', 'poison'] },
                { id: 2, name: 'ivysaur', types: ['grass', 'poison'] },
                { id: 3, name: 'venusaur', types: ['grass', 'poison'] },
                { id: 4, name: 'charmander', types: ['fire'] },
                { id: 5, name: 'charmeleon', types: ['fire'] },
                { id: 6, name: 'charizard', types: ['fire', 'flying'] },
                { id: 7, name: 'squirtle', types: ['water'] },
                { id: 8, name: 'wartortle', types: ['water'] },
                { id: 9, name: 'blastoise', types: ['water'] },
                { id: 10, name: 'caterpie', types: ['bug'] },
                { id: 11, name: 'metapod', types: ['bug'] },
                { id: 12, name: 'butterfree', types: ['bug', 'flying'] },
                { id: 13, name: 'weedle', types: ['bug', 'poison'] },
                { id: 14, name: 'kakuna', types: ['bug', 'poison'] },
                { id: 15, name: 'beedrill', types: ['bug', 'poison'] },
                { id: 16, name: 'pidgey', types: ['normal', 'flying'] },
                { id: 17, name: 'pidgeotto', types: ['normal', 'flying'] },
                { id: 18, name: 'pidgeot', types: ['normal', 'flying'] },
                { id: 19, name: 'rattata', types: ['normal'] },
                { id: 20, name: 'raticate', types: ['normal'] },
                { id: 21, name: 'spearow', types: ['normal', 'flying'] },
                { id: 22, name: 'fearow', types: ['normal', 'flying'] },
                { id: 23, name: 'ekans', types: ['poison'] },
                { id: 24, name: 'arbok', types: ['poison'] },
                { id: 25, name: 'pikachu', types: ['electric'] },
                { id: 26, name: 'raichu', types: ['electric'] },
                { id: 27, name: 'sandshrew', types: ['ground'] },
                { id: 28, name: 'sandslash', types: ['ground'] },
                { id: 29, name: 'nidoran-f', types: ['poison'] },
                { id: 30, name: 'nidorina', types: ['poison'] }
            ];

            this.totalCount = pokemonList.length;
            
            // Add all Pokemon to our data structures
            for (const pokemon of pokemonList) {
                this.pokemonData.set(pokemon.name, pokemon);
                this.pokemonList.push({
                    name: pokemon.name,
                    id: pokemon.id,
                    displayName: this.formatPokemonName(pokemon.name),
                    types: pokemon.types
                });
                this.loadedCount++;
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
        
        // Create local type data instead of fetching
        for (const typeName of types) {
            try {
                this.typeData.set(typeName, {
                    name: typeName,
                    id: types.indexOf(typeName) + 1
                });
            } catch (error) {
                console.warn(`Failed to create type ${typeName}:`, error);
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