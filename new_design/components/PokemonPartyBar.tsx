import React from 'react';
import { mockPokemonParty } from './PokemonDetailView';

const PokemonSlot = ({ pokemon, active, onClick }) => {
    if (!pokemon) {
        // Render a placeholder for an empty slot
        return <div className="w-14 h-14 bg-black/30 rounded-md border-2 border-dashed border-white/20"></div>;
    }

    return (
        <div 
            onClick={() => onClick(pokemon)}
            className={`w-14 h-14 bg-black/50 border-2 rounded-md cursor-pointer group transition-all duration-200 flex items-center justify-center p-1
                ${active ? 'border-cyan-400 shadow-md shadow-cyan-500/30' : 'border-white/20'} 
                hover:border-cyan-300 hover:scale-105`}
        >
            <img 
                src={pokemon.imageUrl} 
                alt={pokemon.name} 
                className="h-full w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110" 
            />
        </div>
    );
};

const PokemonPartyBar = ({ onPokemonClick }) => {
  const party = mockPokemonParty.slice(0, 6);
  // Fill the rest of the party with null so there are always 6 slots
  while (party.length < 6) {
    party.push(null);
  }

  return (
    <div className="fixed top-1/2 -translate-y-1/2 left-4 z-20 flex flex-col gap-2">
        {party.map((p, index) => (
            <PokemonSlot 
                key={p ? p.id : `empty-${index}`} 
                pokemon={p} 
                active={index === 0 && p !== null} // Example: make the first one active
                onClick={onPokemonClick} 
            />
        ))}
    </div>
  );
};

export default PokemonPartyBar;
