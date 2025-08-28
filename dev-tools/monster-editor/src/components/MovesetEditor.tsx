import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Pokemon, Moveset, Move } from '../types/PokemonTypes';

const MovesetContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const MovesetTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #3e3e42;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: 8px 16px;
  color: ${props => props.active ? '#ffffff' : '#cccccc'};
  border-bottom: 2px solid ${props => props.active ? '#007acc' : 'transparent'};
  cursor: pointer;
  font-size: 12px;

  &:hover {
    color: #ffffff;
  }
`;

const MovesetPanel = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 16px;
  height: calc(100% - 60px);
  overflow-y: auto;
`;

const MoveList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MoveItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto auto auto auto;
  gap: 12px;
  align-items: center;
  padding: 8px;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 4px;
`;

const MoveLevel = styled.div`
  color: #ffffff;
  font-weight: bold;
  font-size: 12px;
  min-width: 40px;
  text-align: center;
  background-color: #007acc;
  padding: 2px 6px;
  border-radius: 3px;
`;

const MoveName = styled.div`
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
`;

const MoveType = styled.div<{ typeColor: string }>`
  background-color: ${props => props.typeColor};
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  min-width: 60px;
  text-align: center;
`;

const MoveCategory = styled.div<{ category: string }>`
  background-color: ${props => {
    switch (props.category) {
      case 'physical': return '#C03028';
      case 'special': return '#4F5870';
      case 'status': return '#68A090';
      default: return '#666666';
    }
  }};
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  text-transform: uppercase;
  min-width: 50px;
  text-align: center;
`;

const MovePower = styled.div`
  color: #cccccc;
  font-size: 11px;
  text-align: center;
  min-width: 30px;
`;

const MoveAccuracy = styled.div`
  color: #cccccc;
  font-size: 11px;
  text-align: center;
  min-width: 30px;
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

const AddMoveSection = styled.div`
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
`;

const AddMoveForm = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: #cccccc;
  font-size: 11px;
  margin-bottom: 2px;
