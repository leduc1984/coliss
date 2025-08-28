export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isOnline: boolean;
  lastSeen: Date;
  character?: Character;
  createdAt: Date;
  banStatus?: BanStatus;
  muteStatus?: MuteStatus;
  ipAddresses: string[];
  loginHistory: LoginRecord[];
}

export interface Character {
  id: string;
  name: string;
  level: number;
  location: Location;
  pokemon: Pokemon[];
  inventory: InventoryItem[];
  stats: PlayerStats;
}

export interface Pokemon {
  id: string;
  species: string;
  nickname?: string;
  level: number;
  shiny: boolean;
  moves: string[];
  ability: string;
  nature: string;
  ivs: Stats;
  evs: Stats;
}

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
}

export interface PlayerStats {
  playtime: number;
  battlesWon: number;
  battlesLost: number;
  pokemonCaught: number;
  questsCompleted: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
}

export interface Location {
  mapId: string;
  mapName: string;
  x: number;
  y: number;
  z: number;
}

export type UserRole = 'Admin' | 'Co-Admin' | 'Helper' | 'User';

export interface BanStatus {
  isBanned: boolean;
  reason?: string;
  bannedBy?: string;
  bannedAt?: Date;
  expiresAt?: Date;
  isPermanent: boolean;
}

export interface MuteStatus {
  isMuted: boolean;
  reason?: string;
  mutedBy?: string;
  mutedAt?: Date;
  expiresAt?: Date;
}

export interface LoginRecord {
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  successful: boolean;
}

export interface ServerStats {
  uptime: number;
  playerCount: number;
  maxPlayers: number;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    latency: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    responseTime: number;
  };
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  channel: ChatChannel;
  content: string;
  timestamp: Date;
  isDeleted: boolean;
  deletedBy?: string;
  deletedAt?: Date;
  reports: ChatReport[];
}

export type ChatChannel = 'global' | 'trade' | 'battle' | 'help' | 'guild' | 'whisper';

export interface ChatReport {
  id: string;
  reportedBy: string;
  reason: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
  reviewedBy?: string;
}

export interface AdminAction {
  id: string;
  adminId: string;
  adminUsername: string;
  action: AdminActionType;
  targetUserId?: string;
  targetUsername?: string;
  reason?: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
}

export type AdminActionType = 
  | 'ban_user' 
  | 'unban_user' 
  | 'mute_user' 
  | 'unmute_user' 
  | 'kick_user'
  | 'delete_message'
  | 'spawn_item'
  | 'spawn_pokemon'
  | 'teleport_player'
  | 'change_role'
  | 'server_announcement'
  | 'start_event'
  | 'stop_event'
  | 'server_restart'
  | 'server_shutdown';

export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
  participants: string[];
  rewards: EventReward[];
  configuration: Record<string, any>;
}

export type EventType = 
  | 'double_exp'
  | 'double_money'
  | 'rare_spawns'
  | 'tournament'
  | 'raid_boss'
  | 'seasonal'
  | 'custom';

export interface EventReward {
  type: 'item' | 'pokemon' | 'money' | 'exp';
  itemId?: string;
  pokemonId?: string;
  amount: number;
  rarity: 'common' | 'rare' | 'legendary';
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  responses: TicketResponse[];
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'bug' | 'gameplay' | 'account' | 'payment' | 'suggestion' | 'other';

export interface TicketResponse {
  id: string;
  userId: string;
  username: string;
  isStaff: boolean;
  message: string;
  timestamp: Date;
  attachments?: string[];
}

export interface EconomyData {
  totalMoney: number;
  averagePlayerMoney: number;
  topRichestPlayers: Array<{
    username: string;
    money: number;
  }>;
  itemPrices: Array<{
    itemId: string;
    itemName: string;
    averagePrice: number;
    totalSold: number;
  }>;
  tradeVolume: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface GameMasterTools {
  invisibility: boolean;
  noclip: boolean;
  godMode: boolean;
  currentMap: string;
  selectedPlayer?: string;
}

export interface AlertConfig {
  serverCrash: boolean;
  highCpuUsage: boolean;
  highMemoryUsage: boolean;
  playerCountThreshold: number;
  databaseResponseThreshold: number;
  discordWebhookUrl?: string;
}

export interface AdminPanelState {
  user: AdminUser | null;
  serverStats: ServerStats | null;
  onlinePlayers: User[];
  chatMessages: ChatMessage[];
  supportTickets: SupportTicket[];
  worldEvents: WorldEvent[];
  adminActions: AdminAction[];
  economyData: EconomyData | null;
  gmTools: GameMasterTools;
  alertConfig: AlertConfig;
  isConnected: boolean;
  selectedPlayer: User | null;
  activeTab: AdminTab;
}

export interface AdminUser {
  id: string;
  username: string;
  role: UserRole;
  permissions: Permission[];
  loginTime: Date;
  ipAddress: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export type AdminTab = 
  | 'dashboard'
  | 'players'
  | 'chat'
  | 'support'
  | 'events'
  | 'economy'
  | 'logs'
  | 'settings'
  | 'gm_tools';

// Socket.io event types
export interface ServerToClientEvents {
  serverStats: (stats: ServerStats) => void;
  playerJoined: (user: User) => void;
  playerLeft: (userId: string) => void;
  chatMessage: (message: ChatMessage) => void;
  ticketUpdated: (ticket: SupportTicket) => void;
  adminAction: (action: AdminAction) => void;
  eventStarted: (event: WorldEvent) => void;
  eventEnded: (eventId: string) => void;
  serverAlert: (alert: ServerAlert) => void;
}

export interface ClientToServerEvents {
  authenticate: (token: string) => void;
  banUser: (userId: string, reason: string, duration?: number) => void;
  unbanUser: (userId: string) => void;
  muteUser: (userId: string, reason: string, duration?: number) => void;
  unmuteUser: (userId: string) => void;
  kickUser: (userId: string, reason: string) => void;
  deleteMessage: (messageId: string) => void;
  sendAnnouncement: (message: string, channel?: string) => void;
  spawnItem: (userId: string, itemId: string, quantity: number) => void;
  spawnPokemon: (userId: string, pokemonId: string, level: number, shiny?: boolean) => void;
  teleportPlayer: (userId: string, mapId: string, x: number, y: number) => void;
  startEvent: (eventId: string, duration?: number) => void;
  stopEvent: (eventId: string) => void;
  updateTicket: (ticketId: string, updates: Partial<SupportTicket>) => void;
  restartServer: (delay: number, reason: string) => void;
}

export interface ServerAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}
