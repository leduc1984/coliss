import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Pokemon, BaseStats } from '../types/PokemonTypes';

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
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

const StatRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const StatLabel = styled.label`
  color: #cccccc;
  font-size: 12px;
  min-width: 80px;
  font-weight: bold;
`;

const StatInput = styled.input`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 6px 8px;
  font-size: 12px;
  width: 80px;
  text-align: center;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const StatBar = styled.div`
  flex: 1;
  height: 20px;
  background-color: #3e3e42;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
`;

const StatFill = styled.div<{ percentage: number; color: string }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background-color: ${props => props.color};
  transition: width 0.3s ease;
`;

const StatValue = styled.div`
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  color: #ffffff;
  font-size: 10px;
  font-weight: bold;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
`;

const TotalSection = styled.div`
  background-color: #2d2d30;
  border: 2px solid #007acc;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
`;

const TotalLabel = styled.div`
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
`;

const TotalValue = styled.div<{ warning?: boolean }>`
  color: ${props => props.warning ? '#ff6b6b' : '#4caf50'};
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-top: 4px;
`;

const PresetSection = styled.div`
  margin-bottom: 16px;
`;

const PresetButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const PresetButton = styled.button`
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
`;

const AnalysisSection = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 16px;
`;

const AnalysisItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid #3e3e42;
  color: #cccccc;
  font-size: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const AnalysisValue = styled.span<{ good?: boolean; warning?: boolean }>`
  color: ${props => {
    if (props.good) return '#4caf50';
    if (props.warning) return '#ff9800';
    return '#cccccc';
  }};
  font-weight: bold;
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

interface StatsEditorProps {
  pokemon: Pokemon | null;
  onUpdatePokemon: (updates: Partial<Pokemon>) => void;
}

const statConfig = [
  { key: 'hp', label: 'HP', color: '#ff5959', max: 255 },
  { key: 'attack', label: 'Attack', color: '#f5ac78', max: 255 },
  { key: 'defense', label: 'Defense', color: '#fae078', max: 255 },
  { key: 'specialAttack', label: 'Sp. Attack', color: '#9db7f5', max: 255 },
  { key: 'specialDefense', label: 'Sp. Defense', color: '#a7db8d', max: 255 },
  { key: 'speed', label: 'Speed', color: '#fa92b2', max: 255 },
] as const;

const statPresets = {
  'Balanced': { hp: 75, attack: 75, defense: 75, specialAttack: 75, specialDefense: 75, speed: 75 },
  'Tank': { hp: 120, attack: 60, defense: 120, specialAttack: 60, specialDefense: 120, speed: 40 },
  'Physical Sweeper': { hp: 70, attack: 130, defense: 70, specialAttack: 50, specialDefense: 70, speed: 130 },
  'Special Sweeper': { hp: 70, attack: 50, defense: 70, specialAttack: 130, specialDefense: 70, speed: 130 },
  'Wall': { hp: 100, attack: 50, defense: 140, specialAttack: 50, specialDefense: 140, speed: 40 },
  'Glass Cannon': { hp: 50, attack: 150, defense: 50, specialAttack: 150, specialDefense: 50, speed: 120 },
};

