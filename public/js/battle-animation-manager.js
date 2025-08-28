/**
 * Gestionnaire d'animations pour le système de bataille Pokémon MMO
 * Gère tous les effets visuels, animations de mouvement et transitions
 */
class BattleAnimationManager {
    constructor(battleInterface) {
        this.battleInterface = battleInterface;
        this.animationQueue = [];
        this.isAnimating = false;
        this.currentAnimation = null;
        
        // Configuration des animations
        this.config = {
            // Durées par défaut (en millisecondes)
            durations: {
                pokemonEntry: 800,
                pokemonExit: 600,
                moveAnimation: 1200,
                damageAnimation: 600,
                healthBarUpdate: 800,
                statusEffect: 500,
                textDisplay: 2000,
                switchPokemon: 1000
            },
            
            // Types d'animations
            types: {
                POKEMON_ENTRY: 'pokemon_entry',
                POKEMON_EXIT: 'pokemon_exit',
                MOVE_ATTACK: 'move_attack',
                MOVE_SPECIAL: 'move_special',
                MOVE_STATUS: 'move_status',
                DAMAGE: 'damage',
                HEALING: 'healing',
                STATUS_EFFECT: 'status_effect',
                STAT_CHANGE: 'stat_change',
                SWITCH: 'switch',
                FAINT: 'faint',
                TEXT: 'text'
            },
            
            // Effets visuels
            effects: {
                shake: { intensity: 5, duration: 200 },
                flash: { duration: 100, color: '#ffffff' },
                fade: { duration: 300 },
                bounce: { height: 20, duration: 400 }
            }
        };
        
        // Éléments DOM pour les effets
        this.effectsContainer = null;
        this.initialize();
    }

    /**
     * Initialise le gestionnaire d'animations
     */
    initialize() {
        this.effectsContainer = document.getElementById('battle-effects');
        if (!this.effectsContainer) {
            console.error('❌ Container d\'effets de bataille introuvable');
        }
        
        // Créer les couches d'effets
        this.createEffectLayers();
        
        console.log('🎬 Battle Animation Manager initialisé');
    }

