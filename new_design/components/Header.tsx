import React from 'react';
import { LightningIcon, MapIcon, LogoutIcon } from './Icons';

const Header = ({ onMapEditorClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 p-3 bg-black/30 backdrop-blur-md shadow-lg flex items-center justify-between z-30">
      {/* Left Side */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
            <LightningIcon className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-wider text-white">
          LeDuC <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">MmO</span>
        </h1>
      </div>

      {/* Center - Loading */}
      <div className="absolute left-1/2 -translate-x-1/2">
         <button className="px-5 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white/80 hover:bg-white/20 transition-colors animate-pulse">
            Connecting...
        </button>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-black/40 rounded-full border border-white/10">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">L</div>
          <div className="text-left">
            <div className="font-semibold text-sm">leduc</div>
            <div className="text-xs px-2 py-0.5 bg-purple-600 text-white rounded-full font-bold shadow-md">ADMIN</div>
          </div>
        </div>
        <button 
          onClick={onMapEditorClick}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors border border-transparent hover:border-white/20">
          <MapIcon className="w-5 h-5" />
          Map Editor
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors border border-transparent hover:border-white/20">
          <LogoutIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;