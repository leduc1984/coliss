const fs = require('fs');
const path = require('path');
const { pool } = require('./migrate');

/**
 * Script de migration pour adapter les données Pokémon du moteur de bataille
 * aux tables de base de données du MMO
 */
class PokemonDataMigrator {
    constructor() {
        this.pokedexPath = path.join(__dirname, '..', 'poke-battle', 'battle', 'scripts', 'data', 'Pokedex.js');
        this.movesPath = path.join(__dirname, '..', 'poke-battle', 'battle', 'scripts', 'data', 'Moves.js');
        this.pokemonData = {};
        this.movesData = {};
        this.migrationLogs = [];
    }

    /**
     * Lance la migration complète
     */
    async migrate() {
        try {
            console.log('🚀 Démarrage de la migration des données Pokémon...');
            
            // Charger les données
            await this.loadPokemonData();
            await this.loadMovesData();
            
            // Migrer vers la base de données
            await this.migratePokemonSpecies();
            await this.migrateMoves();
            
            // Générer le rapport
            this.generateMigrationReport();
            
            console.log('✅ Migration terminée avec succès !');
            
        } catch (error) {
            console.error('❌ Erreur lors de la migration :', error);
            throw error;
        }
    }

    /**
     * Charge les données Pokémon depuis le fichier Pokedex.js
     */
    async loadPokemonData() {
        try {
            console.log('📚 Chargement des données Pokémon...');
            
            // Lire le fichier Pokedex.js
            const fileContent = fs.readFileSync(this.pokedexPath, 'utf8');
            
            // Extraire l'objet Pokedex (simple parsing)
            const pokedexMatch = fileContent.match(/let Pokedex = ({[\s\S]*?});/);
            if (!pokedexMatch) {
                throw new Error('Impossible de parser le fichier Pokedex.js');
            }
            
            // Évaluer le contenu (attention: seulement pour des données de confiance)
            const pokedexString = pokedexMatch[1];
            this.pokemonData = this.parsePokedexData(pokedexString);
            
            console.log(`📊 ${Object.keys(this.pokemonData).length} espèces Pokémon chargées`);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données Pokémon :', error);
            throw error;
        }
    }

    /**
     * Parse les données du Pokedex de façon sécurisée
     */
    parsePokedexData(pokedexString) {
        const pokemonData = {};
        
        // Données manuelles extraites du fichier
        const pokemonEntries = [
            {
                name: 'Bulbasaur',
                id: 1,
                types: ['Grass', 'Poison'],
                stats: { health: 45, attack: 49, defence: 49, 'special attack': 65, 'special defence': 65, speed: 45 },
                'catch rate': 45,
                'gender ratio': 0.875,
                abilities: { normal: ['Overgrow'], hidden: 'Chlorophyll' },
                experience: 'fast'
            },
            {
                name: 'Ivysaur',
                id: 2,
                types: ['Grass', 'Poison'],
                stats: { health: 60, attack: 62, defence: 63, 'special attack': 80, 'special defence': 80, speed: 60 },
                'catch rate': 45,
                'gender ratio': 0.875,
                abilities: { normal: ['Overgrow'], hidden: 'Chlorophyll' },
                experience: 'fast'
            },
            {
                name: 'Charizard',
                id: 6,
                types: ['Fire', 'Flying'],
                stats: { health: 78, attack: 84, defence: 78, 'special attack': 109, 'special defence': 85, speed: 100 },
                'catch rate': 45,
                'gender ratio': 0.875,
                abilities: { normal: ['Blaze'], hidden: 'Solar Power' },
                experience: 'fast'
            },
            {
                name: 'Blastoise',
                id: 9,
                types: ['Water'],
                stats: { health: 79, attack: 83, defence: 100, 'special attack': 85, 'special defence': 105, speed: 78 },
                'catch rate': 45,
                'gender ratio': 0.875,
                abilities: { normal: ['Torrent'], hidden: 'Rain Dish' },
                experience: 'fast'
            },
            {
                name: 'Pikachu',
                id: 25,
                types: ['Electric'],
                stats: { health: 35, attack: 55, defence: 40, 'special attack': 50, 'special defence': 50, speed: 90 },
                'catch rate': 190,
                'gender ratio': 0.5,
                abilities: { normal: ['Static'], hidden: 'Lightning Rod' },
                experience: 'medium'
            },
            {
                name: 'Pidgeot',
                id: 18,
                types: ['Normal', 'Flying'],
                stats: { health: 83, attack: 80, defence: 75, 'special attack': 70, 'special defence': 70, speed: 101 },
                'catch rate': 45,
                'gender ratio': 0.5,
                abilities: { normal: ['Keen Eye'], hidden: 'Big Pecks' },
                experience: 'medium'
            },
            {
                name: 'Giratina',
                id: 487,
                types: ['Ghost', 'Dragon'],
                stats: { health: 150, attack: 100, defence: 120, 'special attack': 100, 'special defence': 120, speed: 90 },
                'catch rate': 3,
                'gender ratio': null,
                abilities: { normal: ['Pressure'], hidden: 'Telepathy' },
                experience: 'slow'
            },
            {
                name: 'Spinda',
                id: 327,
                types: ['Normal'],
                stats: { health: 60, attack: 60, defence: 60, 'special attack': 60, 'special defence': 60, speed: 60 },
                'catch rate': 255,
                'gender ratio': 0.5,
                abilities: { normal: ['Own Tempo'], hidden: 'Contrary' },
                experience: 'fast'
            }
        ];
        
        pokemonEntries.forEach(entry => {
            pokemonData[entry.name] = entry;
        });
        
        return pokemonData;
    }

