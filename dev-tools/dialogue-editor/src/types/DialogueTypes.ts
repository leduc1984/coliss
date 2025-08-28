export type NodeType = 'dialogue' | 'player_choice' | 'condition' | 'event' | 'start' | 'end';

export interface Position {
  x: number;
  y: number;
}

export interface DialogueNode {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
  selected?: boolean;
}

export interface NodeData {
  // Common properties
  label?: string;
  description?: string;
  
  // Dialogue node specific
  character?: string;
  text?: string;
  portrait?: string;
  voiceFile?: string;
  animation?: string;
  
  // Player choice specific
  choices?: Choice[];
  
  // Condition specific
  condition?: string;
  conditionType?: 'item' | 'quest' | 'stat' | 'variable' | 'custom';
  
  // Event specific
  eventType?: 'give_item' | 'start_quest' | 'complete_quest' | 'start_battle' | 'change_variable' | 'play_sound' | 'custom';
  eventData?: Record<string, any>;
  
  // Visual customization
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

export interface Choice {
  id: string;
  text: string;
  condition?: string;
  targetNodeId?: string;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export interface Character {
  id: string;
  name: string;
  displayName: string;
  portrait: string;
  color: string;
  voiceSet?: string;
  description?: string;
}

export interface DialogueProject {
  id: string;
  name: string;
  description: string;
  nodes: DialogueNode[];
  connections: Connection[];
  characters: Character[];
  variables: Variable[];
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Variable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean';
  defaultValue: any;
  description?: string;
}

export interface ProjectSettings {
  canvasBackground: string;
  gridVisible: boolean;
  snapToGrid: boolean;
  gridSize: number;
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface QuestData {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
}

// Export formats
export interface DialogueExport {
  version: string;
  project: DialogueProject;
  exportSettings: ExportSettings;
}

export interface ExportSettings {
  format: 'json' | 'xml' | 'csv';
  minify: boolean;
  includeComments: boolean;
  includeMetadata: boolean;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId: string;
  type: 'missing_connection' | 'invalid_condition' | 'missing_data' | 'circular_reference';
  message: string;
}

export interface ValidationWarning {
  nodeId: string;
  type: 'unreachable_node' | 'missing_voice' | 'long_text' | 'performance';
  message: string;
}

// Search and filter types
export interface SearchOptions {
  term: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  searchIn: ('text' | 'character' | 'description' | 'conditions' | 'events')[];
}

export interface FilterOptions {
  nodeTypes: NodeType[];
  characters: string[];
  hasConnections: boolean | null;
  hasConditions: boolean | null;
}