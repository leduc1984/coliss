import React from 'react';
import Draggable from './Draggable';
import { XIcon, PokedexIcon, BagIcon, SettingsIcon, LogoutIcon, PlayerIcon } from './Icons';

const MenuItem = ({ icon, label, last = false }) => (
    <button className={`w-full text-left p-4 flex items-center gap-4 transition-colors hover:bg-gray-200 ${!last ? 'border-b border-gray-200' : ''}`}>
        {icon}
        <span className="font-semibold text-gray-700">{label}</span>
    </button>
);

const PlayerMenu = ({ onClose }) => {
    const initialX = typeof window !== 'undefined' ? (window.innerWidth - 500) / 2 : 200;
    const initialY = typeof window !== 'undefined' ? (window.innerHeight - 400) / 2 : 100;

    return (
        <Draggable initialPosition={{ x: initialX, y: initialY }}>
            <div 
                className="w-[500px] h-[400px] bg-white rounded-xl shadow-2xl flex overflow-hidden border-2 border-black/20"
            >
                {/* Red background part */}
                <div data-drag-handle="true" className="w-2/5 bg-[#d9374b] relative cursor-grab active:cursor-grabbing p-6 flex flex-col justify-between">
                    <div 
                        className="absolute top-0 right-0 h-full w-full bg-white"
                        style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}
                    ></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3">
                             <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                                 <PlayerIcon className="w-10 h-10 text-white" />
                             </div>
                             <div>
                                <p className="font-bold text-xl text-white">leduc</p>
                                <p className="text-sm text-white/80">Trainer</p>
                             </div>
                        </div>
                    </div>
                    <div className="relative z-10">
                        {/* Could add trainer info here */}
                    </div>
                </div>

                {/* White menu part */}
                <div className="w-3/5 bg-gray-100 flex flex-col">
                    <div className="p-2 flex justify-end">
                         <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-300 transition-colors">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </div>
                    <div className="flex-grow">
                        <MenuItem icon={<PokedexIcon className="w-6 h-6 text-gray-600"/>} label="Pokédex" />
                        <MenuItem icon={<BagIcon className="w-6 h-6 text-gray-600"/>} label="Bag" />
                        <MenuItem icon={<SettingsIcon className="w-6 h-6 text-gray-600"/>} label="Settings" />
                        <MenuItem icon={<LogoutIcon className="w-6 h-6 text-gray-600"/>} label="Logout" last={true} />
                    </div>
                </div>
            </div>
        </Draggable>
    );
};

export default PlayerMenu;
