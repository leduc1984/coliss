class ChatManager {
    constructor() {
        this.socket = null;
        this.isInitialized = false;
        this.isMinimized = false; // Start expanded by default to match XML design
        this.isChatFocused = false;
        this.messageHistory = [];
        this.maxMessages = 100;
        this.activeChannel = 'global';
        this.customTabs = []; // Store custom tabs added by user
        
        // DOM elements storage
        this.chatElements = {};
        
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
            this.initializeEventListeners();
            this.initializeTabs();
            this.initializeMinimizeButton();
            this.initializeAdditionalButtons();
            this.isInitialized = true;
            console.log('✅ ChatManager DOM initialization complete');
            
            // Ensure chat panel is visible
            if (this.chatElements.chatPanel) {
                this.chatElements.chatPanel.style.display = 'block';
                console.log('💬 Chat panel initialized and visible');
            }
        } else {
            console.error('❌ ChatManager DOM initialization failed - critical elements missing');
            this.showChatError('Chat system initialization failed. Please refresh the page.');
        }
    }
    
    validateAndSetupDOMElements() {
        const requiredElements = {
            chatMessages: 'chat-messages',
            chatInput: 'chatInput', 
            sendButton: 'sendChat',
            toggleButton: 'toggleChat',
            chatPanel: 'chat-panel',
            chatContent: 'chat-content',
            chatIcon: 'chat-icon',
            chatHeader: 'chat-header'
        };
        
        let missingElements = [];
        
        for (const [key, elementId] of Object.entries(requiredElements)) {
            const element = document.getElementById(elementId);
            if (element) {
                this.chatElements[key] = element;
                console.log(`✅ Found ${key}: #${elementId}`);
            } else {
                if (elementId !== 'chat-icon') { // Icon is optional
                    console.error(`❌ Missing required element: #${elementId}`);
                    missingElements.push(elementId);
                }
            }
        }
        
        // Additional elements with class selectors
        this.chatElements.chatTabs = document.querySelectorAll('.chat-tab-button');
        this.chatElements.addTabButton = document.getElementById('add-tab-button');
        this.chatElements.removeTabButton = document.getElementById('remove-tab-button');
        this.chatElements.settingsButton = document.getElementById('settings-button');
        
        console.log(`Found ${this.chatElements.chatTabs.length} chat tabs`);
        
        if (missingElements.length > 0) {
            console.error('🔥 Critical chat elements missing:', missingElements);
            return false;
        }
        
        return true;
    }
    
    allElementsValid() {
        const required = ['chatMessages', 'chatInput', 'sendButton', 'toggleButton', 'chatPanel'];
        return required.every(key => this.chatElements[key] instanceof HTMLElement);
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

    initialize(socket) {
        console.log('🔌 Initializing chat with socket:', !!socket);
        
        if (!this.isInitialized) {
            console.error('❌ Cannot initialize chat: DOM not ready');
            this.showChatError('Chat system not ready. Please refresh the page.');
            return;
        }
        
        this.socket = socket;
        
        if (!socket) {
            console.error('❌ No socket provided to chat manager');
            this.showChatError('Connection failed. Please refresh the page.');
            return;
        }
        
        try {
            this.setupSocketEvents();
            this.loadChatHistory();
            
            // Show chat is ready
            console.log('💬 Chat system initialized and ready!');
            this.addSystemMessage('Welcome to Pokemon MMO! Type /help for commands.', 'info');
            
            // Make sure chat panel is visible and properly configured
            if (this.chatElements.chatPanel) {
                this.chatElements.chatPanel.style.display = 'block';
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
        if (this.chatElements.sendButton) {
            this.chatElements.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Chat input focus/blur events
        if (this.chatElements.chatInput) {
            this.chatElements.chatInput.addEventListener('focus', () => {
                this.isChatFocused = true;
                this.disableGameControls();
                console.log('💬 Chat focused - game controls disabled');
            });
            
            this.chatElements.chatInput.addEventListener('blur', () => {
                this.isChatFocused = false;
                this.enableGameControls();
                console.log('💬 Chat unfocused - game controls enabled');
            });
            
            // Send message on Enter key
            this.chatElements.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Prevent game controls when typing
            this.chatElements.chatInput.addEventListener('keydown', (e) => {
                e.stopPropagation(); // Empêche la propagation vers les contrôles du jeu
            });
            
            // Auto-resize textarea
            this.chatElements.chatInput.addEventListener('input', () => {
                this.chatElements.chatInput.style.height = '36px';
                this.chatElements.chatInput.style.height = Math.min(this.chatElements.chatInput.scrollHeight, 100) + 'px';
            });
        }

        // Toggle chat visibility with toggle button
        if (this.chatElements.toggleButton) {
            this.chatElements.toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleChat();
            });
        }
        
        console.log('✅ Chat event listeners initialized');
    }

    /**
     * Initialize additional buttons (add, remove, settings)
     */
    initializeAdditionalButtons() {
        // Add tab button
        if (this.chatElements.addTabButton) {
            this.chatElements.addTabButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addTab();
            });
        }
        
        // Remove tab button
        if (this.chatElements.removeTabButton) {
            this.chatElements.removeTabButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTab();
            });
        }
        
        // Settings button
        if (this.chatElements.settingsButton) {
            this.chatElements.settingsButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSettings();
            });
        }
        
        console.log('✅ Additional chat buttons initialized');
    }

    /**
     * Désactive les contrôles du jeu quand on tape dans le chat
     */
    disableGameControls() {
        // Notifier le GameManager de désactiver les contrôles
        if (window.gameManager) {
            window.gameManager.disableControls('chat');
        }
        
        // Marquer globalement que le chat est actif
        document.body.classList.add('chat-active');
    }
    
    /**
     * Réactive les contrôles du jeu quand on quitte le chat
     */
    enableGameControls() {
        // Notifier le GameManager de réactiver les contrôles
        if (window.gameManager) {
            window.gameManager.enableControls('chat');
        }
        
        // Enlever le marqueur global
        document.body.classList.remove('chat-active');
    }

    initializeMinimizeButton() {
        if (this.chatElements.toggleButton) {
            this.chatElements.toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleChat();
            });
            console.log('✅ Chat minimize button initialized');
        } else {
            console.warn('⚠️ Chat minimize button not found');
        }
    }

    /**
     * Bascule entre mode étendu et mode réduit
     */
    toggleChat() {
        if (!this.chatElements.chatPanel) {
            console.error('❌ Cannot toggle chat: panel missing');
            return;
        }
        
        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            // Minimize chat
            this.chatElements.chatPanel.style.width = '50px';
            this.chatElements.chatPanel.style.height = '50px';
            this.chatElements.chatPanel.style.borderRadius = '50%';
            this.chatElements.chatPanel.style.cursor = 'pointer';
            
            // Show icon, hide content
            if (this.chatElements.chatIcon) this.chatElements.chatIcon.style.display = 'flex';
            if (this.chatElements.chatHeader) this.chatElements.chatHeader.style.display = 'none';
            if (this.chatElements.chatContent) this.chatElements.chatContent.style.display = 'none';
            
            // Update toggle button text
            if (this.chatElements.toggleButton) this.chatElements.toggleButton.textContent = '+';
            
            console.log('💬 Chat minimized to icon');
        } else {
            // Expand chat
            this.chatElements.chatPanel.style.width = '350px';
            this.chatElements.chatPanel.style.height = 'auto';
            this.chatElements.chatPanel.style.maxHeight = '400px';
            this.chatElements.chatPanel.style.borderRadius = '8px';
            this.chatElements.chatPanel.style.cursor = 'default';
            
            // Hide icon, show content
            if (this.chatElements.chatIcon) this.chatElements.chatIcon.style.display = 'none';
            if (this.chatElements.chatHeader) this.chatElements.chatHeader.style.display = 'flex';
            if (this.chatElements.chatContent) this.chatElements.chatContent.style.display = 'block';
            
            // Update toggle button text
            if (this.chatElements.toggleButton) this.chatElements.toggleButton.textContent = '−';
            
            console.log('💬 Chat expanded');
        }
    }

    initializeTabs() {
        // Add click event listeners to tabs with proper styling
        if (this.chatElements.chatTabs) {
            this.chatElements.chatTabs.forEach(tab => {
                // Skip add/remove/settings buttons
                if (tab.id === 'add-tab-button' || tab.id === 'remove-tab-button' || tab.id === 'settings-button') {
                    return;
                }
                
                tab.addEventListener('click', () => {
                    const channel = tab.dataset.channel;
                    this.switchToChannel(channel);
                });
                
                // Add hover effects
                tab.addEventListener('mouseenter', () => {
                    if (!tab.classList.contains('togglebutton-normal--active')) {
                        tab.style.color = '#fff';
                        tab.style.background = 'rgba(255,255,255,0.1)';
                    }
                });
                
                tab.addEventListener('mouseleave', () => {
                    if (!tab.classList.contains('togglebutton-normal--active')) {
                        tab.style.color = '#888';
                        tab.style.background = 'transparent';
                    }
                });
            });
        }
    }

    switchToChannel(channel) {
        if (channel === this.activeChannel) return;
        
        // Update active tab appearance
        if (this.chatElements.chatTabs) {
            this.chatElements.chatTabs.forEach(tab => {
                // Skip add/remove/settings buttons
                if (tab.id === 'add-tab-button' || tab.id === 'remove-tab-button' || tab.id === 'settings-button') {
                    return;
                }
                
                if (tab.dataset.channel === channel) {
                    tab.classList.add('togglebutton-normal--active');
                    tab.style.color = '#fff';
                    tab.style.borderBottomColor = '#007acc';
                    tab.style.background = 'rgba(255,255,255,0.1)';
                } else {
                    tab.classList.remove('togglebutton-normal--active');
                    tab.style.color = '#888';
                    tab.style.borderBottomColor = 'transparent';
                    tab.style.background = 'transparent';
                }
            });
        }
        
        this.activeChannel = channel;
        console.log(`💬 Switched to ${channel} channel`);
        
        // Update placeholder text
        if (this.chatElements.chatInput) {
            if (channel === 'english') {
                this.chatElements.chatInput.placeholder = 'Type in English only...';
            } else {
                this.chatElements.chatInput.placeholder = 'Type message or /help for commands...';
            }
        }
        
        // Clear and reload messages for this channel (future feature)
        // For now, we'll keep all messages in the same container
    }

    refreshTabs() {
        // Re-query tabs in case DOM has changed
        this.chatElements.chatTabs = document.querySelectorAll('.chat-tab-button');
        console.log('Refreshed tabs, found:', this.chatElements.chatTabs.length);
        
        // Re-initialize tab listeners
        this.initializeTabs();
        
        // Ensure global is active
        this.switchToChannel('global');
    }

    setupSocketEvents() {
        if (!this.socket) {
            console.error('No socket available for chat events');
            return;
        }

        console.log('Setting up chat socket events...');

        // Regular chat messages
        this.socket.on('chat_message', (data) => {
            console.log('Received chat message:', data);
            this.addMessage(data);
        });

        // System messages
        this.socket.on('chat_system', (data) => {
            console.log('Received system message:', data);
            this.addSystemMessage(data.message, data.type || 'info');
        });

        // Announcements
        this.socket.on('chat_announcement', (data) => {
            console.log('Received announcement:', data);
            this.addAnnouncement(data.message, data.from);
        });

        // Chat clear command
        this.socket.on('chat_clear', () => {
            console.log('Chat clear received');
            this.clearChat();
        });

        // Chat errors
        this.socket.on('chat_error', (data) => {
            console.log('Chat error received:', data);
            this.addSystemMessage(data.message, 'error');
        });
        
        console.log('Chat socket events setup complete');
    }

    sendMessage() {
        if (!this.chatElements.chatInput) {
            console.warn('Chat input element not available');
            return;
        }
        
        const message = this.chatElements.chatInput.value.trim();
        if (!message || !this.socket) {
            console.warn('Cannot send message: empty message or no socket connection');
            return;
        }

        console.log('Sending message:', message, 'to channel:', this.activeChannel);

        // Check if it's a command
        if (message.startsWith('/')) {
            this.handleCommand(message);
        } else {
            // Send regular message to server
            this.socket.emit('chat_message', {
                message: message,
                channel: this.activeChannel
            });
        }

        // Clear input
        this.chatElements.chatInput.value = '';
        // Reset textarea height
        this.chatElements.chatInput.style.height = '36px';
    }
    
    handleCommand(message) {
        const parts = message.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        console.log('🔧 Processing command:', command, 'with args:', args);
        
        switch (command) {
            case '/help':
                this.showCommandHelp();
                break;
            case '/commands':
                this.showAvailableCommands();
                break;
            case '/clear':
                this.clearChat();
                break;
            case '/who':
            case '/online':
                // Send to server for processing
                if (this.socket) {
                    this.socket.emit('chat_command', { command: 'who' });
                }
                break;
            default:
                // Send command to server for processing
                if (this.socket) {
                    this.socket.emit('chat_command', {
                        command: command.slice(1), // Remove the /
                        args: args,
                        fullMessage: message
                    });
                } else {
                    this.addSystemMessage(`Unknown command: ${command}. Type /help for available commands.`, 'error');
                }
                break;
        }
    }

    addMessage(data) {
        const messageElement = this.createMessageElement(data);
        this.addMessageToChat(messageElement);
        
        // Store in history
        this.messageHistory.push(data);
        this.trimMessageHistory();
    }

    addSystemMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message system ${type}`;
        
        messageElement.innerHTML = `<span class="system-text">${this.escapeHtml(message)}</span>`;
        
        this.addMessageToChat(messageElement);
    }

    addAnnouncement(message, from) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message announcement';
        messageElement.innerHTML = `
            <strong>📢 ANNOUNCEMENT from ${this.escapeHtml(from)}:</strong><br>
            ${this.escapeHtml(message)}
        `;
        
        this.addMessageToChat(messageElement);
    }

    createMessageElement(data) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${data.channel || 'global'}`;
        
        const timestamp = new Date(data.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        // Role-based username colors
        let usernameClass = '';
        switch (data.role) {
            case 'admin':
                usernameClass = 'admin';
                break;
            case 'co-admin':
                usernameClass = 'co-admin';
                break;
            case 'helper':
                usernameClass = 'helper';
                break;
        }
        
        messageElement.innerHTML = `
            <span class="chat-timestamp">[${timestamp}]</span>
            <span class="chat-username ${usernameClass}">${this.escapeHtml(data.username)}:</span>
            <span class="chat-text">${this.formatMessage(data.message)}</span>
        `;

        return messageElement;
    }

    addMessageToChat(messageElement) {
        if (!this.chatElements.chatMessages) {
            console.error('Chat messages container not available');
            return;
        }
        
        this.chatElements.chatMessages.appendChild(messageElement);
        
        // Auto-scroll to bottom
        this.chatElements.chatMessages.scrollTop = this.chatElements.chatMessages.scrollHeight;
        
        // Remove old messages if too many
        const messages = this.chatElements.chatMessages.children;
        if (messages.length > this.maxMessages) {
            this.chatElements.chatMessages.removeChild(messages[0]);
        }
    }

    formatMessage(message) {
        // Escape HTML first
        let formatted = this.escapeHtml(message);
        
        // Format URLs (basic implementation)
        formatted = formatted.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener">$1</a>'
        );
        
        // Format @mentions
        formatted = formatted.replace(
            /@(\w+)/g,
            '<span class="mention">@$1</span>'
        );
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearChat() {
        if (this.chatElements.chatMessages) {
            this.chatElements.chatMessages.innerHTML = '';
            this.addSystemMessage('Chat cleared by moderator', 'info');
        }
    }

    async loadChatHistory() {
        try {
            const token = localStorage.getItem('pokemon_mmo_token');
            const response = await fetch('/api/game/chat/history?limit=20', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const messages = await response.json();
                messages.forEach(message => {
                    this.addMessage({
                        username: message.username,
                        message: message.message,
                        role: 'user', // Default role, would need to be included in DB
                        timestamp: message.created_at
                    });
                });
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }

    trimMessageHistory() {
        if (this.messageHistory.length > this.maxMessages) {
            this.messageHistory = this.messageHistory.slice(-this.maxMessages);
        }
    }

    disableGameControls() {
        // Disable game controls when typing in chat
        if (window.gameManager && window.gameManager.playerController) {
            window.gameManager.playerController.setControlsEnabled(false);
        }
    }

    enableGameControls() {
        // Re-enable game controls when not typing in chat
        if (window.gameManager && window.gameManager.playerController) {
            window.gameManager.playerController.setControlsEnabled(true);
        }
    }

    // Show online player count
    updateOnlineCount(count) {
        const onlineCountElement = document.getElementById('onlineCount');
        if (onlineCountElement) {
            onlineCountElement.textContent = count;
        }
    }

    // Add typing indicator (future feature)
    showTypingIndicator(username) {
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator';
        typingElement.textContent = `${username} is typing...`;
        typingElement.id = `typing-${username}`;
        
        if (this.chatElements.chatMessages) {
            this.chatElements.chatMessages.appendChild(typingElement);
            this.chatElements.chatMessages.scrollTop = this.chatElements.chatMessages.scrollHeight;
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            const element = document.getElementById(`typing-${username}`);
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 3000);
    }

    // Show command help
    showCommandHelp() {
        const helpText = `Available commands:
/help - Show this help message
/commands - List all commands
/who, /online - Show online players
/clear - Clear chat messages`;
        
        this.addSystemMessage(helpText, 'info');
    }
    
    showAvailableCommands() {
        // This will be expanded based on user role
        const user = window.authManager ? window.authManager.user : null;
        let commands = [
            '/help - Show help message',
            '/commands - List all commands', 
            '/who, /online - Show online players',
            '/clear - Clear chat messages'
        ];
        
        if (user && user.role !== 'user') {
            commands.push('/mute <username> - Mute a user (Helper+)');
        }
        
        if (user && (user.role === 'co-admin' || user.role === 'admin')) {
            commands.push('/kick <username> - Kick a user (Co-Admin+)');
            commands.push('/announce <message> - Server announcement');
            commands.push('/promote <username> - Promote user to helper')
        }
        
        if (user && user.role === 'admin') {
            commands.push('/ban <username> - Ban a user (Admin only)');
            commands.push('/shutdown - Shutdown server');
            commands.push('/promote <username>&<role> - Promote user to helper or admin')
        }
        
        this.addSystemMessage('Available commands:\n' + commands.join('\n'), 'info');
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

// Initialize chat manager when DOM is loaded only if it doesn't already exist
document.addEventListener('DOMContentLoaded', () => {
    if (!window.chatManager) {
        window.chatManager = new ChatManager();
    }
});