import React from 'react';
import Draggable from './Draggable';
import { XIcon, MaleIcon, FemaleIcon, SparklesIcon } from './Icons';

// Mock data has been expanded to support the new detailed UI
export const mockPokemonParty = [
    {
        id: 3,
        name: 'Venusaur',
        level: 50,
        classification: 'Seed Pokémon',
        abilities: ['Overgrow', 'Chlorophyll'],
        stats: { hp: 80, atk: 82, def: 83, spatk: 100, spdef: 100, spd: 80 },
        dexInfo: "The plant blooms when it is absorbing solar energy. It stays on the move to seek sunlight.",
        height: "6'07\"",
        weight: "220.5 lbs",
        genderRatio: { male: 87.5, female: 12.5 },
        type: 'Grass',
        hp: { current: 150, max: 160 },
        xp: { current: 120, max: 500 },
        imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png',
        moves: [ { name: 'Petal Dance'}, { name: 'Sludge Bomb'}, { name: 'Earthquake'}, { name: 'Synthesis'} ]
    },
    // ... (other pokemon data would be similarly expanded)
];


const StatBar = ({ label, value, color }) => {
    const statColors = {
        hp: 'bg-red-500',
        atk: 'bg-orange-500',
        def: 'bg-yellow-500',
        spatk: 'bg-blue-400',
        spdef: 'bg-green-500',
        spd: 'bg-pink-500',
    };
    const maxStat = 255; // Max possible stat value in games
    return (
        <div className="flex items-center gap-2">
            <span className="w-12 text-xs font-bold text-right">{label}</span>
            <span className="w-8 text-sm font-semibold">{String(value).padStart(3, '0')}</span>
            <div className="flex-1 bg-gray-700/50 rounded-full h-2 border border-black/20">
                <div className={`${statColors[color]} h-full rounded-full`} style={{ width: `${(value / maxStat) * 100}%` }}></div>
            </div>
        </div>
    );
};


const PokemonDetailView = ({ pokemon: initialPokemon, onClose }) => {
    // Use the first pokemon from the mock data for now, as it's the only one with full data
    const pokemon = mockPokemonParty[0];

    const initialX = typeof window !== 'undefined' ? (window.innerWidth - 850) / 2 : 100;
    const initialY = typeof window !== 'undefined' ? (window.innerHeight - 550) / 2 : 50;

    return (
        <Draggable initialPosition={{ x: initialX, y: initialY }}>
            <div className="w-[850px] h-[550px] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-900/50 text-white font-sans">
                <div className="h-full w-full flex flex-col">
                    {/* Header */}
                    <header data-drag-handle="true" className="flex-shrink-0 h-16 bg-gradient-to-b from-red-700 to-red-600 border-b-4 border-red-900/50 flex items-center justify-between px-6 cursor-grab active:cursor-grabbing shadow-lg">
                        <h2 className="text-3xl font-bold tracking-wider" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{pokemon.name}</h2>
                        <div className="flex items-center gap-2">
                           <img src="https://fontmeme.com/permalink/240726/6c20573132d7216a815a51352feca5b2.png" alt="pokedex-logo" className="h-8" />
                        </div>
                         <div className="flex items-center gap-2">
                            <div className="w-20 h-8 bg-white/20 rounded-lg border border-white/30"></div>
                            <div className="w-8 h-8 bg-white/20 rounded-full border border-white/30"></div>
                        </div>
                    </header>

                    {/* Body */}
                    <main className="flex-grow bg-gradient-to-b from-blue-600 to-blue-800 p-4 relative grid grid-cols-2 grid-rows-3 gap-x-4 gap-y-2">
                        {/* Background Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                             <div className="w-[400px] h-[400px] border-[20px] border-white rounded-full flex items-center justify-center">
                                <div className="w-[200px] h-[200px] border-[20px] border-white rounded-full"></div>
                            </div>
                            <div className="absolute w-[180px] h-[180px] border-[20px] border-white rounded-full top-[15%] right-[20%]"></div>
                        </div>
                        
                         {/* Pokemon Image */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <img src={pokemon.imageUrl} alt={pokemon.name} className="h-[65%] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)]" />
                        </div>

                        {/* Info Panels */}
                        <div className="relative z-10 col-span-1 row-span-1 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                            <h4 className="font-bold text-sm">Classification</h4>
                            <p className="text-lg">{pokemon.classification}</p>
                            <h4 className="font-bold text-sm mt-2">Abilities</h4>
                            <div className="flex gap-4 text-md">
                                <span>{pokemon.abilities[0]}</span>
                                <span className="text-cyan-300">{pokemon.abilities[1]} (Hidden)</span>
                            </div>
                        </div>

                        <div className="relative z-10 col-span-1 row-span-2 row-start-2 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-sm mb-2">Stats</h4>
                                <div className="space-y-1.5">
                                    <StatBar label="HP" value={pokemon.stats.hp} color="hp" />
                                    <StatBar label="ATK" value={pokemon.stats.atk} color="atk" />
                                    <StatBar label="DEF" value={pokemon.stats.def} color="def" />
                                    <StatBar label="Sp.ATK" value={pokemon.stats.spatk} color="spatk" />
                                    <StatBar label="Sp.DEF" value={pokemon.stats.spdef} color="spdef" />
                                    <StatBar label="SPD" value={pokemon.stats.spd} color="spd" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-2">
                                <span className="font-bold text-sm">Total:</span>
                                <span className="font-bold text-xl">{Object.values(pokemon.stats).reduce((a, b) => a + b, 0)}</span>
                            </div>
                        </div>
                        
                         <div className="relative z-10 col-span-1 row-span-1 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <SparklesIcon className="w-8 h-8 text-yellow-300" />
                                 <div className="flex items-center gap-2">
                                     <MaleIcon className="w-5 h-5 text-blue-300" />
                                     <span className="text-sm font-semibold">{pokemon.genderRatio.male}%</span>
                                 </div>
                                  <div className="flex items-center gap-2">
                                     <FemaleIcon className="w-5 h-5 text-pink-300" />
                                     <span className="text-sm font-semibold">{pokemon.genderRatio.female}%</span>
                                 </div>
                             </div>
                             <button onClick={onClose} className="p-1 rounded-full bg-red-500/50 hover:bg-red-500 transition-colors self-start">
                                <XIcon className="w-4 h-4" />
                            </button>
                         </div>
                        
                        <div className="relative z-10 col-span-1 row-span-1 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                            <h4 className="font-bold text-sm mb-1">Original Signature Moves</h4>
                             <div className="text-sm grid grid-cols-2 gap-x-4">
                                {pokemon.moves.map(move => <p key={move.name}>- {move.name}</p>)}
                            </div>
                        </div>

                         <div className="relative z-10 col-span-2 row-span-1 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex items-center justify-between">
                            <p className="text-sm w-3/4">{pokemon.dexInfo}</p>
                            <div className="text-right">
                                <p><span className="font-bold">HT:</span> {pokemon.height}</p>
                                <p><span className="font-bold">WT:</span> {pokemon.weight}</p>
                            </div>
                        </div>

                    </main>
                </div>
            </div>
        </Draggable>
    );
}

export default PokemonDetailView;
