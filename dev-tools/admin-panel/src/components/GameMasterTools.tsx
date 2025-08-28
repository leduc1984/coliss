import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminUser } from '../types/AdminTypes';

const ToolsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const ToolsHeader = styled.div`
  margin-bottom: 16px;
`;

const Title = styled.h2`
  color: #ffffff;
  font-size: 18px;
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  color: #cccccc;
  font-size: 12px;
  margin: 0;
`;

const ToolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const ToolPanel = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 16px;
`;

const PanelTitle = styled.h3`
  color: #ffffff;
  font-size: 14px;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PanelIcon = styled.span`
  font-size: 16px;
`;

const FormGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  display: block;
  color: #cccccc;
  font-size: 12px;
  margin-bottom: 4px;
`;

const Input = styled.input`
  width: 100%;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 6px 8px;
  font-size: 12px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 6px 8px;
  font-size: 12px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 6px 8px;
  font-size: 12px;
  resize: vertical;
  min-height: 60px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const Button = styled.button<{ variant?: 'danger' | 'warning' | 'success' }>`
  background-color: ${props => {
    switch (props.variant) {
      case 'danger': return '#dc2626';
      case 'warning': return '#f59e0b';
      case 'success': return '#059669';
      default: return '#0e639c';
    }
  }};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    background-color: #5a5a5a;
    cursor: not-allowed;
  }
`;

