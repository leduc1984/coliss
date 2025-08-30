// Load environment variables from project root
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const http = require('http');
const { Pool } = require('pg');
const Redis = require('redis');

// -----------------------------
// PostgreSQL connection
// -----------------------------
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/pokemon_mmo',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pgPool.on('connect', () => {
  console.log('✅ PostgreSQL connecté');
});

pgPool.on('error', (err) => {
  console.error('❌ PostgreSQL erreur :', err);
});

// -----------------------------
// Redis connection
// -----------------------------
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect()
  .then(() => console.log('✅ Redis connecté'))
  .catch(err => console.error('❌ Redis erreur :', err));

redisClient.on('error', (err) => {
  console.error('❌ Redis client error:', err);
});

// -----------------------------
// Express app & WebSocket server
// -----------------------------
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// -----------------------------
// Middlewares
// -----------------------------
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000', // UI Editor
    'http://localhost:3001', // Dialogue Editor  
    'http://localhost:3002', // Monster Editor
    'http://localhost:3003', // Admin Panel
  ],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
      webSocket: 'active'
    }
  });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Validate credentials against game database
    const result = await pgPool.query(
      'SELECT id, username, role, permissions FROM admin_users WHERE username = $1 AND password_hash = crypt($2, password_hash)',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UI Editor Integration Endpoints
app.post('/api/ui-editor/export', authenticateToken, async (req, res) => {
  const { layout, target, format } = req.body;
  
  try {
    // Validate UI layout
    if (!layout || !layout.components) {
      return res.status(400).json({ error: 'Invalid layout data' });
    }

    // Process and optimize layout
    const processedLayout = {
      ...layout,
      metadata: {
        exportedBy: req.user.username,
        exportedAt: new Date().toISOString(),
        target,
        format
      }
    };

    // Store in Redis for game client to pick up
    const cacheKey = `ui_layout:${layout.id}:${Date.now()}`;
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(processedLayout));

    // Log export operation
    await pgPool.query(
      'INSERT INTO export_logs (user_id, tool, operation, data_id, target) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'ui-editor', 'export', layout.id, target]
    );

    res.json({
      success: true,
      exportId: cacheKey,
      downloadUrl: `/api/ui-editor/download/${cacheKey}`,
      message: 'Layout exported successfully'
    });
  } catch (error) {
    console.error('UI export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

app.get('/api/ui-editor/assets/:type', authenticateToken, async (req, res) => {
  const { type } = req.params;
  
  try {
    // Fetch game assets based on type
    const result = await pgPool.query(
      'SELECT id, name, path, metadata FROM game_assets WHERE type = $1 AND active = true',
      [type]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Asset fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Dialogue Editor Integration Endpoints
app.post('/api/dialogue-editor/export', authenticateToken, async (req, res) => {
  const { dialogueTree, target, validation } = req.body;
  
  try {
    // Validate dialogue tree structure
    if (!dialogueTree || !dialogueTree.nodes) {
      return res.status(400).json({ error: 'Invalid dialogue tree data' });
    }

    // Run validation if requested
    if (validation) {
      const validationErrors = validateDialogueTree(dialogueTree);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validationErrors 
        });
      }
    }

    // Compile dialogue tree for game engine
    const compiledTree = compileDialogueTree(dialogueTree);
    
    // Store compiled dialogue in database
    await pgPool.query(
      'INSERT INTO dialogue_trees (id, name, compiled_data, created_by, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET compiled_data = $3, updated_by = $4, updated_at = $5',
      [dialogueTree.id, dialogueTree.name, JSON.stringify(compiledTree), req.user.id, new Date()]
    );

    res.json({
      success: true,
      treeId: dialogueTree.id,
      message: 'Dialogue tree exported successfully'
    });
  } catch (error) {
    console.error('Dialogue export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

app.get('/api/dialogue-editor/characters', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(
      'SELECT id, name, sprite_path, voice_settings FROM npc_characters WHERE active = true ORDER BY name'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Character fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Monster Editor Integration Endpoints
app.post('/api/monster-editor/sync', authenticateToken, async (req, res) => {
  const { pokemon, operation, validateBalance } = req.body;
  
  try {
    // Validate Pokemon data
    if (!Array.isArray(pokemon)) {
      return res.status(400).json({ error: 'Pokemon data must be an array' });
    }

    // Balance validation if requested
    if (validateBalance) {
      for (const p of pokemon) {
        const balanceIssues = validatePokemonBalance(p);
        if (balanceIssues.length > 0) {
          return res.status(400).json({
            error: 'Balance validation failed',
            pokemon: p.name,
            issues: balanceIssues
          });
        }
      }
    }

    // Execute database operations
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      for (const p of pokemon) {
        switch (operation) {
          case 'create':
          case 'update':
            await client.query(`
              INSERT INTO pokemon (id, name, species, base_stats, types, abilities, moveset, evolution_data, game_data, updated_by, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (id) DO UPDATE SET
                name = $2, species = $3, base_stats = $4, types = $5, abilities = $6,
                moveset = $7, evolution_data = $8, game_data = $9, updated_by = $10, updated_at = $11
            `, [
              p.id, p.name, p.species, JSON.stringify(p.baseStats),
              JSON.stringify(p.types), JSON.stringify(p.abilities),
              JSON.stringify(p.moveset), JSON.stringify(p.evolution),
              JSON.stringify(p.gameData), req.user.id, new Date()
            ]);
            break;
          case 'delete':
            await client.query('UPDATE pokemon SET active = false, updated_by = $2, updated_at = $3 WHERE id = $1', [p.id, req.user.id, new Date()]);
            break;
        }
      }

      await client.query('COMMIT');
      
      // Invalidate battle system cache
      await redisClient.del('battle_cache:*');

      res.json({
        success: true,
        processed: pokemon.length,
        message: `${operation} operation completed successfully`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Monster sync error:', error);
    res.status(500).json({ error: 'Sync operation failed' });
  }
});

app.get('/api/monster-editor/battle-data/:pokemonId', authenticateToken, async (req, res) => {
  const { pokemonId } = req.params;
  
  try {
    // Check cache first
    const cacheKey = `battle_data:${pokemonId}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Fetch from database and prepare for battle system
    const result = await pgPool.query(
      'SELECT id, name, base_stats, types, abilities, moveset FROM pokemon WHERE id = $1 AND active = true',
      [pokemonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pokemon not found' });
    }

    const pokemon = result.rows[0];
    const battleReadyData = prepareBattleData(pokemon);

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(battleReadyData));

    res.json(battleReadyData);
  } catch (error) {
    console.error('Battle data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch battle data' });
  }
});

// Admin Panel WebSocket Integration
wss.on('connection', (ws, req) => {
  console.log('Admin WebSocket connection established');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'PLAYER_ACTION':
          await handlePlayerAction(data.payload);
          break;
        case 'SERVER_COMMAND':
          await handleServerCommand(data.payload);
          break;
        case 'EVENT_MANAGEMENT':
          await handleEventManagement(data.payload);
          break;
        case 'REQUEST_METRICS':
          const metrics = await getSystemMetrics();
          ws.send(JSON.stringify({ type: 'METRICS_UPDATE', data: metrics }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid request' }));
    }
  });

  // Send initial system status
  ws.send(JSON.stringify({ 
    type: 'CONNECTION_ESTABLISHED', 
    timestamp: new Date().toISOString() 
  }));
});

// Utility functions
function validateDialogueTree(tree) {
  const errors = [];
  
  // Check for orphaned nodes
  const nodeIds = new Set(tree.nodes.map(n => n.id));
  tree.edges.forEach(edge => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push(`Invalid edge reference: ${edge.source} -> ${edge.target}`);
    }
  });

  return errors;
}

function compileDialogueTree(tree) {
  // Compile dialogue tree into runtime format
  return {
    id: tree.id,
    name: tree.name,
    startNode: tree.nodes.find(n => n.type === 'start')?.id,
    nodes: tree.nodes.reduce((acc, node) => {
      acc[node.id] = {
        type: node.type,
        data: node.data,
        connections: tree.edges
          .filter(e => e.source === node.id)
          .map(e => e.target)
      };
      return acc;
    }, {}),
    metadata: {
      compiledAt: new Date().toISOString(),
      version: '1.0'
    }
  };
}

function validatePokemonBalance(pokemon) {
  const issues = [];
  const bst = Object.values(pokemon.baseStats).reduce((sum, stat) => sum + (typeof stat === 'number' ? stat : 0), 0);
  
  if (bst > 700 && !pokemon.isLegendary && !pokemon.isMythical) {
    issues.push('Base stat total too high for non-legendary Pokemon');
  }
  
  if (bst < 200) {
    issues.push('Base stat total too low');
  }

  return issues;
}

function prepareBattleData(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    baseStats: pokemon.base_stats,
    types: pokemon.types,
    abilities: pokemon.abilities,
    moves: pokemon.moveset?.levelUp || [],
    battleModifiers: {
      criticalHitRatio: 1,
      accuracyModifier: 1,
      experienceYield: pokemon.base_stats.total / 10
    }
  };
}

async function handlePlayerAction(payload) {
  // Implement player management actions
  console.log('Player action:', payload);
}

async function handleServerCommand(payload) {
  // Implement server control commands
  console.log('Server command:', payload);
}

async function handleEventManagement(payload) {
  // Implement world event management
  console.log('Event management:', payload);
}

async function getSystemMetrics() {
  // Return current system metrics
  return {
    timestamp: new Date().toISOString(),
    onlinePlayers: Math.floor(Math.random() * 1000) + 500,
    serverUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: Math.random() * 100
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Gateway error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  
  await pgPool.end();
  await redisClient.quit();
  
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

module.exports = app;