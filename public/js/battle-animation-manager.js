(function() {
    'use strict';

    // It is recommended to move these styles to a dedicated CSS file for better separation of concerns.
    const BATTLE_ANIMATION_STYLES = `
        /* Add Battle Animation CSS here */
    `;

    /**
     * Manages all visual effects and animations for the battle system.
     */
    class BattleAnimationManager {
        constructor(battleInterface) {
            if (!battleInterface) {
                throw new Error("BattleAnimationManager requires a BattleInterface instance.");
            }
            this.battleInterface = battleInterface;
            this.animationQueue = [];
            this.isAnimating = false;

            this.dom = {
                effectsContainer: document.getElementById('battle-effects')
            };

            this.initialize();
        }

        initialize() {
            if (!this.dom.effectsContainer) {
                console.error('❌ Battle effects container not found! Animations will not play.');
                return;
            }
            this.injectStyles();
            this.createEffectLayers();
            console.log('🎬 Battle Animation Manager initialized');
        }

        injectStyles() {
            if (!document.getElementById('battle-animation-styles')) {
                const styleSheet = document.createElement("style");
                styleSheet.id = 'battle-animation-styles';
                styleSheet.type = "text/css";
                styleSheet.innerText = BATTLE_ANIMATION_STYLES;
                document.head.appendChild(styleSheet);
            }
        }

        createEffectLayers() {
            this.dom.effectsContainer.innerHTML = ''; // Clear previous layers
            const layers = ['background', 'particles', 'foreground', 'ui'];
            layers.forEach((layerName, index) => {
                const layer = document.createElement('div');
                layer.id = `effects-${layerName}`;
                layer.className = `effects-layer`;
                layer.style.zIndex = index + 1;
                this.dom.effectsContainer.appendChild(layer);
            });
        }

        queueAnimation(type, data) {
            this.animationQueue.push({ type, data });
            if (!this.isAnimating) {
                this.processNextAnimation();
            }
        }

        async processNextAnimation() {
            if (this.animationQueue.length === 0) {
                this.isAnimating = false;
                return;
            }
            this.isAnimating = true;
            const animation = this.animationQueue.shift();
            
            try {
                await this.playAnimation(animation);
            } catch (error) {
                console.error('❌ Animation error:', error);
            }
            
            setTimeout(() => this.processNextAnimation(), 100);
        }

        playAnimation({ type, data }) {
            switch (type) {
                case 'pokemon_entry': return this.animatePokemonEntry(data);
                case 'pokemon_exit': return this.animatePokemonExit(data);
                case 'move_attack': return this.animateMoveAttack(data);
                case 'damage': return this.animateDamage(data);
                // Add other animation cases here
                default:
                    console.warn(`⚠️ Unknown animation type: ${type}`);
                    return Promise.resolve();
            }
        }

        animatePokemonEntry({ side, pokemonElement }) {
            return this.animate(pokemonElement, [
                { transform: `translateX(${side === 'player' ? -100 : 100}px) scale(0.5)`, opacity: 0 },
                { transform: 'translateX(0) scale(1)', opacity: 1 }
            ], { duration: 800, easing: 'ease-out' });
        }

        animatePokemonExit({ pokemonElement }) {
            return this.animate(pokemonElement, [
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(0)', opacity: 0 }
            ], { duration: 600, easing: 'ease-in' });
        }

        async animateMoveAttack({ attacker, target }) {
            const originalTransform = attacker.style.transform;
            await this.animate(attacker, [
                { transform: `${originalTransform} translateX(${attacker.dataset.side === 'player' ? -30 : 30}px)` },
                { transform: `${originalTransform} translateX(${attacker.dataset.side === 'player' ? 100 : -100}px) scale(1.1)` }
            ], { duration: 300, easing: 'ease-in' });
            
            await this.shakeElement(target, 200);

            await this.animate(attacker, [
                { transform: attacker.style.transform },
                { transform: originalTransform }
            ], { duration: 400, easing: 'ease-out' });
        }

        async animateDamage({ target, damage, effectiveness, oldHp, newHp, maxHp }) {
            this.showDamageNumber(target, damage, effectiveness);
            const healthBar = target.closest('.pokemon-container').querySelector('.health-fill');
            if (healthBar) {
                this.animateHealthBar(healthBar, oldHp, newHp, maxHp);
            }
            await this.shakeElement(target, 400);
        }
        
        animateHealthBar(healthBar, fromHp, toHp, maxHp) {
            const fromPercent = (fromHp / maxHp) * 100;
            const toPercent = (toHp / maxHp) * 100;
            return this.animate(healthBar, [
                { width: `${fromPercent}%` },
                { width: `${toPercent}%` }
            ], { duration: 800, easing: 'ease-in-out' });
        }

        showDamageNumber(target, damage, effectiveness) {
            const damageText = document.createElement('div');
            damageText.className = 'damage-number';
            damageText.textContent = `-${damage}`;
            if (effectiveness > 1) damageText.classList.add('super-effective');
            if (effectiveness < 1) damageText.classList.add('not-effective');
            
            target.appendChild(damageText);
            this.animate(damageText, [
                { transform: 'translateY(0)', opacity: 1 },
                { transform: 'translateY(-40px)', opacity: 0 }
            ], { duration: 1000, easing: 'ease-out' }).then(() => damageText.remove());
        }

        shakeElement(element, duration) {
            return this.animate(element, [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(0)' }
            ], { duration, easing: 'linear' });
        }
        
        /**
         * A wrapper for the Web Animations API for easier use.
         * @param {HTMLElement} element - The element to animate.
         * @param {Array<object>} keyframes - The keyframes for the animation.
         * @param {object} options - The animation options.
         * @returns {Promise} A promise that resolves when the animation finishes.
         */
        animate(element, keyframes, options) {
            return new Promise(resolve => {
                if (element && typeof element.animate === 'function') {
                    const animation = element.animate(keyframes, options);
                    animation.onfinish = resolve;
                } else {
                    resolve();
                }
            });
        }
    }

    window.BattleAnimationManager = BattleAnimationManager;

})();