import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Pokemon } from '../types/PokemonTypes';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const Panel = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 16px;
`;

const PanelTitle = styled.h3`
  color: #ffffff;
  font-size: 14px;
  margin: 0 0 12px 0;
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

const Checkbox = styled.input`
  margin-right: 8px;
`;

const CheckboxLabel = styled.label`
  color: #cccccc;
  font-size: 12px;
  display: flex;
  align-items: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #999999;
  font-size: 14px;
  gap: 8px;
`;

interface PokemonEditorProps {
  pokemon: Pokemon | null;
  onUpdatePokemon: (updates: Partial<Pokemon>) => void;
}

export const PokemonEditor: React.FC<PokemonEditorProps> = ({
  pokemon,
  onUpdatePokemon
}) => {
  const [editedPokemon, setEditedPokemon] = useState<Pokemon | null>(null);

  useEffect(() => {
    setEditedPokemon(pokemon);
  }, [pokemon]);

  if (!pokemon || !editedPokemon) {
    return (
      <EditorContainer>
        <EmptyState>
          <div>No Pokemon Selected</div>
          <div style={{ fontSize: '12px' }}>
            Select a Pokemon from the browser to edit its details
          </div>
        </EmptyState>
      </EditorContainer>
    );
  }

  const handleChange = (field: keyof Pokemon, value: any) => {
    const updated = { ...editedPokemon, [field]: value };
    setEditedPokemon(updated);
    onUpdatePokemon({ [field]: value });
  };

  const handleNestedChange = (path: string, value: any) => {
    const keys = path.split('.');
    const updated = { ...editedPokemon };
    let current: any = updated;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setEditedPokemon(updated);
    onUpdatePokemon(updated);
  };

  return (
    <EditorContainer>
      <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>
        Editing: {editedPokemon.name}
      </h2>

      <EditorGrid>
        <Panel>
          <PanelTitle>Basic Information</PanelTitle>
          
          <FormGroup>
            <Label>Name</Label>
            <Input
              type="text"
              value={editedPokemon.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Species</Label>
            <Input
              type="text"
              value={editedPokemon.species}
              onChange={(e) => handleChange('species', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Category</Label>
            <Input
              type="text"
              value={editedPokemon.category}
              onChange={(e) => handleChange('category', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              value={editedPokemon.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Generation</Label>
            <Select
              value={editedPokemon.generation}
              onChange={(e) => handleChange('generation', parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(gen => (
                <option key={gen} value={gen}>Generation {gen}</option>
              ))}
            </Select>
          </FormGroup>
        </Panel>

        <Panel>
          <PanelTitle>Physical Attributes</PanelTitle>
          
          <FormGroup>
            <Label>Height (m)</Label>
            <Input
              type="number"
              step="0.1"
              value={editedPokemon.height}
              onChange={(e) => handleChange('height', parseFloat(e.target.value))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={editedPokemon.weight}
              onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Base Experience</Label>
            <Input
              type="number"
              value={editedPokemon.baseExperience}
              onChange={(e) => handleChange('baseExperience', parseInt(e.target.value))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Capture Rate</Label>
            <Input
              type="number"
              min="1"
              max="255"
              value={editedPokemon.captureRate}
              onChange={(e) => handleChange('captureRate', parseInt(e.target.value))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Base Friendship</Label>
            <Input
              type="number"
              min="0"
              max="255"
              value={editedPokemon.baseFriendship}
              onChange={(e) => handleChange('baseFriendship', parseInt(e.target.value))}
            />
          </FormGroup>
        </Panel>

        <Panel>
          <PanelTitle>Gender & Breeding</PanelTitle>
          
          <FormGroup>
            <Label>Male Ratio (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={editedPokemon.genderRatio.male}
              onChange={(e) => handleNestedChange('genderRatio.male', parseFloat(e.target.value))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Female Ratio (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={editedPokemon.genderRatio.female}
              onChange={(e) => handleNestedChange('genderRatio.female', parseFloat(e.target.value))}
            />
          </FormGroup>

          <FormGroup>
            <CheckboxLabel>
              <Checkbox
                type="checkbox"
                checked={editedPokemon.genderRatio.genderless}
                onChange={(e) => handleNestedChange('genderRatio.genderless', e.target.checked)}
              />
              Genderless
            </CheckboxLabel>
          </FormGroup>

          <FormGroup>
            <Label>Egg Groups</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {editedPokemon.eggGroups.map((group, index) => (
                <Input
                  key={index}
                  type="text"
                  value={group.name}
                  onChange={(e) => {
                    const newEggGroups = [...editedPokemon.eggGroups];
                    newEggGroups[index] = { ...group, name: e.target.value };
                    handleChange('eggGroups', newEggGroups);
                  }}
                />
              ))}
            </div>
          </FormGroup>
        </Panel>

        <Panel>
          <PanelTitle>Special Properties</PanelTitle>
          
          <FormGroup>
            <CheckboxLabel>
              <Checkbox
                type="checkbox"
                checked={editedPokemon.isLegendary}
                onChange={(e) => handleChange('isLegendary', e.target.checked)}
              />
              Legendary Pokemon
            </CheckboxLabel>
          </FormGroup>

          <FormGroup>
            <CheckboxLabel>
              <Checkbox
                type="checkbox"
                checked={editedPokemon.isMythical}
                onChange={(e) => handleChange('isMythical', e.target.checked)}
              />
              Mythical Pokemon
            </CheckboxLabel>
          </FormGroup>

          <FormGroup>
            <Label>Growth Rate</Label>
            <Select
              value={editedPokemon.growthRate.name}
              onChange={(e) => handleNestedChange('growthRate.name', e.target.value)}
            >
              <option value="slow">Slow</option>
              <option value="medium-slow">Medium Slow</option>
              <option value="medium">Medium</option>
              <option value="medium-fast">Medium Fast</option>
              <option value="fast">Fast</option>
              <option value="erratic">Erratic</option>
              <option value="fluctuating">Fluctuating</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Spawn Rate</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={editedPokemon.gameData.rarity.spawnRate}
              onChange={(e) => handleNestedChange('gameData.rarity.spawnRate', parseFloat(e.target.value))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Rarity Tier</Label>
            <Select
              value={editedPokemon.gameData.rarity.tier}
              onChange={(e) => handleNestedChange('gameData.rarity.tier', e.target.value)}
            >
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="very-rare">Very Rare</option>
              <option value="legendary">Legendary</option>
              <option value="mythical">Mythical</option>
            </Select>
          </FormGroup>
        </Panel>
      </EditorGrid>
    </EditorContainer>
  );
};