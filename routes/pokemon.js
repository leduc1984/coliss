const express = require('express');
const router = express.Router();

// Mock Pokemon data for the map editor
const pokemonList = [
    'pikachu', 'charizard', 'blastoise', 'venusaur', 'pidgey', 'rattata',
    'caterpie', 'weedle', 'spearow', 'ekans', 'sandshrew', 'nidoran-f',
    'nidoran-m', 'clefairy', 'vulpix', 'jigglypuff', 'zubat', 'oddish',
    'paras', 'venonat', 'diglett', 'meowth', 'psyduck', 'mankey',
    'growlithe', 'poliwag', 'abra', 'machop', 'bellsprout', 'tentacool'
];

const pokemonTypes = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

// Basic Pokemon data structure
const createPokemonData = (name) => ({
    id: Math.floor(Math.random() * 1000) + 1,
    name: name,
    height: Math.floor(Math.random() * 20) + 5,
    weight: Math.floor(Math.random() * 100) + 10,
    types: [{
        type: {
            name: pokemonTypes[Math.floor(Math.random() * pokemonTypes.length)]
        }
    }],
    stats: [
        { base_stat: Math.floor(Math.random() * 100) + 30, stat: { name: 'hp' } },
        { base_stat: Math.floor(Math.random() * 100) + 30, stat: { name: 'attack' } },
        { base_stat: Math.floor(Math.random() * 100) + 30, stat: { name: 'defense' } },
        { base_stat: Math.floor(Math.random() * 100) + 30, stat: { name: 'speed' } }
    ],
    abilities: [{ ability: { name: `ability-${Math.floor(Math.random() * 3) + 1}` } }],
    moves: [{ move: { name: `move-${Math.floor(Math.random() * 10) + 1}` } }],
    sprites: {
        front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${Math.floor(Math.random() * 151) + 1}.png`,
        back_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${Math.floor(Math.random() * 151) + 1}.png`
    }
});

// GET /api/pokemon/list - Get list of available Pokemon
router.get('/list', (req, res) => {
    try {
        // Return simple array for sprite manager compatibility
        res.json(pokemonList);
    } catch (error) {
        console.error('Error getting Pokemon list:', error);
        res.status(500).json({ error: 'Failed to get Pokemon list' });
    }
});

// GET /api/pokemons/:name.json - Get specific Pokemon data
router.get('/:name.json', (req, res) => {
    try {
        const pokemonName = req.params.name.toLowerCase();
        
        if (!pokemonList.includes(pokemonName)) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }
        
        const pokemonData = createPokemonData(pokemonName);
        res.json(pokemonData);
    } catch (error) {
        console.error('Error getting Pokemon data:', error);
        res.status(500).json({ error: 'Failed to get Pokemon data' });
    }
});

// GET /api/types/:type.json - Get Pokemon type data
router.get('/types/:type.json', (req, res) => {
    try {
        const typeName = req.params.type.toLowerCase();
        
        if (!pokemonTypes.includes(typeName)) {
            return res.status(404).json({ error: 'Type not found' });
        }
        
        const typeData = {
            name: typeName,
            damage_relations: {
                double_damage_to: [],
                double_damage_from: [],
                half_damage_to: [],
                half_damage_from: [],
                no_damage_to: [],
                no_damage_from: []
            },
            pokemon: pokemonList
                .filter(() => Math.random() > 0.7) // Random subset
                .map(name => ({ pokemon: { name, url: `/api/pokemons/${name}.json` } }))
        };
        
        res.json(typeData);
    } catch (error) {
        console.error('Error getting type data:', error);
        res.status(500).json({ error: 'Failed to get type data' });
    }
});

// GET /api/pokemon/sprites/:id - Get Pokemon sprite data
router.get('/sprites/:id', (req, res) => {
    try {
        const pokemonId = parseInt(req.params.id);
        
        if (isNaN(pokemonId) || pokemonId < 1 || pokemonId > 1000) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }
        
        const spriteData = {
            id: pokemonId,
            sprites: {
                front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
                back_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${pokemonId}.png`,
                front_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`,
                back_shiny: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/${pokemonId}.png`
            }
        };
        
        res.json(spriteData);
    } catch (error) {
        console.error('Error getting sprite data:', error);
        res.status(500).json({ error: 'Failed to get sprite data' });
    }
});

module.exports = router;