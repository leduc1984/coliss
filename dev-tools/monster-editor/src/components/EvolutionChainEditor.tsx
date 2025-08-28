import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Pokemon, EvolutionChain, EvolutionSpecies, EvolutionDetail } from '../types/PokemonTypes';

const ChainContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const ChainHeader = styled.div`
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

const ChainVisualizer = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 16px;
  min-height: 400px;
  position: relative;
  overflow: auto;
`;

const EvolutionLevel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 20px 0;
  position: relative;
`;

const PokemonNode = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background-color: ${props => props.selected ? '#094771' : '#3c3c3c'};
  border: 2px solid ${props => props.selected ? '#007acc' : '#5e5e5e'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;

  &:hover {
    background-color: ${props => props.selected ? '#0a5f8a' : '#4a4a4a'};
    border-color: ${props => props.selected ? '#1177bb' : '#6e6e6e'};
  }
`;

const PokemonSprite = styled.div`
  width: 60px;
  height: 60px;
  background-color: #2d2d30;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
`;

const PokemonName = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
`;

const PokemonId = styled.div`
  color: #999999;
  font-size: 10px;
  text-align: center;
`;

const EvolutionArrow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 10px;
`;

const Arrow = styled.div`
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 12px solid #cccccc;
  transform: rotate(-90deg);
  margin: 4px;
`;

const EvolutionCondition = styled.div`
  background-color: #2d2d30;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 10px;
  color: #cccccc;
  text-align: center;
  margin: 2px 0;
  white-space: nowrap;
`;

