(function() {
    'use strict';

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
            this.addSystemMessage('Welcome! Type /help for commands.', 'info');
        }

        /**
         * Binds all necessary event listeners for chat UI elements.
         */
        initializeEventListeners() {
            this.dom.sendButton?.addEventListener('click', () => this.sendMessage());
            this.dom.chatInput?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
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

})();