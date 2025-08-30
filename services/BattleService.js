const { pool } = require('../database/migrate');
const crypto = require('crypto');

/**
 * Service de gestion des batailles pour le Pokemon MMO
 * Gère la création, le déroulement et la fin des combats
 */
class BattleService {
    constructor(io, redisClient = null) {
        this.io = io;
        this.redisClient = redisClient;
        this.activeBattles = new Map(); // Map de battleId -> BattleRoom
        this.waitingPlayers = new Set(); // Joueurs en attente de combat
        this.playerToBattle = new Map(); // Map userId -> battleId
        
        console.log('⚔️ BattleService initialized');
    }

    /**
     * Génère un ID unique pour une bataille
     */
    generateBattleId() {
        return crypto.randomUUID();
    }

    /**
     * Initie une bataille entre deux joueurs
     */
    async initiateBattle(player1Socket, player2Socket, battleType = 'pvp') {
        try {
            const battleId = this.generateBattleId();
            
            // Créer la salle de bataille
            const battleRoom = new BattleRoom(battleId, player1Socket, player2Socket, battleType);
            
            // Charger les équipes des joueurs
            await battleRoom.loadPlayerTeams();
            
            // Stocker la bataille
            this.activeBattles.set(battleId, battleRoom);
            this.playerToBattle.set(player1Socket.user.id, battleId);
            this.playerToBattle.set(player2Socket.user.id, battleId);
            
            // Joindre les joueurs à la room Socket.io
            player1Socket.join(battleId);
            player2Socket.join(battleId);
            
            // Démarrer la bataille
            await battleRoom.start();
            
            console.log(`⚔️ Battle started: ${battleId} between ${player1Socket.user.username} and ${player2Socket.user.username}`);
            
            return battleRoom;
            
        } catch (error) {
            console.error('Failed to initiate battle:', error);
            throw error;
        }
    }

    /**
     * Initie une bataille contre un Pokémon sauvage
     */
    async initiateWildBattle(playerSocket, wildPokemon) {
        try {
            const battleId = this.generateBattleId();
            
            // Créer la salle de bataille sauvage
            const battleRoom = new WildBattleRoom(battleId, playerSocket, wildPokemon);
            
            // Charger l'équipe du joueur
            await battleRoom.loadPlayerTeam();
            
            // Stocker la bataille
            this.activeBattles.set(battleId, battleRoom);
            this.playerToBattle.set(playerSocket.user.id, battleId);
            
            // Joindre le joueur à la room Socket.io
            playerSocket.join(battleId);
            
            // Démarrer la bataille
            await battleRoom.start();
            
            console.log(`🐾 Wild battle started: ${battleId} for ${playerSocket.user.username}`);
            
            return battleRoom;
            
        } catch (error) {
            console.error('Failed to initiate wild battle:', error);
            throw error;
        }
    }

    /**
     * Traite un mouvement de bataille
     */
    async processMove(socket, data) {
        try {
            const { battleId, moveId, targetId } = data;
            const battle = this.activeBattles.get(battleId);
            
            if (!battle) {
                throw new Error('Battle not found');
            }
            
            if (!battle.isPlayerInBattle(socket.user.id)) {
                throw new Error('Player not in this battle');
            }
            
            await battle.processPlayerMove(socket.user.id, {
                type: 'move',
                moveId: moveId,
                targetId: targetId
            });
            
        } catch (error) {
            console.error('Failed to process move:', error);
            socket.emit('battle_error', { message: error.message });
        }
    }

    /**
     * Traite un changement de Pokémon
     */
    async processPokemonSwitch(socket, data) {
        try {
            const { battleId, pokemonIndex } = data;
            const battle = this.activeBattles.get(battleId);
            
            if (!battle) {
                throw new Error('Battle not found');
            }
            
            await battle.processPlayerMove(socket.user.id, {
                type: 'switch',
                pokemonIndex: pokemonIndex
            });
            
        } catch (error) {
            console.error('Failed to process switch:', error);
            socket.emit('battle_error', { message: error.message });
        }
    }

    /**
     * Traite une tentative de fuite
     */
    async processRun(socket, data) {
        try {
            const { battleId } = data;
            const battle = this.activeBattles.get(battleId);
            
            if (!battle) {
                throw new Error('Battle not found');
            }
            
            await battle.processPlayerMove(socket.user.id, {
                type: 'run'
            });
            
        } catch (error) {
            console.error('Failed to process run:', error);
            socket.emit('battle_error', { message: error.message });
        }
    }

    /**
     * Termine une bataille
     */
    async endBattle(battleId, result) {
        try {
            const battle = this.activeBattles.get(battleId);
            if (!battle) return;
            
            // Sauvegarder les résultats
            await battle.saveResults(result);
            
            // Notifier les joueurs
            this.io.to(battleId).emit('battle_end', {
                result: result,
                message: this.getBattleEndMessage(result)
            });
            
            // Nettoyer
            this.cleanupBattle(battleId);
            
            console.log(`⚔️ Battle ended: ${battleId}`, result);
            
        } catch (error) {
            console.error('Failed to end battle:', error);
        }
    }

    /**
     * Nettoie une bataille terminée
     */
    cleanupBattle(battleId) {
        const battle = this.activeBattles.get(battleId);
        if (battle) {
            // Retirer les joueurs de la map
            for (const playerId of battle.getPlayerIds()) {
                this.playerToBattle.delete(playerId);
            }
            
            // Supprimer la bataille
            this.activeBattles.delete(battleId);
            
            // Nettoyer le cache Redis si disponible
            if (this.redisClient && this.redisClient.isReady) {
                this.redisClient.del(`battle:${battleId}`);
            }
        }
    }
    
