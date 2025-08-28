/**
 * Éditeur d'Événements Visuels pour l'Éditeur de Cartes Pokémon
 * Système de nodes pour créer des événements de gameplay sans code
 */
class EventEditor {
    constructor(scene) {
        this.scene = scene;
        this.nodes = new Map();
        this.connections = [];
        this.triggerZones = new Map();
        this.canvas = null;
        this.isVisible = false;
        this.nodeCounter = 0;
        
        // Types de nodes disponibles
        this.nodeTypes = {
            'trigger': {
                color: '#ff6b6b',
                inputs: 0,
                outputs: 1,
                properties: ['triggerType', 'condition']
            },
            'condition': {
                color: '#4ecdc4',
                inputs: 1,
                outputs: 2,
                properties: ['conditionType', 'value', 'operator']
            },
            'action': {
                color: '#45b7d1',
                inputs: 1,
                outputs: 1,
                properties: ['actionType', 'target', 'value']
            },
            'dialogue': {
                color: '#96ceb4',
                inputs: 1,
                outputs: 1,
                properties: ['speaker', 'text', 'portrait']
            },
            'pokemon_encounter': {
                color: '#feca57',
                inputs: 1,
                outputs: 2,
                properties: ['pokemonId', 'level', 'shiny']
            },
            'teleport': {
                color: '#5f27cd',
                inputs: 1,
                outputs: 1,
                properties: ['targetMap', 'x', 'y', 'z']
            }
        };
        
        this.eventData = {
            variables: new Map(),
            flags: new Map(),
            activeEvents: new Set()
        };
        
        this.initializeEventEditor();
    }
    
    /**
     * Initialiser l'éditeur d'événements
     */
    initializeEventEditor() {
        this.createEventCanvas();
        this.setupEventUI();
        this.loadEventData();
    }
    
