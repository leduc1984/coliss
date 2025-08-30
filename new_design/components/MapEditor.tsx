import React, { useState, useRef, useEffect, useCallback } from 'react';
import Draggable from './Draggable';
import { XIcon, WrenchIcon, FullScreenIcon, RestoreScreenIcon } from './Icons';

// --- Helper Components for the Editor UI ---

const ToolbarButton = ({ children, active = false, className = '' }) => (
    <button className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${className} ${active ? 'bg-indigo-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`}>
        {children}
    </button>
);

const Panel = ({ children, className = '' }) => (
    <div className={`bg-gray-800/50 rounded-lg p-3 flex flex-col gap-4 ${className}`}>
        {children}
    </div>
);

const PanelSection = ({ title, children }) => (
    <div>
        <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
        {children}
    </div>
);


const MapEditor = ({ onClose }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [panelWidths, setPanelWidths] = useState([240, 0, 240]); // Left, Center, Right
    const containerRef = useRef(null);
    const isResizing = useRef(null); // { index, startX, startWidths }

    // Initialize center panel width after the component mounts
    useEffect(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const initialLeft = 240;
            const initialRight = 240;
            const dividerWidth = 8;
            const initialCenter = containerWidth - initialLeft - initialRight - (dividerWidth * 2);
            setPanelWidths([initialLeft, initialCenter, initialRight]);
        }
    }, [isFullScreen]);

    const handleMouseDown = useCallback((e, index) => {
        isResizing.current = {
            index,
            startX: e.clientX,
            startWidths: [...panelWidths],
        };
        e.preventDefault();
    }, [panelWidths]);

    const handleMouseUp = useCallback(() => {
        isResizing.current = null;
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isResizing.current) return;

        const { index, startX, startWidths } = isResizing.current;
        const deltaX = e.clientX - startX;

        const newWidths = [...startWidths];
        
        // Adjust widths
        newWidths[index] += deltaX;
        newWidths[index + 1] -= deltaX;

        // Enforce minimum width
        const minWidth = 150;
        if (newWidths[index] < minWidth || newWidths[index+1] < minWidth) {
           return;
        }

        setPanelWidths(newWidths);
    }, []);

    useEffect(() => {
        const upHandler = () => handleMouseUp();
        const moveHandler = (e) => handleMouseMove(e);

        if (isResizing.current) {
            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        }

        return () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
    }, [handleMouseMove, handleMouseUp]);


    const editorContent = (
        <div ref={containerRef} className="w-full h-full flex flex-col bg-[#21252b] text-white overflow-hidden">
            {/* Header */}
            <header data-drag-handle="true" className="flex items-center justify-between p-2.5 border-b border-white/10 cursor-grab active:cursor-grabbing flex-shrink-0">
                <div className="flex items-center gap-2">
                    <WrenchIcon className="w-5 h-5 text-indigo-400"/>
                    <h2 className="text-md font-bold text-red-400">Map Editor</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 rounded-md hover:bg-white/10 transition-colors">
                        {isFullScreen ? <RestoreScreenIcon className="w-4 h-4"/> : <FullScreenIcon className="w-4 h-4"/>}
                    </button>
                    <button onClick={onClose} className="p-1.5 rounded-md text-white bg-red-500/80 hover:bg-red-500 transition-colors">
                        <XIcon className="w-4 h-4"/>
                    </button>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex items-center gap-1.5 p-2 border-b border-white/10 flex-shrink-0 overflow-x-auto">
                <ToolbarButton>Charger Carte (.glb)</ToolbarButton>
                <ToolbarButton>Charger Collisions (.glb)</ToolbarButton>
                <ToolbarButton>Exporter Données (.json)</ToolbarButton>
                <ToolbarButton>Importer Données (.json)</ToolbarButton>
                <ToolbarButton>Mode Test</ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-2"></div>
                <ToolbarButton active={true}>Grille ON</ToolbarButton>
                <ToolbarButton active={true}>Collisions ON</ToolbarButton>
                <div className="w-px h-6 bg-white/10 mx-2"></div>
                <ToolbarButton active={true}>Sélectionner</ToolbarButton>
                <ToolbarButton>Sélection Multiple</ToolbarButton>
                <ToolbarButton>Zone Pokémon</ToolbarButton>
                <ToolbarButton>Placer PNJ</ToolbarButton>
                <ToolbarButton>Point de Téléportation</ToolbarButton>
            </div>
            
            {/* Main Content */}
            <main className="flex-grow flex p-2 gap-2 overflow-hidden">
                {/* Left Panel */}
                <div style={{ width: `${panelWidths[0]}px` }} className="flex-shrink-0">
                    <Panel className="h-full">
                        <PanelSection title="Object Properties">
                            <p className="text-sm text-gray-400">Select an object to view its properties.</p>
                        </PanelSection>
                        <PanelSection title="Map Objects Library">
                            <p className="text-sm text-red-500 font-semibold">Error loading objects.</p>
                        </PanelSection>
                    </Panel>
                </div>

                {/* Divider 1 */}
                <div 
                    onMouseDown={(e) => handleMouseDown(e, 0)}
                    className="w-2 flex-shrink-0 cursor-col-resize bg-gray-900/50 hover:bg-indigo-500 rounded-sm transition-colors"
                ></div>

                {/* Center Panel */}
                <div style={{ width: `${panelWidths[1]}px` }} className="flex-grow flex flex-col">
                     <div 
                        className="w-full h-full bg-gray-900/50 rounded-lg flex items-center justify-center"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                     >
                        <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
                     </div>
                </div>

                 {/* Divider 2 */}
                <div 
                    onMouseDown={(e) => handleMouseDown(e, 1)}
                    className="w-2 flex-shrink-0 cursor-col-resize bg-gray-900/50 hover:bg-indigo-500 rounded-sm transition-colors"
                ></div>

                {/* Right Panel */}
                <div style={{ width: `${panelWidths[2]}px` }} className="flex-shrink-0">
                    <Panel className="h-full">
                         <PanelSection title="Inspecteur de Scène">
                             <h4 className="text-gray-300 font-semibold mb-1">Rechercher un objet</h4>
                             <input 
                                type="text"
                                placeholder="Rechercher..."
                                className="w-full bg-black/40 rounded border border-white/20 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                             />
                         </PanelSection>
                    </Panel>
                </div>
            </main>
        </div>
    );
    
    if (isFullScreen) {
        return (
            <div className="fixed inset-0 z-50">
                {editorContent}
            </div>
        )
    }

    return (
        <Draggable initialPosition={{ x: 100, y: 100 }}>
            <div className="w-[calc(100vw-200px)] h-[calc(100vh-200px)] max-w-[1400px] max-h-[900px] bg-transparent border border-white/10 rounded-xl shadow-2xl">
                {editorContent}
            </div>
        </Draggable>
    );
};

export default MapEditor;