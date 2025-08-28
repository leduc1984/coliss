import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PokemonBrowser } from './PokemonBrowser';
import { PokemonEditor } from './PokemonEditor';
import { StatsEditor } from './StatsEditor';
import { MovesetEditor } from './MovesetEditor';
import { BalanceAnalysis } from './BalanceAnalysis';
import { EvolutionChainEditor } from './EvolutionChainEditor';
import { VersionControl } from './VersionControl';
import { Pokemon, EditorState } from '../types/PokemonTypes';
import { GlobalStyles } from '../styles/GlobalStyles';

const EditorContainer = styled.div`
  display: flex;
  flex: 1;
  height: calc(100vh - 48px);
  overflow: hidden;
`;

const Sidebar = styled.nav`
  width: 200px;
  min-width: 200px;
  background-color: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  background-color: #2d2d30;
  padding: 8px 12px;
  border-bottom: 1px solid #3e3e42;
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
`;

const NavList = styled.div`
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
`;

const NavItem = styled.button<{ active: boolean }>`
  width: 100%;
  background: none;
  border: none;
  padding: 8px 12px;
  text-align: left;
  color: ${props => props.active ? '#ffffff' : '#cccccc'};
  background-color: ${props => props.active ? '#094771' : 'transparent'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.active ? '#094771' : '#3e3e42'};
  }
`;

const NavIcon = styled.span`
  font-size: 14px;
  width: 16px;
  text-align: center;
`;

const MainContent = styled.main`
  flex: 1;
  background-color: #1e1e1e;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled.div`
  height: 40px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
`;

const ToolbarButton = styled.button`
  background: none;
  border: 1px solid #5e5e5e;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  
  &:hover {
    background-color: #3e3e42;
  }
  
  &.active {
    background-color: #0e639c;
    border-color: #0e639c;
    color: white;
  }
`;

const StatusBar = styled.div`
  height: 24px;
  background-color: #2d2d30;
  border-top: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 11px;
  color: #999;
  gap: 16px;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