export const StatsEditor: React.FC<StatsEditorProps> = ({
  pokemon,
  onUpdatePokemon
}) => {
  const [stats, setStats] = useState<BaseStats>({
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    total: 0,
  });

  useEffect(() => {
    if (pokemon) {
      setStats(pokemon.baseStats);
    }
  }, [pokemon]);

  if (!pokemon) {
    return (
      <StatsContainer>
        <EmptyState>
          <div>No Pokemon Selected</div>
          <div style={{ fontSize: '12px' }}>
            Select a Pokemon to edit its base stats
          </div>
        </EmptyState>
      </StatsContainer>
    );
  }

  const handleStatChange = (statKey: keyof Omit<BaseStats, 'total'>, value: number) => {
    const newStats = { ...stats, [statKey]: value };
    newStats.total = newStats.hp + newStats.attack + newStats.defense + 
                    newStats.specialAttack + newStats.specialDefense + newStats.speed;
    
    setStats(newStats);
    onUpdatePokemon({ baseStats: newStats });
  };

  const applyPreset = (presetName: keyof typeof statPresets) => {
    const preset = statPresets[presetName];
    const newStats = {
      ...preset,
      total: Object.values(preset).reduce((sum, val) => sum + val, 0)
    };
    
    setStats(newStats);
    onUpdatePokemon({ baseStats: newStats });
  };

  const getStatColor = (statKey: string): string => {
    return statConfig.find(config => config.key === statKey)?.color || '#cccccc';
  };

  const getStatPercentage = (value: number): number => {
    return Math.min((value / 255) * 100, 100);
  };

  const calculateBST = (): number => {
    return stats.hp + stats.attack + stats.defense + stats.specialAttack + stats.specialDefense + stats.speed;
  };

  const analyzeStats = () => {
    const total = calculateBST();
    const statValues = [stats.hp, stats.attack, stats.defense, stats.specialAttack, stats.specialDefense, stats.speed];
    const max = Math.max(...statValues);
    const min = Math.min(...statValues);
    const average = total / 6;
    const physicalTotal = stats.hp + stats.attack + stats.defense;
    const specialTotal = stats.hp + stats.specialAttack + stats.specialDefense;
    
    return {
      total,
      max,
      min,
      average: Math.round(average),
      spread: max - min,
      physicalBias: physicalTotal > specialTotal,
      isBalanced: max - min <= 30,
      isTank: stats.hp > 100 && (stats.defense > 100 || stats.specialDefense > 100),
      isSweeper: (stats.attack > 100 || stats.specialAttack > 100) && stats.speed > 100,
    };
  };

  const analysis = analyzeStats();

  return (
    <StatsContainer>
      <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>
        Base Stats: {pokemon.name}
      </h2>

      <TotalSection>
        <TotalLabel>Base Stat Total (BST)</TotalLabel>
        <TotalValue warning={analysis.total > 700 && !pokemon.isLegendary}>
          {analysis.total}
        </TotalValue>
      </TotalSection>

      <PresetSection>
        <PanelTitle>Stat Presets</PanelTitle>
        <PresetButtons>
          {Object.keys(statPresets).map(presetName => (
            <PresetButton
              key={presetName}
              onClick={() => applyPreset(presetName as keyof typeof statPresets)}
            >
              {presetName}
            </PresetButton>
          ))}
        </PresetButtons>
      </PresetSection>

      <StatsGrid>
        <Panel>
          <PanelTitle>Individual Stats</PanelTitle>
          {statConfig.map(({ key, label, color }) => (
            <StatRow key={key}>
              <StatLabel>{label}:</StatLabel>
              <StatInput
                type="number"
                min="1"
                max="255"
                value={stats[key]}
                onChange={(e) => handleStatChange(key, parseInt(e.target.value) || 0)}
              />
              <StatBar>
                <StatFill 
                  percentage={getStatPercentage(stats[key])} 
                  color={color}
                />
                <StatValue>{stats[key]}</StatValue>
              </StatBar>
            </StatRow>
          ))}
        </Panel>

        <Panel>
          <PanelTitle>Stat Analysis</PanelTitle>
          <AnalysisSection>
            <AnalysisItem>
              <span>Base Stat Total:</span>
              <AnalysisValue 
                good={analysis.total >= 500 && analysis.total <= 600}
                warning={analysis.total > 700 && !pokemon.isLegendary}
              >
                {analysis.total}
              </AnalysisValue>
            </AnalysisItem>
            
            <AnalysisItem>
              <span>Highest Stat:</span>
              <AnalysisValue>{analysis.max}</AnalysisValue>
            </AnalysisItem>
            
            <AnalysisItem>
              <span>Lowest Stat:</span>
              <AnalysisValue warning={analysis.min < 30}>
                {analysis.min}
              </AnalysisValue>
            </AnalysisItem>
            
            <AnalysisItem>
              <span>Average Stat:</span>
              <AnalysisValue>{analysis.average}</AnalysisValue>
            </AnalysisItem>
            
            <AnalysisItem>
              <span>Stat Spread:</span>
              <AnalysisValue 
                good={analysis.spread <= 50}
                warning={analysis.spread > 100}
              >
                {analysis.spread}
              </AnalysisValue>
            </AnalysisItem>
            
            <AnalysisItem>
              <span>Distribution:</span>
              <AnalysisValue>
                {analysis.isBalanced ? 'Balanced' : 'Specialized'}
              </AnalysisValue>
            </AnalysisItem>
            
            <AnalysisItem>
              <span>Role Tendency:</span>
              <AnalysisValue>
                {analysis.isTank ? 'Tank' : analysis.isSweeper ? 'Sweeper' : 'Balanced'}
              </AnalysisValue>
            </AnalysisItem>
            
            <AnalysisItem>
              <span>Damage Bias:</span>
              <AnalysisValue>
                {analysis.physicalBias ? 'Physical' : 'Special'}
              </AnalysisValue>
            </AnalysisItem>
          </AnalysisSection>
        </Panel>
      </StatsGrid>
    </StatsContainer>
  );
};