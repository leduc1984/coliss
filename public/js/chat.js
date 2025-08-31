<<<<<<< HEAD
class ChatManager {
    constructor() {
        this.socket = null;
        this.isInitialized = false;
        this.isMinimized = false;
        this.isChatFocused = false;
        this.messageHistory = [];
        this.maxMessages = 100;
        this.activeChannel = 'global';
        this.customTabs = [];
        this.draggable = null;
        this.isModernUI = true; // Flag to use modern UI
        this.currentUI = 'new'; // 'xml', 'modern', or 'new'
        this.tabs = [
            { 
                id: 1, 
                name: 'Global', 
                channel: 'global',
                messages: [],
                isClosable: false
            },
            { 
                id: 2, 
                name: 'English', 
                channel: 'english',
                messages: [],
                isClosable: false
            },
        ];
        this.activeTabId = 1;
        
        // DOM elements storage
        this.chatElements = {};
        this.modernElements = {};
        this.newElements = {};
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeDOM());
        } else {
            this.initializeDOM();
        }
    }
    
    initializeDOM() {
        // Check if chat is already initialized
        if (this.isInitialized) {
            return;
        }
        
        console.log('🔧 Initializing ChatManager DOM elements...');
        
        // Enhanced DOM element validation with fallback creation
        this.validateAndSetupDOMElements();
        
        if (this.allElementsValid()) {
            // Initialize modern UI components
            this.initializeNewUI();
            
            this.initializeEventListeners();
            this.initializeTabs();
            this.initializeMinimizeButton();
            this.initializeAdditionalButtons();
            this.isInitialized = true;
            console.log('✅ ChatManager DOM initialization complete');
            
            // Ensure chat panel is visible
            if (this.newElements.chatContainer) {
                this.newElements.chatContainer.style.display = 'block';
                console.log('💬 Chat panel initialized and visible');
            }
        } else {
            console.error('❌ ChatManager DOM initialization failed - critical elements missing');
            this.showChatError('Chat system initialization failed. Please refresh the page.');
        }
    }
    
    validateAndSetupDOMElements() {
        // New UI elements
        this.newElements.chatContainer = document.getElementById('new-chat-container');
        this.newElements.chatHeader = this.newElements.chatContainer?.querySelector('[data-drag-handle="true"]');
        this.newElements.chatTabsContainer = this.newElements.chatContainer?.querySelector('.flex-shrink-0.flex');
        this.newElements.chatMessages = this.newElements.chatContainer?.querySelector('.flex-grow');
        this.newElements.chatInput = document.getElementById('new-chatInput');
        this.newElements.sendButton = document.getElementById('new-sendChat');
        this.newElements.toggleButton = document.getElementById('new-toggleChat');
        this.newElements.addTabButton = document.getElementById('new-add-tab-button');
        this.newElements.addTabModal = document.getElementById('new-add-tab-modal');
        this.newElements.newTabNameInput = document.getElementById('new-new-tab-name');
        this.newElements.cancelAddTabButton = document.getElementById('new-cancel-add-tab');
        this.newElements.confirmAddTabButton = document.getElementById('new-confirm-add-tab');
        this.newElements.messagesEnd = document.getElementById('new-chat-messages-end');
        
        // Make chat container draggable
        if (this.newElements.chatContainer && this.newElements.chatHeader) {
            makeDraggable(this.newElements.chatContainer, {
                initialPosition: { 
                    x: window.innerWidth - 420 - 20, 
                    y: window.innerHeight - 400 - 20 
                }
            });
        }
        
        console.log(`Found new chat elements:`, this.newElements);
        
        return true;
    }
    
    allElementsValid() {
        const required = ['chatContainer', 'chatInput', 'sendButton', 'toggleButton'];
        return required.every(key => this.newElements[key] instanceof HTMLElement);
    }
    
    initializeNewUI() {
        // Set initial position for chat container
        if (this.newElements.chatContainer) {
            const initialX = window.innerWidth - 420 - 20;
            const initialY = window.innerHeight - 400 - 20;
            this.newElements.chatContainer.style.left = `${initialX}px`;
            this.newElements.chatContainer.style.top = `${initialY}px`;
        }
        
        // Add initial messages
        this.addSystemMessage('Welcome to Pokemon MMO! Type /help for commands.', 'info');
    }
    
    showChatError(message) {
        // Create error overlay if chat fails
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(220, 38, 38, 0.9);
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 300px;
            font-family: 'Inter', sans-serif;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        errorDiv.innerHTML = `
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">💬 Chat Error</h4>
            <p style="margin: 0; font-size: 12px; line-height: 1.4;">${message}</p>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 10000);
    }
=======
(function() {
    'use strict';
>>>>>>> fd63a9deaee7b81a36ca4e0b566595344472f5ca

    /**
     * Manages all aspects of the in-game chat system, including UI, socket communication,
     * and command handling.
     */
    class ChatManager {
        constructor() {
            this.socket = null;
            this.isInitialized = false;
            this.isMinimized = true; // Start minimized
            this.isChatFocused = false;
            this.messageHistory = [];
            this.maxMessages = 100;
            this.activeChannel = 'global';
            
            this.dom = {}; // To store cached DOM elements

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeDOM());
            } else {
                this.initializeDOM();
            }
        }
        
        /**
         * Caches essential DOM elements and sets up the initial UI state.
         */
        initializeDOM() {
            if (this.isInitialized) return;

            const ids = ['chat-messages', 'chatInput', 'sendChat', 'toggleChat', 'chat-panel', 'chat-content', 'chat-icon', 'chat-header'];
            ids.forEach(id => this.dom[id.replace(/-(\w)/g, (m, g) => g.toUpperCase())] = document.getElementById(id));

            if (!this.dom.chatPanel) {
                console.error('Chat panel not found, chat cannot be initialized.');
                return;
            }

            this.initializeEventListeners();
            this.updateChatVisibility();
            this.isInitialized = true;
            console.log('✅ ChatManager DOM initialized.');
        }
        
        /**
         * Initializes the chat system with a socket connection.
         * @param {object} socket - The socket.io instance for communication.
         */
        initialize(socket) {
            if (!this.isInitialized) {
                return console.error('Cannot initialize chat: DOM not ready.');
            }
            this.socket = socket;
            if (!socket) {
                return console.error('No socket provided to ChatManager.');
            }
            
            this.setupSocketEvents();
            this.loadChatHistory();
<<<<<<< HEAD
            
            // Show chat is ready
            console.log('💬 Chat system initialized and ready!');
            this.addSystemMessage('Welcome to Pokemon MMO! Type /help for commands.', 'info');
            
            // Make sure chat panel is visible and properly configured
            if (this.newElements.chatContainer) {
                this.newElements.chatContainer.style.display = 'block';
                console.log('💬 Chat panel made visible');
            }
            
            // Initialize tabs after socket is ready
            this.refreshTabs();
            
            // Mark as successfully initialized
            this.socket.initialized = true;
            
        } catch (error) {
            console.error('❌ Chat initialization error:', error);
            this.showChatError('Chat initialization failed: ' + error.message);
        }
    }

    initializeEventListeners() {
        // Send message on button click
        if (this.newElements.sendButton) {
            this.newElements.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
        
        // Send message on Enter key
        if (this.newElements.chatInput) {
            this.newElements.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        
        // Toggle chat minimize
        if (this.newElements.toggleButton) {
            this.newElements.toggleButton.addEventListener('click', () => {
                this.toggleMinimize();
            });
        }
        
        // Add tab button
        if (this.newElements.addTabButton) {
            this.newElements.addTabButton.addEventListener('click', () => {
                this.showAddTabModal();
            });
        }
        
        // Cancel add tab
        if (this.newElements.cancelAddTabButton) {
            this.newElements.cancelAddTabButton.addEventListener('click', () => {
                this.hideAddTabModal();
            });
        }
        
        // Confirm add tab
        if (this.newElements.confirmAddTabButton) {
            this.newElements.confirmAddTabButton.addEventListener('click', () => {
                this.confirmAddTab();
            });
        }
        
        // New tab name input Enter key
        if (this.newElements.newTabNameInput) {
            this.newElements.newTabNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.confirmAddTab();
                }
            });
        }
        
        // Tab switching
        if (this.newElements.chatTabsContainer) {
            this.newElements.chatTabsContainer.addEventListener('click', (e) => {
                const tabButton = e.target.closest('[data-tab-id]');
                if (tabButton) {
                    const tabId = parseInt(tabButton.getAttribute('data-tab-id'));
                    this.setActiveTab(tabId);
                }
            });
        }
    }
    
    sendMessage() {
        if (!this.socket) {
            console.error('❌ No socket connection');
            return;
        }
        
        const input = this.newElements.chatInput;
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Send message through socket
        this.socket.emit('chatMessage', {
            message: message,
            channel: this.getActiveTab().channel
        });
        
        // Clear input
        input.value = '';
    }
    
    getActiveTab() {
        return this.tabs.find(tab => tab.id === this.activeTabId);
    }
    
    setActiveTab(tabId) {
        this.activeTabId = tabId;
        this.refreshTabs();
        this.refreshMessages();
    }
    
    refreshTabs() {
        if (!this.newElements.chatTabsContainer) return;
        
        // Clear existing tabs
        this.newElements.chatTabsContainer.innerHTML = '';
        
        // Add tabs
        this.tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.className = `relative flex-shrink-0 flex items-center gap-2 text-sm px-3 py-2 border-b-2 transition-colors ${
                this.activeTabId === tab.id
                    ? 'border-cyan-400 text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`;
            tabButton.setAttribute('data-tab-id', tab.id);
            tabButton.innerHTML = `
                <span>${tab.name === 'Global' ? '🌍' : tab.name === 'English' ? '🇬🇧' : '#'} ${tab.name}</span>
                ${tab.isClosable ? `
                    <span class="p-0.5 rounded-full hover:bg-red-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-3 h-3">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </span>
                ` : ''}
            `;
            this.newElements.chatTabsContainer.appendChild(tabButton);
        });
        
        // Add the + button
        const addButton = document.createElement('button');
        addButton.id = 'new-add-tab-button';
        addButton.className = 'ml-2 p-1.5 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors';
        addButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        `;
        this.newElements.chatTabsContainer.appendChild(addButton);
    }
    
    refreshMessages() {
        if (!this.newElements.chatMessages || !this.newElements.messagesEnd) return;
        
        const activeTab = this.getActiveTab();
        if (!activeTab) return;
        
        // Clear messages container
        const messagesContainer = this.newElements.chatMessages.querySelector('.flex-col');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        } else {
            // Create messages container if it doesn't exist
            const container = document.createElement('div');
            container.className = 'flex flex-col gap-3 text-sm';
            this.newElements.chatMessages.innerHTML = '';
            this.newElements.chatMessages.appendChild(container);
        }
        
        // Add messages
        activeTab.messages.forEach(msg => {
            this.addMessageToDOM(msg);
        });
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    addMessageToDOM(message) {
        if (!this.newElements.chatMessages || !this.newElements.messagesEnd) return;
        
        const messagesContainer = this.newElements.chatMessages.querySelector('.flex-col');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = `
            <span class="${message.color || 'text-white'} font-bold">${message.user}</span>
            <span class="text-white/90">: ${message.text}</span>
        `;
        messagesContainer.appendChild(messageDiv);
        
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        if (this.newElements.messagesEnd) {
            this.newElements.messagesEnd.scrollIntoView({ behavior: "smooth" });
        }
    }
    
    showAddTabModal() {
        if (this.newElements.addTabModal) {
            this.newElements.addTabModal.style.display = 'block';
            if (this.newElements.newTabNameInput) {
                this.newElements.newTabNameInput.focus();
            }
        }
    }
    
    hideAddTabModal() {
        if (this.newElements.addTabModal) {
            this.newElements.addTabModal.style.display = 'none';
            if (this.newElements.newTabNameInput) {
                this.newElements.newTabNameInput.value = '';
            }
        }
    }
    
    confirmAddTab() {
        if (!this.newElements.newTabNameInput) return;
        
        const tabName = this.newElements.newTabNameInput.value.trim();
        if (!tabName) return;
        
        // Create new tab
        const newTabId = Date.now();
        const newTab = {
            id: newTabId,
            name: tabName,
            channel: tabName.toLowerCase(),
            messages: [],
            isClosable: true
        };
        
        this.tabs.push(newTab);
        this.setActiveTab(newTabId);
        this.hideAddTabModal();
    }
    
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        
        if (!this.newElements.chatContainer) return;
        
        // Update height based on minimized state
        this.newElements.chatContainer.style.height = this.isMinimized ? '48px' : '400px';
        
        // Hide/show content elements
        const contentElements = this.newElements.chatContainer.querySelectorAll('.flex-shrink-0:not(:first-child), .flex-grow, .border-t');
        contentElements.forEach(el => {
            el.style.display = this.isMinimized ? 'none' : 'block';
        });
    }
    
    initializeModernUI() {
        if (!this.isModernUI) return;
        
        const chatPanel = this.modernElements.chatPanel;
        if (!chatPanel) return;
        
        // Make chat draggable
        const chatHeader = this.modernElements.chatHeader;
        if (chatHeader) {
            chatHeader.setAttribute('data-drag-handle', 'true');
            
            // Initialize draggable
            if (typeof Draggable !== 'undefined') {
                // Set initial position to bottom right
                const x = window.innerWidth - chatPanel.offsetWidth - 20;
                const y = window.innerHeight - chatPanel.offsetHeight - 20;
                chatPanel.style.left = x + 'px';
                chatPanel.style.top = y + 'px';
                
                this.draggable = new Draggable(chatPanel, {
                    handle: chatHeader
                });
            }
        }
        
        // Initialize modern event listeners
        this.initializeModernEventListeners();
        
        console.log('✅ Modern UI initialized');
    }
    
    initializeModernEventListeners() {
        // Send message on button click
        if (this.modernElements.sendButton) {
            this.modernElements.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
        
        // Chat input focus/blur events
        if (this.modernElements.chatInput) {
            this.modernElements.chatInput.addEventListener('focus', () => {
                this.isChatFocused = true;
                this.disableGameControls();
                console.log('💬 Chat focused - game controls disabled');
            });
            
            this.modernElements.chatInput.addEventListener('blur', () => {
                this.isChatFocused = false;
                this.enableGameControls();
                console.log('💬 Chat unfocused - game controls enabled');
            });
            
            // Send message on Enter key
            this.modernElements.chatInput.addEventListener('keypress', (e) => {
=======
            this.addSystemMessage('Welcome! Type /help for commands.', 'info');
        }

        /**
         * Binds all necessary event listeners for chat UI elements.
         */
        initializeEventListeners() {
            this.dom.sendButton?.addEventListener('click', () => this.sendMessage());
            this.dom.chatInput?.addEventListener('keypress', (e) => {
>>>>>>> fd63a9deaee7b81a36ca4e0b566595344472f5ca
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
<<<<<<< HEAD
        }
        
        // Toggle chat visibility with toggle button
        if (this.modernElements.toggleButton) {
            this.modernElements.toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleChat();
            });
        }
        
        // Add tab button
        if (this.modernElements.addTabButton) {
            this.modernElements.addTabButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showAddTabModal();
            });
        }
        
        // Cancel add tab button
        if (this.modernElements.cancelAddTabButton) {
            this.modernElements.cancelAddTabButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideAddTabModal();
            });
        }
        
        // Confirm add tab button
        if (this.modernElements.confirmAddTabButton) {
            this.modernElements.confirmAddTabButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmAddTab();
            });
        }
        
        // New tab name input
        if (this.modernElements.newTabNameInput) {
            this.modernElements.newTabNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.confirmAddTab();
                }
            });
        }
        
        console.log('✅ Modern chat event listeners initialized');
    }
    
    showAddTabModal() {
        if (this.modernElements.addTabModal) {
            this.modernElements.addTabModal.style.display = 'flex';
            if (this.modernElements.newTabNameInput) {
                this.modernElements.newTabNameInput.focus();
            }
        }
    }
    
    hideAddTabModal() {
        if (this.modernElements.addTabModal) {
            this.modernElements.addTabModal.style.display = 'none';
            if (this.modernElements.newTabNameInput) {
                this.modernElements.newTabNameInput.value = '';
            }
        }
    }
    
    confirmAddTab() {
        if (this.modernElements.newTabNameInput) {
            const tabName = this.modernElements.newTabNameInput.value.trim();
            if (tabName) {
                // Add new tab logic here
                this.addNewTab(tabName);
                this.hideAddTabModal();
            }
        }
    }
    
    addNewTab(tabName) {
        if (!this.modernElements.chatTabsContainer) return;
        
        // Create new tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'chat-tab-button';
        tabButton.dataset.channel = tabName.toLowerCase();
        
        // Add close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-tab';
        closeBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="12" height="12">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        `;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeTab(tabName.toLowerCase());
        });
        
        tabButton.innerHTML = `<span>${tabName}</span>`;
        tabButton.appendChild(closeBtn);
        
        // Insert before the add button
        const addButton = this.modernElements.addTabButton;
        this.modernElements.chatTabsContainer.insertBefore(tabButton, addButton);
        
        // Add click event
        tabButton.addEventListener('click', () => {
            this.switchToChannel(tabName.toLowerCase());
        });
        
        // Switch to the new tab
        this.switchToChannel(tabName.toLowerCase());
    }
    
    removeTab(channel) {
        // Remove tab logic
        console.log('Removing tab:', channel);
    }
    
    switchToChannel(channel) {
        // Switch to channel logic
        console.log('Switching to channel:', channel);
    }
    
    // Add a new tab
    addTab() {
        // For now, we'll just show the remove button as a placeholder
        // In a full implementation, this would prompt for a new tab name and create it
        if (this.chatElements.removeTabButton) {
            this.chatElements.removeTabButton.style.display = 'flex';
        }
        
        // Add to custom tabs array
        this.customTabs.push({ id: Date.now(), name: 'New Tab' });
        
        console.log('➕ Tab add button clicked');
        this.addSystemMessage('Tab management feature - Click - to remove tabs', 'info');
    }
    
    // Remove a tab
    removeTab() {
        // For now, we'll just hide the remove button as a placeholder
        // In a full implementation, this would remove the selected tab
        if (this.chatElements.removeTabButton) {
            this.chatElements.removeTabButton.style.display = 'none';
        }
        
        // Remove from custom tabs array
        if (this.customTabs.length > 0) {
            this.customTabs.pop();
        }
        
        console.log('➖ Tab remove button clicked');
    }
    
    // Open settings
    openSettings() {
        console.log('⚙️ Settings button clicked');
        this.addSystemMessage('Settings panel would open here in a full implementation', 'info');
    }
}
=======
            this.dom.chatInput?.addEventListener('focus', () => this.setChatFocus(true));
            this.dom.chatInput?.addEventListener('blur', () => this.setChatFocus(false));
            this.dom.toggleButton?.addEventListener('click', () => this.toggleChat());
        }

        /**
         * Sets up listeners for socket events related to chat.
         */
        setupSocketEvents() {
            this.socket.on('chat_message', (data) => this.addMessage(data));
            this.socket.on('chat_system', (data) => this.addSystemMessage(data.message, data.type || 'info'));
            this.socket.on('chat_announcement', (data) => this.addAnnouncement(data.message, data.from));
            this.socket.on('chat_clear', () => this.clearChat());
            this.socket.on('chat_error', (data) => this.addSystemMessage(data.message, 'error'));
        }

        /**
         * Toggles the chat window between minimized and expanded states.
         */
        toggleChat() {
            this.isMinimized = !this.isMinimized;
            this.updateChatVisibility();
        }

        /**
         * Updates the chat panel's visibility and style based on its state.
         */
        updateChatVisibility() {
            this.dom.chatPanel.classList.toggle('minimized', this.isMinimized);
            if(this.dom.toggleButton) this.dom.toggleButton.textContent = this.isMinimized ? '+' : '−';
        }

        /**
         * Sends a message or executes a command.
         */
        sendMessage() {
            const message = this.dom.chatInput.value.trim();
            if (!message || !this.socket) return;

            if (message.startsWith('/')) {
                this.handleCommand(message);
            } else {
                this.socket.emit('chat_message', { message, channel: this.activeChannel });
            }
            this.dom.chatInput.value = '';
        }
        
        /**
         * Handles client-side or server-side commands.
         * @param {string} message - The command message.
         */
        handleCommand(message) {
            const [command, ...args] = message.slice(1).split(' ');

            switch (command) {
                case 'help':
                    this.addSystemMessage('Available commands: /help, /clear, /who', 'info');
                    break;
                case 'clear':
                    this.clearChat();
                    break;
                default:
                    this.socket.emit('chat_command', { command, args });
                    break;
            }
        }

        /**
         * Adds a regular chat message to the chat window.
         * @param {object} data - The message data from the server.
         */
        addMessage(data) {
            const messageElement = this.createMessageElement(data);
            this.addMessageToChat(messageElement);
            this.messageHistory.push(data);
            if (this.messageHistory.length > this.maxMessages) {
                this.messageHistory.shift();
            }
        }

        /**
         * Adds a system message to the chat window.
         * @param {string} message - The text of the system message.
         * @param {string} type - The type of message (e.g., 'info', 'error').
         */
        addSystemMessage(message, type = 'info') {
            const el = document.createElement('div');
            el.className = `chat-message system ${type}`;
            el.innerHTML = `<span class="system-text">${this.escapeHtml(message)}</span>`;
            this.addMessageToChat(el);
        }

        /**
         * Adds a server-wide announcement to the chat window.
         * @param {string} message - The announcement text.
         * @param {string} from - The sender of the announcement.
         */
        addAnnouncement(message, from) {
            const el = document.createElement('div');
            el.className = 'chat-message announcement';
            el.innerHTML = `<strong>📢 from ${this.escapeHtml(from)}:</strong><br>${this.escapeHtml(message)}`;
            this.addMessageToChat(el);
        }

        /**
         * Creates a DOM element for a chat message.
         * @param {object} data - The message data.
         * @returns {HTMLElement} The created message element.
         */
        createMessageElement(data) {
            const el = document.createElement('div');
            el.className = `chat-message ${data.channel || 'global'}`;
            const timestamp = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const roleClass = `role-${data.role || 'user'}`;

            el.innerHTML = `
                <span class="chat-timestamp">[${timestamp}]</span>
                <span class="chat-username ${roleClass}">${this.escapeHtml(data.username)}:</span>
                <span class="chat-text">${this.formatMessage(data.message)}</span>
            `;
            return el;
        }

        /**
         * Appends a message element to the chat and scrolls to the bottom.
         * @param {HTMLElement} element - The message element to add.
         */
        addMessageToChat(element) {
            if (!this.dom.chatMessages) return;
            this.dom.chatMessages.appendChild(element);
            this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;

            if (this.dom.chatMessages.children.length > this.maxMessages) {
                this.dom.chatMessages.firstChild.remove();
            }
        }

        /**
         * Formats message content, escaping HTML and converting URLs.
         * @param {string} message - The raw message text.
         * @returns {string} The formatted HTML string.
         */
        formatMessage(message) {
            let formatted = this.escapeHtml(message);
            formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
            formatted = formatted.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
            return formatted;
        }

        escapeHtml(text = '') {
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }

        clearChat() {
            if (this.dom.chatMessages) {
                this.dom.chatMessages.innerHTML = '';
                this.addSystemMessage('Chat cleared.', 'info');
            }
        }

        /**
         * Fetches and displays recent chat history from the server.
         */
        async loadChatHistory() {
            try {
                const response = await fetch('/api/game/chat/history?limit=20', {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                if (response.ok) {
                    const messages = await response.json();
                    messages.reverse().forEach(msg => this.addMessage({ ...msg, channel: 'history' }));
                }
            } catch (error) {
                console.error('Failed to load chat history:', error);
            }
        }

        /**
         * Manages game control state based on chat focus.
         * @param {boolean} isFocused - Whether the chat input is focused.
         */
        setChatFocus(isFocused) {
            this.isChatFocused = isFocused;
            if (window.gameManager) {
                isFocused ? window.gameManager.disableControls('chat') : window.gameManager.enableControls('chat');
            }
            document.body.classList.toggle('chat-active', isFocused);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!window.chatManager) {
            window.chatManager = new ChatManager();
        }
    });
>>>>>>> fd63a9deaee7b81a36ca4e0b566595344472f5ca

})();