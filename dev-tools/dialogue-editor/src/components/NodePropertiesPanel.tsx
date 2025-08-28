import React, { useState } from 'react';
import styled from 'styled-components';
import { DialogueNode } from '../types/DialogueTypes';

const PropertiesContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PropertiesHeader = styled.div`
  background-color: #2d2d30;
  padding: 8px 12px;
  border-bottom: 1px solid #3e3e42;
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
`;

const PropertiesContent = styled.div`
  flex: 1;
  padding: 12px;
  overflow-y: auto;
`;

const PropertyGroup = styled.div`
  margin-bottom: 16px;
`;

const GroupTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #3e3e42;
  padding-bottom: 4px;
`;

const PropertyRow = styled.div`
  margin-bottom: 8px;
`;

const PropertyLabel = styled.label`
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  color: #cccccc;
`;

const PropertyInput = styled.input`
  width: 100%;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  font-size: 11px;
  padding: 6px 8px;

  &:focus {
    border-color: #007acc;
    background-color: #404040;
    outline: none;
  }
`;

const PropertyTextarea = styled.textarea`
  width: 100%;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  font-size: 11px;
  padding: 6px 8px;
  resize: vertical;
  min-height: 60px;

  &:focus {
    border-color: #007acc;
    background-color: #404040;
    outline: none;
  }
`;

const PropertySelect = styled.select`
  width: 100%;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  font-size: 11px;
  padding: 6px 8px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const ChoicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ChoiceItem = styled.div`
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 8px;
`;

const ChoiceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const DeleteButton = styled.button`
  background-color: #d73a49;
  color: white;
  border: none;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  cursor: pointer;

  &:hover {
    background-color: #e74c3c;
  }
`;

const AddButton = styled.button`
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  width: 100%;

  &:hover {
    background-color: #1177bb;
  }
`;

const NoSelectionMessage = styled.div`
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 40px 20px;
`;

