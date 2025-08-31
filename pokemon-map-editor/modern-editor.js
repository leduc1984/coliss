/**
 * Modern Map Editor Component
 * Implements resizable panels and modern UI for the map editor
 */
class ModernMapEditor {
    /**
     * Creates a new ModernMapEditor instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = {
            containerId: 'modern-editor-container',
            leftPanelWidth: 240,
            rightPanelWidth: 240,
            minWidth: 150,
            ...options
        };
        
        this.container = document.getElementById(this.options.containerId);
        this.isResizing = null;
        this.isFullscreen = false;
        this.draggable = null;
        
        this.init();
    }
    
    /**
     * Initialize the modern map editor
     */
    init() {
        if (!this.container) {
            console.error('ModernMapEditor: Container not found');
            return;
        }
        
        // Initialize draggable
        this.initDraggable();
        
        // Initialize resizable panels
        this.initResizablePanels();
        
        // Initialize event listeners
        this.initEventListeners();
        
        console.log('ModernMapEditor initialized');
    }
    
    /**
     * Initialize draggable functionality
     */
    initDraggable() {
        const header = this.container.querySelector('.editor-header');
        if (header) {
            header.setAttribute('data-drag-handle', 'true');
            
            // Initialize draggable
            if (typeof Draggable !== 'undefined') {
                this.draggable = new Draggable(this.container, {
                    handle: header
                });
            }
        }
    }
    
    /**
     * Initialize resizable panels
     */
    initResizablePanels() {
        const dividers = this.container.querySelectorAll('.editor-divider');
        dividers.forEach((divider, index) => {
            divider.addEventListener('mousedown', (e) => {
                this.startResizing(e, index);
            });
        });
        
        // Add global mouse events
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        document.addEventListener('mouseup', () => {
            this.stopResizing();
        });
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Fullscreen button
        const fullscreenBtn = document.getElementById('modern-fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Close button
        const closeBtn = document.getElementById('modern-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
    }
    
    /**
     * Start resizing panels
     * @param {MouseEvent} e - Mouse event
     * @param {number} index - Divider index
     */
    startResizing(e, index) {
        this.isResizing = {
            index: index,
            startX: e.clientX,
            startY: e.clientY
        };
        
        // Prevent text selection while resizing
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    }
    
    /**
     * Handle mouse move during resizing
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        if (!this.isResizing) return;
        
        const deltaX = e.clientX - this.isResizing.startX;
        
        // Get panels
        const leftPanel = this.container.querySelector('.editor-panel.left');
        const centerPanel = this.container.querySelector('.editor-panel.center');
        const rightPanel = this.container.querySelector('.editor-panel.right');
        
        if (this.isResizing.index === 0) {
            // Resize left panel
            const newWidth = leftPanel.offsetWidth + deltaX;
            if (newWidth >= this.options.minWidth) {
                leftPanel.style.width = `${newWidth}px`;
                this.isResizing.startX = e.clientX;
            }
        } else if (this.isResizing.index === 1) {
            // Resize right panel
            const newWidth = rightPanel.offsetWidth - deltaX;
            if (newWidth >= this.options.minWidth) {
                rightPanel.style.width = `${newWidth}px`;
                this.isResizing.startX = e.clientX;
            }
        }
    }
    
    /**
     * Stop resizing panels
     */
    stopResizing() {
        if (!this.isResizing) return;
        
        this.isResizing = null;
        
        // Restore text selection
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        
        if (this.isFullscreen) {
            this.container.classList.add('editor-fullscreen');
        } else {
            this.container.classList.remove('editor-fullscreen');
        }
    }
    
    /**
     * Close the editor
     */
    close() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    /**
     * Show the editor
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }
}

// Initialize modern map editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're in the map editor
    if (document.getElementById('modern-editor-container')) {
        window.modernMapEditor = new ModernMapEditor();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernMapEditor;
}