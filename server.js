const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const Redis = require('redis');
require('dotenv').config();

// Import routes and services
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');
const pokemonRoutes = require('./routes/pokemon');
const ChatService = require('./services/ChatService');
const GameService = require('./services/GameService');
const BattleService = require('./services/BattleService');
const { createTables } = require('./database/migrate');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

app.use(cors());

// Rate limiting - Development mode with higher limits
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (shorter window)
  max: 1000 // Much higher limit for development/testing
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files with proper MIME type configuration
app.use(express.static('public'));
app.use('/assets', express.static('pokemon-map-editor/assets', {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'model/gltf-binary');
    } else if (filePath.endsWith('.gltf')) {
      res.setHeader('Content-Type', 'model/gltf+json');
    } else if (filePath.endsWith('.bin')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Serve poke-battle static files
app.use('/poke-battle', express.static(path.join(__dirname, 'poke-battle'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Configure pokemon-map-editor static files with explicit MIME types
app.use('/pokemon-map-editor', express.static(path.join(__dirname, 'pokemon-map-editor'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (filePath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'model/gltf-binary');
    } else if (filePath.endsWith('.gltf')) {
      res.setHeader('Content-Type', 'model/gltf+json');
    } else if (filePath.endsWith('.bin')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

// Fallback route for map editor files
app.get('/pokemon-map-editor/*', (req, res) => {
  const filePath = path.join(__dirname, 'pokemon-map-editor', req.params[0]);
  
  // Set proper MIME type based on file extension
  if (req.params[0].endsWith('.css')) {
    res.type('text/css');
  } else if (req.params[0].endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.params[0].endsWith('.json')) {
    res.type('application/json');
  } else if (req.params[0].endsWith('.glb')) {
    res.type('model/gltf-binary');
  } else if (req.params[0].endsWith('.gltf')) {
    res.type('model/gltf+json');
  } else if (req.params[0].endsWith('.bin')) {
    res.type('application/octet-stream');
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('File not found:', filePath);
      res.status(404).send('File not found');
    }
  });
});

// Initialize services
const chatService = new ChatService(io);

// Redis configuration
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect()
  .then(() => console.log('\x1b[32m✅ Redis connected successfully at', process.env.REDIS_URL || 'redis://localhost:6379', '\x1b[0m'))
  .catch(err => console.error('\x1b[31m❌ Redis connection failed:', err.message, '\x1b[0m'));

redisClient.on('error', (err) => {
  console.error('\x1b[31m❌ Redis client error:', err.message, '\x1b[0m');
});

// Initialize services with Redis client
const gameService = new GameService(io, redisClient);
const battleService = new BattleService(io, redisClient);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/pokemons', pokemonRoutes);
// Types and sprites routes with specific pattern
app.use('/api', pokemonRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      database: 'connected',
      redis: redisClient.isReady ? 'connected' : 'disconnected',
      socketIO: 'active'
    },
    redisDetails: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      status: redisClient.isReady ? 'connected' : 'disconnected',
      lastError: redisClient.isReady ? null : 'Check server logs for details'
    }
  });
});

// Map Editor API Routes
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'pokemon-map-editor/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Add the missing endpoint for map objects
app.get('/api/editor/map-objects', (req, res) => {
    // Return empty array as temporary fix
    // This will be updated later to fetch actual map object data from the database
    res.status(200).json([]);
});

// Serve dev-tools statically
app.use('/dev-tools/dialogue-editor', express.static(path.join(__dirname, 'dev-tools/dialogue-editor/build')));
app.use('/dev-tools/ui-editor', express.static(path.join(__dirname, 'dev-tools/ui-editor/build')));
app.use('/dev-tools/monster-editor', express.static(path.join(__dirname, 'dev-tools/monster-editor/build')));
app.use('/dev-tools/admin-panel', express.static(path.join(__dirname, 'dev-tools/admin-panel/build')));

// Fallback routes for dev-tools
app.get('/dev-tools/dialogue-editor/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dev-tools/dialogue-editor/build/index.html'));
});

app.get('/dev-tools/ui-editor/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dev-tools/ui-editor/build/index.html'));
});

app.get('/dev-tools/monster-editor/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dev-tools/monster-editor/build/index.html'));
});

