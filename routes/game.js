const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/migrate');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Get player character data
router.get('/character', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM characters WHERE user_id = $1',
                [req.user.userId]
            );

            if (result.rows.length === 0) {
                // Create default character if none exists
                const characterResult = await client.query(
                    'INSERT INTO characters (user_id, name) VALUES ($1, $2) RETURNING *',
                    [req.user.userId, req.user.username]
                );
                res.json(characterResult.rows[0]);
            } else {
                res.json(result.rows[0]);
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get character error:', error);
        res.status(500).json({ message: 'Failed to get character data' });
    }
});

// Update player character
router.put('/character', authenticateToken, async (req, res) => {
    try {
        const { name, sprite_type, position_x, position_y, position_z, current_map } = req.body;
        
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
                [name, sprite_type, position_x, position_y, position_z, current_map, req.user.userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Character not found' });
            }

            res.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update character error:', error);
        res.status(500).json({ message: 'Failed to update character' });
    }
});

// Get available maps
router.get('/maps', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM maps WHERE is_active = true ORDER BY name'
            );
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get maps error:', error);
        res.status(500).json({ message: 'Failed to get maps' });
    }
});

// Get chat history
router.get('/chat/history', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const channel = req.query.channel || 'global';
        
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM chat_messages WHERE channel = $1 ORDER BY created_at DESC LIMIT $2',
                [channel, limit]
            );
            
            // Reverse to get chronological order
            res.json(result.rows.reverse());
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ message: 'Failed to get chat history' });
    }
});

// Get online players
router.get('/players/online', authenticateToken, async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT u.username, u.role, s.current_map, s.last_active
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.last_active > NOW() - INTERVAL '5 minutes'
                ORDER BY u.username
            `);
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get online players error:', error);
        res.status(500).json({ message: 'Failed to get online players' });
    }
});

// Get Pokemon encounters for a map
router.get('/encounters/:mapName', authenticateToken, async (req, res) => {
    try {
        const { mapName } = req.params;
        
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM pokemon_encounters WHERE map_name = $1',
                [mapName]
            );
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get encounters error:', error);
        res.status(500).json({ message: 'Failed to get encounters' });
    }
});

// Save game state (for admins/co-admins)
router.post('/save-state', authenticateToken, async (req, res) => {
    try {
        // Check if user has permission
        const client = await pool.connect();
        try {
            const userResult = await client.query(
                'SELECT role FROM users WHERE id = $1',
                [req.user.userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const userRole = userResult.rows[0].role;
            if (userRole !== 'admin' && userRole !== 'co-admin') {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            // Save game state logic would go here
            // For now, just acknowledge the request
            res.json({ message: 'Game state saved successfully' });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Save state error:', error);
        res.status(500).json({ message: 'Failed to save game state' });
    }
});

module.exports = router;