    /**
     * Cache les données de bataille dans Redis
     */
    async cacheBattleData(battleId, data) {
        if (!this.redisClient || !this.redisClient.isReady) return;
        
        try {
            const cacheKey = `battle:${battleId}`;
            await this.redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
            console.log(`💾 Battle data cached: ${battleId}`);
        } catch (error) {
            console.error('Redis caching error:', error);
        }
    }
    
    /**
     * Récupère les données de bataille depuis Redis
     */
    async getCachedBattleData(battleId) {
        if (!this.redisClient || !this.redisClient.isReady) return null;
        
        try {
            const cacheKey = `battle:${battleId}`;
            const cachedData = await this.redisClient.get(cacheKey);
            
            if (cachedData) {
                return JSON.parse(cachedData);
            }
        } catch (error) {
            console.error('Redis fetch error:', error);
        }
        
        return null;
    }

    /**
     * Gère une demande de bataille
     */
    async handleBattleRequest(socket, data) {
        try {
            const { targetUserId, battleType = 'pvp' } = data;
            
            if (!socket.user) {
                throw new Error('User not authenticated');
            }
            
            // Vérifier si le joueur est déjà en bataille
            if (this.playerToBattle.has(socket.user.id)) {
                throw new Error('Already in battle');
            }
            
            // Vérifier le cache Redis pour les informations de bataille récentes
            if (this.redisClient && this.redisClient.isReady) {
                const recentBattleKey = `recent_battle:${socket.user.id}_${targetUserId}`;
                const recentBattle = await this.redisClient.get(recentBattleKey);
                
                if (recentBattle) {
                    const battleData = JSON.parse(recentBattle);
                    const timeSinceLastBattle = Date.now() - battleData.timestamp;
                    
                    // Limiter les demandes de bataille à une toutes les 30 secondes
                    if (timeSinceLastBattle < 30000) {
                        socket.emit('battle_cooldown', {
                            message: 'Please wait before requesting another battle',
                            remainingTime: Math.floor((30000 - timeSinceLastBattle) / 1000)
                        });
                        return;
                    }
                }
            }
            
            // Trouver le joueur cible
            const targetSocket = this.findPlayerSocket(targetUserId);
            if (!targetSocket) {
                throw new Error('Target player not found');
            }
            
            // Vérifier si la cible est disponible
            if (this.playerToBattle.has(targetUserId)) {
                throw new Error('Target player is already in battle');
            }
            
            // Envoyer la demande de bataille
            targetSocket.emit('battle_invitation', {
                fromUserId: socket.user.id,
                fromUsername: socket.user.username,
                battleType: battleType
            });
            
            // Notifier le demandeur
            socket.emit('battle_request_sent', {
                targetUsername: targetSocket.user.username
            });
            
            // Stocker dans Redis
            if (this.redisClient && this.redisClient.isReady) {
                const battleRequestData = {
                    fromUserId: socket.user.id,
                    fromUsername: socket.user.username,
                    targetUserId: targetUserId,
                    targetUsername: targetSocket.user.username,
                    battleType: battleType,
                    timestamp: Date.now()
                };
                
                const recentBattleKey = `recent_battle:${socket.user.id}_${targetUserId}`;
                await this.redisClient.setEx(recentBattleKey, 300, JSON.stringify(battleRequestData));
            }
            
            console.log(`⚔️ Battle request: ${socket.user.username} -> ${targetSocket.user.username}`);
            
        } catch (error) {
            console.error('Failed to handle battle request:', error);
            throw error;
        }
    }
    
    /**
     * Gère l'acceptation d'une bataille
     */
    async handleBattleAccept(socket, data) {
        try {
            const { fromUserId, battleType = 'pvp' } = data;
            
            if (!socket.user) {
                throw new Error('User not authenticated');
            }
            
            // Trouver le joueur qui a fait la demande
            const challengerSocket = this.findPlayerSocket(fromUserId);
            if (!challengerSocket) {
                throw new Error('Challenger not found');
            }
            
            // Vérifier que les deux joueurs sont disponibles
            if (this.playerToBattle.has(socket.user.id) || this.playerToBattle.has(fromUserId)) {
                throw new Error('One of the players is already in battle');
            }
            
            // Initier la bataille
            await this.initiateBattle(challengerSocket, socket, battleType);
            
            console.log(`⚔️ Battle accepted: ${challengerSocket.user.username} vs ${socket.user.username}`);
            
        } catch (error) {
            console.error('Failed to handle battle accept:', error);
            throw error;
        }
    }
    
    /**
     * Gère une rencontre avec un Pokémon sauvage
     */
    async handleWildEncounter(socket, data) {
        try {
            const { wildPokemon } = data;
            
            if (!socket.user) {
                throw new Error('User not authenticated');
            }
            
            // Vérifier si le joueur est déjà en bataille
            if (this.playerToBattle.has(socket.user.id)) {
                throw new Error('Already in battle');
            }
            
            // Créer le Pokémon sauvage
            const wild = this.generateWildPokemon(wildPokemon);
            
            // Initier la bataille sauvage
            await this.initiateWildBattle(socket, wild);
            
            console.log(`🐾 Wild encounter: ${socket.user.username} vs ${wild.name}`);
            
        } catch (error) {
            console.error('Failed to handle wild encounter:', error);
            throw error;
        }
    }
    
    /**
     * Trouve un socket de joueur par ID utilisateur
     */
    findPlayerSocket(userId) {
        for (const [socketId, socket] of this.io.sockets.sockets) {
            if (socket.user && socket.user.id === userId) {
                return socket;
            }
        }
        return null;
    }
    
    /**
     * Gère la déconnexion d'un joueur du service
     */
    handlePlayerDisconnect(socket) {
        if (!socket || !socket.user) {
            return; // Pas d'utilisateur, rien à faire
        }
        
        const userId = socket.user.id;
        const battleId = this.playerToBattle.get(userId);
        
        if (battleId) {
            console.log(`🚪 Player ${socket.user.username} disconnected from battle ${battleId}`);
            
            const battle = this.activeBattles.get(battleId);
            if (battle && typeof battle.handlePlayerDisconnect === 'function') {
                battle.handlePlayerDisconnect(userId);
            }
            
            // Nettoyer les références
            this.playerToBattle.delete(userId);
            this.waitingPlayers.delete(socket);
        }
    }
    
