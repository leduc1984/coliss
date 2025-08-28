const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use(express.static('.'));
app.use('/assets', express.static('assets'));
app.use('/api', express.static('../api'));

// Serve map objects from all subdirectories
app.use('/map_objects', express.static(path.join(__dirname, 'assets', 'map_objects')));

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
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

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API to get all available map objects
app.get('/api/map_objects', (req, res) => {
    try {
        const mapObjectsDir = path.join(__dirname, 'assets', 'map_objects');
        const objects = [];
        
        // Function to recursively scan directories for 3D files
        const scanObjectDirectories = (dirPath, basePath = '') => {
            try {
                const items = fs.readdirSync(dirPath);
                
                items.forEach(item => {
                    const itemPath = path.join(dirPath, item);
                    const relativePath = basePath ? path.join(basePath, item) : item;
                    const stat = fs.statSync(itemPath);
                    
                    if (stat.isDirectory()) {
                        // Recursively scan subdirectories
                        scanObjectDirectories(itemPath, relativePath);
                    } else if (item.toLowerCase().endsWith('.glb') || 
                               item.toLowerCase().endsWith('.gltf') ||
                               item.toLowerCase().endsWith('.obj')) {
                        // Add 3D files as objects
                        const objectName = relativePath.replace(/\.[^/.]+$/, '').replace(/\\/g, '/');
                        const category = basePath.split('/')[0] || 'Uncategorized';
                        
                        objects.push({
                            id: objects.length + 1,
                            name: objectName,
                            displayName: path.basename(objectName),
                            category: category,
                            filePath: `/map_objects/${relativePath.replace(/\\/g, '/')}`,
                            fileType: path.extname(item).toLowerCase()
                        });
                    }
                });
            } catch (error) {
                console.error('Error scanning directory:', dirPath, error);
            }
        };
        
        // Scan all map object directories
        if (fs.existsSync(mapObjectsDir)) {
            scanObjectDirectories(mapObjectsDir);
        }
        
        res.json(objects);
    } catch (error) {
        console.error('Error fetching map objects:', error);
        res.status(500).json({ error: 'Failed to fetch map objects' });
    }
});

// Pokemon sprites API
app.get('/api/pokemon/sprites/:pokemonId', (req, res) => {
    const pokemonId = req.params.pokemonId;
    const spritesDir = path.join(__dirname, 'assets', 'battlesprites');
    
    try {
        const sprites = {
            front: null,
            frontShiny: null,
            back: null,
            backShiny: null,
            frontFemale: null,
            frontMale: null,
            frontShinyFemale: null,
            frontShinyMale: null
        };

        // Check for different sprite variations
        const patterns = [
            { key: 'front', pattern: `${pokemonId}-front-n.gif` },
            { key: 'frontShiny', pattern: `${pokemonId}-front-s.gif` },
            { key: 'back', pattern: `${pokemonId}-back-n.gif` },
            { key: 'backShiny', pattern: `${pokemonId}-back-s.gif` },
            { key: 'frontFemale', pattern: `${pokemonId}-front-s-f.gif` },
            { key: 'frontMale', pattern: `${pokemonId}-front-s-m.gif` },
            { key: 'frontShinyFemale', pattern: `${pokemonId}-front-n-f.gif` },
            { key: 'frontShinyMale', pattern: `${pokemonId}-front-n-m.gif` }
        ];

        patterns.forEach(({ key, pattern }) => {
            const filePath = path.join(spritesDir, pattern);
            if (fs.existsSync(filePath)) {
                sprites[key] = `/assets/battlesprites/${pattern}`;
            }
        });

        // If no normal front sprite, use shiny as fallback
        if (!sprites.front && sprites.frontShiny) {
            sprites.front = sprites.frontShiny;
        }

        res.json(sprites);
    } catch (error) {
        console.error('Error fetching sprites:', error);
        res.status(500).json({ error: 'Failed to fetch sprites' });
    }
});

// Pokemon list API with sprites
app.get('/api/pokemon/list', (req, res) => {
    try {
        const spritesDir = path.join(__dirname, 'assets', 'battlesprites');
        const files = fs.readdirSync(spritesDir);
        
        // Extract unique Pokemon IDs from sprite files
        const pokemonIds = new Set();
        
        files.forEach(file => {
            if (file.endsWith('.gif')) {
                const match = file.match(/^(\d+)-/);
                if (match) {
                    pokemonIds.add(parseInt(match[1]));
                }
            }
        });

        // Convert to sorted array
        const sortedIds = Array.from(pokemonIds).sort((a, b) => a - b);
        
        const pokemonList = sortedIds.map(id => ({
            id: id,
            name: `pokemon_${id}`,
            hasSprites: true,
            spritePath: `/assets/battlesprites/${id}-front-s.gif`
        }));

        res.json(pokemonList);
    } catch (error) {
        console.error('Error fetching Pokemon list:', error);
        res.status(500).json({ error: 'Failed to fetch Pokemon list' });
    }
});

// Map file upload
app.post('/api/upload/map', upload.single('mapFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            message: 'Map uploaded successfully',
            filename: req.file.filename,
            path: `/uploads/${req.file.filename}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Save map data
app.post('/api/save/map', (req, res) => {
    try {
        const mapData = req.body;
        const filename = `map_${Date.now()}.json`;
        const filepath = path.join(__dirname, 'saves', filename);
        
        // Create saves directory if it doesn't exist
        const savesDir = path.join(__dirname, 'saves');
        if (!fs.existsSync(savesDir)) {
            fs.mkdirSync(savesDir);
        }

        fs.writeFileSync(filepath, JSON.stringify(mapData, null, 2));
        
        res.json({
            message: 'Map saved successfully',
            filename: filename,
            path: `/saves/${filename}`
        });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: 'Save failed' });
    }
});

// Load saved maps
app.get('/api/saves', (req, res) => {
    try {
        const savesDir = path.join(__dirname, 'saves');
        if (!fs.existsSync(savesDir)) {
            return res.json([]);
        }

        const files = fs.readdirSync(savesDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(savesDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    path: `/saves/${file}`,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    size: stats.size
                };
            })
            .sort((a, b) => b.modified - a.modified);

        res.json(files);
    } catch (error) {
        console.error('Error loading saves:', error);
        res.status(500).json({ error: 'Failed to load saves' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Pokemon MMO Map Editor Server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🎮 Pokemon sprites available at: /api/pokemon/sprites/:id`);
    console.log(`📋 Pokemon list available at: /api/pokemon/list`);
    console.log(`📦 Map objects available at: /api/map_objects`);
});

module.exports = app;