interface NodePropertiesPanelProps {
  selectedNode: DialogueNode | null;
  onUpdateNode: (nodeId: string, newData: any) => void;
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode,
  onUpdateNode,
}) => {
  if (!selectedNode) {
    return (
      <PropertiesContainer>
        <PropertiesHeader>Node Properties</PropertiesHeader>
        <PropertiesContent>
          <NoSelectionMessage>
            Select a node to edit its properties
          </NoSelectionMessage>
        </PropertiesContent>
      </PropertiesContainer>
    );
  }

  const handlePropertyChange = (property: string, value: any) => {
    onUpdateNode(selectedNode.id, { [property]: value });
  };

  const handleChoiceUpdate = (choiceIndex: number, property: string, value: string) => {
    const choices = [...(selectedNode.data.choices || [])];
    choices[choiceIndex] = { ...choices[choiceIndex], [property]: value };
    handlePropertyChange('choices', choices);
  };

  const addChoice = () => {
    const choices = [...(selectedNode.data.choices || [])];
    choices.push({
      id: Math.random().toString(36).substr(2, 9),
      text: 'New Choice',
      condition: '',
    });
    handlePropertyChange('choices', choices);
  };

  const deleteChoice = (choiceIndex: number) => {
    const choices = [...(selectedNode.data.choices || [])];
    choices.splice(choiceIndex, 1);
    handlePropertyChange('choices', choices);
  };

  const renderDialogueProperties = () => (
    <>
      <PropertyGroup>
        <GroupTitle>Character</GroupTitle>
        <PropertyRow>
          <PropertyLabel>Character Name:</PropertyLabel>
          <PropertyInput
            value={selectedNode.data.character || ''}
            onChange={(e) => handlePropertyChange('character', e.target.value)}
            placeholder="Professor Oak"
          />
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Portrait:</PropertyLabel>
          <PropertyInput
            value={selectedNode.data.portrait || ''}
            onChange={(e) => handlePropertyChange('portrait', e.target.value)}
            placeholder="path/to/portrait.png"
          />
        </PropertyRow>
      </PropertyGroup>

      <PropertyGroup>
        <GroupTitle>Dialogue</GroupTitle>
        <PropertyRow>
          <PropertyLabel>Text:</PropertyLabel>
          <PropertyTextarea
            value={selectedNode.data.text || ''}
            onChange={(e) => handlePropertyChange('text', e.target.value)}
            placeholder="Enter dialogue text..."
          />
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Voice File:</PropertyLabel>
          <PropertyInput
            value={selectedNode.data.voiceFile || ''}
            onChange={(e) => handlePropertyChange('voiceFile', e.target.value)}
            placeholder="path/to/voice.mp3"
          />
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Animation:</PropertyLabel>
          <PropertySelect
            value={selectedNode.data.animation || ''}
            onChange={(e) => handlePropertyChange('animation', e.target.value)}
          >
            <option value="">None</option>
            <option value="happy">Happy</option>
            <option value="sad">Sad</option>
            <option value="angry">Angry</option>
            <option value="surprised">Surprised</option>
            <option value="thinking">Thinking</option>
          </PropertySelect>
        </PropertyRow>
      </PropertyGroup>
    </>
  );

  const renderPlayerChoiceProperties = () => (
    <PropertyGroup>
      <GroupTitle>Player Choices</GroupTitle>
      <ChoicesList>
        {(selectedNode.data.choices || []).map((choice: any, index: number) => (
          <ChoiceItem key={choice.id}>
            <ChoiceHeader>
              <span style={{ fontSize: '10px', color: '#999' }}>Choice {index + 1}</span>
              <DeleteButton onClick={() => deleteChoice(index)}>×</DeleteButton>
            </ChoiceHeader>
            <PropertyRow>
              <PropertyLabel>Text:</PropertyLabel>
              <PropertyInput
                value={choice.text}
                onChange={(e) => handleChoiceUpdate(index, 'text', e.target.value)}
                placeholder="Choice text"
              />
            </PropertyRow>
            <PropertyRow>
              <PropertyLabel>Condition:</PropertyLabel>
              <PropertyInput
                value={choice.condition || ''}
                onChange={(e) => handleChoiceUpdate(index, 'condition', e.target.value)}
                placeholder="player.level >= 5"
              />
            </PropertyRow>
          </ChoiceItem>
        ))}
      </ChoicesList>
      <AddButton onClick={addChoice}>Add Choice</AddButton>
    </PropertyGroup>
  );

  const renderConditionProperties = () => (
    <PropertyGroup>
      <GroupTitle>Condition</GroupTitle>
      <PropertyRow>
        <PropertyLabel>Type:</PropertyLabel>
        <PropertySelect
          value={selectedNode.data.conditionType || 'custom'}
          onChange={(e) => handlePropertyChange('conditionType', e.target.value)}
        >
          <option value="item">Item Check</option>
          <option value="quest">Quest Status</option>
          <option value="stat">Player Stat</option>
          <option value="variable">Variable</option>
          <option value="custom">Custom</option>
        </PropertySelect>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Condition:</PropertyLabel>
        <PropertyTextarea
          value={selectedNode.data.condition || ''}
          onChange={(e) => handlePropertyChange('condition', e.target.value)}
          placeholder="player.hasItem('pokeball')"
        />
      </PropertyRow>
    </PropertyGroup>
  );

  const renderEventProperties = () => (
    <PropertyGroup>
      <GroupTitle>Event</GroupTitle>
      <PropertyRow>
        <PropertyLabel>Event Type:</PropertyLabel>
        <PropertySelect
          value={selectedNode.data.eventType || 'custom'}
          onChange={(e) => handlePropertyChange('eventType', e.target.value)}
        >
          <option value="give_item">Give Item</option>
          <option value="start_quest">Start Quest</option>
          <option value="complete_quest">Complete Quest</option>
          <option value="start_battle">Start Battle</option>
          <option value="change_variable">Change Variable</option>
          <option value="play_sound">Play Sound</option>
          <option value="custom">Custom</option>
        </PropertySelect>
      </PropertyRow>
      <PropertyRow>
        <PropertyLabel>Event Data:</PropertyLabel>
        <PropertyTextarea
          value={JSON.stringify(selectedNode.data.eventData || {}, null, 2)}
          onChange={(e) => {
            try {
              const eventData = JSON.parse(e.target.value);
              handlePropertyChange('eventData', eventData);
            } catch (error) {
              // Invalid JSON, don't update
            }
          }}
          placeholder='{"item": "pokeball", "quantity": 1}'
        />
      </PropertyRow>
    </PropertyGroup>
  );

  const renderNodeTypeProperties = () => {
    switch (selectedNode.type) {
      case 'dialogue':
        return renderDialogueProperties();
      case 'player_choice':
        return renderPlayerChoiceProperties();
      case 'condition':
        return renderConditionProperties();
      case 'event':
        return renderEventProperties();
      default:
        return null;
    }
  };

  return (
    <PropertiesContainer>
      <PropertiesHeader>
        Properties - {selectedNode.type}
      </PropertiesHeader>
      <PropertiesContent>
        <PropertyGroup>
          <GroupTitle>General</GroupTitle>
          <PropertyRow>
            <PropertyLabel>Node ID:</PropertyLabel>
            <PropertyInput
              value={selectedNode.id}
              disabled
              style={{ opacity: 0.6 }}
            />
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Label:</PropertyLabel>
            <PropertyInput
              value={selectedNode.data.label || ''}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              placeholder="Node label"
            />
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Description:</PropertyLabel>
            <PropertyTextarea
              value={selectedNode.data.description || ''}
              onChange={(e) => handlePropertyChange('description', e.target.value)}
              placeholder="Node description for documentation"
            />
          </PropertyRow>
        </PropertyGroup>

        {renderNodeTypeProperties()}
      </PropertiesContent>
    </PropertiesContainer>
  );
};