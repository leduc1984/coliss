--
-- PostgreSQL database dump
--

\restrict KUru1uohty0qtUh5dJTAkNuK5rO2jfuEDlFG7neozRkzIkb1wT0le6m1a1gwQkZ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'WIN1252';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: calculate_pokemon_hp(integer, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_pokemon_hp(base_hp integer, iv integer, ev integer, level integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN FLOOR((2 * base_hp + iv + FLOOR(ev / 4)) * level / 100 + level + 10);
END;
$$;


ALTER FUNCTION public.calculate_pokemon_hp(base_hp integer, iv integer, ev integer, level integer) OWNER TO postgres;

--
-- Name: calculate_pokemon_stat(integer, integer, integer, integer, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_pokemon_stat(base_stat integer, iv integer, ev integer, level integer, nature_modifier numeric DEFAULT 1.0) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN FLOOR(((2 * base_stat + iv + FLOOR(ev / 4)) * level / 100 + 5) * nature_modifier);
END;
$$;


ALTER FUNCTION public.calculate_pokemon_stat(base_stat integer, iv integer, ev integer, level integer, nature_modifier numeric) OWNER TO postgres;

--
-- Name: generate_random_pokemon(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_random_pokemon(p_trainer_id integer, p_species_id integer DEFAULT NULL::integer, p_level integer DEFAULT NULL::integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.generate_random_pokemon(p_trainer_id integer, p_species_id integer, p_level integer) OWNER TO postgres;

--
-- Name: update_battle_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_battle_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.update_battle_stats() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: battle_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.battle_logs (
    id integer NOT NULL,
    battle_id character varying(36) NOT NULL,
    turn_number integer NOT NULL,
    player_id integer,
    action_type character varying(20) NOT NULL,
    action_data jsonb NOT NULL,
    result_data jsonb,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.battle_logs OWNER TO postgres;

--
-- Name: battle_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.battle_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.battle_logs_id_seq OWNER TO postgres;

--
-- Name: battle_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.battle_logs_id_seq OWNED BY public.battle_logs.id;


--
-- Name: battle_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.battle_stats (
    id integer NOT NULL,
    user_id integer NOT NULL,
    total_battles integer DEFAULT 0,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    draws integer DEFAULT 0,
    pvp_battles integer DEFAULT 0,
    pvp_wins integer DEFAULT 0,
    wild_battles integer DEFAULT 0,
    wild_wins integer DEFAULT 0,
    current_win_streak integer DEFAULT 0,
    longest_win_streak integer DEFAULT 0,
    total_battle_time interval DEFAULT '00:00:00'::interval,
    average_battle_time interval,
    last_battle_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.battle_stats OWNER TO postgres;

--
-- Name: battle_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.battle_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.battle_stats_id_seq OWNER TO postgres;

--
-- Name: battle_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.battle_stats_id_seq OWNED BY public.battle_stats.id;


--
-- Name: battles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.battles (
    id character varying(36) NOT NULL,
    battle_type character varying(20) NOT NULL,
    player1_id integer,
    player2_id integer,
    winner_id integer,
    loser_id integer,
    status character varying(20) DEFAULT 'active'::character varying,
    turn_count integer DEFAULT 0,
    phase character varying(20) DEFAULT 'preparation'::character varying,
    weather character varying(20),
    terrain character varying(20),
    battle_data jsonb,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp without time zone,
    CONSTRAINT battles_check CHECK (((((battle_type)::text = 'wild'::text) AND (player2_id IS NULL)) OR (((battle_type)::text <> 'wild'::text) AND (player2_id IS NOT NULL))))
);


ALTER TABLE public.battles OWNER TO postgres;

--
-- Name: characters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.characters (
    id integer NOT NULL,
    user_id integer,
    name character varying(50) NOT NULL,
    sprite_type character varying(20) DEFAULT 'male'::character varying,
    level integer DEFAULT 1,
    experience integer DEFAULT 0,
    position_x double precision DEFAULT 0,
    position_y double precision DEFAULT 0,
    position_z double precision DEFAULT 0,
    current_map character varying(100) DEFAULT 'house_inside'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.characters OWNER TO postgres;

--
-- Name: characters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.characters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.characters_id_seq OWNER TO postgres;

--
-- Name: characters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.characters_id_seq OWNED BY public.characters.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    user_id integer,
    username character varying(50) NOT NULL,
    message text NOT NULL,
    channel character varying(50) DEFAULT 'global'::character varying,
    is_command boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    category character varying(30) NOT NULL,
    effect character varying(100),
    description text,
    buy_price integer,
    sell_price integer,
    fling_power integer,
    fling_effect character varying(50),
    is_consumable boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: maps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maps (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    file_path character varying(255) NOT NULL,
    spawn_x double precision DEFAULT 0,
    spawn_y double precision DEFAULT 0,
    spawn_z double precision DEFAULT 0,
    max_players integer DEFAULT 50,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.maps OWNER TO postgres;

--
-- Name: maps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.maps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maps_id_seq OWNER TO postgres;

--
-- Name: maps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.maps_id_seq OWNED BY public.maps.id;


--
-- Name: moves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.moves (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    type character varying(20) NOT NULL,
    category character varying(20) NOT NULL,
    power integer,
    accuracy integer,
    pp integer DEFAULT 5 NOT NULL,
    priority integer DEFAULT 0,
    effect_id integer,
    effect_chance integer,
    contest_type character varying(20),
    contest_effect_id integer,
    super_contest_effect_id integer,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.moves OWNER TO postgres;

--
-- Name: player_inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.player_inventory (
    id integer NOT NULL,
    user_id integer NOT NULL,
    item_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT player_inventory_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.player_inventory OWNER TO postgres;

--
-- Name: player_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.player_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.player_inventory_id_seq OWNER TO postgres;

--
-- Name: player_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.player_inventory_id_seq OWNED BY public.player_inventory.id;


--
-- Name: pokemon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pokemon (
    id integer NOT NULL,
    trainer_id integer NOT NULL,
    species_id integer NOT NULL,
    nickname character varying(50),
    level integer DEFAULT 5 NOT NULL,
    experience integer DEFAULT 0 NOT NULL,
    current_hp integer NOT NULL,
    nature character varying(20) DEFAULT 'hardy'::character varying NOT NULL,
    ability character varying(50),
    gender character varying(10),
    is_shiny boolean DEFAULT false,
    is_in_party boolean DEFAULT false,
    party_position integer,
    iv_hp integer DEFAULT 0,
    iv_attack integer DEFAULT 0,
    iv_defense integer DEFAULT 0,
    iv_sp_attack integer DEFAULT 0,
    iv_sp_defense integer DEFAULT 0,
    iv_speed integer DEFAULT 0,
    ev_hp integer DEFAULT 0,
    ev_attack integer DEFAULT 0,
    ev_defense integer DEFAULT 0,
    ev_sp_attack integer DEFAULT 0,
    ev_sp_defense integer DEFAULT 0,
    ev_speed integer DEFAULT 0,
    original_trainer_id integer,
    original_trainer_name character varying(50),
    met_location character varying(100),
    met_level integer,
    met_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ball_type character varying(30) DEFAULT 'pokeball'::character varying,
    status_condition character varying(20),
    status_turns integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pokemon_ev_attack_check CHECK (((ev_attack >= 0) AND (ev_attack <= 255))),
    CONSTRAINT pokemon_ev_defense_check CHECK (((ev_defense >= 0) AND (ev_defense <= 255))),
    CONSTRAINT pokemon_ev_hp_check CHECK (((ev_hp >= 0) AND (ev_hp <= 255))),
    CONSTRAINT pokemon_ev_sp_attack_check CHECK (((ev_sp_attack >= 0) AND (ev_sp_attack <= 255))),
    CONSTRAINT pokemon_ev_sp_defense_check CHECK (((ev_sp_defense >= 0) AND (ev_sp_defense <= 255))),
    CONSTRAINT pokemon_ev_speed_check CHECK (((ev_speed >= 0) AND (ev_speed <= 255))),
    CONSTRAINT pokemon_iv_attack_check CHECK (((iv_attack >= 0) AND (iv_attack <= 31))),
    CONSTRAINT pokemon_iv_defense_check CHECK (((iv_defense >= 0) AND (iv_defense <= 31))),
    CONSTRAINT pokemon_iv_hp_check CHECK (((iv_hp >= 0) AND (iv_hp <= 31))),
    CONSTRAINT pokemon_iv_sp_attack_check CHECK (((iv_sp_attack >= 0) AND (iv_sp_attack <= 31))),
    CONSTRAINT pokemon_iv_sp_defense_check CHECK (((iv_sp_defense >= 0) AND (iv_sp_defense <= 31))),
    CONSTRAINT pokemon_iv_speed_check CHECK (((iv_speed >= 0) AND (iv_speed <= 31))),
    CONSTRAINT pokemon_level_check CHECK (((level >= 1) AND (level <= 100))),
    CONSTRAINT pokemon_party_position_check CHECK (((party_position >= 1) AND (party_position <= 6))),
    CONSTRAINT valid_party_pokemon CHECK (((is_in_party = false) OR ((is_in_party = true) AND (party_position IS NOT NULL))))
);


ALTER TABLE public.pokemon OWNER TO postgres;

--
-- Name: pokemon_encounters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pokemon_encounters (
    id integer NOT NULL,
    map_name character varying(100) NOT NULL,
    zone_name character varying(100) NOT NULL,
    pokemon_id integer NOT NULL,
    min_level integer DEFAULT 1,
    max_level integer DEFAULT 5,
    encounter_rate double precision DEFAULT 0.1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pokemon_encounters OWNER TO postgres;

--
-- Name: pokemon_encounters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pokemon_encounters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pokemon_encounters_id_seq OWNER TO postgres;

--
-- Name: pokemon_encounters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pokemon_encounters_id_seq OWNED BY public.pokemon_encounters.id;


--
-- Name: pokemon_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pokemon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pokemon_id_seq OWNER TO postgres;

--
-- Name: pokemon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pokemon_id_seq OWNED BY public.pokemon.id;


--
-- Name: pokemon_moves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pokemon_moves (
    id integer NOT NULL,
    pokemon_id integer NOT NULL,
    move_id integer NOT NULL,
    slot integer NOT NULL,
    current_pp integer NOT NULL,
    max_pp integer NOT NULL,
    learned_at_level integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pokemon_moves_slot_check CHECK (((slot >= 1) AND (slot <= 4)))
);


ALTER TABLE public.pokemon_moves OWNER TO postgres;

--
-- Name: pokemon_moves_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pokemon_moves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pokemon_moves_id_seq OWNER TO postgres;

--
-- Name: pokemon_moves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pokemon_moves_id_seq OWNED BY public.pokemon_moves.id;


--
-- Name: pokemon_species; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pokemon_species (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    base_hp integer DEFAULT 45 NOT NULL,
    base_attack integer DEFAULT 49 NOT NULL,
    base_defense integer DEFAULT 49 NOT NULL,
    base_sp_attack integer DEFAULT 65 NOT NULL,
    base_sp_defense integer DEFAULT 65 NOT NULL,
    base_speed integer DEFAULT 45 NOT NULL,
    type1 character varying(20) NOT NULL,
    type2 character varying(20),
    height numeric(4,2),
    weight numeric(5,2),
    base_experience integer DEFAULT 64,
    capture_rate integer DEFAULT 45,
    egg_group1 character varying(20),
    egg_group2 character varying(20),
    gender_rate integer DEFAULT 4,
    hatch_counter integer DEFAULT 20,
    has_gender_differences boolean DEFAULT false,
    forms_switchable boolean DEFAULT false,
    is_legendary boolean DEFAULT false,
    is_mythical boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pokemon_species OWNER TO postgres;

--
-- Name: test_table; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_table (
    id integer NOT NULL,
    nom character varying(50),
    niveau integer
);


ALTER TABLE public.test_table OWNER TO postgres;

--
-- Name: test_table_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_table_id_seq OWNER TO postgres;

--
-- Name: test_table_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_table_id_seq OWNED BY public.test_table.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer,
    character_id integer,
    socket_id character varying(100) NOT NULL,
    current_map character varying(100) NOT NULL,
    position_x double precision DEFAULT 0,
    position_y double precision DEFAULT 0,
    position_z double precision DEFAULT 0,
    last_active timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'co-admin'::character varying, 'helper'::character varying, 'user'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: battle_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battle_logs ALTER COLUMN id SET DEFAULT nextval('public.battle_logs_id_seq'::regclass);


--
-- Name: battle_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battle_stats ALTER COLUMN id SET DEFAULT nextval('public.battle_stats_id_seq'::regclass);


--
-- Name: characters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters ALTER COLUMN id SET DEFAULT nextval('public.characters_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: maps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maps ALTER COLUMN id SET DEFAULT nextval('public.maps_id_seq'::regclass);


--
-- Name: player_inventory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_inventory ALTER COLUMN id SET DEFAULT nextval('public.player_inventory_id_seq'::regclass);


--
-- Name: pokemon id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon ALTER COLUMN id SET DEFAULT nextval('public.pokemon_id_seq'::regclass);


--
-- Name: pokemon_encounters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon_encounters ALTER COLUMN id SET DEFAULT nextval('public.pokemon_encounters_id_seq'::regclass);


--
-- Name: pokemon_moves id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon_moves ALTER COLUMN id SET DEFAULT nextval('public.pokemon_moves_id_seq'::regclass);


--
-- Name: test_table id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_table ALTER COLUMN id SET DEFAULT nextval('public.test_table_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: battle_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.battle_logs (id, battle_id, turn_number, player_id, action_type, action_data, result_data, "timestamp") FROM stdin;
\.


--
-- Data for Name: battle_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.battle_stats (id, user_id, total_battles, wins, losses, draws, pvp_battles, pvp_wins, wild_battles, wild_wins, current_win_streak, longest_win_streak, total_battle_time, average_battle_time, last_battle_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: battles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.battles (id, battle_type, player1_id, player2_id, winner_id, loser_id, status, turn_count, phase, weather, terrain, battle_data, started_at, ended_at) FROM stdin;
\.


--
-- Data for Name: characters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.characters (id, user_id, name, sprite_type, level, experience, position_x, position_y, position_z, current_map, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, user_id, username, message, channel, is_command, created_at) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, name, category, effect, description, buy_price, sell_price, fling_power, fling_effect, is_consumable, created_at) FROM stdin;
1	Poke Ball	pokeball	catch_pokemon	A device for catching wild Pokemon. It is thrown like a ball at the target.	200	100	\N	\N	t	2025-08-26 19:03:57.972784
2	Great Ball	pokeball	catch_pokemon_better	A good, high-performance Ball that provides a higher catch rate than a standard Poke Ball.	600	300	\N	\N	t	2025-08-26 19:03:57.972784
3	Ultra Ball	pokeball	catch_pokemon_best	An ultra-performance Ball that provides a higher catch rate than a Great Ball.	1200	600	\N	\N	t	2025-08-26 19:03:57.972784
4	Potion	potion	heal_20	A spray-type medicine for wounds. It restores the HP of one Pokemon by 20 points.	300	150	\N	\N	t	2025-08-26 19:03:57.972784
5	Super Potion	potion	heal_50	A spray-type medicine for wounds. It restores the HP of one Pokemon by 50 points.	700	350	\N	\N	t	2025-08-26 19:03:57.972784
\.


--
-- Data for Name: maps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maps (id, name, file_path, spawn_x, spawn_y, spawn_z, max_players, is_active, created_at) FROM stdin;
1	house_inside	assets/maps/male_house_inside/house.glb	0	0	0	50	t	2025-08-26 19:03:57.971394
\.


--
-- Data for Name: moves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.moves (id, name, type, category, power, accuracy, pp, priority, effect_id, effect_chance, contest_type, contest_effect_id, super_contest_effect_id, description, created_at) FROM stdin;
1	Pound	normal	physical	40	100	35	0	\N	\N	\N	\N	\N	A physical attack in which the user pounds the target with its tail or body.	2025-08-26 19:03:57.972784
2	Karate Chop	fighting	physical	50	100	25	0	\N	\N	\N	\N	\N	The target is attacked with a sharp chop. Critical hits land more easily.	2025-08-26 19:03:57.972784
3	Double Slap	normal	physical	15	85	10	0	\N	\N	\N	\N	\N	The target is slapped repeatedly, back and forth, two to five times in a row.	2025-08-26 19:03:57.972784
4	Comet Punch	normal	physical	18	85	15	0	\N	\N	\N	\N	\N	The target is hit with a flurry of punches that strike two to five times in a row.	2025-08-26 19:03:57.972784
5	Mega Punch	normal	physical	80	85	20	0	\N	\N	\N	\N	\N	The target is slugged by a punch thrown with muscle-packed power.	2025-08-26 19:03:57.972784
\.


--
-- Data for Name: player_inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.player_inventory (id, user_id, item_id, quantity, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pokemon; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pokemon (id, trainer_id, species_id, nickname, level, experience, current_hp, nature, ability, gender, is_shiny, is_in_party, party_position, iv_hp, iv_attack, iv_defense, iv_sp_attack, iv_sp_defense, iv_speed, ev_hp, ev_attack, ev_defense, ev_sp_attack, ev_sp_defense, ev_speed, original_trainer_id, original_trainer_name, met_location, met_level, met_date, ball_type, status_condition, status_turns, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pokemon_encounters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pokemon_encounters (id, map_name, zone_name, pokemon_id, min_level, max_level, encounter_rate, created_at) FROM stdin;
\.


--
-- Data for Name: pokemon_moves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pokemon_moves (id, pokemon_id, move_id, slot, current_pp, max_pp, learned_at_level, created_at) FROM stdin;
\.


--
-- Data for Name: pokemon_species; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pokemon_species (id, name, base_hp, base_attack, base_defense, base_sp_attack, base_sp_defense, base_speed, type1, type2, height, weight, base_experience, capture_rate, egg_group1, egg_group2, gender_rate, hatch_counter, has_gender_differences, forms_switchable, is_legendary, is_mythical, created_at) FROM stdin;
1	Bulbasaur	45	49	49	65	65	45	grass	poison	\N	\N	64	45	\N	\N	4	20	f	f	f	f	2025-08-26 19:03:57.972784
4	Charmander	39	52	43	60	50	65	fire	\N	\N	\N	64	45	\N	\N	4	20	f	f	f	f	2025-08-26 19:03:57.972784
7	Squirtle	44	48	65	50	64	43	water	\N	\N	\N	64	45	\N	\N	4	20	f	f	f	f	2025-08-26 19:03:57.972784
25	Pikachu	35	55	40	50	50	90	electric	\N	\N	\N	64	45	\N	\N	4	20	f	f	f	f	2025-08-26 19:03:57.972784
150	Mewtwo	106	110	90	154	90	130	psychic	\N	\N	\N	64	45	\N	\N	4	20	f	f	f	f	2025-08-26 19:03:57.972784
\.


--
-- Data for Name: test_table; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_table (id, nom, niveau) FROM stdin;
1	SalamŠche	7
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, character_id, socket_id, current_map, position_x, position_y, position_z, last_active) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Name: battle_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.battle_logs_id_seq', 1, false);


--
-- Name: battle_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.battle_stats_id_seq', 1, false);


--
-- Name: characters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.characters_id_seq', 1, false);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- Name: maps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.maps_id_seq', 1, true);


--
-- Name: player_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.player_inventory_id_seq', 1, false);


--
-- Name: pokemon_encounters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pokemon_encounters_id_seq', 1, false);


--
-- Name: pokemon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pokemon_id_seq', 1, false);


--
-- Name: pokemon_moves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pokemon_moves_id_seq', 1, false);


--
-- Name: test_table_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_table_id_seq', 1, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: battle_logs battle_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battle_logs
    ADD CONSTRAINT battle_logs_pkey PRIMARY KEY (id);


--
-- Name: battle_stats battle_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battle_stats
    ADD CONSTRAINT battle_stats_pkey PRIMARY KEY (id);


--
-- Name: battles battles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battles
    ADD CONSTRAINT battles_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: maps maps_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maps
    ADD CONSTRAINT maps_name_key UNIQUE (name);


--
-- Name: maps maps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maps
    ADD CONSTRAINT maps_pkey PRIMARY KEY (id);


--
-- Name: moves moves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moves
    ADD CONSTRAINT moves_pkey PRIMARY KEY (id);


--
-- Name: player_inventory player_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_inventory
    ADD CONSTRAINT player_inventory_pkey PRIMARY KEY (id);


--
-- Name: pokemon_encounters pokemon_encounters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon_encounters
    ADD CONSTRAINT pokemon_encounters_pkey PRIMARY KEY (id);


--
-- Name: pokemon_moves pokemon_moves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon_moves
    ADD CONSTRAINT pokemon_moves_pkey PRIMARY KEY (id);


--
-- Name: pokemon pokemon_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon
    ADD CONSTRAINT pokemon_pkey PRIMARY KEY (id);


--
-- Name: pokemon_species pokemon_species_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon_species
    ADD CONSTRAINT pokemon_species_pkey PRIMARY KEY (id);


--
-- Name: test_table test_table_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_table
    ADD CONSTRAINT test_table_pkey PRIMARY KEY (id);


--
-- Name: battle_stats unique_battle_stats_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battle_stats
    ADD CONSTRAINT unique_battle_stats_user UNIQUE (user_id);


--
-- Name: pokemon unique_party_position; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon
    ADD CONSTRAINT unique_party_position UNIQUE (trainer_id, party_position);


--
-- Name: player_inventory unique_player_item; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_inventory
    ADD CONSTRAINT unique_player_item UNIQUE (user_id, item_id);


--
-- Name: pokemon_moves unique_pokemon_move; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon_moves
    ADD CONSTRAINT unique_pokemon_move UNIQUE (pokemon_id, move_id);


--
-- Name: pokemon_moves unique_pokemon_move_slot; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon_moves
    ADD CONSTRAINT unique_pokemon_move_slot UNIQUE (pokemon_id, slot);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_battle_logs_battle_turn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_battle_logs_battle_turn ON public.battle_logs USING btree (battle_id, turn_number);


--
-- Name: idx_battle_stats_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_battle_stats_user ON public.battle_stats USING btree (user_id);


--
-- Name: idx_battles_players; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_battles_players ON public.battles USING btree (player1_id, player2_id);


--
-- Name: idx_battles_started; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_battles_started ON public.battles USING btree (started_at);


--
-- Name: idx_battles_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_battles_status ON public.battles USING btree (status);


--
-- Name: idx_characters_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_characters_user_id ON public.characters USING btree (user_id);


--
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- Name: idx_inventory_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_user ON public.player_inventory USING btree (user_id);


--
-- Name: idx_pokemon_moves_pokemon; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pokemon_moves_pokemon ON public.pokemon_moves USING btree (pokemon_id);


--
-- Name: idx_pokemon_party; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pokemon_party ON public.pokemon USING btree (trainer_id, is_in_party, party_position);


--
-- Name: idx_pokemon_species; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pokemon_species ON public.pokemon USING btree (species_id);


--
-- Name: idx_pokemon_trainer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pokemon_trainer ON public.pokemon USING btree (trainer_id);


--
-- Name: idx_user_sessions_socket_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_socket_id ON public.user_sessions USING btree (socket_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: battles trigger_update_battle_stats; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_battle_stats AFTER UPDATE ON public.battles FOR EACH ROW EXECUTE FUNCTION public.update_battle_stats();


--
-- Name: battle_logs battle_logs_battle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battle_logs
    ADD CONSTRAINT battle_logs_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES public.battles(id) ON DELETE CASCADE;


--
-- Name: battle_logs battle_logs_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battle_logs
    ADD CONSTRAINT battle_logs_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id);


--
-- Name: battle_stats battle_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battle_stats
    ADD CONSTRAINT battle_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: battles battles_loser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battles
    ADD CONSTRAINT battles_loser_id_fkey FOREIGN KEY (loser_id) REFERENCES public.users(id);


--
-- Name: battles battles_player1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battles
    ADD CONSTRAINT battles_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES public.users(id);


--
-- Name: battles battles_player2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battles
    ADD CONSTRAINT battles_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES public.users(id);


--
-- Name: battles battles_winner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.battles
    ADD CONSTRAINT battles_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.users(id);


--
-- Name: characters characters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: player_inventory player_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_inventory
    ADD CONSTRAINT player_inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: player_inventory player_inventory_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_inventory
    ADD CONSTRAINT player_inventory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pokemon_moves pokemon_moves_move_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon_moves
    ADD CONSTRAINT pokemon_moves_move_id_fkey FOREIGN KEY (move_id) REFERENCES public.moves(id);


--
-- Name: pokemon_moves pokemon_moves_pokemon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon_moves
    ADD CONSTRAINT pokemon_moves_pokemon_id_fkey FOREIGN KEY (pokemon_id) REFERENCES public.pokemon(id) ON DELETE CASCADE;


--
-- Name: pokemon pokemon_original_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon
    ADD CONSTRAINT pokemon_original_trainer_id_fkey FOREIGN KEY (original_trainer_id) REFERENCES public.users(id);


--
-- Name: pokemon pokemon_species_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon
    ADD CONSTRAINT pokemon_species_id_fkey FOREIGN KEY (species_id) REFERENCES public.pokemon_species(id);


--
-- Name: pokemon pokemon_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pokemon
    ADD CONSTRAINT pokemon_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KUru1uohty0qtUh5dJTAkNuK5rO2jfuEDlFG7neozRkzIkb1wT0le6m1a1gwQkZ