`;

const Input = styled.input`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 4px 6px;
  font-size: 11px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const Select = styled.select`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 4px 6px;
  font-size: 11px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const Button = styled.button`
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;

  &:hover {
    background-color: #1177bb;
  }

  &:disabled {
    background-color: #5a5a5a;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999999;
  font-size: 12px;
  gap: 8px;
`;

const TMNumber = styled.div`
  color: #ffffff;
  font-weight: bold;
  font-size: 12px;
  min-width: 40px;
  text-align: center;
  background-color: #ff9800;
  padding: 2px 6px;
  border-radius: 3px;
`;

interface MovesetEditorProps {
  pokemon: Pokemon | null;
  onUpdatePokemon: (updates: Partial<Pokemon>) => void;
}

type MovesetTab = 'levelUp' | 'tmMoves' | 'eggMoves' | 'tutorMoves';

// Mock move data - in a real application, this would come from a moves database
const mockMoves: Move[] = [
  { id: 1, name: 'Tackle', type: { id: 1, name: 'Normal', color: '#A8A878' }, category: 'physical', power: 40, accuracy: 100, pp: 35, description: 'A physical attack in which the user charges and slams into the target with its whole body.' },
  { id: 45, name: 'Growl', type: { id: 1, name: 'Normal', color: '#A8A878' }, category: 'status', power: null, accuracy: 100, pp: 40, description: 'The user growls in an endearing way, making opposing Pokemon less wary.' },
  { id: 22, name: 'Vine Whip', type: { id: 12, name: 'Grass', color: '#78C850' }, category: 'physical', power: 45, accuracy: 100, pp: 25, description: 'The target is struck with slender, whiplike vines to inflict damage.' },
  { id: 6, name: 'Toxic', type: { id: 4, name: 'Poison', color: '#A040A0' }, category: 'status', power: null, accuracy: 90, pp: 10, description: 'A move that leaves the target badly poisoned.' },
  { id: 9, name: 'Take Down', type: { id: 1, name: 'Normal', color: '#A8A878' }, category: 'physical', power: 90, accuracy: 85, pp: 20, description: 'A reckless, full-body charge attack that also hurts the user a little.' },
];

export const MovesetEditor: React.FC<MovesetEditorProps> = ({
  pokemon,
  onUpdatePokemon
}) => {
  const [activeTab, setActiveTab] = useState<MovesetTab>('levelUp');
  const [newMove, setNewMove] = useState({
    moveId: '',
    level: '',
    tmNumber: '',
  });

  if (!pokemon) {
    return (
      <MovesetContainer>
        <EmptyState>
          <div>No Pokemon Selected</div>
          <div>Select a Pokemon to edit its moveset</div>
        </EmptyState>
      </MovesetContainer>
    );
  }

  const getMoveData = (moveId: number): Move | undefined => {
    return mockMoves.find(move => move.id === moveId);
  };

  const addMove = () => {
    if (!newMove.moveId) return;

    const moveId = parseInt(newMove.moveId);
    const updatedMoveset = { ...pokemon.moveset };

    switch (activeTab) {
      case 'levelUp':
        if (!newMove.level) return;
        updatedMoveset.levelUp.push({
          moveId,
          level: parseInt(newMove.level)
        });
        updatedMoveset.levelUp.sort((a, b) => a.level - b.level);
        break;

      case 'tmMoves':
        if (!newMove.tmNumber) return;
        updatedMoveset.tmMoves.push({
          moveId,
          tmNumber: parseInt(newMove.tmNumber)
        });
        updatedMoveset.tmMoves.sort((a, b) => a.tmNumber - b.tmNumber);
        break;

      case 'eggMoves':
        updatedMoveset.eggMoves.push({
          moveId,
          parents: []
        });
        break;

      case 'tutorMoves':
        updatedMoveset.tutorMoves.push({ moveId });
        break;
    }

    onUpdatePokemon({ moveset: updatedMoveset });
    setNewMove({ moveId: '', level: '', tmNumber: '' });
  };

  const removeMove = (index: number) => {
    const updatedMoveset = { ...pokemon.moveset };
    
    switch (activeTab) {
      case 'levelUp':
        updatedMoveset.levelUp.splice(index, 1);
        break;
      case 'tmMoves':
        updatedMoveset.tmMoves.splice(index, 1);
        break;
      case 'eggMoves':
        updatedMoveset.eggMoves.splice(index, 1);
        break;
      case 'tutorMoves':
        updatedMoveset.tutorMoves.splice(index, 1);
        break;
    }

    onUpdatePokemon({ moveset: updatedMoveset });
  };

  const renderMoveList = () => {
    let moves: any[] = [];
    let showLevel = false;
    let showTM = false;

    switch (activeTab) {
      case 'levelUp':
        moves = pokemon.moveset.levelUp;
        showLevel = true;
        break;
      case 'tmMoves':
        moves = pokemon.moveset.tmMoves;
        showTM = true;
        break;
      case 'eggMoves':
        moves = pokemon.moveset.eggMoves;
        break;
      case 'tutorMoves':
        moves = pokemon.moveset.tutorMoves;
        break;
    }

    if (moves.length === 0) {
      return (
        <EmptyState>
          <div>No {activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()} moves</div>
          <div>Add moves using the form above</div>
        </EmptyState>
      );
    }

    return (
      <MoveList>
        {moves.map((moveData, index) => {
          const move = getMoveData(moveData.moveId);
          if (!move) return null;

          return (
            <MoveItem key={index}>
              {showLevel && (
                <MoveLevel>Lv.{moveData.level}</MoveLevel>
              )}
              {showTM && (
                <TMNumber>TM{moveData.tmNumber.toString().padStart(2, '0')}</TMNumber>
              )}
              <MoveName>{move.name}</MoveName>
              <MoveType typeColor={move.type.color}>
                {move.type.name}
              </MoveType>
              <MoveCategory category={move.category}>
                {move.category}
              </MoveCategory>
              <MovePower>
                {move.power || '--'}
              </MovePower>
              <MoveAccuracy>
                {move.accuracy}%
              </MoveAccuracy>
              <RemoveButton onClick={() => removeMove(index)}>
                Remove
              </RemoveButton>
            </MoveItem>
          );
        })}
      </MoveList>
    );
  };

  return (
    <MovesetContainer>
      <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>
        Moveset: {pokemon.name}
      </h2>

      <AddMoveSection>
        <AddMoveForm>
          <FormGroup>
            <Label>Move</Label>
            <Select
              value={newMove.moveId}
              onChange={(e) => setNewMove(prev => ({ ...prev, moveId: e.target.value }))}
            >
              <option value="">Select a move...</option>
              {mockMoves.map(move => (
                <option key={move.id} value={move.id}>
                  {move.name} ({move.type.name})
                </option>
              ))}
            </Select>
          </FormGroup>

          {activeTab === 'levelUp' && (
            <FormGroup>
              <Label>Level</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={newMove.level}
                onChange={(e) => setNewMove(prev => ({ ...prev, level: e.target.value }))}
                placeholder="Level"
              />
            </FormGroup>
          )}

          {activeTab === 'tmMoves' && (
            <FormGroup>
              <Label>TM Number</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={newMove.tmNumber}
                onChange={(e) => setNewMove(prev => ({ ...prev, tmNumber: e.target.value }))}
                placeholder="TM#"
              />
            </FormGroup>
          )}

          <Button 
            onClick={addMove}
            disabled={!newMove.moveId || (activeTab === 'levelUp' && !newMove.level) || (activeTab === 'tmMoves' && !newMove.tmNumber)}
          >
            Add Move
          </Button>
        </AddMoveForm>
      </AddMoveSection>

      <MovesetTabs>
        <Tab 
          active={activeTab === 'levelUp'} 
          onClick={() => setActiveTab('levelUp')}
        >
          Level Up ({pokemon.moveset.levelUp.length})
        </Tab>
        <Tab 
          active={activeTab === 'tmMoves'} 
          onClick={() => setActiveTab('tmMoves')}
        >
          TM Moves ({pokemon.moveset.tmMoves.length})
        </Tab>
        <Tab 
          active={activeTab === 'eggMoves'} 
          onClick={() => setActiveTab('eggMoves')}
        >
          Egg Moves ({pokemon.moveset.eggMoves.length})
        </Tab>
        <Tab 
          active={activeTab === 'tutorMoves'} 
          onClick={() => setActiveTab('tutorMoves')}
        >
          Tutor Moves ({pokemon.moveset.tutorMoves.length})
        </Tab>
      </MovesetTabs>

      <MovesetPanel>
        {renderMoveList()}
      </MovesetPanel>
    </MovesetContainer>
  );
};