const jwt = require('jsonwebtoken');
const dataAccess = require('../database/data-access');

class GameService {
    constructor(io) {
        this.io = io;
        this.activePlayers = new Map(); // Map of socket.id -> player data
        this.playersByUserId = new Map(); // Map of user_id -> socket.id
        this.movementIntents = new Map(); // Map of socket.id -> movement intent
        this.gameLoopInterval = null;

        this.startGameLoop();
    }

    startGameLoop() {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        this.gameLoopInterval = setInterval(() => {
            this.updatePlayerPositions();
        }, 1000 / 60); // 60 times per second
    }

    async authenticateUser(socket, data) {
        try {
            const { token, user } = data;
            
            if (!token) {
                throw new Error('No token provided');
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.userId !== user.id) {
                throw new Error('Token user mismatch');
            }

            try {
                // Get user and character data
                const userData = await dataAccess.findUserAndCharacterById(decoded.userId);

                if (!userData) {
                    throw new Error('User not found or inactive');
                }
                
                // Store user data on socket
                socket.user = {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    character: {
                        id: userData.character_id || userData.id, // Use user id if no character
                        name: userData.name || userData.username,
                        level: userData.level || 1,
                        experience: userData.experience || 0,
                        position: {
                            x: userData.position_x || 0,
                            y: userData.position_y || 1,
                            z: userData.position_z || 0
                        },
                        currentMap: userData.current_map || 'house_inside'
                    }
                };

                // Check if user is already connected (prevent multiple connections)
                const existingSocketId = this.playersByUserId.get(userData.id);
                if (existingSocketId && this.io.sockets.sockets.has(existingSocketId)) {
                    // Disconnect the old connection
                    this.io.sockets.sockets.get(existingSocketId).disconnect();
                }

                // Store player data
                this.activePlayers.set(socket.id, socket.user);
                this.playersByUserId.set(userData.id, socket.id);

                // Initialize movement intent
                this.movementIntents.set(socket.id, {
                    forward: false,
                    backward: false,
                    left: false,
                    right: false,
                    run: false
                });

                // Create or update user session
                await dataAccess.createOrUpdateUserSession({
                    userId: userData.id,
                    characterId: userData.character_id || userData.id,
                    socketId: socket.id,
                    currentMap: socket.user.character.currentMap,
                    positionX: socket.user.character.position.x,
                    positionY: socket.user.character.position.y,
                    positionZ: socket.user.character.position.z
                });

                // Notify client of successful authentication
                socket.emit('authenticated', {
                    user: socket.user,
                    currentMap: socket.user.character.currentMap
                });

                // Notify other players in the same map
                socket.to(socket.user.character.currentMap).emit('player_joined', {
                    userId: socket.user.id,
                    username: socket.user.username,
                    role: socket.user.role, // Include role information
                    position: socket.user.character.position,
                    character: socket.user.character
                });

                // Join the map room
                socket.join(socket.user.character.currentMap);

                // Send list of other players in the same map
                this.sendOtherPlayersInMap(socket, socket.user.character.currentMap);

                console.log(`✅ Player authenticated: ${socket.user.username} (${socket.user.role})`);

            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Authentication error:', error);
            socket.emit('auth_error', { message: error.message });
        }
    }

    async handlePlayerMovement(socket, movementIntent) {
        if (!socket.user) {
            return;
        }
        this.movementIntents.set(socket.id, movementIntent);
    }

    updatePlayerPositions() {
        const moveSpeed = 5.0 / 60.0; // units per tick

        for (const [socketId, player] of this.activePlayers) {
            const intent = this.movementIntents.get(socketId);
            if (!intent) continue;

            let moved = false;
            const moveVector = { x: 0, z: 0 };

            if (intent.forward) {
                moveVector.z += 1;
                moved = true;
            }
            if (intent.backward) {
                moveVector.z -= 1;
                moved = true;
            }
            if (intent.left) {
                moveVector.x -= 1;
                moved = true;
            }
            if (intent.right) {
                moveVector.x += 1;
                moved = true;
            }

            if (moved) {
                // For now, we'll just move along axes.
                // A proper implementation would use the player's rotation.
                player.character.position.x += moveVector.x * moveSpeed * (intent.run ? 1.5 : 1);
                player.character.position.z += moveVector.z * moveSpeed * (intent.run ? 1.5 : 1);

                // TODO: Server-side collision detection

                this.throttledPositionUpdate(player.id, player.character.position);

                this.io.to(player.character.currentMap).emit('player_moved', {
                    userId: player.id,
                    username: player.username,
                    position: player.character.position,
                    rotation: player.character.rotation, // Will need to calculate this too
                    isMoving: moved,
                    isRunning: intent.run
                });
            }
        }
    }

    async sendOtherPlayersInMap(socket, mapName) {
        const otherPlayers = [];
        
        // Get all players in the same map
        for (const [socketId, playerData] of this.activePlayers) {
            if (socketId !== socket.id && playerData.character.currentMap === mapName) {
                otherPlayers.push({
                    userId: playerData.id,
                    username: playerData.username,
                    role: playerData.role, // Include role information
                    position: playerData.character.position,
                    character: playerData.character
                });
            }
        }

        if (otherPlayers.length > 0) {
            socket.emit('other_players', otherPlayers);
        }
    }

    async handleMapChange(socket, newMapName) {
        if (!socket.user) {
            return;
        }

        try {
            const oldMap = socket.user.character.currentMap;
            
            // Leave old map room
            socket.leave(oldMap);
            
            // Update player's current map
            socket.user.character.currentMap = newMapName;
            
            // Join new map room
            socket.join(newMapName);
            
            // Notify players in old map that this player left
            socket.to(oldMap).emit('player_left', {
                userId: socket.user.id,
                username: socket.user.username
            });
            
            // Notify players in new map that this player joined
            socket.to(newMapName).emit('player_joined', {
                userId: socket.user.id,
                username: socket.user.username,
                role: socket.user.role, // Include role information
                position: socket.user.character.position,
                character: socket.user.character
            });
            
            // Send list of players in new map
            this.sendOtherPlayersInMap(socket, newMapName);
            
            // Update database
            await dataAccess.updateCharacterMap(socket.user.id, newMapName);
            
            console.log(`Player ${socket.user.username} moved from ${oldMap} to ${newMapName}`);
            
        } catch (error) {
            console.error('Map change error:', error);
        }
    }

    async handleEditorAccess(socket) {
        if (!socket.user) {
            socket.emit('editor_access_denied', { message: 'Not authenticated' });
            return;
        }

        // Check if user has editor permissions
        const hasPermission = socket.user.role === 'admin' || socket.user.role === 'co-admin';
        
        if (hasPermission) {
            socket.emit('editor_access_granted', {
                message: 'Map editor access granted',
                editorUrl: '/pokemon-map-editor/'
            });
        } else {
            socket.emit('editor_access_denied', {
                message: 'You do not have permission to access the map editor'
            });
        }
    }
    
    async handleAdminMapRequest(socket) {
        console.log('🗺️ Admin map request received from:', socket.user ? socket.user.username : 'unknown');
        
        if (!socket.user) {
            console.log('❌ Admin map request denied: Not authenticated');
            socket.emit('admin_map_request_denied', { message: 'Not authenticated' });
            return;
        }

        // Check if user has admin permissions
        const hasPermission = socket.user.role === 'admin' || socket.user.role === 'co-admin';
        
        console.log('🔑 User role:', socket.user.role, 'Has permission:', hasPermission);
        
        if (!hasPermission) {
            console.log('❌ Admin map request denied: Admin access required');
            socket.emit('admin_map_request_denied', { message: 'Admin access required' });
            return;
        }
        
        try {
            console.log('🎯 Preparing map list for admin selector...');
            
            // Function to scan directories and build map list
            const fs = require('fs');
            const path = require('path');
            
            // Base path for maps
            const mapsBasePath = path.join(__dirname, '..', 'pokemon-map-editor', 'assets', 'maps');
            
            // Function to recursively scan directories for GLB files
            const scanMapDirectories = (dirPath, basePath = '') => {
                let maps = [];
                
                try {
                    const items = fs.readdirSync(dirPath);
                    
                    items.forEach(item => {
                        const itemPath = path.join(dirPath, item);
                        const relativePath = basePath ? path.join(basePath, item) : item;
                        const stat = fs.statSync(itemPath);
                        
                        if (stat.isDirectory()) {
                            // Recursively scan subdirectories
                            maps = maps.concat(scanMapDirectories(itemPath, relativePath));
                        } else if (item.toLowerCase().endsWith('.glb')) {
                            // Add GLB files as maps
                            const mapName = relativePath.replace(/\.glb$/i, '').replace(/\\/g, '/').toLowerCase().replace(/\//g, '_').replace(/ /g, '_');
                            maps.push({
                                id: maps.length + 1,
                                name: mapName,
                                displayName: relativePath.replace(/\.glb$/i, '').replace(/\\/g, '/'),
                                filePath: `/pokemon-map-editor/assets/maps/${relativePath.replace(/\\/g, '/')}`,
                                spawnPosition: { x: 0, y: 1, z: 0 }
                            });
                        }
                    });
                } catch (error) {
                    console.error('Error scanning directory:', dirPath, error);
                }
                
                return maps;
            };
            
            // Scan all map directories
            let availableMaps = scanMapDirectories(mapsBasePath);
            
            // Add the hardcoded maps that we know work well
            const hardcodedMaps = [
                {
                    id: 1,
                    name: 'house_inside',
                    displayName: 'Maison Intérieure',
                    filePath: '/pokemon-map-editor/assets/maps/male_house_inside/house.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 2,
                    name: 'drewfort',
                    displayName: 'Drewfort',
                    filePath: '/pokemon-map-editor/assets/maps/Drewfort/drewfort.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 3,
                    name: 'fortree_city',
                    displayName: 'Fortree City',
                    filePath: '/pokemon-map-editor/assets/maps/Fortree City/fortree.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 4,
                    name: 'slateport_city',
                    displayName: 'Slateport City',
                    filePath: '/pokemon-map-editor/assets/maps/Slateport City/Slateport City.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 5,
                    name: 'sootopolis_city',
                    displayName: 'Sootopolis City',
                    filePath: '/pokemon-map-editor/assets/maps/Sootopolis City/Sootopolis City.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 6,
                    name: 'shoal_cave_entrance_low',
                    displayName: 'Shoal Cave - Entrée (Marée Basse)',
                    filePath: '/pokemon-map-editor/assets/maps/Shoal cave/Entrance Room (Low Tide).glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 7,
                    name: 'shoal_cave_ice_room',
                    displayName: 'Shoal Cave - Salle de Glace',
                    filePath: '/pokemon-map-editor/assets/maps/Shoal cave/Ice Room.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 8,
                    name: 'granite_cave',
                    displayName: 'Grotte Granite',
                    filePath: '/pokemon-map-editor/assets/maps/Granite Cave Origin Room/Granite Cave Origin Room.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 9,
                    name: 'fallarbor_town',
                    displayName: 'Fallarbor Town',
                    filePath: '/pokemon-map-editor/assets/maps/Fallarbor Town/Fallarbor Town.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 10,
                    name: 'castle_village',
                    displayName: 'Castle Village',
                    filePath: '/pokemon-map-editor/assets/maps/castle village/castle_village_scene.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 }
                },
                {
                    id: 11,
                    name: 'matrix',
                    displayName: 'Matrix World',
                    filePath: '/pokemon-map-editor/assets/maps/perso/matrix/matrix1.glb',
                    collisionPath: '/pokemon-map-editor/assets/maps/perso/matrix/matrix1_collision.glb',
                    spawnPosition: { x: 0, y: 1, z: 0 },
                    isLargeMap: true
                }
            ];
            
            // Combine scanned maps with hardcoded maps, prioritizing hardcoded ones
            const hardcodedMapNames = new Set(hardcodedMaps.map(map => map.name));
            const filteredScannedMaps = availableMaps.filter(map => !hardcodedMapNames.has(map.name));
            availableMaps = [...hardcodedMaps, ...filteredScannedMaps];
            
            console.log('📡 Sending admin_maps_available with', availableMaps.length, 'maps');
            console.log('🗺️ Current map:', socket.user.character.currentMap);
            
            socket.emit('admin_maps_available', {
                maps: availableMaps,
                currentMap: socket.user.character.currentMap
            });
            
        } catch (error) {
            console.error('Admin map request error:', error);
            socket.emit('admin_map_request_error', { message: 'Failed to get available maps' });
        }
    }
    
    async handleAdminMapChange(socket, data) {
        if (!socket.user) {
            socket.emit('admin_teleport_error', { message: 'Not authenticated' });
            return;
        }

        // Check if user has admin permissions
        const hasPermission = socket.user.role === 'admin' || socket.user.role === 'co-admin';
        
        if (!hasPermission) {
            socket.emit('admin_teleport_error', { message: 'Admin access required' });
            return;
        }
        
        try {
            const { mapName, spawnPosition } = data;
            
            if (!mapName) {
                socket.emit('admin_teleport_error', { message: 'Map name is required' });
                return;
            }
            
            const oldMap = socket.user.character.currentMap;
            
            // Leave old map room
            socket.leave(oldMap);
            
            // Update player's current map and position
            socket.user.character.currentMap = mapName;
            if (spawnPosition) {
                socket.user.character.position = spawnPosition;
            }
            
            // Join new map room
            socket.join(mapName);
            
            // Notify players in old map that admin left
            socket.to(oldMap).emit('player_left', {
                userId: socket.user.id,
                username: socket.user.username
            });
            
            // Notify players in new map that admin joined
            socket.to(mapName).emit('player_joined', {
                userId: socket.user.id,
                username: socket.user.username,
                role: socket.user.role,
                position: socket.user.character.position,
                character: socket.user.character
            });
            
            // Send confirmation to admin
            socket.emit('admin_teleport_complete', {
                message: 'Teleportation successful',
                mapName: mapName,
                position: socket.user.character.position
            });
            
            // Send list of players in new map
            this.sendOtherPlayersInMap(socket, mapName);
            
            // Update database
            await dataAccess.updateCharacterMap(socket.user.id, mapName);
            await dataAccess.createOrUpdateUserSession({
                userId: socket.user.id,
                characterId: socket.user.character.id,
                socketId: socket.id,
                currentMap: mapName,
                positionX: socket.user.character.position.x,
                positionY: socket.user.character.position.y,
                positionZ: socket.user.character.position.z
            });
            
            console.log(`👑 Admin ${socket.user.username} teleported from ${oldMap} to ${mapName}`);
            
        } catch (error) {
            console.error('Admin map change error:', error);
            socket.emit('admin_teleport_error', { message: 'Failed to teleport' });
        }
    }

    throttledPositionUpdate(userId, position) {
        // Simple throttling - only update position in DB every 5 seconds
        if (!this.positionUpdateTimers) {
            this.positionUpdateTimers = new Map();
        }

        if (!this.positionUpdateTimers.has(userId)) {
            this.positionUpdateTimers.set(userId, setTimeout(async () => {
                try {
                    await dataAccess.updateCharacterPosition(userId, position);
                } catch (error) {
                    console.error('Position update error:', error);
                }
                this.positionUpdateTimers.delete(userId);
            }, 5000));
        }
    }

    handleDisconnect(socket) {
        if (socket.user) {
            console.log(`👋 Player disconnected: ${socket.user.username}`);
            
            // Remove from active players
            this.activePlayers.delete(socket.id);
            this.playersByUserId.delete(socket.user.id);
            
            // Notify other players in the same map
            socket.to(socket.user.character.currentMap).emit('player_left', {
                userId: socket.user.id,
                username: socket.user.username
            });
            
            // Update database session
            dataAccess.deleteUserSession(socket.user.id).catch(error => {
                console.error('Session cleanup error:', error);
            });
        }
    }

    // Get online player count
    getOnlinePlayerCount() {
        return this.activePlayers.size;
    }

    // Get players in specific map
    getPlayersInMap(mapName) {
        const players = [];
        for (const [socketId, playerData] of this.activePlayers) {
            if (playerData.character.currentMap === mapName) {
                players.push(playerData);
            }
        }
        return players;
    }
}

module.exports = GameService;