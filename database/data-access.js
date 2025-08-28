const { pool } = require('./migrate');

const dataAccess = {
    // User queries
    async findUserByLogin(login) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1 OR email = $1',
                [login]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async findUserById(id) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
                [id]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async findUserByUsernameOrEmail(username, email) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT id FROM users WHERE username = $1 OR email = $2',
                [username, email]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async createUser(username, email, passwordHash, role = 'user') {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
                [username, email, passwordHash, role]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    // Character queries
    async findCharacterByUserId(userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM characters WHERE user_id = $1',
                [userId]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async createCharacter(userId, name, currentMap = 'house_inside') {
        const client = await pool.connect();
        try {
            await client.query(
                'INSERT INTO characters (user_id, name, current_map) VALUES ($1, $2, $3)',
                [userId, name, currentMap]
            );
        } finally {
            client.release();
        }
    },

    async updateCharacter(userId, characterData) {
        const { name, sprite_type, position_x, position_y, position_z, current_map } = characterData;
        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE characters SET
                    name = COALESCE($1, name),
                    sprite_type = COALESCE($2, sprite_type),
                    position_x = COALESCE($3, position_x),
                    position_y = COALESCE($4, position_y),
                    position_z = COALESCE($5, position_z),
                    current_map = COALESCE($6, current_map),
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $7
                RETURNING *`,
                [name, sprite_type, position_x, position_y, position_z, current_map, userId]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    // Map queries
    async getActiveMaps() {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM maps WHERE is_active = true ORDER BY name'
            );
            return result.rows;
        } finally {
            client.release();
        }
    },

    // Chat queries
    async getChatHistory(channel, limit = 50) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM chat_messages WHERE channel = $1 ORDER BY created_at DESC LIMIT $2',
                [channel, limit]
            );
            return result.rows.reverse();
        } finally {
            client.release();
        }
    },

    // Player queries
    async getOnlinePlayers() {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT u.username, u.role, s.current_map, s.last_active
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.last_active > NOW() - INTERVAL '5 minutes'
                ORDER BY u.username
            `);
            return result.rows;
        } finally {
            client.release();
        }
    },

    // Encounter queries
    async getPokemonEncounters(mapName) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM pokemon_encounters WHERE map_name = $1',
                [mapName]
            );
            return result.rows;
        } finally {
            client.release();
        }
    },

    // Game Service Queries
    async findUserAndCharacterById(userId) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT u.*, c.* FROM users u LEFT JOIN characters c ON u.id = c.user_id WHERE u.id = $1 AND u.is_active = true',
                [userId]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async createOrUpdateUserSession(sessionData) {
        const { userId, characterId, socketId, currentMap, positionX, positionY, positionZ } = sessionData;
        const client = await pool.connect();
        try {
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
            `, [userId, characterId, socketId, currentMap, positionX, positionY, positionZ]);
        } finally {
            client.release();
        }
    },

    async updateCharacterMap(userId, newMapName) {
        const client = await pool.connect();
        try {
            await client.query(
                'UPDATE characters SET current_map = $1 WHERE user_id = $2',
                [newMapName, userId]
            );
        } finally {
            client.release();
        }
    },

    async updateCharacterPosition(userId, position) {
        const { x, y, z } = position;
        const client = await pool.connect();
        try {
            await client.query(
                'UPDATE characters SET position_x = $1, position_y = $2, position_z = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4',
                [x, y, z, userId]
            );
        } finally {
            client.release();
        }
    },

    async deleteUserSession(userId) {
        const client = await pool.connect();
        try {
            await client.query(
                'DELETE FROM user_sessions WHERE user_id = $1',
                [userId]
            );
        } finally {
            client.release();
        }
    },

    // Chat Service Queries
    async saveChatMessage(messageData) {
        const { user_id, username, message, channel } = messageData;
        const client = await pool.connect();
        try {
            await client.query(
                'INSERT INTO chat_messages (user_id, username, message, channel) VALUES ($1, $2, $3, $4)',
                [user_id, username, message, channel]
            );
        } finally {
            client.release();
        }
    },

    async updateUserRole(username, newRole) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'UPDATE users SET role = $1 WHERE username = $2 RETURNING username, role',
                [newRole, username]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async banUser(username) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'UPDATE users SET is_active = false WHERE username = $1 RETURNING username',
                [username]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async unbanUser(username) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'UPDATE users SET is_active = true WHERE username = $1 RETURNING username',
                [username]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    async demoteUser(username) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'UPDATE users SET role = \'user\' WHERE username = $1 AND role != \'admin\' RETURNING username, role',
                [username]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    },
};

module.exports = dataAccess;
