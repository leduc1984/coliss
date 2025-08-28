import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminUser } from '../types/AdminTypes';

const EventsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const EventsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  color: #ffffff;
  font-size: 18px;
  margin: 0;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 8px;
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

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    background-color: #5a5a5a;
    cursor: not-allowed;
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: calc(100% - 60px);
`;

const Panel = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div`
  background-color: #2d2d30;
  padding: 8px 12px;
  border-bottom: 1px solid #3e3e42;
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 12px;
  overflow-y: auto;
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EventItem = styled.div<{ status: 'active' | 'scheduled' | 'completed' | 'cancelled' }>`
  padding: 12px;
  background-color: ${props => {
    switch (props.status) {
      case 'active': return '#1e4f1e';
      case 'scheduled': return '#1e3a4f';
      case 'completed': return '#3e3e42';
      case 'cancelled': return '#4f1e1e';
      default: return '#3c3c3c';
    }
  }};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'active': return '#4caf50';
      case 'scheduled': return '#2196f3';
      case 'completed': return '#666666';
      case 'cancelled': return '#f44336';
      default: return '#5e5e5e';
    }
  }};
  border-radius: 4px;
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const EventName = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
`;

const EventStatus = styled.div<{ status: string }>`
  background-color: ${props => {
    switch (props.status) {
      case 'active': return '#4caf50';
      case 'scheduled': return '#2196f3';
      case 'completed': return '#666666';
      case 'cancelled': return '#f44336';
      default: return '#999999';
    }
  }};
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  text-transform: uppercase;
`;

const EventDetails = styled.div`
  color: #cccccc;
  font-size: 11px;
  margin-bottom: 8px;
`;

const EventActions = styled.div`
  display: flex;
  gap: 4px;
`;

const SmallButton = styled.button<{ variant?: 'danger' | 'warning' | 'success' }>`
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
  padding: 4px 8px;
  border-radius: 2px;
  font-size: 10px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    background-color: #5a5a5a;
    cursor: not-allowed;
  }
`;

const CreateEventModal = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 20px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h3`
  color: #ffffff;
  font-size: 16px;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;

  &:hover {
    color: #ffffff;
  }
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
  min-height: 80px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const EventMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
`;

const MetricCard = styled.div`
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 8px;
  text-align: center;
`;

const MetricValue = styled.div`
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
`;

const MetricLabel = styled.div`
  color: #999999;
  font-size: 10px;
  text-transform: uppercase;
`;

interface WorldEventsProps {
  user: AdminUser;
}

interface WorldEvent {
  id: string;
  name: string;
  type: 'rare_spawn' | 'double_xp' | 'special_battle' | 'tournament' | 'legendary_appearance' | 'community_challenge';
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  startTime: Date;
  endTime: Date;
  description: string;
  participants: number;
  rewards: string[];
  location?: string;
  creator: string;
}

interface EventTemplate {
  id: string;
  name: string;
  type: WorldEvent['type'];
  description: string;
  defaultDuration: number; // in minutes
  requirements: string[];
}