    /**
     * Génère un Pokémon sauvage
     */
    generateWildPokemon(wildData) {
        const level = wildData.level || Math.floor(Math.random() * 20) + 5;
        
        return {
            id: 'wild_' + crypto.randomUUID(),
            species_id: wildData.species_id || 25, // Pikachu par défaut
            name: wildData.name || 'Pikachu sauvage',
            level: level,
            current_hp: this.calculateWildHP(wildData.species_id, level),
            max_hp: this.calculateWildHP(wildData.species_id, level),
            attack: this.calculateWildStat(wildData.base_attack || 55, level),
            defense: this.calculateWildStat(wildData.base_defense || 40, level),
            sp_attack: this.calculateWildStat(wildData.base_sp_attack || 50, level),
            sp_defense: this.calculateWildStat(wildData.base_sp_defense || 50, level),
            speed: this.calculateWildStat(wildData.base_speed || 90, level),
            type1: wildData.type1 || 'electric',
            type2: wildData.type2 || null,
            moves: this.getWildPokemonMoves(wildData.species_id, level),
            ability: wildData.ability || 'static',
            nature: this.getRandomNature(),
            gender: wildData.gender || (Math.random() > 0.5 ? 'male' : 'female'),
            is_shiny: wildData.is_shiny || (Math.random() < 0.001), // 0.1% chance
            status: [],
            stats_modifiers: {
                attack: 0,
                defense: 0,
                sp_attack: 0,
                sp_defense: 0,
                speed: 0,
                accuracy: 0,
                evasion: 0
            }
        };
    }
    
    /**
     * Calcule les HP d'un Pokémon sauvage
     */
    calculateWildHP(speciesId, level) {
        const baseHP = 45; // HP de base par défaut
        const iv = Math.floor(Math.random() * 32);
        return Math.floor(((2 * baseHP + iv) * level / 100) + level + 10);
    }
    
    /**
     * Calcule une statistique d'un Pokémon sauvage
     */
    calculateWildStat(baseStat, level) {
        const iv = Math.floor(Math.random() * 32);
        return Math.floor(((2 * baseStat + iv) * level / 100) + 5);
    }
    
    /**
     * Obtient les attaques d'un Pokémon sauvage
     */
    getWildPokemonMoves(speciesId, level) {
        // Expanded default moves for wild Pokemon with more variety
        const wildMoves = [
            { id: 1, name: 'Charge', type: 'normal', power: 40, accuracy: 100, current_pp: 35, max_pp: 35 },
            { id: 2, name: 'Grognement', type: 'normal', power: 0, accuracy: 100, current_pp: 40, max_pp: 40 },
            { id: 3, name: 'Vive-attaque', type: 'normal', power: 40, accuracy: 100, current_pp: 30, max_pp: 30 },
            { id: 4, name: 'Queue de fer', type: 'steel', power: 100, accuracy: 75, current_pp: 15, max_pp: 15 },
            { id: 5, name: 'Tackle', type: 'normal', power: 50, accuracy: 100, current_pp: 35, max_pp: 35 },
            { id: 6, name: 'Scratch', type: 'normal', power: 40, accuracy: 100, current_pp: 35, max_pp: 35 },
            { id: 7, name: 'Ember', type: 'fire', power: 40, accuracy: 100, current_pp: 25, max_pp: 25 },
            { id: 8, name: 'Water Gun', type: 'water', power: 40, accuracy: 100, current_pp: 25, max_pp: 25 },
            { id: 9, name: 'Thunder Shock', type: 'electric', power: 40, accuracy: 100, current_pp: 30, max_pp: 30 },
            { id: 10, name: 'Vine Whip', type: 'grass', power: 45, accuracy: 100, current_pp: 25, max_pp: 25 },
            { id: 11, name: 'Poison Sting', type: 'poison', power: 15, accuracy: 100, current_pp: 35, max_pp: 35 },
            { id: 12, name: 'Gust', type: 'flying', power: 40, accuracy: 100, current_pp: 35, max_pp: 35 },
            { id: 13, name: 'Bug Bite', type: 'bug', power: 60, accuracy: 100, current_pp: 20, max_pp: 20 },
            { id: 14, name: 'Rock Throw', type: 'rock', power: 50, accuracy: 90, current_pp: 15, max_pp: 15 },
            { id: 15, name: 'Mud Shot', type: 'ground', power: 55, accuracy: 100, current_pp: 15, max_pp: 15 },
            // Action-based moves
            { id: 99, name: 'idle', type: 'normal', power: 0, accuracy: 100, current_pp: 40, max_pp: 40 },
            { id: 100, name: 'move', type: 'normal', power: 0, accuracy: 100, current_pp: 40, max_pp: 40 },
            { id: 101, name: 'run', type: 'normal', power: 0, accuracy: 100, current_pp: 40, max_pp: 40 },
            { id: 102, name: 'jump', type: 'normal', power: 0, accuracy: 100, current_pp: 40, max_pp: 40 },
            { id: 108, name: 'dodge', type: 'normal', power: 0, accuracy: 100, current_pp: 30, max_pp: 30 },
            { id: 109, name: 'boost', type: 'normal', power: 0, accuracy: 100, current_pp: 20, max_pp: 20 }
        ];
        
        // Select 4 random moves for the wild Pokemon
        const selectedMoves = [];
        const availableMoves = [...wildMoves];
        
        while (selectedMoves.length < 4 && availableMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            selectedMoves.push(availableMoves.splice(randomIndex, 1)[0]);
        }
        
        return selectedMoves;
    }
    
