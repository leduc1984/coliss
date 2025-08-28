export type UIComponentType = 
  | 'button'
  | 'text'
  | 'image'
  | 'panel'
  | 'input'
  | 'checkbox'
  | 'slider'
  | 'progressbar'
  | 'itemslot'
  | 'scrolllist'
  | 'window'
  | 'tooltip';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface UIComponentProperties {
  text?: string;
  placeholder?: string;
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  padding?: number;
  margin?: number;
  opacity?: number;
  zIndex?: number;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  boxShadow?: string;
  cursor?: string;
  textAlign?: 'left' | 'center' | 'right';
  display?: string;
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  // Pokemon-specific properties
  itemIcon?: string;
  pokemonSprite?: string;
  statValue?: number;
  maxValue?: number;
  // Event properties
  onClick?: string;
  onHover?: string;
  onFocus?: string;
  onBlur?: string;
  // Animation properties
  animation?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationTimingFunction?: string;
  // Data binding
  dataBinding?: string;
  // Responsive properties
  responsiveSettings?: ResponsiveSettings;
}

export interface ResponsiveSettings {
  mobile?: Partial<UIComponentProperties>;
  tablet?: Partial<UIComponentProperties>;
  desktop?: Partial<UIComponentProperties>;
}

export interface UIComponent {
  id: string;
  type: UIComponentType;
  position: Position;
  size: Size;
  properties: UIComponentProperties;
  children: UIComponent[];
  parentId?: string;
  locked?: boolean;
  visible?: boolean;
  name?: string;
}

export interface UITheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface UITemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  components: UIComponent[];
  thumbnail?: string;
  tags: string[];
}

export interface UIState {
  id: string;
  name: string;
  conditions?: string[];
  properties: Partial<UIComponentProperties>;
}

export interface ComponentAnimation {
  id: string;
  name: string;
  keyframes: AnimationKeyframe[];
  duration: number;
  delay?: number;
  timingFunction?: string;
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface AnimationKeyframe {
  offset: number; // 0-1
  properties: Partial<UIComponentProperties>;
  easing?: string;
}

export interface UIProject {
  id: string;
  name: string;
  description: string;
  version: string;
  theme: UITheme;
  components: UIComponent[];
  templates: UITemplate[];
  assets: UIAsset[];
  animations: ComponentAnimation[];
  states: UIState[];
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UIAsset {
  id: string;
  name: string;
  type: 'image' | 'icon' | 'sprite' | 'audio';
  url: string;
  width?: number;
  height?: number;
  fileSize: number;
  tags: string[];
}

export interface ProjectSettings {
  canvasSize: Size;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showRulers: boolean;
  backgroundColor: string;
  exportSettings: ExportSettings;
}

export interface ExportSettings {
  format: 'json' | 'html' | 'css';
  minify: boolean;
  includeAssets: boolean;
  generateCSS: boolean;
  cssFramework?: 'none' | 'bootstrap' | 'tailwind' | 'custom';
}

// Drag and Drop types
export interface DragItem {
  type: 'component' | 'asset';
  componentType?: UIComponentType;
  asset?: UIAsset;
  component?: UIComponent;
}

// Event system types
export interface UIEvent {
  type: string;
  target: string; // component ID
  action: string;
  parameters?: Record<string, any>;
}

// Localization types
export interface LocalizationEntry {
  id: string;
  defaultValue: string;
  translations: Record<string, string>; // language code -> translation
  description?: string;
  context?: string;
}

export interface LocalizationProject {
  defaultLanguage: string;
  supportedLanguages: string[];
  entries: LocalizationEntry[];
}