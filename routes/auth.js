const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { pool } = require('../database/migrate');

const router = express.Router();

// Password validation function
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

// Register endpoint
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  
  try {
    // Validate input
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate username
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ message: 'Username must be between 3 and 50 characters' });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
    }
    
    // Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: passwordErrors.join('. ') });
    }
    
    // Check password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    const client = await pool.connect();
    
    try {
      // Check if username or email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: 'Username or email already exists' });
      }
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // --- BUG FIX: All new users start with 'user' role for security ---
      // Admin roles must be assigned through secure admin tools or scripts
      const role = 'user';
      
      // Create user
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        [username, email, passwordHash, role]
      );
      
      const newUser = result.rows[0];
      
      // Create default character
      await client.query(
        'INSERT INTO characters (user_id, name, current_map) VALUES ($1, $2, $3)',
        [newUser.id, username, 'house_inside']
      );
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, username: newUser.username, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Get character information
      const characterResult = await client.query(
        'SELECT name, current_map FROM characters WHERE user_id = $1',
        [newUser.id]
      );
      
      const character = characterResult.rows[0] || { name: username, current_map: 'house_inside' };
      
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          character: {
            name: character.name,
            currentMap: character.current_map
          }
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { login, password } = req.body; // login can be username or email
  
  try {
    if (!login || !password) {
      return res.status(400).json({ message: 'Login and password are required' });
    }
    
    const client = await pool.connect();
    
    try {
      // Find user by username or email
      const result = await client.query(
        'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1 OR email = $1',
        [login]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const user = result.rows[0];
      
      if (!user.is_active) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Get character information
      const characterResult = await client.query(
        'SELECT name, current_map FROM characters WHERE user_id = $1',
        [user.id]
      );
      
      const character = characterResult.rows[0] || { name: user.username, current_map: 'house_inside' };
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          character: {
            name: character.name,
            currentMap: character.current_map
          }
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );
      
      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Get character information
      const characterResult = await client.query(
        'SELECT name, current_map FROM characters WHERE user_id = $1',
        [decoded.userId]
      );
      
      const character = characterResult.rows[0] || { name: result.rows[0].username, current_map: 'house_inside' };
      
      res.json({ 
        user: {
          ...result.rows[0],
          character: {
            name: character.name,
            currentMap: character.current_map
          }
        }
      });
    } finally {
      client.release();
    }
    
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Quick test user creation endpoint (development only)
router.post('/create-test-user', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Check if test user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1',
        ['test_leduc']
      );
      
      if (existingUser.rows.length > 0) {
        // User exists, just return login token
        const user = await client.query(
          'SELECT id, username, email, role FROM users WHERE username = $1',
          ['test_leduc']
        );
        
        const token = jwt.sign(
          { userId: user.rows[0].id, username: user.rows[0].username, role: user.rows[0].role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        // Get character information
        const characterResult = await client.query(
          'SELECT name, current_map FROM characters WHERE user_id = $1',
          [user.rows[0].id]
        );
        
        const character = characterResult.rows[0] || { name: user.rows[0].username, current_map: 'house_inside' };
        
        return res.json({
          message: 'Test user already exists',
          token,
          user: {
            ...user.rows[0],
            character: {
              name: character.name,
              currentMap: character.current_map
            }
          }
        });
      }
      
      // Create test user
      const passwordHash = await bcrypt.hash('TestLeduc123!', 12);
      
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
        ['test_leduc', 'test@leduc.com', passwordHash, 'admin']
      );
      
      const newUser = result.rows[0];
      
      // Create default character
      await client.query(
        'INSERT INTO characters (user_id, name, current_map) VALUES ($1, $2, $3)',
        [newUser.id, 'test_leduc', 'house_inside']
      );
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, username: newUser.username, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Get character information
      const characterResult = await client.query(
        'SELECT name, current_map FROM characters WHERE user_id = $1',
        [newUser.id]
      );
      
      const character = characterResult.rows[0] || { name: newUser.username, current_map: 'house_inside' };
      
      res.status(201).json({
        message: 'Test user created successfully',
        token,
        user: {
          ...newUser,
          character: {
            name: character.name,
            currentMap: character.current_map
          }
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Test user creation error:', error);
    res.status(500).json({ message: 'Failed to create test user' });
  }
});

module.exports = router;