    /**
     * Obtient une nature aléatoire
     */
    getRandomNature() {
        const natures = [
            'hardy', 'lonely', 'brave', 'adamant', 'naughty',
            'bold', 'docile', 'relaxed', 'impish', 'lax',
            'timid', 'hasty', 'serious', 'jolly', 'naive',
            'modest', 'mild', 'quiet', 'bashful', 'rash',
            'calm', 'gentle', 'sassy', 'careful', 'quirky'
        ];
        return natures[Math.floor(Math.random() * natures.length)];
    }

    /**
     * Obtient les données d'une attaque
     */
    getMoveData(moveId) {
        // Expanded move database with more moves
        const moveDatabase = {
            1: { name: 'Charge', type: 'normal', category: 'physical', power: 40 },
            2: { name: 'Grognement', type: 'normal', category: 'status', power: 0 },
            3: { name: 'Vive-attaque', type: 'normal', category: 'physical', power: 40 },
            4: { name: 'Queue de fer', type: 'steel', category: 'physical', power: 100 },
            5: { name: 'Tackle', type: 'normal', category: 'physical', power: 50 },
            6: { name: 'Scratch', type: 'normal', category: 'physical', power: 40 },
            7: { name: 'Ember', type: 'fire', category: 'special', power: 40 },
            8: { name: 'Water Gun', type: 'water', category: 'special', power: 40 },
            9: { name: 'Thunder Shock', type: 'electric', category: 'special', power: 40 },
            10: { name: 'Vine Whip', type: 'grass', category: 'physical', power: 45 },
            11: { name: 'Poison Sting', type: 'poison', category: 'physical', power: 15 },
            12: { name: 'Gust', type: 'flying', category: 'special', power: 40 },
            13: { name: 'Bug Bite', type: 'bug', category: 'physical', power: 60 },
            14: { name: 'Rock Throw', type: 'rock', category: 'physical', power: 50 },
            15: { name: 'Mud Shot', type: 'ground', category: 'special', power: 55 },
            16: { name: 'Karate Chop', type: 'fighting', category: 'physical', power: 50 },
            17: { name: 'Confusion', type: 'psychic', category: 'special', power: 50 },
            18: { name: 'Powder Snow', type: 'ice', category: 'special', power: 40 },
            19: { name: 'Lick', type: 'ghost', category: 'physical', power: 30 },
            20: { name: 'Twister', type: 'dragon', category: 'special', power: 40 },
            21: { name: 'Bite', type: 'dark', category: 'physical', power: 60 },
            22: { name: 'Fouet Lianes', type: 'grass', category: 'physical', power: 45 },
            23: { name: 'Metal Claw', type: 'steel', category: 'physical', power: 50 },
            24: { name: 'Fairy Wind', type: 'fairy', category: 'special', power: 40 },
            25: { name: 'Flamethrower', type: 'fire', category: 'special', power: 90 },
            26: { name: 'Surf', type: 'water', category: 'special', power: 90 },
            27: { name: 'Thunderbolt', type: 'electric', category: 'special', power: 90 },
            28: { name: 'Solar Beam', type: 'grass', category: 'special', power: 120 },
            29: { name: 'Sludge Bomb', type: 'poison', category: 'special', power: 90 },
            30: { name: 'Air Slash', type: 'flying', category: 'special', power: 75 },
            31: { name: 'X-Scissor', type: 'bug', category: 'physical', power: 80 },
            32: { name: 'Stone Edge', type: 'rock', category: 'physical', power: 100 },
            33: { name: 'Earthquake', type: 'ground', category: 'physical', power: 100 },
            34: { name: 'Focus Blast', type: 'fighting', category: 'special', power: 120 },
            35: { name: 'Psychic', type: 'psychic', category: 'special', power: 90 },
            36: { name: 'Blizzard', type: 'ice', category: 'special', power: 110 },
            37: { name: 'Shadow Ball', type: 'ghost', category: 'special', power: 80 },
            38: { name: 'Dragon Claw', type: 'dragon', category: 'physical', power: 80 },
            39: { name: 'Dark Pulse', type: 'dark', category: 'special', power: 80 },
            40: { name: 'Flash Cannon', type: 'steel', category: 'special', power: 80 },
            41: { name: 'Moonblast', type: 'fairy', category: 'special', power: 95 },
            42: { name: 'Hyper Beam', type: 'normal', category: 'special', power: 150 },
            43: { name: 'Fire Blast', type: 'fire', category: 'special', power: 110 },
            44: { name: 'Hydro Pump', type: 'water', category: 'special', power: 110 },
            45: { name: 'Thunder', type: 'electric', category: 'special', power: 110 },
            46: { name: 'Leaf Blade', type: 'grass', category: 'physical', power: 90 },
            47: { name: 'Gunk Shot', type: 'poison', category: 'physical', power: 120 },
            48: { name: 'Hurricane', type: 'flying', category: 'special', power: 110 },
            49: { name: 'Megahorn', type: 'bug', category: 'physical', power: 120 },
            50: { name: 'Head Smash', type: 'rock', category: 'physical', power: 150 },
            51: { name: 'Fissure', type: 'ground', category: 'physical', power: null },
            52: { name: 'Flammèche', type: 'fire', category: 'special', power: 40 },
            53: { name: 'Close Combat', type: 'fighting', category: 'physical', power: 120 },
            54: { name: 'Future Sight', type: 'psychic', category: 'special', power: 120 },
            55: { name: 'Pistolet à O', type: 'water', category: 'special', power: 40 },
            56: { name: 'Sheer Cold', type: 'ice', category: 'special', power: null },
            57: { name: 'Destiny Bond', type: 'ghost', category: 'status', power: 0 },
            58: { name: 'Outrage', type: 'dragon', category: 'physical', power: 120 },
            59: { name: 'Crunch', type: 'dark', category: 'physical', power: 80 },
            60: { name: 'Iron Tail', type: 'steel', category: 'physical', power: 100 },
            61: { name: 'Play Rough', type: 'fairy', category: 'physical', power: 90 },
            62: { name: 'Body Slam', type: 'normal', category: 'physical', power: 85 },
            63: { name: 'Flame Wheel', type: 'fire', category: 'physical', power: 60 },
            64: { name: 'Aqua Tail', type: 'water', category: 'physical', power: 90 },
            65: { name: 'Thunder Punch', type: 'electric', category: 'physical', power: 75 },
            66: { name: 'Energy Ball', type: 'grass', category: 'special', power: 90 },
            67: { name: 'Cross Poison', type: 'poison', category: 'physical', power: 70 },
            68: { name: 'Brave Bird', type: 'flying', category: 'physical', power: 120 },
            69: { name: 'Bug Buzz', type: 'bug', category: 'special', power: 90 },
            70: { name: 'Rock Slide', type: 'rock', category: 'physical', power: 75 },
            71: { name: 'Dig', type: 'ground', category: 'physical', power: 80 },
            72: { name: 'Drain Punch', type: 'fighting', category: 'physical', power: 75 },
            73: { name: 'Zen Headbutt', type: 'psychic', category: 'physical', power: 80 },
            74: { name: 'Avalanche', type: 'ice', category: 'physical', power: 60 },
            75: { name: 'Shadow Claw', type: 'ghost', category: 'physical', power: 70 },
            76: { name: 'Dragon Pulse', type: 'dragon', category: 'special', power: 85 },
            77: { name: 'Sucker Punch', type: 'dark', category: 'physical', power: 70 },
            78: { name: 'Iron Head', type: 'steel', category: 'physical', power: 80 },
            79: { name: 'Dazzling Gleam', type: 'fairy', category: 'special', power: 80 },
            80: { name: 'Take Down', type: 'normal', category: 'physical', power: 90 },
            81: { name: 'Fire Spin', type: 'fire', category: 'special', power: 35 },
            82: { name: 'Bubble Beam', type: 'water', category: 'special', power: 65 },
            83: { name: 'Spark', type: 'electric', category: 'physical', power: 65 },
            84: { name: 'Éclair', type: 'electric', category: 'special', power: 40 },
            85: { name: 'Razor Leaf', type: 'grass', category: 'physical', power: 55 },
            86: { name: 'Sludge', type: 'poison', category: 'special', power: 65 },
            87: { name: 'Wing Attack', type: 'flying', category: 'physical', power: 60 },
            88: { name: 'Pin Missile', type: 'bug', category: 'physical', power: 25 },
            89: { name: 'Rock Blast', type: 'rock', category: 'physical', power: 25 },
            90: { name: 'Mud Bomb', type: 'ground', category: 'special', power: 65 },
            91: { name: 'Brick Break', type: 'fighting', category: 'physical', power: 75 },
            92: { name: 'Psybeam', type: 'psychic', category: 'special', power: 65 },
            93: { name: 'Ice Beam', type: 'ice', category: 'special', power: 90 },
            94: { name: 'Night Shade', type: 'ghost', category: 'special', power: null },
            95: { name: 'Dragon Rage', type: 'dragon', category: 'special', power: null },
            96: { name: 'Feint Attack', type: 'dark', category: 'physical', power: 60 },
            97: { name: 'Bullet Punch', type: 'steel', category: 'physical', power: 40 },
            98: { name: 'Draining Kiss', type: 'fairy', category: 'special', power: 50 },
            // Action-based moves
            99: { name: 'idle', type: 'normal', category: 'status', power: 0 },
            100: { name: 'move', type: 'normal', category: 'status', power: 0 },
            101: { name: 'run', type: 'normal', category: 'status', power: 0 },
            102: { name: 'jump', type: 'normal', category: 'status', power: 0 },
            103: { name: 'jump_lp', type: 'normal', category: 'status', power: 0 },
            104: { name: 'jump_end', type: 'normal', category: 'status', power: 0 },
            105: { name: 'damage', type: 'normal', category: 'status', power: 0 },
            106: { name: 'down', type: 'normal', category: 'status', power: 0 },
            107: { name: 'down_end', type: 'normal', category: 'status', power: 0 },
            108: { name: 'dodge', type: 'normal', category: 'status', power: 0 },
            109: { name: 'boost', type: 'normal', category: 'status', power: 0 },
            110: { name: 'skill_A', type: 'normal', category: 'physical', power: 50 },
            111: { name: 'skill_B', type: 'normal', category: 'special', power: 50 },
            112: { name: 'flagget', type: 'normal', category: 'status', power: 0 },
            113: { name: 'adle_a', type: 'normal', category: 'status', power: 0 }
        };
        
        return moveDatabase[moveId] || { name: 'Attaque inconnue', type: 'normal', category: 'physical', power: 50 };
    }

