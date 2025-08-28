import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import styled from 'styled-components';

const NodeContainer = styled.div`
  background-color: #4a2d2d;
  border: 2px solid #7c4a4a;
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  max-width: 300px;
  position: relative;
`;

const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 12px;
  color: #d8a8a8;
`;

const NodeIcon = styled.div`
  width: 16px;
  height: 16px;
  background-color: #7c4a4a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
`;

const EventType = styled.div`
  font-size: 10px;
  color: #d8a8a8;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 500;
`;

const EventDescription = styled.div`
  font-size: 11px;
  color: #cccccc;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 6px 8px;
  border-radius: 4px;
  border-left: 3px solid #7c4a4a;
  word-wrap: break-word;
  max-height: 80px;
  overflow: hidden;
`;

const EventData = styled.div`
  font-size: 9px;
  color: #d8a8a8;
  margin-top: 4px;
  font-family: 'Courier New', monospace;
`;

interface EventNodeProps {
  data: {
    label?: string;
    eventType?: 'give_item' | 'start_quest' | 'complete_quest' | 'start_battle' | 'change_variable' | 'play_sound' | 'custom';
    eventData?: Record<string, any>;
  };
  selected: boolean;
}

export const EventNode: React.FC<EventNodeProps> = ({ data, selected }) => {
  const eventType = data.eventType || 'custom';
  const eventData = data.eventData || {};

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'give_item': return '🎁';
      case 'start_quest': return '📋';
      case 'complete_quest': return '✅';
      case 'start_battle': return '⚔️';
      case 'change_variable': return '🔧';
      case 'play_sound': return '🔊';
      default: return '⚡';
    }
  };

  const getEventDescription = (type: string, data: Record<string, any>) => {
    switch (type) {
      case 'give_item':
        return `Give ${data.quantity || 1}x ${data.item || 'item'}`;
      case 'start_quest':
        return `Start quest: ${data.quest || 'quest_id'}`;
      case 'complete_quest':
        return `Complete quest: ${data.quest || 'quest_id'}`;
      case 'start_battle':
        return `Battle: ${data.trainer || data.pokemon || 'opponent'}`;
      case 'change_variable':
        return `Set ${data.variable || 'var'} = ${data.value || 'value'}`;
      case 'play_sound':
        return `Play: ${data.sound || 'sound.mp3'}`;
      default:
        return `Custom event: ${data.action || 'action'}`;
    }
  };

  return (
    <NodeContainer style={{ 
      borderColor: selected ? '#007acc' : '#7c4a4a',
      boxShadow: selected ? '0 0 0 2px rgba(0, 122, 204, 0.3)' : 'none'
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#7c4a4a',
          border: '2px solid #d8a8a8',
          width: 10,
          height: 10,
        }}
      />
      
      <NodeHeader>
        <NodeIcon>⚡</NodeIcon>
        <span>Event</span>
      </NodeHeader>
      
      <EventType>
        {getEventTypeIcon(eventType)} {eventType.replace('_', ' ')}
      </EventType>
      
      <EventDescription>
        {getEventDescription(eventType, eventData)}
      </EventDescription>
      
      {Object.keys(eventData).length > 0 && (
        <EventData>
          {JSON.stringify(eventData, null, 2).slice(0, 100)}
          {JSON.stringify(eventData).length > 100 ? '...' : ''}
        </EventData>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#7c4a4a',
          border: '2px solid #d8a8a8',
          width: 10,
          height: 10,
        }}
      />
    </NodeContainer>
  );
};