export const WorldEvents: React.FC<WorldEventsProps> = ({ user }) => {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    type: 'rare_spawn' as WorldEvent['type'],
    description: '',
    startTime: '',
    duration: '60',
    location: '',
    rewards: ''
  });

  const eventTemplates: EventTemplate[] = [
    {
      id: 'rare_spawn',
      name: 'Rare Pokemon Spawn',
      type: 'rare_spawn',
      description: 'Spawn rare Pokemon in specific locations',
      defaultDuration: 60,
      requirements: ['Valid spawn location', 'Pokemon ID']
    },
    {
      id: 'double_xp',
      name: 'Double XP Weekend',
      type: 'double_xp',
      description: 'Players receive double experience points',
      defaultDuration: 180,
      requirements: ['Experience multiplier settings']
    },
    {
      id: 'tournament',
      name: 'Battle Tournament',
      type: 'tournament',
      description: 'Organized PvP tournament with brackets',
      defaultDuration: 240,
      requirements: ['Tournament bracket system', 'Prize pool']
    },
    {
      id: 'legendary',
      name: 'Legendary Appearance',
      type: 'legendary_appearance',
      description: 'Legendary Pokemon appears for capture',
      defaultDuration: 30,
      requirements: ['Legendary Pokemon ID', 'Spawn coordinates']
    }
  ];

  // Mock events data
  useEffect(() => {
    const mockEvents: WorldEvent[] = [
      {
        id: '1',
        name: 'Shiny Charizard Hunt',
        type: 'rare_spawn',
        status: 'active',
        startTime: new Date(Date.now() - 1800000), // 30 minutes ago
        endTime: new Date(Date.now() + 1800000), // 30 minutes from now
        description: 'Shiny Charizard has been spotted in Mt. Silver! Hurry before it disappears!',
        participants: 47,
        rewards: ['Shiny Charizard', 'Master Ball', '10000 EXP'],
        location: 'Mt. Silver',
        creator: 'GameMaster'
      },
      {
        id: '2',
        name: 'Weekend XP Boost',
        type: 'double_xp',
        status: 'scheduled',
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        endTime: new Date(Date.now() + 259200000), // 3 days from now
        description: 'Enjoy 2x experience points all weekend long!',
        participants: 0,
        rewards: ['Double XP'],
        creator: 'EventManager'
      },
      {
        id: '3',
        name: 'Gym Leader Challenge',
        type: 'tournament',
        status: 'completed',
        startTime: new Date(Date.now() - 86400000), // 1 day ago
        endTime: new Date(Date.now() - 3600000), // 1 hour ago
        description: 'Monthly tournament to challenge the Elite Four',
        participants: 128,
        rewards: ['Champion Title', 'Rare Candy x50', 'Master Ball x3'],
        creator: 'TournamentBot'
      }
    ];

    setEvents(mockEvents);
  }, []);

  const activeEvents = events.filter(e => e.status === 'active');
  const scheduledEvents = events.filter(e => e.status === 'scheduled');
  const totalParticipants = activeEvents.reduce((sum, e) => sum + e.participants, 0);

  const handleCreateEvent = () => {
    if (!newEvent.name || !newEvent.startTime) return;

    const startTime = new Date(newEvent.startTime);
    const endTime = new Date(startTime.getTime() + parseInt(newEvent.duration) * 60000);

    const event: WorldEvent = {
      id: Date.now().toString(),
      name: newEvent.name,
      type: newEvent.type,
      status: startTime <= new Date() ? 'active' : 'scheduled',
      startTime,
      endTime,
      description: newEvent.description,
      participants: 0,
      rewards: newEvent.rewards.split(',').map(r => r.trim()).filter(r => r),
      location: newEvent.location || undefined,
      creator: user.username
    };

    setEvents(prev => [...prev, event]);
    setShowCreateModal(false);
    setNewEvent({
      name: '',
      type: 'rare_spawn',
      description: '',
      startTime: '',
      duration: '60',
      location: '',
      rewards: ''
    });
  };

  const handleEventAction = (eventId: string, action: 'start' | 'stop' | 'cancel' | 'extend') => {
    setEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event;

      switch (action) {
        case 'start':
          return { ...event, status: 'active' as const, startTime: new Date() };
        case 'stop':
          return { ...event, status: 'completed' as const, endTime: new Date() };
        case 'cancel':
          return { ...event, status: 'cancelled' as const };
        case 'extend':
          return { ...event, endTime: new Date(event.endTime.getTime() + 3600000) }; // +1 hour
        default:
          return event;
      }
    }));
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleString();
  };

  const getTimeRemaining = (endTime: Date): string => {
    const remaining = endTime.getTime() - Date.now();
    if (remaining <= 0) return 'Ended';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <EventsContainer>
      <EventsHeader>
        <Title>World Events</Title>
        <HeaderButtons>
          <Button onClick={() => setShowCreateModal(true)}>
            ➕ Create Event
          </Button>
          <Button variant="warning" onClick={() => {
            if (window.confirm('Stop all active events?')) {
              setEvents(prev => prev.map(e => 
                e.status === 'active' ? { ...e, status: 'completed' as const } : e
              ));
            }
          }}>
            ⏹️ Stop All
          </Button>
        </HeaderButtons>
      </EventsHeader>

      <EventMetrics>
        <MetricCard>
          <MetricValue>{activeEvents.length}</MetricValue>
          <MetricLabel>Active Events</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{scheduledEvents.length}</MetricValue>
          <MetricLabel>Scheduled</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{totalParticipants}</MetricValue>
          <MetricLabel>Participants</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{events.filter(e => e.status === 'completed').length}</MetricValue>
          <MetricLabel>Completed Today</MetricLabel>
        </MetricCard>
      </EventMetrics>

      <EventsGrid>
        <Panel>
          <PanelHeader>
            Active & Scheduled Events
            <span>{activeEvents.length + scheduledEvents.length} events</span>
          </PanelHeader>
          <PanelContent>
            <EventList>
              {[...activeEvents, ...scheduledEvents].map(event => (
                <EventItem key={event.id} status={event.status}>
                  <EventHeader>
                    <EventName>{event.name}</EventName>
                    <EventStatus status={event.status}>
                      {event.status}
                    </EventStatus>
                  </EventHeader>
                  
                  <EventDetails>
                    <div>{event.description}</div>
                    <div style={{ marginTop: '4px' }}>
                      <strong>Start:</strong> {formatTime(event.startTime)}
                    </div>
                    <div>
                      <strong>End:</strong> {formatTime(event.endTime)}
                    </div>
                    {event.location && (
                      <div>
                        <strong>Location:</strong> {event.location}
                      </div>
                    )}
                    <div>
                      <strong>Participants:</strong> {event.participants}
                    </div>
                    {event.status === 'active' && (
                      <div style={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {getTimeRemaining(event.endTime)}
                      </div>
                    )}
                  </EventDetails>

                  <EventActions>
                    {event.status === 'scheduled' && (
                      <SmallButton 
                        variant="success"
                        onClick={() => handleEventAction(event.id, 'start')}
                      >
                        Start Now
                      </SmallButton>
                    )}
                    {event.status === 'active' && (
                      <>
                        <SmallButton 
                          onClick={() => handleEventAction(event.id, 'extend')}
                        >
                          Extend +1h
                        </SmallButton>
                        <SmallButton 
                          variant="warning"
                          onClick={() => handleEventAction(event.id, 'stop')}
                        >
                          Stop
                        </SmallButton>
                      </>
                    )}
                    <SmallButton 
                      variant="danger"
                      onClick={() => handleEventAction(event.id, 'cancel')}
                    >
                      Cancel
                    </SmallButton>
                  </EventActions>
                </EventItem>
              ))}
              
              {activeEvents.length === 0 && scheduledEvents.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999999', 
                  padding: '20px',
                  fontSize: '12px'
                }}>
                  No active or scheduled events
                </div>
              )}
            </EventList>
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            Event History
            <span>{events.filter(e => e.status === 'completed' || e.status === 'cancelled').length} completed</span>
          </PanelHeader>
          <PanelContent>
            <EventList>
              {events
                .filter(e => e.status === 'completed' || e.status === 'cancelled')
                .map(event => (
                  <EventItem key={event.id} status={event.status}>
                    <EventHeader>
                      <EventName>{event.name}</EventName>
                      <EventStatus status={event.status}>
                        {event.status}
                      </EventStatus>
                    </EventHeader>
                    
                    <EventDetails>
                      <div>{event.description}</div>
                      <div style={{ marginTop: '4px' }}>
                        <strong>Duration:</strong> {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </div>
                      <div>
                        <strong>Final Participants:</strong> {event.participants}
                      </div>
                      <div>
                        <strong>Created by:</strong> {event.creator}
                      </div>
                    </EventDetails>
                  </EventItem>
                ))}
            </EventList>
          </PanelContent>
        </Panel>
      </EventsGrid>

      <CreateEventModal show={showCreateModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Create New Event</ModalTitle>
            <CloseButton onClick={() => setShowCreateModal(false)}>
              ×
            </CloseButton>
          </ModalHeader>

          <FormGroup>
            <Label>Event Name</Label>
            <Input
              type="text"
              value={newEvent.name}
              onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter event name..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Event Type</Label>
            <Select
              value={newEvent.type}
              onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as WorldEvent['type'] }))}
            >
              {eventTemplates.map(template => (
                <option key={template.id} value={template.type}>
                  {template.name}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the event..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Start Time</Label>
            <Input
              type="datetime-local"
              value={newEvent.startTime}
              onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={newEvent.duration}
              onChange={(e) => setNewEvent(prev => ({ ...prev, duration: e.target.value }))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Location (optional)</Label>
            <Input
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Event location..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Rewards (comma-separated)</Label>
            <Input
              type="text"
              value={newEvent.rewards}
              onChange={(e) => setNewEvent(prev => ({ ...prev, rewards: e.target.value }))}
              placeholder="Shiny Pokemon, Master Ball, 5000 EXP"
            />
          </FormGroup>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="success"
              onClick={handleCreateEvent}
              disabled={!newEvent.name || !newEvent.startTime}
            >
              Create Event
            </Button>
          </div>
        </ModalContent>
      </CreateEventModal>
    </EventsContainer>
  );
};