const ControlPanel = styled.div`
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

const Button = styled.button`
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;

  &:hover {
    background-color: #1177bb;
  }

  &:disabled {
    background-color: #5a5a5a;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(Button)`
  background-color: #d73a49;

  &:hover {
    background-color: #e74c3c;
  }
`;

const ConditionsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  padding: 8px;
`;

const ConditionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid #3e3e42;

  &:last-child {
    border-bottom: none;
  }
`;

const ConditionText = styled.span`
  color: #cccccc;
  font-size: 11px;
  flex: 1;
`;

const RemoveButton = styled.button`
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

interface EvolutionChainEditorProps {
  pokemon: Pokemon | null;
  pokemonList: Pokemon[];
  onUpdateEvolution: (updates: Partial<EvolutionChain>) => void;
}

export const EvolutionChainEditor: React.FC<EvolutionChainEditorProps> = ({
  pokemon,
  pokemonList,
  onUpdateEvolution
}) => {
  const [selectedPokemon, setSelectedPokemon] = useState<number | null>(null);
  const [newCondition, setNewCondition] = useState({
    trigger: '',
    minLevel: '',
    item: '',
    move: '',
    location: '',
    timeOfDay: '',
    weather: '',
    friendship: '',
    beauty: '',
    affection: '',
    gender: '',
    heldItem: '',
    tradeSpecies: '',
  });

  const evolutionChain = pokemon?.evolution?.evolutionChain;

  const renderEvolutionSpecies = useCallback((species: EvolutionSpecies, level: number = 0): React.ReactNode => {
    return (
      <div key={`${species.id}-${level}`}>
        <EvolutionLevel>
          <PokemonNode 
            selected={selectedPokemon === species.id}
            onClick={() => setSelectedPokemon(species.id)}
          >
            <PokemonSprite>
              {pokemonList.find(p => p.id === species.id)?.name?.[0] || '?'}
            </PokemonSprite>
            <PokemonName>{species.name}</PokemonName>
            <PokemonId>#{species.id}</PokemonId>
          </PokemonNode>
          
          {species.evolvesTo.map((evolution, index) => (
            <div key={evolution.id} style={{ display: 'flex', alignItems: 'center' }}>
              <EvolutionArrow>
                <Arrow />
                {evolution.evolutionDetails.map((detail, detailIndex) => (
                  <EvolutionCondition key={detailIndex}>
                    {formatEvolutionCondition(detail)}
                  </EvolutionCondition>
                ))}
              </EvolutionArrow>
              <PokemonNode 
                selected={selectedPokemon === evolution.id}
                onClick={() => setSelectedPokemon(evolution.id)}
              >
                <PokemonSprite>
                  {pokemonList.find(p => p.id === evolution.id)?.name?.[0] || '?'}
                </PokemonSprite>
                <PokemonName>{evolution.name}</PokemonName>
                <PokemonId>#{evolution.id}</PokemonId>
              </PokemonNode>
            </div>
          ))}
        </EvolutionLevel>
        
        {species.evolvesTo.map(evolution => 
          renderEvolutionSpecies(evolution, level + 1)
        )}
      </div>
    );
  }, [selectedPokemon, pokemonList]);

  const formatEvolutionCondition = (detail: EvolutionDetail): string => {
    const conditions: string[] = [];
    
    if (detail.minLevel) conditions.push(`Lv.${detail.minLevel}`);
    if (detail.item) conditions.push(`${detail.item.name}`);
    if (detail.move) conditions.push(`knows ${detail.move.name}`);
    if (detail.location) conditions.push(`at ${detail.location.name}`);
    if (detail.timeOfDay) conditions.push(`${detail.timeOfDay}`);
    if (detail.weather) conditions.push(`${detail.weather}`);
    if (detail.friendship) conditions.push(`friendship ${detail.friendship}+`);
    if (detail.beauty) conditions.push(`beauty ${detail.beauty}+`);
    if (detail.affection) conditions.push(`affection ${detail.affection}+`);
    if (detail.gender) conditions.push(`${detail.gender} only`);
    if (detail.heldItem) conditions.push(`holding ${detail.heldItem.name}`);
    if (detail.tradeSpecies) conditions.push(`trade for ${detail.tradeSpecies.name}`);

    return conditions.length > 0 ? conditions.join(', ') : detail.trigger?.name || 'Unknown';
  };

  const addEvolutionCondition = () => {
    if (!selectedPokemon || !newCondition.trigger) return;

    const condition: EvolutionDetail = {
      trigger: { id: 1, name: newCondition.trigger },
      ...(newCondition.minLevel && { minLevel: parseInt(newCondition.minLevel) }),
      ...(newCondition.item && { item: { id: 1, name: newCondition.item } }),
      ...(newCondition.move && { move: { id: 1, name: newCondition.move } }),
      ...(newCondition.location && { location: { id: 1, name: newCondition.location } }),
      ...(newCondition.timeOfDay && { timeOfDay: newCondition.timeOfDay }),
      ...(newCondition.weather && { weather: newCondition.weather }),
      ...(newCondition.friendship && { friendship: parseInt(newCondition.friendship) }),
      ...(newCondition.beauty && { beauty: parseInt(newCondition.beauty) }),
      ...(newCondition.affection && { affection: parseInt(newCondition.affection) }),
      ...(newCondition.gender && { gender: newCondition.gender }),
      ...(newCondition.heldItem && { heldItem: { id: 1, name: newCondition.heldItem } }),
      ...(newCondition.tradeSpecies && { tradeSpecies: { id: 1, name: newCondition.tradeSpecies } }),
    };

    // Update the evolution chain with the new condition
    // This is a simplified version - in a real implementation, you'd need to properly update the chain structure
    console.log('Adding evolution condition:', condition);
    
    // Reset form
    setNewCondition({
      trigger: '',
      minLevel: '',
      item: '',
      move: '',
      location: '',
      timeOfDay: '',
      weather: '',
      friendship: '',
      beauty: '',
      affection: '',
      gender: '',
      heldItem: '',
      tradeSpecies: '',
    });
  };

  const selectedPokemonData = pokemonList.find(p => p.id === selectedPokemon);

  if (!pokemon) {
    return (
      <ChainContainer>
        <ChainHeader>
          <Title>Evolution Chain Editor</Title>
          <Description>Select a Pokemon to view and edit its evolution chain.</Description>
        </ChainHeader>
      </ChainContainer>
    );
  }

  return (
    <ChainContainer>
      <ChainHeader>
        <Title>Evolution Chain Editor</Title>
        <Description>
          Manage evolution relationships and conditions for {pokemon.name}.
        </Description>
      </ChainHeader>

      <ChainVisualizer>
        {evolutionChain ? (
          evolutionChain.species.map(species => renderEvolutionSpecies(species))
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#cccccc',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div>No evolution chain defined</div>
            <Button onClick={() => console.log('Create evolution chain')}>
              Create Evolution Chain
            </Button>
          </div>
        )}
      </ChainVisualizer>

      <ControlPanel>
        <Panel>
          <PanelTitle>Selected Pokemon</PanelTitle>
          {selectedPokemonData ? (
            <div>
              <FormGroup>
                <Label>Name: {selectedPokemonData.name}</Label>
                <Label>ID: #{selectedPokemonData.id}</Label>
                <Label>Species: {selectedPokemonData.species}</Label>
              </FormGroup>
              
              <FormGroup>
                <Button onClick={() => console.log('Edit pokemon details')}>
                  Edit Details
                </Button>
                <DangerButton onClick={() => console.log('Remove from chain')}>
                  Remove from Chain
                </DangerButton>
              </FormGroup>
            </div>
          ) : (
            <div style={{ color: '#999999', fontSize: '12px' }}>
              Click on a Pokemon in the evolution chain to select it.
            </div>
          )}
        </Panel>

        <Panel>
          <PanelTitle>Add Evolution Condition</PanelTitle>
          <FormGroup>
            <Label>Evolution Trigger</Label>
            <Select 
              value={newCondition.trigger}
              onChange={(e) => setNewCondition(prev => ({ ...prev, trigger: e.target.value }))}
            >
              <option value="">Select trigger...</option>
              <option value="level-up">Level Up</option>
              <option value="trade">Trade</option>
              <option value="use-item">Use Item</option>
              <option value="shed">Shed</option>
              <option value="spin">Spin</option>
              <option value="tower-of-darkness">Tower of Darkness</option>
              <option value="tower-of-waters">Tower of Waters</option>
              <option value="three-critical-hits">Three Critical Hits</option>
              <option value="take-damage">Take Damage</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Minimum Level</Label>
            <Input
              type="number"
              value={newCondition.minLevel}
              onChange={(e) => setNewCondition(prev => ({ ...prev, minLevel: e.target.value }))}
              placeholder="e.g., 16"
            />
          </FormGroup>

          <FormGroup>
            <Label>Required Item</Label>
            <Input
              value={newCondition.item}
              onChange={(e) => setNewCondition(prev => ({ ...prev, item: e.target.value }))}
              placeholder="e.g., Thunder Stone"
            />
          </FormGroup>

          <FormGroup>
            <Label>Time of Day</Label>
            <Select
              value={newCondition.timeOfDay}
              onChange={(e) => setNewCondition(prev => ({ ...prev, timeOfDay: e.target.value }))}
            >
              <option value="">Any time</option>
              <option value="day">Day</option>
              <option value="night">Night</option>
              <option value="dusk">Dusk</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Minimum Friendship</Label>
            <Input
              type="number"
              value={newCondition.friendship}
              onChange={(e) => setNewCondition(prev => ({ ...prev, friendship: e.target.value }))}
              placeholder="e.g., 220"
            />
          </FormGroup>

          <FormGroup>
            <Button 
              onClick={addEvolutionCondition}
              disabled={!selectedPokemon || !newCondition.trigger}
            >
              Add Condition
            </Button>
          </FormGroup>
        </Panel>
      </ControlPanel>
    </ChainContainer>
  );
};