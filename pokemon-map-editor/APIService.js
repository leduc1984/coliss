class APIService {
    constructor() {
        // Base URL for API requests
        this.baseURL = '/api';
    }

    /**
     * Fetch data from the API
     * @param {string} endpoint - The API endpoint to fetch data from
     * @returns {Promise} Promise that resolves with the parsed JSON data
     */
    async fetchData(endpoint) {
        try {
            // Construct the full URL
            const url = `${this.baseURL}${endpoint}`;
            
            // Make the fetch request
            const response = await fetch(url);
            
            // Check if the response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Parse and return the JSON data
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Service Error:', error);
            throw error;
        }
    }

    /**
     * Fetch map objects from the editor API
     * @returns {Promise} Promise that resolves with the map objects data
     */
    async fetchMapObjects() {
        try {
            const data = await this.fetchData('/editor/map-objects');
            return data;
        } catch (error) {
            console.error('Error fetching map objects:', error);
            throw error;
        }
    }

    /**
     * Fetch Pokemon data from the API
     * @returns {Promise} Promise that resolves with the Pokemon data
     */
    async fetchPokemonData() {
        try {
            const data = await this.fetchData('/pokemon');
            return data;
        } catch (error) {
            console.error('Error fetching Pokemon data:', error);
            throw error;
        }
    }

    /**
     * Fetch Pokemon species data from the API
     * @returns {Promise} Promise that resolves with the Pokemon species data
     */
    async fetchPokemonSpecies() {
        try {
            const data = await this.fetchData('/pokemon_species');
            return data;
        } catch (error) {
            console.error('Error fetching Pokemon species data:', error);
            throw error;
        }
    }
}

// Export the APIService class
window.APIService = APIService;