    /**
     * Détermine le type d'animation selon l'attaque
     */
    getAnimationType(moveData) {
        if (moveData.category === 'physical') {
            return 'move_attack';
        } else if (moveData.category === 'special') {
            return 'move_special';
        } else {
            return 'move_status';
        }
    }

    /**
     * Calcule l'efficacité d'une attaque
     */
    calculateEffectiveness(attackType, defenderType1, defenderType2) {
        // Table d'efficacité simplifiée
        const effectiveness = {
            fire: { grass: 2, water: 0.5, fire: 0.5 },
            water: { fire: 2, grass: 0.5, water: 0.5 },
            grass: { water: 2, fire: 0.5, grass: 0.5 },
            electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0 },
            ground: { electric: 2, grass: 0.5, flying: 0 },
            flying: { grass: 2, electric: 0.5, ground: 0 }
        };
        
        let multiplier = 1;
        
        if (effectiveness[attackType]) {
            if (effectiveness[attackType][defenderType1]) {
                multiplier *= effectiveness[attackType][defenderType1];
            }
            if (defenderType2 && effectiveness[attackType][defenderType2]) {
                multiplier *= effectiveness[attackType][defenderType2];
            }
        }
        
        return multiplier;
    }
    getBattleEndMessage(result) {
        switch (result.type) {
            case 'victory':
                return `${result.winner} a gagné le combat !`;
            case 'defeat':
                return `${result.loser} a perdu le combat !`;
            case 'draw':
                return 'Le combat se termine par une égalité !';
            case 'forfeit':
                return `${result.forfeiter} a abandonné le combat.`;
            case 'disconnect':
                return 'Un joueur s\'est déconnecté.';
            default:
                return 'Le combat est terminé.';
        }
    }

    /**
     * Obtient les statistiques du service
     */
    getStats() {
        return {
            activeBattles: this.activeBattles.size,
            waitingPlayers: this.waitingPlayers.size,
            totalBattlesHandled: this.totalBattlesHandled || 0
        };
    }
}

