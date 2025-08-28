const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/migrate');

const router = express.Router();

// Middleware to verify admin token
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has admin or co-admin role
    if (!['admin', 'co-admin'].includes(decoded.role)) {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Get all users (admin only)
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          u.id, 
          u.username, 
          u.email, 
          u.role, 
          u.is_active, 
          u.created_at,
          c.name as character_name,
          c.current_map,
          c.position_x,
          c.position_y,
          c.position_z
        FROM users u
        LEFT JOIN characters c ON u.id = c.user_id
        ORDER BY u.created_at DESC
      `);
      
      res.json({ users: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user role (admin only)
router.put('/users/:userId/role', verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    const validRoles = ['user', 'helper', 'co-admin', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Only allow admin to promote to admin role
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can promote to admin role' });
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role',
        [role, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ 
        message: 'User role updated successfully',
        user: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Ban/unban user (admin only)
router.put('/users/:userId/status', verifyAdminToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;
    
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active must be a boolean' });
    }
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, is_active',
        [is_active, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ 
        message: `User ${is_active ? 'unbanned' : 'banned'} successfully`,
        user: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get server statistics (admin only)
router.get('/stats', verifyAdminToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const [
        userCount,
        activeUsers,
        totalMessages,
        activeSessions
      ] = await Promise.all([
        client.query('SELECT COUNT(*) FROM users'),
        client.query('SELECT COUNT(*) FROM users WHERE is_active = true'),
        client.query('SELECT COUNT(*) FROM chat_messages'),
        client.query('SELECT COUNT(*) FROM user_sessions WHERE expires_at > NOW()')
      ]);
      
      res.json({
        stats: {
          totalUsers: parseInt(userCount.rows[0].count),
          activeUsers: parseInt(activeUsers.rows[0].count),
          totalMessages: parseInt(totalMessages.rows[0].count),
          activeSessions: parseInt(activeSessions.rows[0].count)
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get recent chat messages (admin only)
router.get('/chat', verifyAdminToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          cm.id,
          cm.message,
          cm.channel,
          cm.created_at,
          u.username,
          u.role
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        ORDER BY cm.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      res.json({ messages: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete chat message (admin only)
router.delete('/chat/:messageId', verifyAdminToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'DELETE FROM chat_messages WHERE id = $1 RETURNING id',
        [messageId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      res.json({ message: 'Message deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get maps data (admin only)
router.get('/maps', verifyAdminToken, async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          id,
          name,
          description,
          data,
          created_at,
          updated_at
        FROM maps
        ORDER BY name
      `);
      
      res.json({ maps: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get maps error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update map data (admin only)
router.put('/maps/:mapId', verifyAdminToken, async (req, res) => {
  try {
    const { mapId } = req.params;
    const { name, description, data } = req.body;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE maps 
        SET name = $1, description = $2, data = $3, updated_at = NOW()
        WHERE id = $4 
        RETURNING id, name, description, updated_at
      `, [name, description, JSON.stringify(data), mapId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Map not found' });
      }
      
      res.json({ 
        message: 'Map updated successfully',
        map: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update map error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;