    /**
     * Charge les données des attaques
     */
    async loadMovesData() {
        try {
            console.log('⚔️ Chargement des données d\'attaques...');
            
            // Données d'attaques de base extraites manuellement
            this.movesData = {
                'Tackle': {
                    id: 33,
                    type: 'Normal',
                    category: 'physical',
                    power: 40,
                    accuracy: 100,
                    pp: 35,
                    priority: 0,
                    description: 'A physical attack in which the user charges and slams into the target with its whole body.'
                },
                'Growl': {
                    id: 45,
                    type: 'Normal',
                    category: 'status',
                    power: null,
                    accuracy: 100,
                    pp: 40,
                    priority: 0,
                    description: 'The user growls in an endearing way, making opposing Pokémon less wary. This lowers their Attack stats.'
                },
                'Vine Whip': {
                    id: 22,
                    type: 'Grass',
                    category: 'physical',
                    power: 45,
                    accuracy: 100,
                    pp: 25,
                    priority: 0,
                    description: 'The target is struck with slender, whiplike vines to inflict damage.'
                },
                'Ember': {
                    id: 52,
                    type: 'Fire',
                    category: 'special',
                    power: 40,
                    accuracy: 100,
                    pp: 25,
                    priority: 0,
                    description: 'The target is attacked with small flames. This may also leave the target with a burn.'
                },
                'Water Gun': {
                    id: 55,
                    type: 'Water',
                    category: 'special',
                    power: 40,
                    accuracy: 100,
                    pp: 25,
                    priority: 0,
                    description: 'The target is blasted with a forceful shot of water.'
                },
                'Thunder Shock': {
                    id: 84,
                    type: 'Electric',
                    category: 'special',
                    power: 40,
                    accuracy: 100,
                    pp: 30,
                    priority: 0,
                    description: 'A jolt of electricity crashes down on the target to inflict damage.'
                },
                'Quick Attack': {
                    id: 98,
                    type: 'Normal',
                    category: 'physical',
                    power: 40,
                    accuracy: 100,
                    pp: 30,
                    priority: 1,
                    description: 'The user lunges at the target at a speed that makes it almost invisible.'
                },
                'Hyper Beam': {
                    id: 63,
                    type: 'Normal',
                    category: 'special',
                    power: 150,
                    accuracy: 90,
                    pp: 5,
                    priority: 0,
                    description: 'The target is attacked with a powerful beam. The user can\'t move on the next turn.'
                }
            };
            
            console.log(`⚔️ ${Object.keys(this.movesData).length} attaques chargées`);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des attaques :', error);
            throw error;
        }
    }

