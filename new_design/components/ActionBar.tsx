import React from 'react';
import { PokedexIcon, BagIcon, PlayerIcon, SettingsIcon, ChatIcon } from './Icons';

const ActionButton = ({ children, tooltip, onClick }) => {
  return (
    <div className="group relative">
      <button 
        onClick={onClick}
        className="w-12 h-12 bg-gray-800/60 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center text-white/80 hover:bg-cyan-500/50 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-cyan-500/30">
        {children}
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-gray-900/80 rounded-md text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {tooltip}
      </div>
    </div>
  );
};

const ActionBar = ({ onChatToggle, onPokedexToggle, onPlayerMenuToggle }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-black/30 backdrop-blur-md rounded-full shadow-2xl z-20">
      <ActionButton tooltip="Pokédex" onClick={onPokedexToggle}>
        <PokedexIcon className="w-6 h-6" />
      </ActionButton>
      <ActionButton tooltip="Bag" onClick={() => {}}>
        <BagIcon className="w-6 h-6" />
      </ActionButton>
      <ActionButton tooltip="Chat" onClick={onChatToggle}>
        <ChatIcon className="w-6 h-6" />
      </ActionButton>
      <ActionButton tooltip="Player" onClick={onPlayerMenuToggle}>
        <PlayerIcon className="w-6 h-6" />
      </ActionButton>
      <ActionButton tooltip="Settings" onClick={() => {}}>
        <SettingsIcon className="w-6 h-6" />
      </ActionButton>
    </div>
  );
};

export default ActionBar;