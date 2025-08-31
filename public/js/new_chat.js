class NewChatManager {
    constructor() {
        this.socket = null;
        this.isInitialized = false;
        this.isMinimized = false;
        this.tabs = [
            { id: 1, name: 'Global', channel: 'global', messages: [] },
            { id: 2, name: 'English', channel: 'english', messages: [] },
        ];
        this.activeTabId = 1;

        this.elements = {};

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeDOM());
        } else {
            this.initializeDOM();
        }
    }

    initializeDOM() {
        if (this.isInitialized) return;

        this.elements.chatContainer = document.getElementById('new-chat-container');
        this.elements.chatHeader = this.elements.chatContainer?.querySelector('[data-drag-handle="true"]');
        this.elements.chatTabsContainer = document.getElementById('new-chat-tabs-container');
        this.elements.chatMessages = document.getElementById('new-chat-messages');
        this.elements.chatInput = document.getElementById('new-chatInput');
        this.elements.sendButton = document.getElementById('new-sendChat');
        this.elements.toggleButton = document.getElementById('new-toggleChat');
        this.elements.messagesEnd = document.getElementById('new-chat-messages-end');

        if (!this.elements.chatContainer) {
            console.error("Chat container not found");
            return;
        }

        this.initializeEventListeners();
        this.renderTabs();
        this.addSystemMessage('Welcome to the new chat!', 'info');

        if (typeof makeDraggable === 'function') {
            makeDraggable(this.elements.chatContainer, { handle: this.elements.chatHeader });
        }

        this.isInitialized = true;
        console.log('New Chat Manager Initialized');
    }

    initialize(socket) {
        this.socket = socket;
        this.setupSocketEvents();
    }

    setupSocketEvents() {
        if (!this.socket) return;
        this.socket.on('chat_message', (data) => this.addMessage(data));
        this.socket.on('chat_system', (data) => this.addSystemMessage(data.message, data.type || 'info'));
    }

    initializeEventListeners() {
        this.elements.sendButton?.addEventListener('click', () => this.sendMessage());

        this.elements.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.elements.toggleButton?.addEventListener('click', () => this.toggleMinimize());

        this.elements.chatTabsContainer?.addEventListener('click', (e) => {
            const tabButton = e.target.closest('.chat-tab');
            if (tabButton) {
                const tabId = parseInt(tabButton.dataset.tabId);
                this.setActiveTab(tabId);
            }
        });
    }

    sendMessage() {
        const message = this.elements.chatInput.value.trim();
        if (!message) return;

        if (this.socket) {
             this.socket.emit('chat_message', {
                message: message,
                channel: this.getActiveTab().channel
            });
        } else {
            // For local testing without a server
            this.addMessage({ username: 'You', message });
        }

        this.elements.chatInput.value = '';
    }

    addMessage(data) {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            activeTab.messages.push(data);
            this.renderMessages();
        }
    }

    addSystemMessage(message, type) {
        const msg = {
            username: 'System',
            message: message,
            system: true,
            type: type
        };
        const activeTab = this.getActiveTab();
        if (activeTab) {
            activeTab.messages.push(msg);
            this.renderMessages();
        }
    }

    renderMessages() {
        if (!this.elements.chatMessages) return;
        this.elements.chatMessages.innerHTML = '';

        const activeTab = this.getActiveTab();
        if (!activeTab) return;

        activeTab.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            if (msg.system) {
                 messageDiv.innerHTML = `<span style="font-weight: bold; color: ${msg.type === 'error' ? 'red' : 'cyan'};">${msg.username}</span>: <span>${msg.message}</span>`;
            } else {
                 messageDiv.innerHTML = `<span style="font-weight: bold;">${msg.username}</span>: <span>${msg.message}</span>`;
            }
            this.elements.chatMessages.appendChild(messageDiv);
        });

        this.scrollToBottom();
    }

    renderTabs() {
        if (!this.elements.chatTabsContainer) return;
        this.elements.chatTabsContainer.innerHTML = '';
        this.tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.className = 'chat-tab';
            tabButton.dataset.tabId = tab.id;
            tabButton.textContent = tab.name;
            if (tab.id === this.activeTabId) {
                tabButton.classList.add('active');
            }
            this.elements.chatTabsContainer.appendChild(tabButton);
        });
    }

    setActiveTab(tabId) {
        this.activeTabId = tabId;
        this.renderTabs();
        this.renderMessages();
    }

    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId);
    }

    scrollToBottom() {
        this.elements.messagesEnd?.scrollIntoView({ behavior: 'smooth' });
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const container = this.elements.chatContainer.children[0];
        if (this.isMinimized) {
            container.style.height = '48px';
        } else {
            container.style.height = '400px';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.newChatManager = new NewChatManager();
    // The chat manager needs the socket instance.
    // We can get it from the game manager when it's initialized.
    const originalGameInit = window.gameManager?.initialize;
    if (originalGameInit) {
        window.gameManager.initialize = function(...args) {
            return originalGameInit.apply(this, args).then(() => {
                if (window.newChatManager && this.socket) {
                    window.newChatManager.initialize(this.socket);
                }
            });
        };
    }
});