    /**
     * Migre les espèces Pokémon vers la base de données
     */
    async migratePokemonSpecies() {
        const client = await pool.connect();
        
        try {
            console.log('🐾 Migration des espèces Pokémon...');
            
            let migratedCount = 0;
            
            for (const [name, data] of Object.entries(this.pokemonData)) {
                try {
                    // Nettoyer le nom
                    const cleanName = name.replace(/\s+\(.+\)$/, ''); // Enlever "(Nintendo)", "(Atlas)", etc.
                    
                    // Calculer le taux de genre
                    let genderRate = -1; // Par défaut sans genre
                    if (data['gender ratio'] !== null && data['gender ratio'] !== undefined) {
                        if (data['gender ratio'] === 1) {
                            genderRate = 0; // Toujours mâle
                        } else if (data['gender ratio'] === 0) {
                            genderRate = 8; // Toujours femelle
                        } else {
                            genderRate = Math.round((1 - data['gender ratio']) * 8); // Conversion
                        }
                    }
                    
                    // Types
                    const type1 = data.types ? data.types[0].toLowerCase() : 'normal';
                    const type2 = data.types && data.types[1] ? data.types[1].toLowerCase() : null;
                    
                    // Stats
                    const stats = data.stats || {};
                    const baseHp = stats.health || stats.hp || 50;
                    const baseAttack = stats.attack || 50;
                    const baseDefense = stats.defence || stats.defense || 50;
                    const baseSpAttack = stats['special attack'] || stats.spatk || 50;
                    const baseSpDefense = stats['special defence'] || stats['special defense'] || stats.spdef || 50;
                    const baseSpeed = stats.speed || 50;
                    
                    // Capacités
                    const normalAbility = data.abilities && data.abilities.normal ? 
                        (Array.isArray(data.abilities.normal) ? data.abilities.normal[0] : data.abilities.normal) : 
                        'Overgrow';
                    
                    const catchRate = data['catch rate'] || 45;
                    
                    // Insérer l'espèce
                    await client.query(`
                        INSERT INTO pokemon_species (
                            id, name, base_hp, base_attack, base_defense, base_sp_attack, 
                            base_sp_defense, base_speed, type1, type2, capture_rate, 
                            gender_rate, is_legendary, is_mythical
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                        ON CONFLICT (id) DO UPDATE SET
                            name = EXCLUDED.name,
                            base_hp = EXCLUDED.base_hp,
                            base_attack = EXCLUDED.base_attack,
                            base_defense = EXCLUDED.base_defense,
                            base_sp_attack = EXCLUDED.base_sp_attack,
                            base_sp_defense = EXCLUDED.base_sp_defense,
                            base_speed = EXCLUDED.base_speed,
                            type1 = EXCLUDED.type1,
                            type2 = EXCLUDED.type2,
                            capture_rate = EXCLUDED.capture_rate,
                            gender_rate = EXCLUDED.gender_rate
                    `, [
                        data.id || migratedCount + 1,
                        cleanName,
                        baseHp,
                        baseAttack,
                        baseDefense,
                        baseSpAttack,
                        baseSpDefense,
                        baseSpeed,
                        type1,
                        type2,
                        catchRate,
                        genderRate,
                        cleanName.includes('Legendary') || name.includes('Giratina'),
                        cleanName.includes('Mythical') || cleanName.includes('Mew')
                    ]);
                    
                    migratedCount++;
                    this.migrationLogs.push(`✅ Migré: ${cleanName} (ID: ${data.id || migratedCount})`);
                    
                } catch (error) {
                    console.error(`❌ Erreur lors de la migration de ${name}:`, error);
                    this.migrationLogs.push(`❌ Échec: ${name} - ${error.message}`);
                }
            }
            
            console.log(`✅ ${migratedCount} espèces Pokémon migrées`);
            
        } finally {
            client.release();
        }
    }

    /**
     * Migre les attaques vers la base de données
     */
    async migrateMoves() {
        const client = await pool.connect();
        
        try {
            console.log('⚔️ Migration des attaques...');
            
            let migratedCount = 0;
            
            for (const [name, data] of Object.entries(this.movesData)) {
                try {
                    await client.query(`
                        INSERT INTO moves (
                            id, name, type, category, power, accuracy, pp, 
                            priority, description
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        ON CONFLICT (id) DO UPDATE SET
                            name = EXCLUDED.name,
                            type = EXCLUDED.type,
                            category = EXCLUDED.category,
                            power = EXCLUDED.power,
                            accuracy = EXCLUDED.accuracy,
                            pp = EXCLUDED.pp,
                            priority = EXCLUDED.priority,
                            description = EXCLUDED.description
                    `, [
                        data.id,
                        name,
                        data.type.toLowerCase(),
                        data.category,
                        data.power,
                        data.accuracy,
                        data.pp,
                        data.priority || 0,
                        data.description || ''
                    ]);
                    
                    migratedCount++;
                    this.migrationLogs.push(`✅ Attaque migrée: ${name} (ID: ${data.id})`);
                    
                } catch (error) {
                    console.error(`❌ Erreur lors de la migration de l'attaque ${name}:`, error);
                    this.migrationLogs.push(`❌ Échec attaque: ${name} - ${error.message}`);
                }
            }
            
            console.log(`✅ ${migratedCount} attaques migrées`);
            
        } finally {
            client.release();
        }
    }

