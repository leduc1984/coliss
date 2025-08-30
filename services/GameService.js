const jwt = require('jsonwebtoken');
const { pool } = require('../database/migrate');

class GameService {
    constructor(io, redisClient = null) {
        this.io = io;
        this.redisClient = redisClient;
        this.activePlayers = new Map(); // Map of socket.id -> player data
        this.playersByUserId = new Map(); // Map of user_id -> socket.id
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

            const client = await pool.connect();
            try {
                // Get user and character data
                const userResult = await client.query(
                    'SELECT u.*, c.* FROM users u LEFT JOIN characters c ON u.id = c.user_id WHERE u.id = $1 AND u.is_active = true',
                    [decoded.userId]
                );

                if (userResult.rows.length === 0) {
                    throw new Error('User not found or inactive');
                }

                const userData = userResult.rows[0];
                
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

                // Create or update user session
                await client.query(`
                    INSERT INTO user_sessions (user_id, character_id, socket_id, current_map, position_x, position_y, position_z)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (user_id) DO UPDATE SET
                        socket_id = $3,
                        current_map = $4,
                        position_x = $5,
                        position_y = $6,
                        position_z = $7,
                        last_active = CURRENT_TIMESTAMP
                `, [
                    userData.id,
                    userData.character_id || userData.id,
                    socket.id,
                    socket.user.character.currentMap,
                    socket.user.character.position.x,
                    socket.user.character.position.y,
                    socket.user.character.position.z
                ]);

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

    async handlePlayerMovement(socket, data) {
        if (!socket.user) {
            return;
        }

        try {
            const { position, rotation, isMoving, isRunning } = data;

            // Validate position data
            if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
                return;
            }

            // Update player position
            socket.user.character.position = position;
            socket.user.character.rotation = rotation || { x: 0, y: 0, z: 0 };
            socket.user.character.isMoving = isMoving;
            socket.user.character.isRunning = isRunning;

            // Update in database (throttled to avoid too many DB calls)
            this.throttledPositionUpdate(socket.user.id, position);

            // Broadcast movement to other players in the same map
            socket.to(socket.user.character.currentMap).emit('player_moved', {
                userId: socket.user.id,
                username: socket.user.username,
                position: position,
                rotation: rotation,
                isMoving: isMoving,
                isRunning: isRunning
            });

        } catch (error) {
            console.error('Player movement error:', error);
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
                    const client = await pool.connect();
                    try {
                        await client.query(
                            'UPDATE characters SET position_x = $1, position_y = $2, position_z = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4',
                            [position.x, position.y, position.z, userId]
                        );
                    } finally {
                        client.release();
                    }
                } catch (error) {
                    console.error('Position update error:', error);
                }
                this.positionUpdateTimers.delete(userId);
            }, 5000));
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
            const client = await pool.connect();
            try {
                await client.query(
                    'UPDATE characters SET current_map = $1 WHERE user_id = $2',
                    [newMapName, socket.user.id]
                );
            } finally {
                client.release();
            }
            
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
            const client = await pool.connect();
            try {
                await client.query(
                    'UPDATE characters SET current_map = $1, position_x = $2, position_y = $3, position_z = $4 WHERE user_id = $5',
                    [mapName, socket.user.character.position.x, socket.user.character.position.y, socket.user.character.position.z, socket.user.id]
                );
                
                await client.query(
                    'UPDATE user_sessions SET current_map = $1, position_x = $2, position_y = $3, position_z = $4 WHERE user_id = $5',
                    [mapName, socket.user.character.position.x, socket.user.character.position.y, socket.user.character.position.z, socket.user.id]
                );
            } finally {
                client.release();
            }
            
            console.log(`👑 Admin ${socket.user.username} teleported from ${oldMap} to ${mapName}`);
            
        } catch (error) {
            console.error('Admin map change error:', error);
            socket.emit('admin_teleport_error', { message: 'Failed to teleport' });
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
            this.updateSessionOnDisconnect(socket.user.id);
        }
    }

    async updateSessionOnDisconnect(userId) {
        try {
            const client = await pool.connect();
            try {
                await client.query(
                    'DELETE FROM user_sessions WHERE user_id = $1',
                    [userId]
                );
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Session cleanup error:', error);
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