    /**
     * Crée les couches d'effets visuels
     */
    createEffectLayers() {
        const layers = ['background', 'particles', 'foreground', 'ui'];
        
        layers.forEach(layerName => {
            const layer = document.createElement('div');
            layer.id = `effects-${layerName}`;
            layer.className = `effects-layer ${layerName}-layer`;
            layer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: ${this.getLayerZIndex(layerName)};
            `;
            this.effectsContainer.appendChild(layer);
        });
    }

    /**
     * Obtient l'index Z pour une couche
     */
    getLayerZIndex(layerName) {
        const indices = {
            background: 1,
            particles: 2,
            foreground: 3,
            ui: 4
        };
        return indices[layerName] || 1;
    }

    /**
     * Ajoute une animation à la queue
     */
    queueAnimation(animationData) {
        this.animationQueue.push(animationData);
        
        if (!this.isAnimating) {
            this.processNextAnimation();
        }
    }

    /**
     * Traite la prochaine animation dans la queue
     */
    async processNextAnimation() {
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            return;
        }
        
        this.isAnimating = true;
        const animation = this.animationQueue.shift();
        this.currentAnimation = animation;
        
        try {
            await this.playAnimation(animation);
        } catch (error) {
            console.error('❌ Erreur lors de l\'animation :', error);
        }
        
        this.currentAnimation = null;
        
        // Petite pause entre les animations
        setTimeout(() => {
            this.processNextAnimation();
        }, 100);
    }

    /**
     * Joue une animation spécifique
     */
    async playAnimation(animationData) {
        const { type, data } = animationData;
        
        switch (type) {
            case this.config.types.POKEMON_ENTRY:
                return this.animatePokemonEntry(data);
            case this.config.types.POKEMON_EXIT:
                return this.animatePokemonExit(data);
            case this.config.types.MOVE_ATTACK:
                return this.animateMoveAttack(data);
            case this.config.types.MOVE_SPECIAL:
                return this.animateMoveSpecial(data);
            case this.config.types.MOVE_STATUS:
                return this.animateMoveStatus(data);
            case this.config.types.DAMAGE:
                return this.animateDamage(data);
            case this.config.types.HEALING:
                return this.animateHealing(data);
            case this.config.types.STATUS_EFFECT:
                return this.animateStatusEffect(data);
            case this.config.types.SWITCH:
                return this.animatePokemonSwitch(data);
            case this.config.types.FAINT:
                return this.animateFaint(data);
            case this.config.types.TEXT:
                return this.animateText(data);
            default:
                console.warn(`⚠️ Type d'animation inconnu: ${type}`);
        }
    }

    /**
     * Animation d'entrée d'un Pokémon
     */
    async animatePokemonEntry(data) {
        const { side, pokemonElement } = data;
        const duration = this.config.durations.pokemonEntry;
        
        // Position initiale (hors écran)
        const initialTransform = side === 'player' ? 
            'translateX(-200px) scale(0.5)' : 
            'translateX(200px) scale(0.5)';
        
        pokemonElement.style.transform = initialTransform;
        pokemonElement.style.opacity = '0';
        
        // Animation d'entrée
        return new Promise(resolve => {
            setTimeout(() => {
                pokemonElement.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
                pokemonElement.style.transform = 'translateX(0) scale(1)';
                pokemonElement.style.opacity = '1';
                
                setTimeout(resolve, duration);
            }, 50);
        });
    }

    /**
     * Animation de sortie d'un Pokémon
     */
    async animatePokemonExit(data) {
        const { side, pokemonElement } = data;
        const duration = this.config.durations.pokemonExit;
        
        return new Promise(resolve => {
            pokemonElement.style.transition = `transform ${duration}ms ease-in, opacity ${duration}ms ease-in`;
            pokemonElement.style.transform = 'scale(0)';
            pokemonElement.style.opacity = '0';
            
            setTimeout(resolve, duration);
        });
    }

    /**
     * Animation d'attaque physique
     */
    async animateMoveAttack(data) {
        const { attacker, target, moveData } = data;
        const duration = this.config.durations.moveAnimation;
        
        // Sauvegarder la position originale
        const originalTransform = attacker.style.transform;
        
        return new Promise(resolve => {
            // Phase 1: Préparation (recul)
            attacker.style.transition = 'transform 200ms ease-out';
            const prepTransform = attacker.dataset.side === 'player' ? 
                'translateX(-30px) scale(1.1)' : 
                'translateX(30px) scale(1.1)';
            attacker.style.transform = prepTransform;
            
            setTimeout(() => {
                // Phase 2: Attaque (avancer)
                attacker.style.transition = 'transform 300ms ease-in';
                const attackTransform = attacker.dataset.side === 'player' ? 
                    'translateX(100px) scale(1.2)' : 
                    'translateX(-100px) scale(1.2)';
                attacker.style.transform = attackTransform;
                
                // Effet de secousse sur la cible
                setTimeout(() => {
                    this.shakeElement(target, 200);
                }, 250);
                
                setTimeout(() => {
                    // Phase 3: Retour
                    attacker.style.transition = 'transform 400ms ease-out';
                    attacker.style.transform = originalTransform;
                    
                    setTimeout(resolve, 400);
                }, 300);
            }, 200);
        });
    }

    /**
     * Animation d'attaque spéciale
     */
    async animateMoveSpecial(data) {
        const { attacker, target, moveData } = data;
        const duration = this.config.durations.moveAnimation;
        
        return new Promise(resolve => {
            // Effet de charge
            this.createChargeEffect(attacker, moveData.type);
            
            setTimeout(() => {
                // Projectile ou effet spécial
                this.createProjectileEffect(attacker, target, moveData);
                
                setTimeout(() => {
                    // Impact sur la cible
                    this.createImpactEffect(target, moveData.type);
                    this.shakeElement(target, 300);
                    
                    setTimeout(resolve, 500);
                }, 600);
            }, 400);
        });
    }

    /**
     * Animation d'attaque de statut
     */
    async animateMoveStatus(data) {
        const { attacker, target, moveData } = data;
        
        return new Promise(resolve => {
            // Effet de statut
            this.createStatusVisualEffect(target, moveData.effect);
            
            setTimeout(resolve, this.config.durations.statusEffect);
        });
    }

    /**
     * Animation de dégâts
     */
    async animateDamage(data) {
        const { target, damage, effectiveness } = data;
        
        // Texte de dégâts
        this.showDamageNumber(target, damage, effectiveness);
        
        // Animation de la barre de santé
        const healthBar = target.closest('.pokemon-container').querySelector('.health-fill');
        if (healthBar) {
            await this.animateHealthBar(healthBar, data.oldHp, data.newHp, data.maxHp);
        }
        
        // Secousse
        await this.shakeElement(target, 400);
    }

    /**
     * Animation de soin
     */
    async animateHealing(data) {
        const { target, amount } = data;
        
        // Effet de soin
        this.createHealingEffect(target);
        
        // Texte de soin
        this.showHealingNumber(target, amount);
        
        // Animation de la barre de santé
        const healthBar = target.closest('.pokemon-container').querySelector('.health-fill');
        if (healthBar) {
            await this.animateHealthBar(healthBar, data.oldHp, data.newHp, data.maxHp);
        }
    }

    /**
     * Animation d'effet de statut
     */
    async animateStatusEffect(data) {
        const { target, statusType, action } = data; // action: 'apply' ou 'remove'
        
        if (action === 'apply') {
            this.createStatusVisualEffect(target, statusType);
        } else {
            this.removeStatusVisualEffect(target, statusType);
        }
        
        return new Promise(resolve => {
            setTimeout(resolve, this.config.durations.statusEffect);
        });
    }

    /**
     * Animation de changement de Pokémon
     */
    async animatePokemonSwitch(data) {
        const { outgoing, incoming, side } = data;
        
        // Sortie de l'ancien Pokémon
        await this.animatePokemonExit({ side, pokemonElement: outgoing });
        
        // Pause
        await this.wait(200);
        
        // Entrée du nouveau Pokémon
        await this.animatePokemonEntry({ side, pokemonElement: incoming });
    }

    /**
     * Animation de K.O.
     */
    async animateFaint(data) {
        const { target } = data;
        const duration = 1000;
        
        return new Promise(resolve => {
            // Animation de chute
            target.style.transition = `transform ${duration}ms ease-in, opacity ${duration}ms ease-in`;
            target.style.transform = 'translateY(50px) rotate(90deg) scale(0.8)';
            target.style.opacity = '0';
            
            // Effet de disparition
            this.createFaintEffect(target);
            
            setTimeout(resolve, duration);
        });
    }

    /**
     * Animation de texte
     */
    async animateText(data) {
        const { text, duration } = data;
        
        this.battleInterface.setBattleText(text);
        
        return new Promise(resolve => {
            setTimeout(resolve, duration || this.config.durations.textDisplay);
        });
    }

    /**
     * Anime la barre de santé
     */
    async animateHealthBar(healthBar, oldHp, newHp, maxHp) {
        const duration = this.config.durations.healthBarUpdate;
        const oldPercentage = (oldHp / maxHp) * 100;
        const newPercentage = (newHp / maxHp) * 100;
        
        return new Promise(resolve => {
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const currentPercentage = oldPercentage + (newPercentage - oldPercentage) * progress;
                healthBar.style.width = `${currentPercentage}%`;
                
                // Changer la couleur selon le pourcentage
                if (currentPercentage > 50) {
                    healthBar.className = 'health-fill health-good';
                } else if (currentPercentage > 25) {
                    healthBar.className = 'health-fill health-warning';
                } else {
                    healthBar.className = 'health-fill health-critical';
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }

    /**
     * Effet de secousse sur un élément
     */
    async shakeElement(element, duration = 200) {
        const intensity = this.config.effects.shake.intensity;
        const originalTransform = element.style.transform;
        
        return new Promise(resolve => {
            const startTime = Date.now();
            
            const shake = () => {
                const elapsed = Date.now() - startTime;
                
                if (elapsed < duration) {
                    const offsetX = (Math.random() - 0.5) * intensity;
                    const offsetY = (Math.random() - 0.5) * intensity;
                    element.style.transform = `${originalTransform} translate(${offsetX}px, ${offsetY}px)`;
                    
                    requestAnimationFrame(shake);
                } else {
                    element.style.transform = originalTransform;
                    resolve();
                }
            };
            
            shake();
        });
    }

    /**
     * Crée un effet de charge pour les attaques spéciales
     */
    createChargeEffect(element, moveType) {
        const effect = document.createElement('div');
        effect.className = `charge-effect type-${moveType.toLowerCase()}`;
        effect.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: radial-gradient(circle, ${this.getTypeColor(moveType)} 0%, transparent 70%);
            transform: translate(-50%, -50%) scale(0);
            animation: chargeEffect 800ms ease-out forwards;
            pointer-events: none;
            z-index: 10;
        `;
        
        element.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 800);
    }

    /**
     * Crée un effet de projectile
     */
    createProjectileEffect(attacker, target, moveData) {
        const projectile = document.createElement('div');
        projectile.className = `projectile-effect type-${moveData.type.toLowerCase()}`;
        
        // Position de départ
        const attackerRect = attacker.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        
        projectile.style.cssText = `
            position: fixed;
            left: ${attackerRect.left + attackerRect.width / 2}px;
            top: ${attackerRect.top + attackerRect.height / 2}px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${this.getTypeColor(moveData.type)};
            z-index: 100;
            transition: all 600ms ease-out;
            box-shadow: 0 0 20px ${this.getTypeColor(moveData.type)};
        `;
        
        document.body.appendChild(projectile);
        
        // Animation vers la cible
        setTimeout(() => {
            projectile.style.left = `${targetRect.left + targetRect.width / 2}px`;
            projectile.style.top = `${targetRect.top + targetRect.height / 2}px`;
            projectile.style.transform = 'scale(2)';
        }, 50);
        
        setTimeout(() => {
            projectile.remove();
        }, 650);
    }

    /**
     * Crée un effet d'impact
     */
    createImpactEffect(target, moveType) {
        const impact = document.createElement('div');
        impact.className = `impact-effect type-${moveType.toLowerCase()}`;
        impact.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: radial-gradient(circle, ${this.getTypeColor(moveType)} 0%, transparent 100%);
            transform: translate(-50%, -50%) scale(0);
            animation: impactEffect 400ms ease-out forwards;
            pointer-events: none;
            z-index: 10;
        `;
        
        target.appendChild(impact);
        
        setTimeout(() => {
            impact.remove();
        }, 400);
    }

    /**
     * Affiche un nombre de dégâts
     */
    showDamageNumber(target, damage, effectiveness = 1) {
        const damageText = document.createElement('div');
        damageText.className = 'damage-number';
        damageText.textContent = `-${damage}`;
        
        let color = '#ff4444';
        if (effectiveness > 1) {
            color = '#ff8800'; // Super efficace
            damageText.textContent += '!';
        } else if (effectiveness < 1) {
            color = '#888888'; // Peu efficace
        }
        
        damageText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            color: ${color};
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: damageNumber 1s ease-out forwards;
            pointer-events: none;
            z-index: 20;
        `;
        
        target.appendChild(damageText);
        
        setTimeout(() => {
            damageText.remove();
        }, 1000);
    }

    /**
     * Affiche un nombre de soin
     */
    showHealingNumber(target, amount) {
        const healText = document.createElement('div');
        healText.className = 'healing-number';
        healText.textContent = `+${amount}`;
        healText.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            color: #44ff44;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: healingNumber 1s ease-out forwards;
            pointer-events: none;
            z-index: 20;
        `;
        
        target.appendChild(healText);
        
        setTimeout(() => {
            healText.remove();
        }, 1000);
    }

    /**
     * Crée un effet visuel de statut
     */
    createStatusVisualEffect(target, statusType) {
        const effect = document.createElement('div');
        effect.className = `status-visual-effect status-${statusType}`;
        effect.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
            animation: statusEffect 2s ease-out;
        `;
        
        switch (statusType) {
            case 'poison':
                effect.style.background = 'radial-gradient(circle, rgba(128,0,128,0.3) 0%, transparent 100%)';
                break;
            case 'burn':
                effect.style.background = 'radial-gradient(circle, rgba(255,69,0,0.3) 0%, transparent 100%)';
                break;
            case 'paralyze':
                effect.style.background = 'radial-gradient(circle, rgba(255,255,0,0.3) 0%, transparent 100%)';
                break;
            case 'sleep':
                effect.style.background = 'radial-gradient(circle, rgba(75,0,130,0.3) 0%, transparent 100%)';
                break;
            case 'freeze':
                effect.style.background = 'radial-gradient(circle, rgba(173,216,230,0.5) 0%, transparent 100%)';
                break;
        }
        
        target.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 2000);
    }

    /**
     * Crée un effet de soin
     */
    createHealingEffect(target) {
        const particles = [];
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'healing-particle';
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: #44ff44;
                border-radius: 50%;
                bottom: 0;
                left: ${20 + (i * 10)}%;
                animation: healingParticle 1.5s ease-out forwards;
                animation-delay: ${i * 100}ms;
                pointer-events: none;
                z-index: 15;
            `;
            
            target.appendChild(particle);
            particles.push(particle);
        }
        
        setTimeout(() => {
            particles.forEach(particle => particle.remove());
        }, 2000);
    }

    /**
     * Crée un effet de K.O.
     */
    createFaintEffect(target) {
        const effect = document.createElement('div');
        effect.className = 'faint-effect';
        effect.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(0,0,0,0.8) 0%, transparent 100%);
            animation: faintEffect 1s ease-out forwards;
            pointer-events: none;
            z-index: 10;
        `;
        
        target.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    /**
     * Obtient la couleur associée à un type
     */
    getTypeColor(type) {
        const colors = {
            normal: '#A8A878',
            fire: '#F08030',
            water: '#6890F0',
            electric: '#F8D030',
            grass: '#78C850',
            ice: '#98D8D8',
            fighting: '#C03028',
            poison: '#A040A0',
            ground: '#E0C068',
            flying: '#A890F0',
            psychic: '#F85888',
            bug: '#A8B820',
            rock: '#B8A038',
            ghost: '#705898',
            dragon: '#7038F8',
            dark: '#705848',
            steel: '#B8B8D0',
            fairy: '#EE99AC'
        };
        
        return colors[type.toLowerCase()] || '#68A090';
    }

    /**
     * Fonction utilitaire pour attendre
     */
    wait(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /**
     * Nettoie tous les effets en cours
     */
    clearAllEffects() {
        this.animationQueue = [];
        this.isAnimating = false;
        this.currentAnimation = null;
        
        if (this.effectsContainer) {
            this.effectsContainer.innerHTML = '';
            this.createEffectLayers();
        }
    }

    /**
     * Met en pause les animations
     */
    pauseAnimations() {
        this.isAnimating = false;
    }

    /**
     * Reprend les animations
     */
    resumeAnimations() {
        if (this.animationQueue.length > 0 && !this.isAnimating) {
            this.processNextAnimation();
        }
    }
}

// Export pour utilisation dans BattleInterface
window.BattleAnimationManager = BattleAnimationManager;