`;

interface MonsterEditorProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
  onConnectionChange: (connected: boolean) => void;
}

export const MonsterEditor: React.FC<MonsterEditorProps> = ({
  onUnsavedChanges,
  onConnectionChange,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browser');
  const [editorState, setEditorState] = useState<EditorState>({
    selectedPokemon: null,
    pokemonList: [],
    filteredList: [],
    searchOptions: {
      term: '',
      searchIn: ['name', 'species'],
      caseSensitive: false,
      exactMatch: false,
    },
    filterOptions: {
      types: [],
      generations: [],
      legendary: null,
      mythical: null,
      abilities: [],
      eggGroups: [],
      growthRates: [],
    },
    sortOptions: {
      field: 'id',
      direction: 'asc',
    },
    isLoading: false,
    hasUnsavedChanges: false,
    version: '1.0.0',
  });

  const navItems = [
    { id: 'browser', label: 'Pokemon Browser', icon: '🔍', path: '/browser' },
    { id: 'editor', label: 'Pokemon Editor', icon: '✏️', path: '/editor' },
    { id: 'stats', label: 'Stats Editor', icon: '📊', path: '/stats' },
    { id: 'moveset', label: 'Moveset Editor', icon: '⚔️', path: '/moveset' },
    { id: 'evolution', label: 'Evolution Chain', icon: '🔄', path: '/evolution' },
    { id: 'analysis', label: 'Balance Analysis', icon: '📈', path: '/analysis' },
    { id: 'versions', label: 'Version Control', icon: '📝', path: '/versions' },
  ];

  useEffect(() => {
    // Load initial Pokemon data
    loadPokemonData();
  }, []);

  useEffect(() => {
    onUnsavedChanges(editorState.hasUnsavedChanges);
  }, [editorState.hasUnsavedChanges, onUnsavedChanges]);

  const loadPokemonData = async () => {
    setEditorState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // TODO: Load actual Pokemon data from API or file
      const mockPokemon: Pokemon[] = [
        {
          id: 1,
          name: 'Bulbasaur',
          species: 'Seed Pokemon',
          types: [
            { id: 12, name: 'Grass', color: '#78C850', effectiveness: { weakTo: [10, 3, 2, 15], resistantTo: [11, 5, 13], immuneTo: [] } },
            { id: 4, name: 'Poison', color: '#A040A0', effectiveness: { weakTo: [14, 10], resistantTo: [12, 2, 7, 4, 18], immuneTo: [] } },
          ],
          baseStats: {
            hp: 45,
            attack: 49,
            defense: 49,
            specialAttack: 65,
            specialDefense: 65,
            speed: 45,
            total: 318,
          },
          abilities: [
            { id: 65, name: 'Overgrow', description: 'Powers up Grass-type moves when the Pokemon is in trouble.', effect: 'Increases Grass-type move power by 50% when HP is below 1/3.' },
          ],
          hiddenAbility: { id: 34, name: 'Chlorophyll', description: 'Boosts the Pokemon\'s Speed stat in sunshine.', effect: 'Doubles Speed in sunny weather.' },
          moveset: {
            levelUp: [
              { moveId: 1, level: 1 },
              { moveId: 45, level: 3 },
              { moveId: 22, level: 6 },
            ],
            tmMoves: [
              { moveId: 6, tmNumber: 6 },
              { moveId: 9, tmNumber: 9 },
            ],
            eggMoves: [
              { moveId: 78, parents: [2, 3] },
            ],
            tutorMoves: [],
            transferMoves: [],
          },
          evolution: {
            canEvolve: true,
            evolutionChain: {
              id: 1,
              species: [
                {
                  id: 1,
                  name: 'Bulbasaur',
                  evolutionDetails: [],
                  evolvesTo: [
                    {
                      id: 2,
                      name: 'Ivysaur',
                      evolutionDetails: [{ trigger: { id: 1, name: 'level-up' }, minLevel: 16 }],
                      evolvesTo: [
                        {
                          id: 3,
                          name: 'Venusaur',
                          evolutionDetails: [{ trigger: { id: 1, name: 'level-up' }, minLevel: 32 }],
                          evolvesTo: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          sprites: {
            frontDefault: '/sprites/pokemon/1.png',
            frontShiny: '/sprites/pokemon/shiny/1.png',
            backDefault: '/sprites/pokemon/back/1.png',
            backShiny: '/sprites/pokemon/back/shiny/1.png',
          },
          gameData: {
            encounters: [
              {
                locationId: 1,
                method: { id: 1, name: 'walk', description: 'Walking in tall grass' },
                minLevel: 2,
                maxLevel: 4,
                chance: 0.1,
              },
            ],
            locations: [
              { id: 1, name: 'Pallet Town', region: 'Kanto', description: 'Starting town' },
            ],
            rarity: { tier: 'common', spawnRate: 0.15 },
          },
          description: 'A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokemon.',
          category: 'Seed',
          height: 0.7,
          weight: 6.9,
          genderRatio: { male: 87.5, female: 12.5, genderless: false },
          eggGroups: [
            { id: 7, name: 'Monster' },
            { id: 1, name: 'Grass' },
          ],
          baseExperience: 64,
          captureRate: 45,
          baseFriendship: 70,
          growthRate: { id: 4, name: 'medium-slow', formula: '(6/5)*n^3 - 15*n^2 + 100*n - 140' },
          generation: 1,
          isLegendary: false,
          isMythical: false,
        },
        // Add more mock Pokemon data as needed
      ];

      setEditorState(prev => ({
        ...prev,
        pokemonList: mockPokemon,
        filteredList: mockPokemon,
        isLoading: false,
      }));

      onConnectionChange(true);
    } catch (error) {
      console.error('Failed to load Pokemon data:', error);
      setEditorState(prev => ({ ...prev, isLoading: false }));
      onConnectionChange(false);
    }
  };

  const handleNavClick = (tabId: string, path: string) => {
    setActiveTab(tabId);
    navigate(path);
  };

  const handleSelectPokemon = (pokemon: Pokemon) => {
    setEditorState(prev => ({
      ...prev,
      selectedPokemon: pokemon,
    }));
  };

  const handleUpdatePokemon = (updates: Partial<Pokemon>) => {
    if (!editorState.selectedPokemon) return;

    const updatedPokemon = { ...editorState.selectedPokemon, ...updates };
    
    setEditorState(prev => ({
      ...prev,
      selectedPokemon: updatedPokemon,
      pokemonList: prev.pokemonList.map(p => 
        p.id === updatedPokemon.id ? updatedPokemon : p
      ),
      filteredList: prev.filteredList.map(p => 
        p.id === updatedPokemon.id ? updatedPokemon : p
      ),
      hasUnsavedChanges: true,
    }));
  };

  const handleSearch = (term: string) => {
    setEditorState(prev => ({
      ...prev,
      searchOptions: { ...prev.searchOptions, term },
    }));
    
    // Apply search filter
    const filtered = editorState.pokemonList.filter(pokemon => {
      if (!term) return true;
      
      const searchTerm = term.toLowerCase();
      return pokemon.name.toLowerCase().includes(searchTerm) ||
             pokemon.species.toLowerCase().includes(searchTerm);
    });
    
    setEditorState(prev => ({
      ...prev,
      filteredList: filtered,
    }));
  };

  const selectedPokemonName = editorState.selectedPokemon?.name || 'None';
  const totalPokemon = editorState.pokemonList.length;
  const filteredCount = editorState.filteredList.length;

  return (
    <>
      <GlobalStyles />
      <EditorContainer>
        <Sidebar>
          <SidebarHeader>Navigation</SidebarHeader>
          <NavList>
            {navItems.map(item => (
              <NavItem
                key={item.id}
                active={activeTab === item.id}
                onClick={() => handleNavClick(item.id, item.path)}
              >
                <NavIcon>{item.icon}</NavIcon>
                {item.label}
              </NavItem>
            ))}
          </NavList>
        </Sidebar>

        <MainContent>
          <Toolbar>
            <ToolbarButton onClick={() => handleSearch('')}>
              Clear Filters
            </ToolbarButton>
            <ToolbarButton onClick={() => console.log('Validate data')}>
              Validate
            </ToolbarButton>
            <ToolbarButton onClick={() => console.log('Analyze balance')}>
              Analyze
            </ToolbarButton>
          </Toolbar>

          <ContentArea>
            <Routes>
              <Route 
                path="/browser" 
                element={
                  <PokemonBrowser 
                    pokemon={editorState.filteredList}
                    selectedPokemon={editorState.selectedPokemon}
                    onSelectPokemon={handleSelectPokemon}
                    onSearch={handleSearch}
                    isLoading={editorState.isLoading}
                  />
                } 
              />
              <Route 
                path="/editor" 
                element={
                  <PokemonEditor 
                    pokemon={editorState.selectedPokemon}
                    onUpdatePokemon={handleUpdatePokemon}
                  />
                } 
              />
              <Route 
                path="/stats" 
                element={
                  <StatsEditor 
                    pokemon={editorState.selectedPokemon}
                    onUpdatePokemon={handleUpdatePokemon}
                  />
                } 
              />
              <Route 
                path="/moveset" 
                element={
                  <MovesetEditor 
                    pokemon={editorState.selectedPokemon}
                    onUpdatePokemon={handleUpdatePokemon}
                  />
                } 
              />
              <Route 
                path="/evolution" 
                element={
                  <EvolutionChainEditor 
                    pokemon={editorState.selectedPokemon}
                    pokemonList={editorState.pokemonList}
                    onUpdateEvolution={(updates) => {
                      if (editorState.selectedPokemon) {
                        handleUpdatePokemon({ evolution: { ...editorState.selectedPokemon.evolution, ...updates } });
                      }
                    }}
                  />
                } 
              />
              <Route 
                path="/analysis" 
                element={
                  <BalanceAnalysis 
                    pokemonList={editorState.pokemonList}
                  />
                } 
              />
              <Route 
                path="/versions" 
                element={
                  <VersionControl 
                    pokemon={editorState.selectedPokemon}
                    onRevert={(versionId) => console.log('Reverting to version:', versionId)}
                    onCreateTag={(versionId, tagName) => console.log('Creating tag:', tagName, 'for version:', versionId)}
                  />
                } 
              />
              <Route path="/*" element={
                <PokemonBrowser 
                  pokemon={editorState.filteredList}
                  selectedPokemon={editorState.selectedPokemon}
                  onSelectPokemon={handleSelectPokemon}
                  onSearch={handleSearch}
                  isLoading={editorState.isLoading}
                />
              } />
            </Routes>
          </ContentArea>

          <StatusBar>
            <StatusItem>
              📊 Total: {totalPokemon} Pokemon
            </StatusItem>
            <StatusItem>
              🔍 Filtered: {filteredCount} Pokemon
            </StatusItem>
            <StatusItem>
              ✏️ Selected: {selectedPokemonName}
            </StatusItem>
            <StatusItem>
              📦 Version: {editorState.version}
            </StatusItem>
          </StatusBar>
        </MainContent>
      </EditorContainer>
    </>
  );
};