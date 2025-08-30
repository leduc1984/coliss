class UIComponent {
    constructor(type, id, properties = {}) {
        this.type = type;
        this.id = id || this.generateId();
        this.properties = {
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            ...properties
        };
        this.children = [];
        this.parent = null;
        this.dataSource = null; // For data binding
        this.dataBinding = {}; // Map of property to data field
    }

    generateId() {
        return 'component_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }

    setProperty(key, value) {
        this.properties[key] = value;
    }

    getProperty(key) {
        return this.properties[key];
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
    }

    // Set data source for binding
    setDataSource(dataSource) {
        this.dataSource = dataSource;
    }

    // Bind a property to a data field
    bindProperty(property, dataField) {
        this.dataBinding[property] = dataField;
    }

    // Update component based on data source
    updateFromDataSource() {
        if (this.dataSource && this.dataBinding) {
            for (const [property, dataField] of Object.entries(this.dataBinding)) {
                if (this.dataSource[dataField] !== undefined) {
                    this.setProperty(property, this.dataSource[dataField]);
                }
            }
        }
    }

    render() {
        // This method should be overridden by subclasses
        return `<div id="${this.id}" class="ui-component ${this.type}" style="
            position: absolute;
            left: ${this.properties.x}px;
            top: ${this.properties.y}px;
            width: ${this.properties.width}px;
            height: ${this.properties.height}px;
        "></div>`;
    }
}

class Panel extends UIComponent {
    constructor(id, properties = {}) {
        super('panel', id, properties);
        this.properties = {
            backgroundColor: '#333',
            borderColor: '#555',
            borderWidth: '1px',
            borderStyle: 'solid',
            ...this.properties,
            ...properties
        };
    }

    render() {
        return `<div id="${this.id}" class="ui-component panel" style="
            position: absolute;
            left: ${this.properties.x}px;
            top: ${this.properties.y}px;
            width: ${this.properties.width}px;
            height: ${this.properties.height}px;
            background-color: ${this.properties.backgroundColor};
            border: ${this.properties.borderWidth} ${this.properties.borderStyle} ${this.properties.borderColor};
        ">
            ${this.children.map(child => child.render()).join('')}
        </div>`;
    }
}

class Label extends UIComponent {
    constructor(id, properties = {}) {
        super('label', id, properties);
        this.properties = {
            text: 'Label',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'Arial',
            ...this.properties,
            ...properties
        };
    }

    render() {
        return `<div id="${this.id}" class="ui-component label" style="
            position: absolute;
            left: ${this.properties.x}px;
            top: ${this.properties.y}px;
            width: ${this.properties.width}px;
            height: ${this.properties.height}px;
            color: ${this.properties.color};
            font-size: ${this.properties.fontSize};
            font-family: ${this.properties.fontFamily};
        ">${this.properties.text}</div>`;
    }
}

class Image extends UIComponent {
    constructor(id, properties = {}) {
        super('image', id, properties);
        this.properties = {
            src: '',
            alt: '',
            ...this.properties,
            ...properties
        };
    }

    render() {
        return `<img id="${this.id}" class="ui-component image" src="${this.properties.src}" alt="${this.properties.alt}" style="
            position: absolute;
            left: ${this.properties.x}px;
            top: ${this.properties.y}px;
            width: ${this.properties.width}px;
            height: ${this.properties.height}px;
        ">`;
    }
}

class List extends UIComponent {
    constructor(id, properties = {}) {
        super('list', id, properties);
        this.properties = {
            items: [],
            dataSourceEndpoint: '', // API endpoint for data
            dataField: 'name', // Field to display in list
            backgroundColor: '#222',
            color: '#fff',
            ...this.properties,
            ...properties
        };
    }

    render() {
        // If we have a data source endpoint, we would fetch data here
        // For now, we'll just render the items
        const itemsHtml = this.properties.items.map(item => `<li>${item}</li>`).join('');
        return `<div id="${this.id}" class="ui-component list" style="
            position: absolute;
            left: ${this.properties.x}px;
            top: ${this.properties.y}px;
            width: ${this.properties.width}px;
            height: ${this.properties.height}px;
            background-color: ${this.properties.backgroundColor};
            color: ${this.properties.color};
        ">
            <ul>${itemsHtml}</ul>
        </div>`;
    }

    // Method to populate list from API
    async populateFromAPI(apiService) {
        if (this.properties.dataSourceEndpoint) {
            try {
                const data = await apiService.fetchData(this.properties.dataSourceEndpoint);
                if (Array.isArray(data)) {
                    this.properties.items = data.map(item => item[this.properties.dataField] || item.toString());
                }
            } catch (error) {
                console.error('Error populating list from API:', error);
            }
        }
    }
}

class Grid extends UIComponent {
    constructor(id, properties = {}) {
        super('grid', id, properties);
        this.properties = {
            rows: 3,
            columns: 3,
            cellWidth: 50,
            cellHeight: 50,
            backgroundColor: '#222',
            cellColor: '#333',
            dataSourceEndpoint: '', // API endpoint for data
            dataField: 'name', // Field to display in grid cells
            ...this.properties,
            ...properties
        };
    }

    render() {
        let gridHtml = '';
        for (let row = 0; row < this.properties.rows; row++) {
            for (let col = 0; col < this.properties.columns; col++) {
                gridHtml += `<div class="grid-cell" style="
                    position: absolute;
                    left: ${col * this.properties.cellWidth}px;
                    top: ${row * this.properties.cellHeight}px;
                    width: ${this.properties.cellWidth}px;
                    height: ${this.properties.cellHeight}px;
                    background-color: ${this.properties.cellColor};
                    border: 1px solid #555;
                "></div>`;
            }
        }

        return `<div id="${this.id}" class="ui-component grid" style="
            position: absolute;
            left: ${this.properties.x}px;
            top: ${this.properties.y}px;
            width: ${this.properties.width}px;
            height: ${this.properties.height}px;
            background-color: ${this.properties.backgroundColor};
        ">
            ${gridHtml}
        </div>`;
    }

    // Method to populate grid from API
    async populateFromAPI(apiService) {
        if (this.properties.dataSourceEndpoint) {
            try {
                const data = await apiService.fetchData(this.properties.dataSourceEndpoint);
                if (Array.isArray(data)) {
                    // Update grid properties based on data
                    this.properties.rows = Math.ceil(data.length / this.properties.columns);
                    // In a real implementation, we would update the grid cells with data
                }
            } catch (error) {
                console.error('Error populating grid from API:', error);
            }
        }
    }
}

class UIComponentSystem {
    constructor() {
        this.components = [];
        this.selectedComponent = null;
        this.apiService = new APIService(); // Instance of APIService for data binding
    }

    addComponent(component) {
        this.components.push(component);
    }

    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index !== -1) {
            this.components.splice(index, 1);
        }
    }

    getComponentById(id) {
        return this.components.find(component => component.id === id);
    }

    renderAll() {
        return this.components.map(component => component.render()).join('');
    }

    // Update all components from their data sources
    async updateAllFromDataSources() {
        for (const component of this.components) {
            if (component.dataSource) {
                component.updateFromDataSource();
            }
            
            // If component has a data source endpoint, populate from API
            if (component.properties && component.properties.dataSourceEndpoint) {
                if (component.populateFromAPI) {
                    await component.populateFromAPI(this.apiService);
                }
            }
        }
    }

    // Serialize the current UI layout to JSON
    serializeToJSON() {
        const serializedComponents = this.components.map(component => ({
            type: component.constructor.name,
            id: component.id,
            properties: component.properties,
            children: component.children.map(child => ({
                type: child.constructor.name,
                id: child.id,
                properties: child.properties
            }))
        }));

        return JSON.stringify({
            components: serializedComponents,
            createdAt: new Date().toISOString()
        }, null, 2);
    }

    // Export the current UI layout as a JSON file
    exportToJSON() {
        const json = this.serializeToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ui-layout-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // Import UI layout from JSON
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Clear existing components
            this.components = [];
            
            // Recreate components from JSON data
            if (data.components && Array.isArray(data.components)) {
                for (const compData of data.components) {
                    let component;
                    
                    // Create component based on type
                    switch (compData.type) {
                        case 'Panel':
                            component = new Panel(compData.id, compData.properties);
                            break;
                        case 'Label':
                            component = new Label(compData.id, compData.properties);
                            break;
                        case 'Image':
                            component = new Image(compData.id, compData.properties);
                            break;
                        case 'List':
                            component = new List(compData.id, compData.properties);
                            break;
                        case 'Grid':
                            component = new Grid(compData.id, compData.properties);
                            break;
                        default:
                            console.warn(`Unknown component type: ${compData.type}`);
                            continue;
                    }
                    
                    // Add children if any
                    if (compData.children && Array.isArray(compData.children)) {
                        for (const childData of compData.children) {
                            let child;
                            
                            switch (childData.type) {
                                case 'Panel':
                                    child = new Panel(childData.id, childData.properties);
                                    break;
                                case 'Label':
                                    child = new Label(childData.id, childData.properties);
                                    break;
                                case 'Image':
                                    child = new Image(childData.id, childData.properties);
                                    break;
                                case 'List':
                                    child = new List(childData.id, childData.properties);
                                    break;
                                case 'Grid':
                                    child = new Grid(childData.id, childData.properties);
                                    break;
                                default:
                                    console.warn(`Unknown child component type: ${childData.type}`);
                                    continue;
                            }
                            
                            component.addChild(child);
                        }
                    }
                    
                    this.addComponent(component);
                }
            }
            
            console.log('UI layout imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing UI layout from JSON:', error);
            return false;
        }
    }

    // Load UI layout from a JSON file
    async loadFromFile(file) {
        try {
            const text = await file.text();
            return this.importFromJSON(text);
        } catch (error) {
            console.error('Error loading UI layout from file:', error);
            return false;
        }
    }

    // Drag and drop functionality
    enableDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('ui-component')) {
                e.dataTransfer.setData('text/plain', e.target.id);
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const component = this.getComponentById(id);
            
            if (component) {
                component.setProperty('x', e.clientX);
                component.setProperty('y', e.clientY);
                
                // Re-render the component
                const element = document.getElementById(id);
                if (element) {
                    element.style.left = e.clientX + 'px';
                    element.style.top = e.clientY + 'px';
                }
            }
        });
    }
}

// Make classes available globally
window.UIComponent = UIComponent;
window.Panel = Panel;
window.Label = Label;
window.Image = Image;
window.List = List;
window.Grid = Grid;
window.UIComponentSystem = UIComponentSystem;