/**
 * Salle de bataille entre deux joueurs
 */
class BattleRoom {
    constructor(battleId, player1Socket, player2Socket, battleType = 'pvp') {
        this.battleId = battleId;
        this.player1 = {
            socket: player1Socket,
            user: player1Socket.user,
            team: [],
            currentPokemon: null,
            currentAction: null,
            isReady: false
        };
        this.player2 = {
            socket: player2Socket,
            user: player2Socket.user,
            team: [],
            currentPokemon: null,
            currentAction: null,
            isReady: false
        };
        this.battleType = battleType;
        this.turn = 1;
        this.phase = 'preparation'; // preparation, selection, processing, ended
        this.weather = null;
        this.terrain = null;
        this.turnTimer = null;
    }

    /**
     * Charge les équipes des joueurs depuis la base de données
     */
    async loadPlayerTeams() {
        try {
            const client = await pool.connect();
            
            try {
                // Charger l'équipe du joueur 1
                const team1Result = await client.query(`
                    SELECT p.*, ps.name as species_name, ps.base_hp, ps.base_attack, ps.base_defense,
                           ps.base_sp_attack, ps.base_sp_defense, ps.base_speed, ps.type1, ps.type2
                    FROM pokemon p
                    JOIN pokemon_species ps ON p.species_id = ps.id
                    WHERE p.trainer_id = $1 AND p.is_in_party = true
                    ORDER BY p.party_position
                `, [this.player1.user.id]);
                
                // Charger l'équipe du joueur 2  
                const team2Result = await client.query(`
                    SELECT p.*, ps.name as species_name, ps.base_hp, ps.base_attack, ps.base_defense,
                           ps.base_sp_attack, ps.base_sp_defense, ps.base_speed, ps.type1, ps.type2
                    FROM pokemon p
                    JOIN pokemon_species ps ON p.species_id = ps.id
                    WHERE p.trainer_id = $1 AND p.is_in_party = true
                    ORDER BY p.party_position
                `, [this.player2.user.id]);
                
                this.player1.team = team1Result.rows.map(row => this.formatPokemon(row));
                this.player2.team = team2Result.rows.map(row => this.formatPokemon(row));
                
                // Définir les Pokémon actuels (premier de l'équipe)
                this.player1.currentPokemon = this.player1.team[0];
                this.player2.currentPokemon = this.player2.team[0];
                
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error('Failed to load player teams:', error);
            throw error;
        }
    }

    /**
     * Formate les données d'un Pokémon pour la bataille
     */
    formatPokemon(dbRow) {
        return {
            id: dbRow.id,
            species_id: dbRow.species_id,
            name: dbRow.nickname || dbRow.species_name,
            level: dbRow.level,
            current_hp: dbRow.current_hp,
            max_hp: this.calculateHP(dbRow),
            attack: this.calculateStat(dbRow.base_attack, dbRow.iv_attack, dbRow.ev_attack, dbRow.level),
            defense: this.calculateStat(dbRow.base_defense, dbRow.iv_defense, dbRow.ev_defense, dbRow.level),
            sp_attack: this.calculateStat(dbRow.base_sp_attack, dbRow.iv_sp_attack, dbRow.ev_sp_attack, dbRow.level),
            sp_defense: this.calculateStat(dbRow.base_sp_defense, dbRow.iv_sp_defense, dbRow.ev_sp_defense, dbRow.level),
            speed: this.calculateStat(dbRow.base_speed, dbRow.iv_speed, dbRow.ev_speed, dbRow.level),
            type1: dbRow.type1,
            type2: dbRow.type2,
            moves: [], // À charger séparément
            ability: dbRow.ability,
            nature: dbRow.nature,
            gender: dbRow.gender,
            is_shiny: dbRow.is_shiny,
            status: [],
            stats_modifiers: {
                attack: 0,
                defense: 0,
                sp_attack: 0,
                sp_defense: 0,
                speed: 0,
                accuracy: 0,
                evasion: 0
            }
        };
    }

    /**
     * Calcule les statistiques d'un Pokémon
     */
    calculateStat(base, iv, ev, level) {
        return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5);
    }