    /**
     * Créer le canvas pour l'éditeur de nodes
     */
    createEventCanvas() {
        const eventContainer = document.createElement('div');
        eventContainer.id = 'event-editor-container';
        eventContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            display: none;
        `;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'event-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.background = '#1a1a1a';
        
        eventContainer.appendChild(canvas);
        document.body.appendChild(eventContainer);
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.setupCanvasEvents();
    }
    
    /**
     * Configurer les événements du canvas
     */
    setupCanvasEvents() {
        let isDragging = false;
        let dragNode = null;
        let isConnecting = false;
        let connectionStart = null;
        
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const clickedNode = this.getNodeAtPosition(x, y);
            
            if (clickedNode) {
                const outputPort = this.getOutputPortAtPosition(clickedNode, x, y);
                if (outputPort !== -1) {
                    isConnecting = true;
                    connectionStart = { node: clickedNode, port: outputPort };
                } else {
                    isDragging = true;
                    dragNode = clickedNode;
                }
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (isDragging && dragNode) {
                dragNode.position.x = x - 60;
                dragNode.position.y = y - 30;
                this.redrawCanvas();
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (isConnecting && connectionStart) {
                const targetNode = this.getNodeAtPosition(x, y);
                if (targetNode && targetNode !== connectionStart.node) {
                    const inputPort = this.getInputPortAtPosition(targetNode, x, y);
                    if (inputPort !== -1) {
                        this.createConnection(connectionStart, { node: targetNode, port: inputPort });
                    }
                }
                isConnecting = false;
                connectionStart = null;
            }
            
            isDragging = false;
            dragNode = null;
            this.redrawCanvas();
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.showContextMenu(x, y);
        });
    }
    
    /**
     * Créer un nouveau node
     */
    createNode(type, position) {
        const nodeType = this.nodeTypes[type];
        if (!nodeType) return null;
        
        this.nodeCounter++;
        const node = {
            id: `node_${this.nodeCounter}`,
            type: type,
            position: { x: position.x, y: position.y },
            properties: {},
            connections: {
                inputs: new Array(nodeType.inputs).fill(null),
                outputs: new Array(nodeType.outputs).fill([])
            }
        };
        
        // Initialiser les propriétés par défaut
        if (nodeType.properties) {
            nodeType.properties.forEach(prop => {
                node.properties[prop] = this.getDefaultPropertyValue(type, prop);
            });
        }
        
        this.nodes.set(node.id, node);
        this.redrawCanvas();
        
        return node;
    }
    
    /**
     * Obtenir la valeur par défaut d'une propriété
     */
    getDefaultPropertyValue(nodeType, property) {
        const defaults = {
            trigger: { triggerType: 'player_enter', condition: 'always' },
            condition: { conditionType: 'variable', value: '', operator: 'equals' },
            action: { actionType: 'show_message', target: '', value: '' },
            dialogue: { speaker: 'NPC', text: 'Bonjour !', portrait: '' },
            pokemon_encounter: { pokemonId: 1, level: 5, shiny: false },
            teleport: { targetMap: '', x: 0, y: 0, z: 0 }
        };
        
        return defaults[nodeType]?.[property] || '';
    }
    
    /**
     * Créer une connexion entre deux nodes
     */
    createConnection(from, to) {
        if (to.node.connections.inputs[to.port] !== null) {
            console.warn('Port d\'entrée déjà connecté');
            return false;
        }
        
        const connection = {
            id: `conn_${Date.now()}`,
            from: { nodeId: from.node.id, port: from.port },
            to: { nodeId: to.node.id, port: to.port }
        };
        
        this.connections.push(connection);
        from.node.connections.outputs[from.port].push(connection.id);
        to.node.connections.inputs[to.port] = connection.id;
        
        this.redrawCanvas();
        return true;
    }
    
    /**
     * Créer une zone de déclenchement dans la scène 3D
     */
    createTriggerZone(node) {
        const trigger = BABYLON.MeshBuilder.CreateBox(
            `trigger_${node.id}`, 
            { width: 5, height: 3, depth: 5 }, 
            this.scene
        );
        
        const triggerMaterial = new BABYLON.StandardMaterial(`triggerMat_${node.id}`, this.scene);
        triggerMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
        triggerMaterial.alpha = 0.3;
        triggerMaterial.wireframe = true;
        trigger.material = triggerMaterial;
        
        trigger.isPickable = false;
        trigger.checkCollisions = false;
        trigger.eventNode = node;
        
        this.triggerZones.set(node.id, trigger);
        node.triggerMesh = trigger;
        
        return trigger;
    }
    
    /**
     * Afficher le menu contextuel
     */
    showContextMenu(x, y) {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            background: #333;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 8px;
            z-index: 1001;
        `;
        
        Object.keys(this.nodeTypes).forEach(type => {
            const button = document.createElement('button');
            button.textContent = type;
            button.style.cssText = `
                display: block;
                width: 100%;
                padding: 4px 8px;
                margin: 2px 0;
                background: ${this.nodeTypes[type].color};
                border: none;
                color: white;
                cursor: pointer;
            `;
            
            button.onclick = () => {
                this.createNode(type, { x, y });
                menu.remove();
            };
            
            menu.appendChild(button);
        });
        
        // Ajouter le bouton fermer
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Fermer';
        closeBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 4px 8px;
            margin: 2px 0;
            background: #666;
            border: none;
            color: white;
            cursor: pointer;
        `;
        closeBtn.onclick = () => menu.remove();
        menu.appendChild(closeBtn);
        
        document.getElementById('event-editor-container').appendChild(menu);
        
        // Supprimer le menu après 5 secondes
        setTimeout(() => {
            if (menu.parentNode) {
                menu.remove();
            }
        }, 5000);
    }
    
    /**
     * Configurer l'interface utilisateur des événements
     */
    setupEventUI() {
        // Ajouter un bouton pour ouvrir l'éditeur d'événements
        const topBar = document.getElementById('top-bar');
        if (topBar) {
            const eventBtn = document.createElement('button');
            eventBtn.id = 'eventEditorBtn';
            eventBtn.textContent = 'Éditeur d\'Événements';
            eventBtn.onclick = () => this.toggleVisibility();
            
            topBar.appendChild(document.createElement('div')).className = 'separator';
            topBar.appendChild(eventBtn);
        }
    }
    
    /**
     * Afficher/Cacher l'éditeur d'événements
     */
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        const container = document.getElementById('event-editor-container');
        if (container) {
            container.style.display = this.isVisible ? 'block' : 'none';
        }
        
        if (this.isVisible) {
            this.redrawCanvas();
        }
    }
    
    /**
     * Redessiner le canvas
     */
    redrawCanvas() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        
        this.connections.forEach(connection => {
            this.drawConnection(connection);
        });
        
        this.nodes.forEach(node => {
            this.drawNode(node);
        });
    }
    
    /**
     * Dessiner la grille de fond
     */
    drawGrid() {
        const gridSize = 20;
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * Dessiner un node
     */
    drawNode(node) {
        const nodeType = this.nodeTypes[node.type];
        const x = node.position.x;
        const y = node.position.y;
        const width = 120;
        const height = 60;
        
        // Corps du node
        this.ctx.fillStyle = nodeType.color;
        this.ctx.fillRect(x, y, width, height);
        
        // Bordure
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Titre
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.type, x + width/2, y + 20);
        
        // ID du node
        this.ctx.font = '10px Arial';
        this.ctx.fillText(node.id, x + width/2, y + 35);
        
        // Ports d'entrée et de sortie
        for (let i = 0; i < nodeType.inputs; i++) {
            this.drawPort(x - 5, y + 15 + i * 15, 'input', node.connections.inputs[i] !== null);
        }
        
        for (let i = 0; i < nodeType.outputs; i++) {
            this.drawPort(x + width, y + 15 + i * 15, 'output', node.connections.outputs[i].length > 0);
        }
    }
    
    /**
     * Dessiner un port
     */
    drawPort(x, y, type, connected) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fillStyle = connected ? '#00ff00' : '#666';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    /**
     * Dessiner une connexion
     */
    drawConnection(connection) {
        const fromNode = this.nodes.get(connection.from.nodeId);
        const toNode = this.nodes.get(connection.to.nodeId);
        
        if (!fromNode || !toNode) return;
        
        const fromX = fromNode.position.x + 120;
        const fromY = fromNode.position.y + 15 + connection.from.port * 15;
        const toX = toNode.position.x - 5;
        const toY = toNode.position.y + 15 + connection.to.port * 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.bezierCurveTo(fromX + 50, fromY, toX - 50, toY, toX, toY);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    /**
     * Obtenir le node à une position donnée
     */
    getNodeAtPosition(x, y) {
        for (const node of this.nodes.values()) {
            if (x >= node.position.x && x <= node.position.x + 120 &&
                y >= node.position.y && y <= node.position.y + 60) {
                return node;
            }
        }
        return null;
    }
    
    /**
     * Obtenir le port de sortie à une position donnée
     */
    getOutputPortAtPosition(node, x, y) {
        const nodeType = this.nodeTypes[node.type];
        const nodeX = node.position.x + 120;
        
        for (let i = 0; i < nodeType.outputs; i++) {
            const portY = node.position.y + 15 + i * 15;
            if (Math.abs(x - nodeX) < 10 && Math.abs(y - portY) < 10) {
                return i;
            }
        }
        return -1;
    }
    
    /**
     * Obtenir le port d'entrée à une position donnée
     */
    getInputPortAtPosition(node, x, y) {
        const nodeType = this.nodeTypes[node.type];
        const nodeX = node.position.x - 5;
        
        for (let i = 0; i < nodeType.inputs; i++) {
            const portY = node.position.y + 15 + i * 15;
            if (Math.abs(x - nodeX) < 10 && Math.abs(y - portY) < 10) {
                return i;
            }
        }
        return -1;
    }
    
    /**
     * Sauvegarder les données d'événements
     */
    saveEventData() {
        const eventData = {
            nodes: Array.from(this.nodes.entries()),
            connections: this.connections,
            variables: Array.from(this.eventData.variables.entries()),
            flags: Array.from(this.eventData.flags.entries())
        };
        
        localStorage.setItem('pokemonMapEvents', JSON.stringify(eventData));
        console.log('Données d\'événements sauvegardées');
    }
    
    /**
     * Charger les données d'événements
     */
    loadEventData() {
        try {
            const stored = localStorage.getItem('pokemonMapEvents');
            if (stored) {
                const eventData = JSON.parse(stored);
                
                this.nodes.clear();
                eventData.nodes?.forEach(([id, node]) => {
                    this.nodes.set(id, node);
                });
                
                this.connections = eventData.connections || [];
                
                this.eventData.variables.clear();
                (eventData.variables || []).forEach(([name, value]) => {
                    this.eventData.variables.set(name, value);
                });
                
                this.eventData.flags.clear();
                (eventData.flags || []).forEach(([name, value]) => {
                    this.eventData.flags.set(name, value);
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des événements:', error);
        }
    }
    
    /**
     * Nettoyer les ressources
     */
    dispose() {
        this.triggerZones.forEach(trigger => {
            trigger.dispose();
        });
        this.triggerZones.clear();
        
        const container = document.getElementById('event-editor-container');
        if (container) {
            container.remove();
        }
    }
}

// Export pour utilisation dans d'autres modules
window.EventEditor = EventEditor;