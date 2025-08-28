import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Pokemon, PokemonType } from '../types/PokemonTypes';

const AnalysisContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const AnalysisHeader = styled.div`
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

const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
`;

const AnalysisCard = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 16px;
`;

const CardTitle = styled.h3`
  color: #ffffff;
  font-size: 14px;
  margin: 0 0 12px 0;
`;

const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
`;

const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid #3e3e42;
`;

const StatLabel = styled.span`
  color: #cccccc;
  font-size: 12px;
`;

const StatValue = styled.span<{ warning?: boolean }>`
  color: ${props => props.warning ? '#ff6b6b' : '#ffffff'};
  font-size: 12px;
  font-weight: bold;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
`;

const FilterLabel = styled.label`
  color: #cccccc;
  font-size: 12px;
`;

const FilterSelect = styled.select`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 4px 8px;
  font-size: 12px;
`;

const WarningList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const WarningItem = styled.div<{ severity: 'low' | 'medium' | 'high' }>`
  padding: 8px;
  border-radius: 3px;
  font-size: 12px;
  background-color: ${props => {
    switch (props.severity) {
      case 'high': return '#ff6b6b20';
      case 'medium': return '#ffa50020';
      case 'low': return '#ffff0020';
      default: return '#3e3e42';
    }
  }};
  border-left: 3px solid ${props => {
    switch (props.severity) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa500';
      case 'low': return '#ffff00';
      default: return '#3e3e42';
    }
  }};
  color: #ffffff;