    /**
     * Calcule les HP d'un Pokémon
     */
    calculateHP(pokemon) {
        const base = pokemon.base_hp;
        const iv = pokemon.iv_hp || 0;
        const ev = pokemon.ev_hp || 0;
        const level = pokemon.level;
        
        return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10);
    }

    /**
     * Démarre la bataille
     */
    async start() {
        this.phase = 'selection';
        
        // Créer les données de bataille initiales
        const battleData = {
            id: this.battleId,
            type: this.battleType,
            turn: this.turn,
            phase: this.phase,
            playerTeam: this.player1.team,
            opponentTeam: this.player2.team,
            currentPlayerPokemon: this.player1.currentPokemon,
            currentOpponentPokemon: this.player2.currentPokemon,
            weather: this.weather,
            terrain: this.terrain
        };
        
        // Envoyer aux joueurs
        this.player1.socket.emit('battle_start', {
            ...battleData,
            isPlayer1: true,
            opponent: {
                id: this.player2.user.id,
                username: this.player2.user.username
            }
        });
        
        this.player2.socket.emit('battle_start', {
            ...battleData,
            playerTeam: this.player2.team,
            opponentTeam: this.player1.team,
            currentPlayerPokemon: this.player2.currentPokemon,
            currentOpponentPokemon: this.player1.currentPokemon,
            isPlayer1: false,
            opponent: {
                id: this.player1.user.id,
                username: this.player1.user.username
            }
        });
        
        // Démarrer le timer de tour
        this.startTurnTimer();
    }

    /**
     * Traite l'action d'un joueur
     */
    async processPlayerMove(playerId, action) {
        const player = this.getPlayer(playerId);
        if (!player) {
            throw new Error('Player not found in battle');
        }
        
        if (this.phase !== 'selection') {
            throw new Error('Not in selection phase');
        }
        
        player.currentAction = action;
        player.isReady = true;
        
        // Vérifier si les deux joueurs sont prêts
        if (this.player1.isReady && this.player2.isReady) {
            await this.processTurn();
        }
    }

    /**
     * Traite un tour complet
     */
    async processTurn() {
        this.phase = 'processing';
        this.clearTurnTimer();
        
        try {
            // Déterminer l'ordre des actions
            const actions = this.sortActionsByPriority();
            
            // Exécuter les actions dans l'ordre
            for (const action of actions) {
                await this.executeAction(action);
                
                // Vérifier si la bataille est terminée
                if (this.checkBattleEnd()) {
                    return;
                }
            }
            
            // Passer au tour suivant
            this.nextTurn();
            
        } catch (error) {
            console.error('Error processing turn:', error);
            this.broadcastError('Erreur lors du traitement du tour');
        }
    }

    /**
     * Trie les actions par priorité et vitesse
     */
    sortActionsByPriority() {
        const actions = [
            { player: this.player1, action: this.player1.currentAction },
            { player: this.player2, action: this.player2.currentAction }
        ].filter(a => a.action);
        
        return actions.sort((a, b) => {
            // Les changements de Pokémon sont prioritaires
            if (a.action.type === 'switch' && b.action.type !== 'switch') return -1;
            if (b.action.type === 'switch' && a.action.type !== 'switch') return 1;
            
            // Les fuites sont prioritaires
            if (a.action.type === 'run' && b.action.type !== 'run') return -1;
            if (b.action.type === 'run' && a.action.type !== 'run') return 1;
            
            // Comparer par vitesse du Pokémon
            const speedA = a.player.currentPokemon.speed;
            const speedB = b.player.currentPokemon.speed;
            
            return speedB - speedA; // Plus rapide en premier
        });
    }

    /**
     * Exécute une action
     */
    async executeAction(actionData) {
        const { player, action } = actionData;
        
        switch (action.type) {
            case 'move':
                await this.executeMove(player, action);
                break;
            case 'switch':
                await this.executePokemonSwitch(player, action);
                break;
            case 'run':
                await this.executeRun(player);
                break;
        }
    }

    /**
     * Exécute une attaque
     */
    async executeMove(player, action) {
        const attacker = player.currentPokemon;
        const target = player === this.player1 ? this.player2.currentPokemon : this.player1.currentPokemon;
        
        // TODO: Implémenter la logique de calcul des dégâts
        const damage = this.calculateDamage(attacker, target, action.moveId);
        
        // Appliquer les dégâts
        target.current_hp = Math.max(0, target.current_hp - damage);
        
        // Diffuser l'animation et les résultats
        this.broadcastMoveAnimation(attacker, target, action.moveId, damage);
        this.broadcastBattleUpdate();
    }

    /**
     * Calcule les dégâts d'une attaque (simplifié)
     */
    calculateDamage(attacker, target, moveId) {
        // Calcul simplifié pour la démonstration
        const level = attacker.level;
        const attack = attacker.attack;
        const defense = target.defense;
        const power = 80; // Power par défaut
        
        const damage = Math.floor(((2 * level / 5 + 2) * power * attack / defense / 50 + 2) * (Math.random() * 0.15 + 0.85));
        
        return Math.max(1, damage);
    }

    /**
     * Diffuse une animation d'attaque
     */
    broadcastMoveAnimation(attacker, target, moveId, damage) {
        const moveData = this.getMoveData(moveId);
        
        const animationData = {
            type: this.getAnimationType(moveData),
            data: {
                attacker: { 
                    id: attacker.id, 
                    name: attacker.name,
                    element: `${attacker.id === this.player1.currentPokemon.id ? 'player' : 'opponent'}-sprite`
                },
                target: { 
                    id: target.id, 
                    name: target.name,
                    element: `${target.id === this.player1.currentPokemon.id ? 'player' : 'opponent'}-sprite`
                },
                moveData: {
                    id: moveId,
                    name: moveData.name,
                    type: moveData.type,
                    category: moveData.category,
                    power: moveData.power
                },
                damage: damage,
                effectiveness: this.calculateEffectiveness(moveData.type, target.type1, target.type2)
            }
        };
        
        this.player1.socket.emit('battle_animation', animationData);
        this.player2.socket.emit('battle_animation', animationData);
    }

    /**
     * Diffuse une mise à jour de l'état de bataille
     */
    broadcastBattleUpdate() {
        const updateData = {
            turn: this.turn,
            phase: this.phase,
            player1Pokemon: this.player1.currentPokemon,
            player2Pokemon: this.player2.currentPokemon
        };
        
        this.player1.socket.emit('battle_update', {
            ...updateData,
            playerPokemon: this.player1.currentPokemon,
            opponentPokemon: this.player2.currentPokemon
        });
        
        this.player2.socket.emit('battle_update', {
            ...updateData,
            playerPokemon: this.player2.currentPokemon,
            opponentPokemon: this.player1.currentPokemon
        });
    }

    /**
     * Vérifie si la bataille est terminée
     */
    checkBattleEnd() {
        const player1HasPokemon = this.player1.team.some(p => p.current_hp > 0);
        const player2HasPokemon = this.player2.team.some(p => p.current_hp > 0);
        
        if (!player1HasPokemon || !player2HasPokemon) {
            const winner = player1HasPokemon ? this.player1 : this.player2;
            const loser = player1HasPokemon ? this.player2 : this.player1;
            
            this.endBattle({
                type: 'victory',
                winner: winner.user.username,
                loser: loser.user.username,
                winnerId: winner.user.id,
                loserId: loser.user.id
            });
            
            return true;
        }
        
        return false;
    }

    /**
     * Termine la bataille
     */
    async endBattle(result) {
        this.phase = 'ended';
        this.clearTurnTimer();
        
        // Sauvegarder les résultats
        await this.saveResults(result);
        
        // Notifier le service principal
        const battleService = require('./BattleService'); // Éviter la dépendance circulaire
        if (battleService) {
            battleService.endBattle(this.battleId, result);
        }
    }

    /**
     * Démarre le timer de tour
     */
    startTurnTimer() {
        this.turnTimer = setTimeout(() => {
            // Temps écoulé, actions automatiques
            if (!this.player1.isReady) {
                this.player1.currentAction = { type: 'struggle' }; // Action par défaut
                this.player1.isReady = true;
            }
            if (!this.player2.isReady) {
                this.player2.currentAction = { type: 'struggle' }; // Action par défaut
                this.player2.isReady = true;
            }
            
            this.processTurn();
        }, 30000); // 30 secondes par tour
    }

    /**
     * Efface le timer de tour
     */
    clearTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = null;
        }
    }

    /**
     * Passe au tour suivant
     */
    nextTurn() {
        this.turn++;
        this.phase = 'selection';
        this.player1.isReady = false;
        this.player2.isReady = false;
        this.player1.currentAction = null;
        this.player2.currentAction = null;
        
        this.broadcastBattleUpdate();
        this.startTurnTimer();
    }

    /**
     * Sauvegarde les résultats de la bataille
     */
    async saveResults(result) {
        try {
            const client = await pool.connect();
            try {
                await client.query(`
                    INSERT INTO battles (id, player1_id, player2_id, battle_type, winner_id, battle_data, ended_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                `, [
                    this.battleId,
                    this.player1.user.id,
                    this.player2.user.id,
                    this.battleType,
                    result.winnerId || null,
                    JSON.stringify({
                        turns: this.turn,
                        result: result,
                        finalTeams: {
                            player1: this.player1.team,
                            player2: this.player2.team
                        }
                    })
                ]);
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Failed to save battle results:', error);
        }
    }

    /**
     * Diffuse une erreur
     */
    broadcastError(message) {
        this.player1.socket.emit('battle_error', { message });
        this.player2.socket.emit('battle_error', { message });
    }

    /**
     * Obtient un joueur par ID
     */
    getPlayer(playerId) {
        if (this.player1.user.id === playerId) return this.player1;
        if (this.player2.user.id === playerId) return this.player2;
        return null;
    }

    /**
     * Vérifie si un joueur est dans cette bataille
     */
    isPlayerInBattle(playerId) {
        return this.player1.user.id === playerId || this.player2.user.id === playerId;
    }

    /**
     * Obtient les IDs des joueurs
     */
    getPlayerIds() {
        return [this.player1.user.id, this.player2.user.id];
    }

    /**
     * Gère la déconnexion d'un joueur
     */
    handlePlayerDisconnect(playerId) {
        this.endBattle({
            type: 'disconnect',
            disconnectedPlayer: playerId
        });
    }
}

