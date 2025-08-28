-- Tables pour le système de bataille Pokemon MMO
-- À exécuter après les tables de base existantes

-- Table des espèces Pokémon (données de base)
CREATE TABLE IF NOT EXISTS pokemon_species (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    base_hp INTEGER NOT NULL DEFAULT 45,
    base_attack INTEGER NOT NULL DEFAULT 49,
    base_defense INTEGER NOT NULL DEFAULT 49,
    base_sp_attack INTEGER NOT NULL DEFAULT 65,
    base_sp_defense INTEGER NOT NULL DEFAULT 65,
    base_speed INTEGER NOT NULL DEFAULT 45,
    type1 VARCHAR(20) NOT NULL,
    type2 VARCHAR(20),
    height DECIMAL(4,2),
    weight DECIMAL(5,2),
    base_experience INTEGER DEFAULT 64,
    capture_rate INTEGER DEFAULT 45,
    egg_group1 VARCHAR(20),
    egg_group2 VARCHAR(20),
    gender_rate INTEGER DEFAULT 4, -- -1 = sans genre, 0 = toujours mâle, 8 = toujours femelle
    hatch_counter INTEGER DEFAULT 20,
    has_gender_differences BOOLEAN DEFAULT FALSE,
    forms_switchable BOOLEAN DEFAULT FALSE,
    is_legendary BOOLEAN DEFAULT FALSE,
    is_mythical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des attaques
CREATE TABLE IF NOT EXISTS moves (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(20) NOT NULL, -- physical, special, status
    power INTEGER,
    accuracy INTEGER,
    pp INTEGER NOT NULL DEFAULT 5,
    priority INTEGER DEFAULT 0,
    effect_id INTEGER,
    effect_chance INTEGER,
    contest_type VARCHAR(20),
    contest_effect_id INTEGER,
    super_contest_effect_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des Pokémon appartenant aux joueurs
CREATE TABLE IF NOT EXISTS pokemon (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    species_id INTEGER NOT NULL REFERENCES pokemon_species(id),
    nickname VARCHAR(50),
    level INTEGER NOT NULL DEFAULT 5 CHECK (level >= 1 AND level <= 100),
    experience INTEGER NOT NULL DEFAULT 0,
    current_hp INTEGER NOT NULL,
    nature VARCHAR(20) NOT NULL DEFAULT 'hardy',
    ability VARCHAR(50),
    gender VARCHAR(10), -- male, female, null pour sans genre
    is_shiny BOOLEAN DEFAULT FALSE,
    is_in_party BOOLEAN DEFAULT FALSE,
    party_position INTEGER CHECK (party_position >= 1 AND party_position <= 6),
    
    -- IVs (Individual Values) - 0 à 31
    iv_hp INTEGER DEFAULT 0 CHECK (iv_hp >= 0 AND iv_hp <= 31),
    iv_attack INTEGER DEFAULT 0 CHECK (iv_attack >= 0 AND iv_attack <= 31),
    iv_defense INTEGER DEFAULT 0 CHECK (iv_defense >= 0 AND iv_defense <= 31),
    iv_sp_attack INTEGER DEFAULT 0 CHECK (iv_sp_attack >= 0 AND iv_sp_attack <= 31),
    iv_sp_defense INTEGER DEFAULT 0 CHECK (iv_sp_defense >= 0 AND iv_sp_defense <= 31),
    iv_speed INTEGER DEFAULT 0 CHECK (iv_speed >= 0 AND iv_speed <= 31),
    
    -- EVs (Effort Values) - 0 à 255, total max 510
    ev_hp INTEGER DEFAULT 0 CHECK (ev_hp >= 0 AND ev_hp <= 255),
    ev_attack INTEGER DEFAULT 0 CHECK (ev_attack >= 0 AND ev_attack <= 255),
    ev_defense INTEGER DEFAULT 0 CHECK (ev_defense >= 0 AND ev_defense <= 255),
    ev_sp_attack INTEGER DEFAULT 0 CHECK (ev_sp_attack >= 0 AND ev_sp_attack <= 255),
    ev_sp_defense INTEGER DEFAULT 0 CHECK (ev_sp_defense >= 0 AND ev_sp_defense <= 255),
    ev_speed INTEGER DEFAULT 0 CHECK (ev_speed >= 0 AND ev_speed <= 255),
    
    -- Métadonnées
    original_trainer_id INTEGER REFERENCES users(id),
    original_trainer_name VARCHAR(50),
    met_location VARCHAR(100),
    met_level INTEGER,
    met_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ball_type VARCHAR(30) DEFAULT 'pokeball',
    
    -- Statuts permanents
    status_condition VARCHAR(20), -- poison, burn, paralysis, sleep, freeze
    status_turns INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT unique_party_position UNIQUE (trainer_id, party_position),
    CONSTRAINT valid_party_pokemon CHECK (
        (is_in_party = FALSE) OR 
        (is_in_party = TRUE AND party_position IS NOT NULL)
    )
);

-- Table des attaques connues par les Pokémon
CREATE TABLE IF NOT EXISTS pokemon_moves (
    id SERIAL PRIMARY KEY,
    pokemon_id INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
    move_id INTEGER NOT NULL REFERENCES moves(id),
    slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 4),
    current_pp INTEGER NOT NULL,
    max_pp INTEGER NOT NULL,
    learned_at_level INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_pokemon_move_slot UNIQUE (pokemon_id, slot),
    CONSTRAINT unique_pokemon_move UNIQUE (pokemon_id, move_id)
);

-- Table des batailles
CREATE TABLE IF NOT EXISTS battles (
    id VARCHAR(36) PRIMARY KEY, -- UUID
    battle_type VARCHAR(20) NOT NULL, -- pvp, wild, trainer, gym
    player1_id INTEGER REFERENCES users(id),
    player2_id INTEGER REFERENCES users(id),
    winner_id INTEGER REFERENCES users(id),
    loser_id INTEGER REFERENCES users(id),
    
    -- État de la bataille
    status VARCHAR(20) DEFAULT 'active', -- active, completed, abandoned, error
    turn_count INTEGER DEFAULT 0,
    phase VARCHAR(20) DEFAULT 'preparation', -- preparation, selection, processing, ended
    
    -- Conditions environnementales
    weather VARCHAR(20), -- sun, rain, hail, sandstorm, fog
    terrain VARCHAR(20), -- electric, grassy, misty, psychic
    
    -- Métadonnées de bataille
    battle_data JSONB, -- Données complètes de la bataille (équipes, historique, etc.)
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Contraintes
    CHECK (
        (battle_type = 'wild' AND player2_id IS NULL) OR
        (battle_type != 'wild' AND player2_id IS NOT NULL)
    )
);

-- Table des logs de bataille (historique des actions)
CREATE TABLE IF NOT EXISTS battle_logs (
    id SERIAL PRIMARY KEY,
    battle_id VARCHAR(36) NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    player_id INTEGER REFERENCES users(id),
    action_type VARCHAR(20) NOT NULL, -- move, switch, item, run, forfeit
    action_data JSONB NOT NULL, -- Détails de l'action
    result_data JSONB, -- Résultat de l'action
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_battle_logs_battle_turn ON battle_logs(battle_id, turn_number);

-- Table des statistiques de bataille par joueur
CREATE TABLE IF NOT EXISTS battle_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Statistiques générales
    total_battles INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    
    -- Statistiques par type
    pvp_battles INTEGER DEFAULT 0,
    pvp_wins INTEGER DEFAULT 0,
    wild_battles INTEGER DEFAULT 0,
    wild_wins INTEGER DEFAULT 0,
    
    -- Streaks
    current_win_streak INTEGER DEFAULT 0,
    longest_win_streak INTEGER DEFAULT 0,
    
    -- Temps de jeu
    total_battle_time INTERVAL DEFAULT '0 seconds',
    average_battle_time INTERVAL,
    
    -- Métadonnées
    last_battle_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_battle_stats_user UNIQUE (user_id)
);

-- Table des objets (items) pour plus tard
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL, -- pokeball, potion, berry, tm, misc
    effect VARCHAR(100),
    description TEXT,
    buy_price INTEGER,
    sell_price INTEGER,
    fling_power INTEGER,
    fling_effect VARCHAR(50),
    is_consumable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de l'inventaire des joueurs
CREATE TABLE IF NOT EXISTS player_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_player_item UNIQUE (user_id, item_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_pokemon_trainer ON pokemon(trainer_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_species ON pokemon(species_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_party ON pokemon(trainer_id, is_in_party, party_position);
CREATE INDEX IF NOT EXISTS idx_pokemon_moves_pokemon ON pokemon_moves(pokemon_id);
CREATE INDEX IF NOT EXISTS idx_battles_players ON battles(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_started ON battles(started_at);
CREATE INDEX IF NOT EXISTS idx_battle_stats_user ON battle_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON player_inventory(user_id);

-- Triggers pour maintenir les données à jour
CREATE OR REPLACE FUNCTION update_battle_stats() 
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les statistiques lors de la fin d'une bataille
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Incrémenter le nombre total de batailles pour les deux joueurs
        INSERT INTO battle_stats (user_id, total_battles) 
        VALUES (NEW.player1_id, 1), (COALESCE(NEW.player2_id, 0), 1)
        ON CONFLICT (user_id) DO UPDATE SET 
            total_battles = battle_stats.total_battles + 1,
            updated_at = CURRENT_TIMESTAMP;
            
        -- Mettre à jour les victoires/défaites
        IF NEW.winner_id IS NOT NULL THEN
            UPDATE battle_stats SET 
                wins = wins + 1,
                current_win_streak = current_win_streak + 1,
                longest_win_streak = GREATEST(longest_win_streak, current_win_streak + 1),
                last_battle_at = NEW.ended_at,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = NEW.winner_id;
            
            -- Réinitialiser le streak du perdant
            UPDATE battle_stats SET 
                losses = losses + 1,
                current_win_streak = 0,
                last_battle_at = NEW.ended_at,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = NEW.loser_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_battle_stats ON battles;

CREATE TRIGGER trigger_update_battle_stats
    AFTER UPDATE ON battles
    FOR EACH ROW
    EXECUTE FUNCTION update_battle_stats();

-- Fonction pour calculer les statistiques d'un Pokémon
CREATE OR REPLACE FUNCTION calculate_pokemon_stat(
    base_stat INTEGER,
    iv INTEGER,
    ev INTEGER,
    level INTEGER,
    nature_modifier DECIMAL DEFAULT 1.0
) RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(((2 * base_stat + iv + FLOOR(ev / 4)) * level / 100 + 5) * nature_modifier);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les HP d'un Pokémon  
CREATE OR REPLACE FUNCTION calculate_pokemon_hp(
    base_hp INTEGER,
    iv INTEGER,
    ev INTEGER,
    level INTEGER
) RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR((2 * base_hp + iv + FLOOR(ev / 4)) * level / 100 + level + 10);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un Pokémon aléatoire
CREATE OR REPLACE FUNCTION generate_random_pokemon(
    p_trainer_id INTEGER,
    p_species_id INTEGER DEFAULT NULL,
    p_level INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    new_pokemon_id INTEGER;
    random_species_id INTEGER;
    random_level INTEGER;
    calculated_hp INTEGER;
BEGIN
    -- Espèce aléatoire si non spécifiée
    random_species_id := COALESCE(p_species_id, 1 + FLOOR(RANDOM() * 151)); -- Première génération
    
    -- Niveau aléatoire si non spécifié
    random_level := COALESCE(p_level, 5 + FLOOR(RANDOM() * 15)); -- Niveau 5-20
    
    -- Calculer les HP
    SELECT calculate_pokemon_hp(base_hp, FLOOR(RANDOM() * 32), 0, random_level)
    INTO calculated_hp
    FROM pokemon_species 
    WHERE id = random_species_id;
    
    -- Insérer le nouveau Pokémon
    INSERT INTO pokemon (
        trainer_id, species_id, level, current_hp,
        iv_hp, iv_attack, iv_defense, iv_sp_attack, iv_sp_defense, iv_speed,
        nature, ability, gender, is_shiny
    ) VALUES (
        p_trainer_id,
        random_species_id,
        random_level,
        calculated_hp,
        FLOOR(RANDOM() * 32), -- IV HP
        FLOOR(RANDOM() * 32), -- IV Attack
        FLOOR(RANDOM() * 32), -- IV Defense
        FLOOR(RANDOM() * 32), -- IV Sp. Attack
        FLOOR(RANDOM() * 32), -- IV Sp. Defense
        FLOOR(RANDOM() * 32), -- IV Speed
        (ARRAY['hardy', 'lonely', 'brave', 'adamant', 'naughty', 'bold', 'docile', 'relaxed', 'impish', 'lax', 'timid', 'hasty', 'serious', 'jolly', 'naive', 'modest', 'mild', 'quiet', 'bashful', 'rash', 'calm', 'gentle', 'sassy', 'careful', 'quirky'])[1 + FLOOR(RANDOM() * 25)], -- Nature aléatoire
        'overgrow', -- Capacité par défaut
        CASE WHEN RANDOM() > 0.5 THEN 'male' ELSE 'female' END, -- Genre aléatoire
        RANDOM() < 0.001 -- 0.1% chance d'être shiny
    ) RETURNING id INTO new_pokemon_id;
    
    RETURN new_pokemon_id;
END;
$$ LANGUAGE plpgsql;

-- Données de base pour quelques Pokémon populaires
INSERT INTO pokemon_species (id, name, base_hp, base_attack, base_defense, base_sp_attack, base_sp_defense, base_speed, type1, type2) VALUES
(1, 'Bulbasaur', 45, 49, 49, 65, 65, 45, 'grass', 'poison'),
(4, 'Charmander', 39, 52, 43, 60, 50, 65, 'fire', NULL),
(7, 'Squirtle', 44, 48, 65, 50, 64, 43, 'water', NULL),
(25, 'Pikachu', 35, 55, 40, 50, 50, 90, 'electric', NULL),
(150, 'Mewtwo', 106, 110, 90, 154, 90, 130, 'psychic', NULL)
ON CONFLICT (id) DO NOTHING;

-- Quelques attaques de base
INSERT INTO moves (id, name, type, category, power, accuracy, pp, priority, description) VALUES
(1, 'Pound', 'normal', 'physical', 40, 100, 35, 0, 'A physical attack in which the user pounds the target with its tail or body.'),
(2, 'Karate Chop', 'fighting', 'physical', 50, 100, 25, 0, 'The target is attacked with a sharp chop. Critical hits land more easily.'),
(3, 'Double Slap', 'normal', 'physical', 15, 85, 10, 0, 'The target is slapped repeatedly, back and forth, two to five times in a row.'),
(4, 'Comet Punch', 'normal', 'physical', 18, 85, 15, 0, 'The target is hit with a flurry of punches that strike two to five times in a row.'),
(5, 'Mega Punch', 'normal', 'physical', 80, 85, 20, 0, 'The target is slugged by a punch thrown with muscle-packed power.')
ON CONFLICT (id) DO NOTHING;

-- Quelques objets de base
INSERT INTO items (id, name, category, effect, description, buy_price, sell_price, is_consumable) VALUES
(1, 'Poke Ball', 'pokeball', 'catch_pokemon', 'A device for catching wild Pokemon. It is thrown like a ball at the target.', 200, 100, TRUE),
(2, 'Great Ball', 'pokeball', 'catch_pokemon_better', 'A good, high-performance Ball that provides a higher catch rate than a standard Poke Ball.', 600, 300, TRUE),
(3, 'Ultra Ball', 'pokeball', 'catch_pokemon_best', 'An ultra-performance Ball that provides a higher catch rate than a Great Ball.', 1200, 600, TRUE),
(4, 'Potion', 'potion', 'heal_20', 'A spray-type medicine for wounds. It restores the HP of one Pokemon by 20 points.', 300, 150, TRUE),
(5, 'Super Potion', 'potion', 'heal_50', 'A spray-type medicine for wounds. It restores the HP of one Pokemon by 50 points.', 700, 350, TRUE)
ON CONFLICT (id) DO NOTHING;