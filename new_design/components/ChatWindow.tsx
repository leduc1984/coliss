import React, { useState, useRef, useEffect } from 'react';
import Draggable from './Draggable';
import { GlobeIcon, MinusIcon, SendIcon, PlusIcon, XIcon, CheckIcon } from './Icons';

const initialTabs = [
    { 
        id: 1, 
        name: 'Global', 
        messages: [
            { user: 'System', text: 'Welcome to LeDuC MmO! The adventure begins.', color: 'text-cyan-400' },
            { user: 'Ash', text: 'Hey, has anyone seen a Pikachu around here?', color: 'text-yellow-400' },
        ],
        isClosable: false
    },
    { 
        id: 2, 
        name: 'English', 
        messages: [
             { user: 'Misty', text: 'I\'m looking for a water pokemon, any suggestions?', color: 'text-blue-400' },
             { user: 'Brock', text: 'I can help! What about a Staryu?', color: 'text-orange-400' },
        ],
        isClosable: false
    },
];

const CHAT_WIDTH = 420;
const CHAT_HEIGHT_MAX = 400;
const PADDING = 20;

const initialX = typeof window !== 'undefined' ? window.innerWidth - CHAT_WIDTH - PADDING : 800;
const initialY = typeof window !== 'undefined' ? window.innerHeight - CHAT_HEIGHT_MAX - PADDING : 200;

const ChatWindow = () => {
    const [tabs, setTabs] = useState(initialTabs);
    const [activeTabId, setActiveTabId] = useState(1);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showAddTabModal, setShowAddTabModal] = useState(false);
    const [newTabName, setNewTabName] = useState('');
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    const activeTab = tabs.find(t => t.id === activeTabId);

    useEffect(() => {
        if (!isMinimized) {
            scrollToBottom();
        }
    }, [activeTab?.messages, isMinimized, activeTabId]);
    
    const handleSend = () => {
        if(input.trim() && activeTabId !== -1){
            const newMessage = { user: 'leduc', text: input, color: 'text-fuchsia-400'};
            const newTabs = tabs.map(tab => {
                if (tab.id === activeTabId) {
                    return { ...tab, messages: [...tab.messages, newMessage] };
                }
                return tab;
            });
            setTabs(newTabs);
            setInput('');
        }
    }
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const confirmAddTab = () => {
        if(newTabName.trim() === '') return;
        const newTabId = Date.now();
        const newTab = {
            id: newTabId,
            name: newTabName,
            messages: [{ user: 'System', text: `You joined #${newTabName}.`, color: 'text-cyan-400' }],
            isClosable: true
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTabId);
        setNewTabName('');
        setShowAddTabModal(false);
    };
    
    const handleNewTabKeyPress = (e) => {
        if (e.key === 'Enter') {
            confirmAddTab();
        }
    };


    const handleCloseTab = (tabIdToClose) => {
        if (tabs.length <= 1) return;

        const newTabs = tabs.filter(tab => tab.id !== tabIdToClose);
        setTabs(newTabs);

        if (activeTabId === tabIdToClose) {
            setActiveTabId(newTabs[0]?.id || -1);
        }
    };
    
    return (
        <Draggable initialPosition={{ x: initialX, y: initialY }}>
            <div 
                className="relative w-[420px] bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out" 
                style={{ height: isMinimized ? '48px' : '400px', overflow: showAddTabModal ? 'visible' : 'hidden' }}
            >
                {showAddTabModal && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl overflow-hidden">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-80 border border-white/10">
                      <h3 className="text-lg font-semibold mb-4 text-white">Create New Channel</h3>
                      <input 
                        type="text"
                        value={newTabName}
                        onChange={(e) => setNewTabName(e.target.value)}
                        onKeyPress={handleNewTabKeyPress}
                        placeholder="Channel name"
                        className="w-full bg-black/40 rounded border border-white/20 px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                        autoFocus
                      />
                      <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setShowAddTabModal(false)} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors">Cancel</button>
                        <button onClick={confirmAddTab} className="px-4 py-2 bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 font-semibold transition-colors">Create</button>
                      </div>
                    </div>
                  </div>
                )}

                <header 
                    data-drag-handle="true" 
                    className="flex-shrink-0 p-3 bg-black/30 cursor-grab active:cursor-grabbing border-b border-white/5"
                >
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <GlobeIcon className="w-5 h-5 text-cyan-300"/>
                             <span className="font-bold text-sm">Chat</span>
                         </div>
                         <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                             <MinusIcon className="w-5 h-5 text-gray-400"/>
                         </button>
                    </div>
                </header>

                <div className="flex-shrink-0 flex items-center border-b border-white/10 px-2 overflow-x-auto" style={{ display: isMinimized ? 'none' : 'flex' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={`relative flex-shrink-0 flex items-center gap-2 text-sm px-3 py-2 border-b-2 transition-colors ${
                                activeTabId === tab.id
                                    ? 'border-cyan-400 text-white'
                                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab.name}
                            {tab.isClosable && (
                                <span onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }} className="p-0.5 rounded-full hover:bg-red-500/50">
                                    <XIcon className="w-3 h-3"/>
                                </span>
                            )}
                        </button>
                    ))}
                    <button onClick={() => setShowAddTabModal(true)} className="ml-2 p-1.5 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto" style={{ display: isMinimized ? 'none' : 'block' }}>
                    <div className="flex flex-col gap-3 text-sm">
                        {activeTab?.messages.map((msg, index) => (
                            <div key={index}>
                                <span className={`${msg.color} font-bold`}>{msg.user}</span>
                                <span className="text-white/90">: {msg.text}</span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="p-3 border-t border-white/10" style={{ display: isMinimized ? 'none' : 'block' }}>
                    <div className="flex items-center bg-black/40 rounded-lg ring-1 ring-transparent focus-within:ring-cyan-400/50 transition-all">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={`Message in #${activeTab?.name}...`}
                            className="w-full bg-transparent px-3 py-2 text-white placeholder-gray-400 focus:outline-none"
                        />
                        <button onClick={handleSend} className="p-2 mr-1 text-gray-400 hover:text-cyan-300 transition-colors rounded-md hover:bg-white/10">
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            </div>
        </Draggable>
    );
};

export default ChatWindow;