/**
 * Salle de bataille contre un Pokémon sauvage
 */
class WildBattleRoom extends BattleRoom {
    constructor(battleId, playerSocket, wildPokemon) {
        // Créer un faux joueur 2 pour le Pokémon sauvage
        const wildSocket = { user: { id: 'wild', username: 'Wild Pokemon' } };
        super(battleId, playerSocket, wildSocket, 'wild');
        
        this.wildPokemon = wildPokemon;
        this.player2.team = [wildPokemon];
        this.player2.currentPokemon = wildPokemon;
    }

    async loadPlayerTeams() {
        // Charger seulement l'équipe du joueur
        const client = await pool.connect();
        try {
            const teamResult = await client.query(`
                SELECT p.*, ps.name as species_name, ps.base_hp, ps.base_attack, ps.base_defense,
                       ps.base_sp_attack, ps.base_sp_defense, ps.base_speed, ps.type1, ps.type2
                FROM pokemon p
                JOIN pokemon_species ps ON p.species_id = ps.id
                WHERE p.trainer_id = $1 AND p.is_in_party = true
                ORDER BY p.party_position
            `, [this.player1.user.id]);
            
            this.player1.team = teamResult.rows.map(row => this.formatPokemon(row));
            this.player1.currentPokemon = this.player1.team[0];
            
        } finally {
            client.release();
        }
    }

    async processTurn() {
        // IA simple pour le Pokémon sauvage
        if (!this.player2.isReady) {
            this.player2.currentAction = this.getWildPokemonAction();
            this.player2.isReady = true;
        }
        
        await super.processTurn();
    }

    getWildPokemonAction() {
        // IA très simple : attaque aléatoire
        return {
            type: 'move',
            moveId: Math.floor(Math.random() * 4) + 1 // Move ID aléatoire
        };
    }
}

module.exports = BattleService;