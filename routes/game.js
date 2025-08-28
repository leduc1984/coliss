const express = require('express');
const jwt = require('jsonwebtoken');
const dataAccess = require('../database/data-access');

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
        let character = await dataAccess.findCharacterByUserId(req.user.userId);
        if (!character) {
            // Create default character if none exists
            await dataAccess.createCharacter(req.user.userId, req.user.username);
            character = await dataAccess.findCharacterByUserId(req.user.userId);
        }
        res.json(character);
    } catch (error) {
        console.error('Get character error:', error);
        res.status(500).json({ message: 'Failed to get character data' });
    }
});

// Update player character
router.put('/character', authenticateToken, async (req, res) => {
    try {
        const updatedCharacter = await dataAccess.updateCharacter(req.user.userId, req.body);
        if (!updatedCharacter) {
            return res.status(404).json({ message: 'Character not found' });
        }
        res.json(updatedCharacter);
    } catch (error) {
        console.error('Update character error:', error);
        res.status(500).json({ message: 'Failed to update character' });
    }
});

// Get available maps
router.get('/maps', authenticateToken, async (req, res) => {
    try {
        const maps = await dataAccess.getActiveMaps();
        res.json(maps);
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
        const messages = await dataAccess.getChatHistory(channel, limit);
        res.json(messages);
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ message: 'Failed to get chat history' });
    }
});

// Get online players
router.get('/players/online', authenticateToken, async (req, res) => {
    try {
        const players = await dataAccess.getOnlinePlayers();
        res.json(players);
    } catch (error) {
        console.error('Get online players error:', error);
        res.status(500).json({ message: 'Failed to get online players' });
    }
});

// Get Pokemon encounters for a map
router.get('/encounters/:mapName', authenticateToken, async (req, res) => {
    try {
        const { mapName } = req.params;
        const encounters = await dataAccess.getPokemonEncounters(mapName);
        res.json(encounters);
    } catch (error) {
        console.error('Get encounters error:', error);
        res.status(500).json({ message: 'Failed to get encounters' });
    }
});

// Save game state (for admins/co-admins)
router.post('/save-state', authenticateToken, async (req, res) => {
    try {
        // Check if user has permission
        const user = await dataAccess.findUserById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userRole = user.role;
        if (userRole !== 'admin' && userRole !== 'co-admin') {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        // Save game state logic would go here
        // For now, just acknowledge the request
        res.json({ message: 'Game state saved successfully' });
    } catch (error) {
        console.error('Save state error:', error);
        res.status(500).json({ message: 'Failed to save game state' });
    }
});

module.exports = router;