import React from 'react';
import Draggable from './Draggable';
import { XIcon } from './Icons';

const pokedexData = [
  { id: 1, name: 'Bulbasaur' }, { id: 2, name: 'Ivysaur' }, { id: 3, name: 'Venusaur' },
  { id: 4, name: 'Charmander' }, { id: 5, name: 'Charmeleon' }, { id: 6, name: 'Charizard' },
  { id: 7, name: 'Squirtle' }, { id: 8, name: 'Wartortle' }, { id: 9, name: 'Blastoise' },
  { id: 10, name: 'Caterpie' }, { id: 11, name: 'Metapod' }, { id: 12, name: 'Butterfree' },
  { id: 13, name: 'Weedle' }, { id: 14, name: 'Kakuna' }, { id: 15, name: 'Beedrill' },
  { id: 16, name: 'Pidgey' }, { id: 17, name: 'Pidgeotto' }, { id: 18, name: 'Pidgeot' },
  { id: 19, name: 'Rattata' }, { id: 20, name: 'Raticate' }, { id: 21, name: 'Spearow' },
  { id: 22, name: 'Fearow' }, { id: 23, name: 'Ekans' }, { id: 24, name: 'Arbok' },
  { id: 25, name: 'Pikachu' }, { id: 26, name: 'Raichu' }, { id: 27, name: 'Sandshrew' },
  { id: 28, name: 'Sandslash' }, { id: 29, name: 'Nidoran♀' }, { id: 30, name: 'Nidorina' },
  { id: 31, name: 'Nidoqueen' }, { id: 32, name: 'Nidoran♂' }, { id: 33, name: 'Nidorino' },
  { id: 34, name: 'Nidoking' }, { id: 35, name: 'Clefairy' }, { id: 36, name: 'Clefable' },
];

const PokedexEntry = ({ pokemon }) => {
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
    return (
        <div className="bg-black/30 rounded-lg p-2 flex flex-col items-center justify-end aspect-square hover:bg-cyan-500/20 cursor-pointer transition-colors group relative overflow-hidden">
            <img src={imageUrl} alt={pokemon.name} className="absolute inset-2 h-auto w-auto object-contain transition-transform duration-300 group-hover:scale-110" />
            <div className="relative w-full text-center p-1 bg-black/40 backdrop-blur-sm rounded-b-md">
                <p className="text-xs text-white/70 group-hover:text-white">#{String(pokemon.id).padStart(3, '0')}</p>
                <p className="text-sm font-semibold truncate">{pokemon.name}</p>
            </div>
        </div>
    );
};


const PokedexWindow = ({ onClose }) => {
    const initialX = typeof window !== 'undefined' ? (window.innerWidth - 800) / 2 : 100;
    const initialY = typeof window !== 'undefined' ? (window.innerHeight - 600) / 2 : 100;

    return (
        <Draggable initialPosition={{x: initialX, y: initialY}}>
            <div className="w-[800px] max-h-[70vh] flex flex-col bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl text-white">
                <header data-drag-handle="true" className="flex items-center justify-between p-4 border-b border-white/10 cursor-grab active:cursor-grabbing flex-shrink-0">
                    <h2 className="text-lg font-bold">Pokédex</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </header>
                
                <div className="p-4 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-4">
                        {pokedexData.map(pokemon => (
                            <PokedexEntry key={pokemon.id} pokemon={pokemon} />
                        ))}
                    </div>
                </div>
            </div>
        </Draggable>
    );
}

export default PokedexWindow;