app.get('/dev-tools/admin-panel/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dev-tools/admin-panel/build/index.html'));
});

// Serve the main game
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the map editor (correct path)
app.get('/editor', (req, res) => {
  res.redirect('/pokemon-map-editor/');
});

// Also serve it at the original path for compatibility 
app.get('/pokemon-map-editor', (req, res) => {
  res.redirect('/pokemon-map-editor/');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`👤 New connection: ${socket.id}`);

  // Handle user authentication
  socket.on('authenticate', async (data) => {
    try {
      await gameService.authenticateUser(socket, data);
    } catch (error) {
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  });

  // Handle player movement
  socket.on('player_move', async (data) => {
    await gameService.handlePlayerMovement(socket, data);
  });

  // Handle chat messages
  socket.on('chat_message', async (data) => {
    await chatService.handleMessage(socket, data);
  });
  
  // Handle chat commands
  socket.on('chat_command', async (data) => {
    await chatService.handleCommand(socket, `/${data.command} ${data.args ? data.args.join(' ') : ''}`, 'global');
  });

  // Handle map editor access (admin/co-admin only)
  socket.on('request_editor_access', async () => {
    await gameService.handleEditorAccess(socket);
  });

  // Handle map changes (teleportation)
  socket.on('map_change', async (newMapName) => {
    await gameService.handleMapChange(socket, newMapName);
  });
  
  // Handle admin map requests
  socket.on('admin_map_request', async () => {
    await gameService.handleAdminMapRequest(socket);
  });
  
  // Handle admin map selection
  socket.on('admin_map_change', async (data) => {
    await gameService.handleAdminMapChange(socket, data);
  });

  // ===== BATTLE EVENTS =====
  
  // Handle battle requests
  socket.on('battle_request', async (data) => {
    try {
      await battleService.handleBattleRequest(socket, data);
    } catch (error) {
      console.error('Battle request error:', error);
      socket.emit('battle_error', { message: error.message });
    }
  });
  
  // Handle battle acceptance
  socket.on('battle_accept', async (data) => {
    try {
      await battleService.handleBattleAccept(socket, data);
    } catch (error) {
      console.error('Battle accept error:', error);
      socket.emit('battle_error', { message: error.message });
    }
  });
  
  // Handle battle moves
  socket.on('battle_move', async (data) => {
    try {
      await battleService.processMove(socket, data);
    } catch (error) {
      console.error('Battle move error:', error);
      socket.emit('battle_error', { message: error.message });
    }
  });
  
  // Handle pokemon switching
  socket.on('battle_switch', async (data) => {
    try {
      await battleService.processPokemonSwitch(socket, data);
    } catch (error) {
      console.error('Battle switch error:', error);
      socket.emit('battle_error', { message: error.message });
    }
  });
  
  // Handle battle run attempts
  socket.on('battle_run', async (data) => {
    try {
      await battleService.processRun(socket, data);
    } catch (error) {
      console.error('Battle run error:', error);
      socket.emit('battle_error', { message: error.message });
    }
  });
  
  // Handle wild pokemon encounters
  socket.on('wild_encounter', async (data) => {
    try {
      await battleService.handleWildEncounter(socket, data);
    } catch (error) {
      console.error('Wild encounter error:', error);
      socket.emit('battle_error', { message: error.message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
    gameService.handleDisconnect(socket);
    battleService.handlePlayerDisconnect(socket);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Initializing database...');
    await createTables();
    
    // Check Redis connection status
    const redisStatus = redisClient.isReady ? 
      '\x1b[42m\x1b[30m CONNECTED \x1b[0m' : 
      '\x1b[41m\x1b[37m DISCONNECTED \x1b[0m';
    console.log('\x1b[36m\x1b[1m\n====== Redis Status: ' + redisStatus + ' ======\x1b[0m');
    
    server.listen(PORT, () => {
      console.log(`🚀 Pokemon MMO Server running on port ${PORT}`);
      console.log(`🎮 Game available at: http://localhost:${PORT}`);
      console.log(`🗺️  Map editor at: http://localhost:${PORT}/pokemon-map-editor/`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Close Redis connection
  if (redisClient.isReady) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { app, server, io, battleService, redisClient };