`;

interface BalanceAnalysisProps {
  pokemonList: Pokemon[];
}

interface BalanceIssue {
  pokemonId: number;
  pokemonName: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

interface StatDistribution {
  name: string;
  count: number;
  percentage: number;
}

export const BalanceAnalysis: React.FC<BalanceAnalysisProps> = ({ pokemonList }) => {
  const [selectedGeneration, setSelectedGeneration] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string | 'all'>('all');

  const filteredPokemon = useMemo(() => {
    return pokemonList.filter(pokemon => {
      const generationMatch = selectedGeneration === 'all' || pokemon.generation === selectedGeneration;
      const typeMatch = selectedType === 'all' || pokemon.types.some(type => type.name === selectedType);
      return generationMatch && typeMatch;
    });
  }, [pokemonList, selectedGeneration, selectedType]);

  const statDistribution = useMemo(() => {
    const ranges = [
      { name: '0-50', min: 0, max: 50 },
      { name: '51-75', min: 51, max: 75 },
      { name: '76-100', min: 76, max: 100 },
      { name: '101-125', min: 101, max: 125 },
      { name: '126+', min: 126, max: 999 },
    ];

    const stats = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
    const distribution: { [key: string]: StatDistribution[] } = {};

    stats.forEach(stat => {
      distribution[stat] = ranges.map(range => {
        const count = filteredPokemon.filter(pokemon => {
          const statValue = pokemon.baseStats[stat as keyof typeof pokemon.baseStats];
          return statValue >= range.min && statValue <= range.max;
        }).length;

        return {
          name: range.name,
          count,
          percentage: filteredPokemon.length > 0 ? (count / filteredPokemon.length) * 100 : 0,
        };
      });
    });

    return distribution;
  }, [filteredPokemon]);

  const typeDistribution = useMemo(() => {
    const typeCount: { [key: string]: number } = {};
    
    filteredPokemon.forEach(pokemon => {
      pokemon.types.forEach(type => {
        typeCount[type.name] = (typeCount[type.name] || 0) + 1;
      });
    });

    return Object.entries(typeCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: filteredPokemon.length > 0 ? (count / filteredPokemon.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPokemon]);

  const balanceIssues = useMemo(() => {
    const issues: BalanceIssue[] = [];

    filteredPokemon.forEach(pokemon => {
      const stats = pokemon.baseStats;
      const total = stats.total;

      // Check for extremely low or high stat totals
      if (total < 200) {
        issues.push({
          pokemonId: pokemon.id,
          pokemonName: pokemon.name,
          issue: `Very low stat total (${total})`,
          severity: 'high',
          suggestion: 'Consider increasing base stats to make viable',
        });
      } else if (total > 700 && !pokemon.isLegendary && !pokemon.isMythical) {
        issues.push({
          pokemonId: pokemon.id,
          pokemonName: pokemon.name,
          issue: `Very high stat total for non-legendary (${total})`,
          severity: 'medium',
          suggestion: 'Consider reducing stats or marking as legendary',
        });
      }

      // Check for unbalanced stat distributions
      const statValues = [stats.hp, stats.attack, stats.defense, stats.specialAttack, stats.specialDefense, stats.speed];
      const maxStat = Math.max(...statValues);
      const minStat = Math.min(...statValues);
      
      if (maxStat - minStat > 100) {
        issues.push({
          pokemonId: pokemon.id,
          pokemonName: pokemon.name,
          issue: `Extreme stat distribution (${maxStat} - ${minStat} = ${maxStat - minStat})`,
          severity: 'medium',
          suggestion: 'Consider balancing stat distribution',
        });
      }

      // Check for very low individual stats
      Object.entries(stats).forEach(([statName, value]) => {
        if (statName !== 'total' && value < 20) {
          issues.push({
            pokemonId: pokemon.id,
            pokemonName: pokemon.name,
            issue: `Very low ${statName} (${value})`,
            severity: 'low',
            suggestion: `Consider increasing ${statName} to at least 20`,
          });
        }
      });
    });

    return issues.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [filteredPokemon]);

  const averageStats = useMemo(() => {
    if (filteredPokemon.length === 0) return null;

    const totals = {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      total: 0,
    };

    filteredPokemon.forEach(pokemon => {
      totals.hp += pokemon.baseStats.hp;
      totals.attack += pokemon.baseStats.attack;
      totals.defense += pokemon.baseStats.defense;
      totals.specialAttack += pokemon.baseStats.specialAttack;
      totals.specialDefense += pokemon.baseStats.specialDefense;
      totals.speed += pokemon.baseStats.speed;
      totals.total += pokemon.baseStats.total;
    });

    const count = filteredPokemon.length;
    return {
      hp: Math.round(totals.hp / count),
      attack: Math.round(totals.attack / count),
      defense: Math.round(totals.defense / count),
      specialAttack: Math.round(totals.specialAttack / count),
      specialDefense: Math.round(totals.specialDefense / count),
      speed: Math.round(totals.speed / count),
      total: Math.round(totals.total / count),
    };
  }, [filteredPokemon]);

  const radarData = useMemo(() => {
    if (!averageStats) return [];

    return [
      { stat: 'HP', value: averageStats.hp },
      { stat: 'Attack', value: averageStats.attack },
      { stat: 'Defense', value: averageStats.defense },
      { stat: 'Sp. Attack', value: averageStats.specialAttack },
      { stat: 'Sp. Defense', value: averageStats.specialDefense },
      { stat: 'Speed', value: averageStats.speed },
    ];
  }, [averageStats]);

  const generations = useMemo(() => {
    const gens = [...new Set(pokemonList.map(p => p.generation))].sort();
    return gens;
  }, [pokemonList]);

  const types = useMemo(() => {
    const typeSet = new Set<string>();
    pokemonList.forEach(pokemon => {
      pokemon.types.forEach(type => typeSet.add(type.name));
    });
    return Array.from(typeSet).sort();
  }, [pokemonList]);

  return (
    <AnalysisContainer>
      <AnalysisHeader>
        <Title>Balance Analysis</Title>
        <Description>
          Analyze Pokemon balance across generations and types to identify potential issues and opportunities for improvement.
        </Description>
      </AnalysisHeader>

      <FilterSection>
        <FilterLabel>Generation:</FilterLabel>
        <FilterSelect
          value={selectedGeneration}
          onChange={(e) => setSelectedGeneration(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
        >
          <option value="all">All Generations</option>
          {generations.map(gen => (
            <option key={gen} value={gen}>Generation {gen}</option>
          ))}
        </FilterSelect>

        <FilterLabel>Type:</FilterLabel>
        <FilterSelect
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="all">All Types</option>
          {types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </FilterSelect>
      </FilterSection>

      <AnalysisGrid>
        <AnalysisCard>
          <CardTitle>Type Distribution</CardTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeDistribution.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3e3e42" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#cccccc', fontSize: 10 }}
                  stroke="#cccccc"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#cccccc', fontSize: 10 }} stroke="#cccccc" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2d2d30', 
                    border: '1px solid #3e3e42',
                    color: '#cccccc'
                  }} 
                />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </AnalysisCard>

        <AnalysisCard>
          <CardTitle>Average Stats</CardTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#3e3e42" />
                <PolarAngleAxis tick={{ fill: '#cccccc', fontSize: 10 }} />
                <PolarRadiusAxis 
                  tick={{ fill: '#cccccc', fontSize: 8 }} 
                  domain={[0, 120]}
                />
                <Radar
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </AnalysisCard>

        <AnalysisCard>
          <CardTitle>HP Distribution</CardTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statDistribution.hp}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3e3e42" />
                <XAxis dataKey="name" tick={{ fill: '#cccccc', fontSize: 10 }} stroke="#cccccc" />
                <YAxis tick={{ fill: '#cccccc', fontSize: 10 }} stroke="#cccccc" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2d2d30', 
                    border: '1px solid #3e3e42',
                    color: '#cccccc'
                  }} 
                />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </AnalysisCard>

        <AnalysisCard>
          <CardTitle>Attack Distribution</CardTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statDistribution.attack}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3e3e42" />
                <XAxis dataKey="name" tick={{ fill: '#cccccc', fontSize: 10 }} stroke="#cccccc" />
                <YAxis tick={{ fill: '#cccccc', fontSize: 10 }} stroke="#cccccc" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2d2d30', 
                    border: '1px solid #3e3e42',
                    color: '#cccccc'
                  }} 
                />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </AnalysisCard>
      </AnalysisGrid>

      <AnalysisGrid>
        <AnalysisCard>
          <CardTitle>Overall Statistics</CardTitle>
          <StatsList>
            <StatItem>
              <StatLabel>Total Pokemon:</StatLabel>
              <StatValue>{filteredPokemon.length}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Average BST:</StatLabel>
              <StatValue>{averageStats?.total || 0}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Legendary/Mythical:</StatLabel>
              <StatValue>
                {filteredPokemon.filter(p => p.isLegendary || p.isMythical).length}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Balance Issues:</StatLabel>
              <StatValue warning={balanceIssues.length > 0}>
                {balanceIssues.length}
              </StatValue>
            </StatItem>
          </StatsList>
        </AnalysisCard>

        <AnalysisCard>
          <CardTitle>Balance Issues</CardTitle>
          <WarningList style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {balanceIssues.length === 0 ? (
              <div style={{ color: '#4caf50', padding: '8px', textAlign: 'center' }}>
                No balance issues detected!
              </div>
            ) : (
              balanceIssues.slice(0, 10).map((issue, index) => (
                <WarningItem key={index} severity={issue.severity}>
                  <strong>{issue.pokemonName}:</strong> {issue.issue}
                  <br />
                  <small>{issue.suggestion}</small>
                </WarningItem>
              ))
            )}
          </WarningList>
        </AnalysisCard>
      </AnalysisGrid>
    </AnalysisContainer>
  );
};