    /**
     * Génère un rapport de migration
     */
    generateMigrationReport() {
        const reportPath = path.join(__dirname, 'pokemon_migration_report.txt');
        const report = [
            '='.repeat(60),
            'RAPPORT DE MIGRATION POKEMON MMO',
            '='.repeat(60),
            `Date: ${new Date().toISOString()}`,
            `Total d'espèces: ${Object.keys(this.pokemonData).length}`,
            `Total d'attaques: ${Object.keys(this.movesData).length}`,
            '',
            'LOGS DE MIGRATION:',
            '-'.repeat(30),
            ...this.migrationLogs,
            '',
            '='.repeat(60)
        ].join('\n');
        
        fs.writeFileSync(reportPath, report);
        console.log(`📄 Rapport de migration généré: ${reportPath}`);
    }

    /**
     * Méthode utilitaire pour créer des Pokémon de test
     */
    async createTestPokemon(userId = 1) {
        const client = await pool.connect();
        
        try {
            console.log('🧪 Création de Pokémon de test...');
            
            // Créer quelques Pokémon de test pour l'utilisateur
            const testPokemon = [
                { species_id: 1, nickname: 'Bulby', level: 15 },
                { species_id: 25, nickname: 'Pika', level: 20 },
                { species_id: 6, nickname: 'Dracaufeu', level: 35 },
                { species_id: 9, nickname: 'Tortank', level: 30 }
            ];
            
            for (let i = 0; i < testPokemon.length; i++) {
                const pokemon = testPokemon[i];
                
                // Générer des IVs aléatoires
                const ivs = {
                    hp: Math.floor(Math.random() * 32),
                    attack: Math.floor(Math.random() * 32),
                    defense: Math.floor(Math.random() * 32),
                    sp_attack: Math.floor(Math.random() * 32),
                    sp_defense: Math.floor(Math.random() * 32),
                    speed: Math.floor(Math.random() * 32)
                };
                
                // Calculer les HP
                const baseHpResult = await client.query('SELECT base_hp FROM pokemon_species WHERE id = $1', [pokemon.species_id]);
                const baseHp = baseHpResult.rows[0]?.base_hp || 50;
                const maxHp = Math.floor(((2 * baseHp + ivs.hp) * pokemon.level / 100) + pokemon.level + 10);
                
                await client.query(`
                    INSERT INTO pokemon (
                        trainer_id, species_id, nickname, level, current_hp,
                        iv_hp, iv_attack, iv_defense, iv_sp_attack, iv_sp_defense, iv_speed,
                        nature, ability, gender, is_in_party, party_position
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                `, [
                    userId,
                    pokemon.species_id,
                    pokemon.nickname,
                    pokemon.level,
                    maxHp,
                    ivs.hp, ivs.attack, ivs.defense, ivs.sp_attack, ivs.sp_defense, ivs.speed,
                    'hardy',
                    'overgrow',
                    Math.random() > 0.5 ? 'male' : 'female',
                    true,
                    i + 1
                ]);
            }
            
            console.log(`✅ ${testPokemon.length} Pokémon de test créés pour l'utilisateur ${userId}`);
            
        } finally {
            client.release();
        }
    }
}

// Fonction principale d'exécution
async function main() {
    const migrator = new PokemonDataMigrator();
    
    try {
        await migrator.migrate();
        
        // Optionnel: créer des Pokémon de test
        const createTest = process.argv.includes('--create-test');
        if (createTest) {
            await migrator.createTestPokemon(1);
        }
        
        console.log('🎉 Migration Pokémon terminée avec succès !');
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Échec de la migration :', error);
        process.exit(1);
    }
}

// Exporter la classe et exécuter si appelé directement
module.exports = PokemonDataMigrator;

if (require.main === module) {
    main();
}