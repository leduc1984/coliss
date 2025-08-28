export interface Pokemon {
  id: number;
  name: string;
  species: string;
  types: PokemonType[];
  baseStats: BaseStats;
  abilities: Ability[];
  hiddenAbility?: Ability;
  moveset: Moveset;
  evolution: Evolution;
  sprites: Sprites;
  gameData: GameData;
  description: string;
  category: string;
  height: number; // in meters
  weight: number; // in kg
  genderRatio: GenderRatio;
  eggGroups: EggGroup[];
  baseExperience: number;
  captureRate: number;
  baseFriendship: number;
  growthRate: GrowthRate;
  generation: number;
  isLegendary: boolean;
  isMythical: boolean;
  forms?: PokemonForm[];
}

export interface PokemonType {
  id: number;
  name: string;
  color: string;
  effectiveness: TypeEffectiveness;
}

export interface TypeEffectiveness {
  weakTo: number[]; // type IDs that are super effective against this type
  resistantTo: number[]; // type IDs that are not very effective against this type
  immuneTo: number[]; // type IDs that have no effect on this type
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  total: number;
}

export interface Ability {
  id: number;
  name: string;
  description: string;
  effect: string;
  isHidden?: boolean;
}

export interface Moveset {
  levelUp: LevelUpMove[];
  tmMoves: TMMove[];
  eggMoves: EggMove[];
  tutorMoves: TutorMove[];
  transferMoves: TransferMove[];
}

export interface LevelUpMove {
  moveId: number;
  level: number;
  generation?: number;
}

export interface TMMove {
  moveId: number;
  tmNumber: number;
  generation?: number;
}

export interface EggMove {
  moveId: number;
  parents: number[]; // Pokemon IDs that can pass this move
}

export interface TutorMove {
  moveId: number;
  location: string;
  cost?: number;
  generation?: number;
}

export interface TransferMove {
  moveId: number;
  fromGame: string;
  method: string;
}

export interface Move {
  id: number;
  name: string;
  type: number; // type ID
  category: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  description: string;
  effect: string;
  effectChance?: number;
  target: MoveTarget;
  damageClass: DamageClass;
  generation: number;
}

export interface MoveTarget {
  id: number;
  name: string;
  description: string;
}

export interface DamageClass {
  id: number;
  name: string;
  description: string;
}

export interface Evolution {
  canEvolve: boolean;
  evolutionChain?: EvolutionChain;
  evolutionMethods?: EvolutionMethod[];
}

export interface EvolutionChain {
  id: number;
  species: EvolutionSpecies[];
}

export interface EvolutionSpecies {
  id: number;
  name: string;
  evolutionDetails: EvolutionMethod[];
  evolvesTo: EvolutionSpecies[];
}

export interface EvolutionMethod {
  trigger: EvolutionTrigger;
  minLevel?: number;
  item?: number;
  heldItem?: number;
  knownMove?: number;
  location?: number;
  timeOfDay?: 'day' | 'night';
  minHappiness?: number;
  minBeauty?: number;
  minAffection?: number;
  partySpecies?: number;
  tradeSpecies?: number;
  needsOverworldRain?: boolean;
  turnUpsideDown?: boolean;
  gender?: 'male' | 'female';
}

export interface EvolutionTrigger {
  id: number;
  name: string;
}

export interface Sprites {
  frontDefault: string;
  frontShiny: string;
  backDefault: string;
  backShiny: string;
  frontFemale?: string;
  frontShinyFemale?: string;
  backFemale?: string;
  backShinyFemale?: string;
  official?: OfficialArtwork;
  animated?: AnimatedSprites;
}

export interface OfficialArtwork {
  frontDefault: string;
  frontShiny: string;
}

export interface AnimatedSprites {
  frontDefault: string;
  frontShiny: string;
  backDefault: string;
  backShiny: string;
}

export interface GameData {
  encounters: Encounter[];
  locations: Location[];
  rarity: Rarity;
}

export interface Encounter {
  locationId: number;
  method: EncounterMethod;
  minLevel: number;
  maxLevel: number;
  chance: number;
  conditions?: EncounterCondition[];
}

export interface EncounterMethod {
  id: number;
  name: string;
  description: string;
}

export interface EncounterCondition {
  type: 'time' | 'weather' | 'season' | 'special';
  value: string;
}

export interface Location {
  id: number;
  name: string;
  region: string;
  description: string;
}

export interface Rarity {
  tier: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'mythical';
  spawnRate: number;
}

export interface GenderRatio {
  male: number; // percentage
  female: number; // percentage
  genderless: boolean;
}

export interface EggGroup {
  id: number;
  name: string;
}

export interface GrowthRate {
  id: number;
  name: string;
  formula: string;
}

export interface PokemonForm {
  id: number;
  name: string;
  formName: string;
  isDefault: boolean;
  isMega: boolean;
  isAlolan: boolean;
  isGalarian: boolean;
  isGigantamax: boolean;
  sprites: Sprites;
  types: PokemonType[];
  baseStats: BaseStats;
  abilities: Ability[];
  height: number;
  weight: number;
}

// Filter and search types
export interface PokemonFilter {
  types: number[];
  generations: number[];
  legendary: boolean | null;
  mythical: boolean | null;
  minStats?: Partial<BaseStats>;
  maxStats?: Partial<BaseStats>;
  abilities: number[];
  eggGroups: number[];
  growthRates: number[];
}

export interface PokemonSearchOptions {
  term: string;
  searchIn: ('name' | 'species' | 'description' | 'moves' | 'abilities')[];
  caseSensitive: boolean;
  exactMatch: boolean;
}

export interface PokemonSortOptions {
  field: keyof Pokemon | keyof BaseStats;
  direction: 'asc' | 'desc';
}

// Editor state types
export interface EditorState {
  selectedPokemon: Pokemon | null;
  pokemonList: Pokemon[];
  filteredList: Pokemon[];
  searchOptions: PokemonSearchOptions;
  filterOptions: PokemonFilter;
  sortOptions: PokemonSortOptions;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  version: string;
}

// Database operation types
export interface DatabaseOperation {
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: Date;
  user: string;
}

export interface DatabaseVersion {
  id: string;
  version: string;
  description: string;
  operations: DatabaseOperation[];
  createdAt: Date;
  createdBy: string;
  isPublished: boolean;
}

// Analysis types
export interface StatsAnalysis {
  averageStats: BaseStats;
  statDistribution: StatDistribution[];
  typeDistribution: TypeDistribution[];
  generationDistribution: GenerationDistribution[];
  rarityDistribution: RarityDistribution[];
}

export interface StatDistribution {
  statName: keyof BaseStats;
  ranges: StatRange[];
}

export interface StatRange {
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface TypeDistribution {
  typeId: number;
  typeName: string;
  count: number;
  percentage: number;
  averageStats: BaseStats;
}

export interface GenerationDistribution {
  generation: number;
  count: number;
  percentage: number;
  averageStats: BaseStats;
}

export interface RarityDistribution {
  tier: string;
  count: number;
  percentage: number;
}

// Import/Export types
export interface ImportOptions {
  format: 'json' | 'csv' | 'xml';
  overwriteExisting: boolean;
  validateData: boolean;
  createBackup: boolean;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xml' | 'sql';
  includeSprites: boolean;
  includeMoveset: boolean;
  includeEvolutions: boolean;
  compression: 'none' | 'gzip' | 'zip';
  selectedOnly: boolean;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  pokemonId: number;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  pokemonId: number;
  field: string;
  message: string;
  suggestion?: string;
}