import React, { useState } from 'react';
import Header from './components/Header';
import PokemonPartyBar from './components/PokemonPartyBar';
import ActionBar from './components/ActionBar';
import ChatWindow from './components/ChatWindow';
import MapEditor from './components/MapEditor';
import PokemonDetailView from './components/PokemonDetailView';
import PokedexWindow from './components/PokedexWindow';
import PlayerMenu from './components/PlayerMenu';


const App = () => {
  const [isMapEditorOpen, setMapEditorOpen] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isChatOpen, setChatOpen] = useState(true);
  const [isPokedexOpen, setPokedexOpen] = useState(false);
  const [isPlayerMenuOpen, setPlayerMenuOpen] = useState(false);

  const handlePokemonClick = (pokemon) => {
    setSelectedPokemon(pokemon);
  };
  
  return (
    <div className="relative h-screen w-screen font-sans">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://picsum.photos/seed/anime-world-v2/1920/1080')" }}
      ></div>
      <div className="absolute inset-0 bg-black/40"></div>

      {/* UI Elements */}
      <div className="relative z-10 h-full w-full">
        <Header onMapEditorClick={() => setMapEditorOpen(true)} />
        <PokemonPartyBar onPokemonClick={handlePokemonClick} />
        <ActionBar 
            onChatToggle={() => setChatOpen(prev => !prev)} 
            onPokedexToggle={() => setPokedexOpen(prev => !prev)}
            onPlayerMenuToggle={() => setPlayerMenuOpen(prev => !prev)}
        />
        
        {isChatOpen && <ChatWindow />}
        {isMapEditorOpen && <MapEditor onClose={() => setMapEditorOpen(false)} />}
        {selectedPokemon && <PokemonDetailView pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />}
        {isPokedexOpen && <PokedexWindow onClose={() => setPokedexOpen(false)} onPokemonSelect={handlePokemonClick} />}
        {isPlayerMenuOpen && <PlayerMenu onClose={() => setPlayerMenuOpen(false)} />}
      </div>
    </div>
  );
};

export default App;