(function() {
    'use strict';

    /**
     * Handles all UI elements and user interactions for the battle system.
     */
    class BattleInterface {
        constructor(gameManager) {
            this.gameManager = gameManager;
            this.socket = gameManager.socket;
            this.currentBattle = null;
            this.isActive = false;
            this.currentPhase = 'waiting'; // waiting, selection, animation

            this.dom = {}; // To cache DOM elements
            this.animationManager = new window.BattleAnimationManager(this);

            this.initialize();
        }

        /**
         * Creates the battle UI structure and caches DOM elements.
         */
        initialize() {
            const container = document.createElement('div');
            container.id = 'battle-interface';
            container.className = 'battle-interface hidden';
            container.innerHTML = this.getBattleHTML();
            document.body.appendChild(container);

            this.dom = {
                container,
                actionMenu: container.querySelector('#action-menu'),
                movesMenu: container.querySelector('#moves-menu'),
                pokemonMenu: container.querySelector('#pokemon-menu'),
                battleText: container.querySelector('#battle-text'),
            };

            this.setupEventListeners();
            console.log('⚔️ Battle Interface initialized');
        }

        /**
         * Returns the HTML structure for the battle interface.
         */
        getBattleHTML() {
            // This structure can be loaded from a template in a more advanced setup
            return `
                <div class="battle-field">
                    <div class="opponent-side">
                        <!-- Opponent Pokemon display -->
                    </div>
                    <div class="player-side">
                        <!-- Player Pokemon display -->
                    </div>
                    <div class="battle-effects" id="battle-effects"></div>
                </div>
                <div class="battle-controls">
                    <div class="action-menu" id="action-menu">
                        <button data-action="attack">Attack</button>
                        <button data-action="pokemon">Pokémon</button>
                        <button data-action="bag">Bag</button>
                        <button data-action="run">Run</button>
                    </div>
                    <div class="moves-menu hidden" id="moves-menu"></div>
                    <div class="pokemon-menu hidden" id="pokemon-menu"></div>
                    <div class="battle-text-box">
                        <p id="battle-text"></p>
                    </div>
                </div>
            `;
        }

        /**
         * Sets up event listeners for all interactive UI elements.
         */
        setupEventListeners() {
            this.dom.actionMenu.addEventListener('click', e => {
                if (e.target.dataset.action) {
                    this.handleActionClick(e.target.dataset.action);
                }
            });
            // Add listeners for moves, pokemon, etc.
        }

        /**
         * Starts a battle, setting up the UI with the provided data.
         * @param {object} battleData - The initial data for the battle.
         */
        async startBattle(battleData) {
            this.currentBattle = battleData;
            this.isActive = true;
            this.dom.container.classList.remove('hidden');
            
            // Setup initial UI state based on battleData
            this.updatePokemonDisplay('player', battleData.playerTeam[0]);
            this.updatePokemonDisplay('opponent', battleData.opponentTeam[0]);
            this.updateMovesMenu(battleData.playerTeam[0].moves);
            
            this.animationManager.queueAnimation('pokemon_entry', { side: 'opponent', pokemonElement: this.getPokemonElement('opponent') });
            this.animationManager.queueAnimation('pokemon_entry', { side: 'player', pokemonElement: this.getPokemonElement('player') });
            
            this.setBattleText(`A wild ${battleData.opponentTeam[0].name} appeared!`);
            this.setPhase('selection');
        }

        endBattle() {
            this.isActive = false;
            this.dom.container.classList.add('hidden');
            this.gameManager.onBattleEnd(); // Notify game manager
        }

        handleActionClick(action) {
            if (this.currentPhase !== 'selection') return;

            switch (action) {
                case 'attack': this.showMovesMenu(); break;
                // Handle other actions
            }
        }

        showMovesMenu() {
            this.dom.actionMenu.classList.add('hidden');
            this.dom.movesMenu.classList.remove('hidden');
        }

        updatePokemonDisplay(side, pokemonData) {
            // Logic to update a Pokemon's UI (name, HP, sprite)
        }

        updateMovesMenu(moves) {
            // Logic to populate the moves menu
        }

        setBattleText(text) {
            this.dom.battleText.textContent = text;
        }

        setPhase(phase) {
            this.currentPhase = phase;
            // Can be used to enable/disable controls
        }

        getPokemonElement(side) {
            // Helper to get the pokemon element for animations
            return this.dom.container.querySelector(`.${side}-side .pokemon-container`);
        }
    }

    window.BattleInterface = BattleInterface;

})();