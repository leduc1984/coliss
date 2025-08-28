import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Pokemon } from '../types/PokemonTypes';

const BrowserContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
`;

const SearchSection = styled.div`
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  width: 100%;
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 8px 12px;
  font-size: 14px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const FilterSelect = styled.select`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 4px 8px;
  font-size: 12px;
`;

const PokemonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  overflow-y: auto;
  flex: 1;
`;

const PokemonCard = styled.div<{ selected?: boolean }>`
  background-color: ${props => props.selected ? '#094771' : '#252526'};
  border: 2px solid ${props => props.selected ? '#007acc' : '#3e3e42'};
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.selected ? '#0a5f8a' : '#2d2d30'};
    border-color: ${props => props.selected ? '#1177bb' : '#4a4a4a'};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 8px;
`;

const PokemonName = styled.h3`
  color: #ffffff;
  font-size: 16px;
  margin: 0;
  flex: 1;
`;

const PokemonId = styled.span`
  color: #999999;
  font-size: 12px;
  font-weight: normal;
`;

const PokemonSpecies = styled.div`
  color: #cccccc;
  font-size: 12px;
  margin-bottom: 8px;
`;

const TypesContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
`;

const TypeBadge = styled.span<{ color: string }>`
  background-color: ${props => props.color};
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
`;

const StatsPreview = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  font-size: 10px;
  color: #cccccc;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  color: #ffffff;
  font-weight: bold;
`;

const StatLabel = styled.div`
  color: #999999;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #cccccc;
  font-size: 14px;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999999;
  font-size: 14px;
  gap: 8px;
`;

interface PokemonBrowserProps {
  pokemon: Pokemon[];
  selectedPokemon: Pokemon | null;
  onSelectPokemon: (pokemon: Pokemon) => void;
  onSearch: (term: string) => void;
  isLoading: boolean;
}

export const PokemonBrowser: React.FC<PokemonBrowserProps> = ({
  pokemon,
  selectedPokemon,
  onSelectPokemon,
  onSearch,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [generationFilter, setGenerationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id');

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    pokemon.forEach(p => p.types.forEach(t => types.add(t.name)));
    return Array.from(types).sort();
  }, [pokemon]);

  const availableGenerations = useMemo(() => {
    const generations = new Set(pokemon.map(p => p.generation));
    return Array.from(generations).sort();
  }, [pokemon]);

  const filteredAndSortedPokemon = useMemo(() => {
    let filtered = pokemon;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.species.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.types.some(t => t.name === typeFilter)
      );
    }

    // Apply generation filter
    if (generationFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.generation === parseInt(generationFilter)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'species':
          return a.species.localeCompare(b.species);
        case 'bst':
          return b.baseStats.total - a.baseStats.total;
        case 'id':
        default:
          return a.id - b.id;
      }
    });

    return filtered;
  }, [pokemon, searchTerm, typeFilter, generationFilter, sortBy]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  if (isLoading) {
    return (
      <BrowserContainer>
        <LoadingContainer>
          Loading Pokemon data...
        </LoadingContainer>
      </BrowserContainer>
    );
  }

  return (
    <BrowserContainer>
      <SearchSection>
        <SearchInput
          type="text"
          placeholder="Search Pokemon by name or species..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        
        <FilterBar>
          <FilterSelect 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </FilterSelect>

          <FilterSelect 
            value={generationFilter}
            onChange={(e) => setGenerationFilter(e.target.value)}
          >
            <option value="all">All Generations</option>
            {availableGenerations.map(gen => (
              <option key={gen} value={gen}>Generation {gen}</option>
            ))}
          </FilterSelect>

          <FilterSelect 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="id">Sort by ID</option>
            <option value="name">Sort by Name</option>
            <option value="species">Sort by Species</option>
            <option value="bst">Sort by Base Stat Total</option>
          </FilterSelect>
        </FilterBar>
      </SearchSection>

      {filteredAndSortedPokemon.length === 0 ? (
        <EmptyContainer>
          <div>No Pokemon found</div>
          <div style={{ fontSize: '12px' }}>
            Try adjusting your search criteria
          </div>
        </EmptyContainer>
      ) : (
        <PokemonGrid>
          {filteredAndSortedPokemon.map((p) => (
            <PokemonCard
              key={p.id}
              selected={selectedPokemon?.id === p.id}
              onClick={() => onSelectPokemon(p)}
            >
              <CardHeader>
                <PokemonName>{p.name}</PokemonName>
                <PokemonId>#{p.id.toString().padStart(3, '0')}</PokemonId>
              </CardHeader>
              
              <PokemonSpecies>{p.species}</PokemonSpecies>
              
              <TypesContainer>
                {p.types.map((type) => (
                  <TypeBadge key={type.id} color={type.color}>
                    {type.name}
                  </TypeBadge>
                ))}
              </TypesContainer>
              
              <StatsPreview>
                <StatItem>
                  <StatValue>{p.baseStats.hp}</StatValue>
                  <StatLabel>HP</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{p.baseStats.attack}</StatValue>
                  <StatLabel>ATK</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{p.baseStats.defense}</StatValue>
                  <StatLabel>DEF</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{p.baseStats.specialAttack}</StatValue>
                  <StatLabel>SPA</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{p.baseStats.specialDefense}</StatValue>
                  <StatLabel>SPD</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>{p.baseStats.speed}</StatValue>
                  <StatLabel>SPE</StatLabel>
                </StatItem>
              </StatsPreview>
            </PokemonCard>
          ))}
        </PokemonGrid>
      )}
    </BrowserContainer>
  );
};