const PlayerSearchResults = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  background-color: #2d2d30;
`;

const PlayerItem = styled.div`
  padding: 8px;
  border-bottom: 1px solid #3e3e42;
  cursor: pointer;
  display: flex;
  justify-content: between;
  align-items: center;

  &:hover {
    background-color: #3e3e42;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
`;

const PlayerDetails = styled.div`
  color: #999999;
  font-size: 10px;
`;

const LogEntry = styled.div`
  padding: 8px;
  border-bottom: 1px solid #3e3e42;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #cccccc;

  &:last-child {
    border-bottom: none;
  }
`;

const LogsContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  background-color: #1e1e1e;
`;

interface GameMasterToolsProps {
  user: AdminUser;
}

interface Player {
  id: string;
  username: string;
  level: number;
  location: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: Date;
}

interface GMAction {
  timestamp: Date;
  admin: string;
  action: string;
  target?: string;
  details: string;
}

export const GameMasterTools: React.FC<GameMasterToolsProps> = ({ user }) => {
  const [playerSearch, setPlayerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [gmActions, setGmActions] = useState<GMAction[]>([]);
  
  // Form states
  const [itemGiveForm, setItemGiveForm] = useState({
    itemId: '',
    quantity: '1',
    reason: ''
  });
  
  const [teleportForm, setTeleportForm] = useState({
    location: '',
    x: '',
    y: '',
    z: ''
  });
  
  const [punishmentForm, setPunishmentForm] = useState({
    type: 'mute',
    duration: '1',
    reason: ''
  });

  // Mock player data
  const mockPlayers: Player[] = [
    { id: '1', username: 'Ash_Ketchum', level: 25, location: 'Pewter City', status: 'online', lastSeen: new Date() },
    { id: '2', username: 'Misty_Gym', level: 32, location: 'Cerulean City', status: 'online', lastSeen: new Date() },
    { id: '3', username: 'Brock_Breeder', level: 28, location: 'Route 3', status: 'away', lastSeen: new Date(Date.now() - 300000) },
  ];

  useEffect(() => {
    if (playerSearch.length > 0) {
      const filtered = mockPlayers.filter(player => 
        player.username.toLowerCase().includes(playerSearch.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [playerSearch]);

  const logAction = (action: string, target?: string, details?: string) => {
    const newAction: GMAction = {
      timestamp: new Date(),
      admin: user.username,
      action,
      target,
      details: details || '',
    };
    
    setGmActions(prev => [newAction, ...prev].slice(0, 50)); // Keep last 50 actions
  };

  const handleGiveItem = () => {
    if (!selectedPlayer || !itemGiveForm.itemId) return;
    
    const details = `Gave ${itemGiveForm.quantity}x ${itemGiveForm.itemId} to ${selectedPlayer.username}. Reason: ${itemGiveForm.reason}`;
    logAction('GIVE_ITEM', selectedPlayer.username, details);
    
    setItemGiveForm({ itemId: '', quantity: '1', reason: '' });
    alert(`Successfully gave ${itemGiveForm.quantity}x ${itemGiveForm.itemId} to ${selectedPlayer.username}`);
  };

  const handleTeleportPlayer = () => {
    if (!selectedPlayer || !teleportForm.location) return;
    
    const coords = teleportForm.x && teleportForm.y && teleportForm.z 
      ? `(${teleportForm.x}, ${teleportForm.y}, ${teleportForm.z})`
      : '';
    const details = `Teleported ${selectedPlayer.username} to ${teleportForm.location} ${coords}`;
    logAction('TELEPORT', selectedPlayer.username, details);
    
    setTeleportForm({ location: '', x: '', y: '', z: '' });
    alert(`Successfully teleported ${selectedPlayer.username} to ${teleportForm.location}`);
  };

  const handlePunishment = () => {
    if (!selectedPlayer || !punishmentForm.reason) return;
    
    const details = `${punishmentForm.type.toUpperCase()} for ${punishmentForm.duration}h - Reason: ${punishmentForm.reason}`;
    logAction('PUNISHMENT', selectedPlayer.username, details);
    
    setPunishmentForm({ type: 'mute', duration: '1', reason: '' });
    alert(`Applied ${punishmentForm.type} to ${selectedPlayer.username} for ${punishmentForm.duration} hours`);
  };

  const handleSpawnPokemon = () => {
    const pokemonId = prompt('Enter Pokemon ID to spawn:');
    const level = prompt('Enter level (1-100):');
    
    if (pokemonId && level) {
      const details = `Spawned level ${level} Pokemon #${pokemonId}`;
      logAction('SPAWN_POKEMON', undefined, details);
      alert(`Spawned level ${level} Pokemon #${pokemonId} in the world`);
    }
  };

  const handleWorldMessage = () => {
    const message = prompt('Enter world announcement message:');
    
    if (message) {
      logAction('WORLD_MESSAGE', undefined, message);
      alert('World message sent to all players');
    }
  };

  const handleEmergencyTeleport = () => {
    if (!selectedPlayer) return;
    
    if (window.confirm(`Emergency teleport ${selectedPlayer.username} to spawn point?`)) {
      logAction('EMERGENCY_TELEPORT', selectedPlayer.username, 'Teleported to spawn point');
      alert(`${selectedPlayer.username} has been emergency teleported to spawn`);
    }
  };

  return (
    <ToolsContainer>
      <ToolsHeader>
        <Title>Game Master Tools</Title>
        <Description>
          Advanced tools for game management and player assistance. All actions are logged and monitored.
        </Description>
      </ToolsHeader>

      <ToolsGrid>
        <ToolPanel>
          <PanelTitle>
            <PanelIcon>👤</PanelIcon>
            Player Selection
          </PanelTitle>
          
          <FormGroup>
            <Label>Search Players</Label>
            <Input
              type="text"
              placeholder="Enter username to search..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
            />
          </FormGroup>

          {searchResults.length > 0 && (
            <PlayerSearchResults>
              {searchResults.map(player => (
                <PlayerItem 
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                >
                  <PlayerInfo>
                    <PlayerName>{player.username}</PlayerName>
                    <PlayerDetails>
                      Level {player.level} • {player.location} • {player.status}
                    </PlayerDetails>
                  </PlayerInfo>
                </PlayerItem>
              ))}
            </PlayerSearchResults>
          )}

          {selectedPlayer && (
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#2d2d30', borderRadius: '3px' }}>
              <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                Selected: {selectedPlayer.username}
              </div>
              <div style={{ color: '#999999', fontSize: '10px' }}>
                Level {selectedPlayer.level} • {selectedPlayer.location}
              </div>
            </div>
          )}
        </ToolPanel>

        <ToolPanel>
          <PanelTitle>
            <PanelIcon>🎁</PanelIcon>
            Item Management
          </PanelTitle>
          
          <FormGroup>
            <Label>Item ID</Label>
            <Select
              value={itemGiveForm.itemId}
              onChange={(e) => setItemGiveForm(prev => ({ ...prev, itemId: e.target.value }))}
            >
              <option value="">Select item...</option>
              <option value="pokeball">Poke Ball</option>
              <option value="greatball">Great Ball</option>
              <option value="ultraball">Ultra Ball</option>
              <option value="masterball">Master Ball</option>
              <option value="potion">Potion</option>
              <option value="superpotion">Super Potion</option>
              <option value="hyperpotion">Hyper Potion</option>
              <option value="maxpotion">Max Potion</option>
              <option value="revive">Revive</option>
              <option value="maxrevive">Max Revive</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              max="999"
              value={itemGiveForm.quantity}
              onChange={(e) => setItemGiveForm(prev => ({ ...prev, quantity: e.target.value }))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Reason</Label>
            <Input
              type="text"
              placeholder="Reason for giving item..."
              value={itemGiveForm.reason}
              onChange={(e) => setItemGiveForm(prev => ({ ...prev, reason: e.target.value }))}
            />
          </FormGroup>

          <Button 
            onClick={handleGiveItem}
            disabled={!selectedPlayer || !itemGiveForm.itemId}
          >
            Give Item
          </Button>
        </ToolPanel>

        <ToolPanel>
          <PanelTitle>
            <PanelIcon>🚀</PanelIcon>
            Teleportation
          </PanelTitle>
          
          <FormGroup>
            <Label>Location</Label>
            <Select
              value={teleportForm.location}
              onChange={(e) => setTeleportForm(prev => ({ ...prev, location: e.target.value }))}
            >
              <option value="">Select location...</option>
              <option value="Pallet Town">Pallet Town</option>
              <option value="Viridian City">Viridian City</option>
              <option value="Pewter City">Pewter City</option>
              <option value="Cerulean City">Cerulean City</option>
              <option value="Vermilion City">Vermilion City</option>
              <option value="Lavender Town">Lavender Town</option>
              <option value="Celadon City">Celadon City</option>
              <option value="Fuchsia City">Fuchsia City</option>
              <option value="Saffron City">Saffron City</option>
              <option value="Cinnabar Island">Cinnabar Island</option>
            </Select>
          </FormGroup>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <FormGroup>
              <Label>X</Label>
              <Input
                type="number"
                placeholder="X"
                value={teleportForm.x}
                onChange={(e) => setTeleportForm(prev => ({ ...prev, x: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <Label>Y</Label>
              <Input
                type="number"
                placeholder="Y"
                value={teleportForm.y}
                onChange={(e) => setTeleportForm(prev => ({ ...prev, y: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <Label>Z</Label>
              <Input
                type="number"
                placeholder="Z"
                value={teleportForm.z}
                onChange={(e) => setTeleportForm(prev => ({ ...prev, z: e.target.value }))}
              />
            </FormGroup>
          </div>

          <Button 
            onClick={handleTeleportPlayer}
            disabled={!selectedPlayer || !teleportForm.location}
          >
            Teleport Player
          </Button>
          
          <Button 
            variant="warning"
            onClick={handleEmergencyTeleport}
            disabled={!selectedPlayer}
          >
            Emergency Teleport
          </Button>
        </ToolPanel>

        <ToolPanel>
          <PanelTitle>
            <PanelIcon>⚖️</PanelIcon>
            Player Moderation
          </PanelTitle>
          
          <FormGroup>
            <Label>Punishment Type</Label>
            <Select
              value={punishmentForm.type}
              onChange={(e) => setPunishmentForm(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="mute">Mute</option>
              <option value="ban">Ban</option>
              <option value="kick">Kick</option>
              <option value="warning">Warning</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Duration (hours)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={punishmentForm.duration}
              onChange={(e) => setPunishmentForm(prev => ({ ...prev, duration: e.target.value }))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Reason</Label>
            <TextArea
              placeholder="Reason for punishment..."
              value={punishmentForm.reason}
              onChange={(e) => setPunishmentForm(prev => ({ ...prev, reason: e.target.value }))}
            />
          </FormGroup>

          <Button 
            variant="danger"
            onClick={handlePunishment}
            disabled={!selectedPlayer || !punishmentForm.reason}
          >
            Apply Punishment
          </Button>
        </ToolPanel>

        <ToolPanel>
          <PanelTitle>
            <PanelIcon>🌟</PanelIcon>
            World Management
          </PanelTitle>
          
          <Button onClick={handleSpawnPokemon}>
            🐾 Spawn Pokemon
          </Button>
          
          <Button onClick={handleWorldMessage}>
            📢 World Message
          </Button>
          
          <Button variant="warning" onClick={() => {
            if (window.confirm('Initiate server maintenance mode?')) {
              logAction('MAINTENANCE_MODE', undefined, 'Server maintenance mode enabled');
              alert('Server maintenance mode enabled');
            }
          }}>
            🔧 Maintenance Mode
          </Button>
          
          <Button variant="success" onClick={() => {
            logAction('EVENT_TRIGGER', undefined, 'Special event triggered');
            alert('Special event has been triggered!');
          }}>
            ✨ Trigger Event
          </Button>
        </ToolPanel>

        <ToolPanel>
          <PanelTitle>
            <PanelIcon>📋</PanelIcon>
            Action Log
          </PanelTitle>
          
          <LogsContainer>
            {gmActions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#999999', fontSize: '12px' }}>
                No actions logged yet
              </div>
            ) : (
              gmActions.map((action, index) => (
                <LogEntry key={index}>
                  <div style={{ marginBottom: '2px' }}>
                    <strong>{action.timestamp.toLocaleTimeString()}</strong> - {action.admin}
                  </div>
                  <div style={{ color: '#4caf50' }}>
                    {action.action} {action.target && `→ ${action.target}`}
                  </div>
                  {action.details && (
                    <div style={{ color: '#999999', fontSize: '10px' }}>
                      {action.details}
                    </div>
                  )}
                </LogEntry>
              ))
            )}
          </LogsContainer>
        </ToolPanel>
      </ToolsGrid>
    </ToolsContainer>
  );
};