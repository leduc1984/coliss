/**
 * Draggable Component
 * Makes DOM elements draggable with handle-based dragging mechanism
 * Converted from React component to vanilla JavaScript
 */
class Draggable {
    /**
     * Creates a new Draggable instance
     * @param {HTMLElement} element - The element to make draggable
     * @param {Object} options - Configuration options
     */
    constructor(element, options = {}) {
        this.element = element;
        this.initialPosition = options.initialPosition || { x: 0, y: 0 };
        this.handle = element.querySelector('[data-drag-handle="true"]') || element;
        
        this.position = { ...this.initialPosition };
        this.isDragging = false;
        this.offset = { x: 0, y: 0 };
        
        this.init();
    }
    
    /**
     * Initialize the draggable component
     */
    init() {
        // Set initial position
        this.element.style.position = 'absolute';
        this.element.style.left = `${this.initialPosition.x}px`;
        this.element.style.top = `${this.initialPosition.y}px`;
        this.element.style.touchAction = 'none';
        
        // Add event listeners
        this.handle.addEventListener('mousedown', this.onMouseDown.bind(this));
    }
    
    /**
     * Handle mouse down event on the handle
     * @param {MouseEvent} e - The mouse event
     */
    onMouseDown(e) {
        // Only start dragging if clicked on the handle
        if (e.target.closest('[data-drag-handle="true"]') || e.target === this.handle) {
            this.isDragging = true;
            
            // Calculate offset
            const rect = this.element.getBoundingClientRect();
            this.offset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            // Disable text selection while dragging
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        }
    }
    
    /**
     * Handle mouse move event (global listener)
     * @param {MouseEvent} e - The mouse event
     */
    onMouseMove(e) {
        if (!this.isDragging) return;
        
        // Calculate new position
        const newX = e.clientX - this.offset.x;
        const newY = e.clientY - this.offset.y;
        
        // Update position
        this.position = { x: newX, y: newY };
        
        // Apply new position
        this.element.style.left = `${newX}px`;
        this.element.style.top = `${newY}px`;
    }
    
    /**
     * Handle mouse up event (global listener)
     * @param {MouseEvent} e - The mouse event
     */
    onMouseUp() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Re-enable text selection
        document.body.style.userSelect = '';
    }
    
    /**
     * Set the position of the draggable element
     * @param {Object} position - The new position {x, y}
     */
    setPosition(position) {
        this.position = { ...position };
        this.element.style.left = `${position.x}px`;
        this.element.style.top = `${position.y}px`;
    }
    
    /**
     * Get the current position of the draggable element
     * @returns {Object} The current position {x, y}
     */
    getPosition() {
        return { ...this.position };
    }
    
    /**
     * Destroy the draggable component
     */
    destroy() {
        this.handle.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Re-enable text selection
        document.body.style.userSelect = '';
    }
}

// Global mouse move and mouse up handlers
document.addEventListener('mousemove', (e) => {
    // Find all draggable elements and call their mouse move handlers
    const draggables = document.querySelectorAll('[data-draggable-initialized="true"]');
    draggables.forEach(el => {
        if (el._draggableInstance) {
            el._draggableInstance.onMouseMove(e);
        }
    });
});

document.addEventListener('mouseup', (e) => {
    // Find all draggable elements and call their mouse up handlers
    const draggables = document.querySelectorAll('[data-draggable-initialized="true"]');
    draggables.forEach(el => {
        if (el._draggableInstance) {
            el._draggableInstance.onMouseUp(e);
        }
    });
});

// Factory function to create a draggable element
function makeDraggable(element, options = {}) {
    // Check if already initialized
    if (element._draggableInstance) {
        return element._draggableInstance;
    }
    
    // Create new draggable instance
    const draggable = new Draggable(element, options);
    
    // Store reference to instance
    element._draggableInstance = draggable;
    element.setAttribute('data-draggable-initialized', 'true');
    
    return draggable;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Draggable, makeDraggable };
}

// Also expose globally
window.Draggable = Draggable;
window.makeDraggable = makeDraggable;