class AuthManager {
    constructor() {
        this.token = localStorage.getItem('pokemon_mmo_token');
        this.user = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form switch handlers
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Form submission handlers
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e);
        });

        // Password validation on input
        document.getElementById('regPassword').addEventListener('input', this.validatePasswordLive);
        document.getElementById('regConfirmPassword').addEventListener('input', this.validatePasswordMatch);
    }

    showRegisterForm() {
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.add('active');
        this.clearMessage();
    }

    showLoginForm() {
        document.getElementById('register-form').classList.remove('active');
        document.getElementById('login-form').classList.add('active');
        this.clearMessage();
    }

    validatePasswordLive() {
        const password = document.getElementById('regPassword').value;
        const errors = [];

        if (password.length > 0) {
            if (password.length < 8) errors.push('8+ characters');
            if (!/[A-Z]/.test(password)) errors.push('uppercase letter');
            if (!/[a-z]/.test(password)) errors.push('lowercase letter');
            if (!/[0-9]/.test(password)) errors.push('number');
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('special character');

            const small = document.querySelector('#regPassword + small');
            if (errors.length > 0) {
                small.textContent = `Missing: ${errors.join(', ')}`;
                small.style.color = '#ff6b6b';
            } else {
                small.textContent = 'Password strength: Strong ✓';
                small.style.color = '#66bb6a';
            }
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const small = document.querySelector('#regConfirmPassword + small');

        if (confirmPassword.length > 0) {
            if (password === confirmPassword) {
                small.textContent = 'Passwords match ✓';
                small.style.color = '#66bb6a';
            } else {
                small.textContent = 'Passwords do not match';
                small.style.color = '#ff6b6b';
            }
        }
    }

    async handleLogin(event) {
        const formData = new FormData(event.target);
        const loginData = {
            login: formData.get('login'),
            password: formData.get('password')
        };

        if (!loginData.login || !loginData.password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            this.showMessage('Connecting to Pokemon world...', 'info');
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('pokemon_mmo_token', result.token);
                this.token = result.token;
                this.user = result.user;
                this.showMessage('Welcome back, trainer!', 'success');
                
                setTimeout(() => {
                    this.startGame();
                }, 1000);
            } else {
                this.showMessage(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Connection failed. Please try again.', 'error');
        }
    }

    async handleRegister(event) {
        const formData = new FormData(event.target);
        const registerData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Client-side validation
        if (!this.validateRegisterData(registerData)) {
            return;
        }

        try {
            this.showMessage('Creating your trainer profile...', 'info');
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('pokemon_mmo_token', result.token);
                this.token = result.token;
                this.user = result.user;
                this.showMessage('Welcome to the Pokemon world!', 'success');
                
                setTimeout(() => {
                    this.startGame();
                }, 1000);
            } else {
                this.showMessage(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Connection failed. Please try again.', 'error');
        }
    }

    validateRegisterData(data) {
        // Username validation
        if (!data.username || data.username.length < 3 || data.username.length > 50) {
            this.showMessage('Username must be 3-50 characters', 'error');
            return false;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            this.showMessage('Username can only contain letters, numbers, and underscores', 'error');
            return false;
        }

        // Email validation
        if (!data.email || !this.isValidEmail(data.email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return false;
        }

        // Password validation
        const passwordErrors = this.validatePassword(data.password);
        if (passwordErrors.length > 0) {
            this.showMessage(passwordErrors.join('. '), 'error');
            return false;
        }

        // Password confirmation
        if (data.password !== data.confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return false;
        }

        return true;
    }

    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('auth-message');
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        
        if (type === 'success') {
            messageElement.style.display = 'block';
        }
    }

    clearMessage() {
        const messageElement = document.getElementById('auth-message');
        messageElement.textContent = '';
        messageElement.className = 'message';
    }

    async verifyToken() {
        if (!this.token) return false;

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.user = result.user;
                return true;
            } else {
                localStorage.removeItem('pokemon_mmo_token');
                this.token = null;
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    startGame() {
        // Hide auth screen and show loading
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('loading-screen').classList.add('active');
        
        // Initialize the game
        if (window.gameManager) {
            window.gameManager.initialize(this.user, this.token);
        }
    }

    logout() {
        localStorage.removeItem('pokemon_mmo_token');
        this.token = null;
        this.user = null;
        
        // Disconnect socket if connected
        if (window.socket) {
            window.socket.disconnect();
        }
        
        // Show auth screen
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('editor-screen').classList.remove('active');
        document.getElementById('loading-screen').classList.remove('active');
        document.getElementById('auth-screen').classList.add('active');
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Initialize chat manager globally
    if (typeof ChatManager !== 'undefined') {
        window.chatManager = new ChatManager();
        console.log('💬 Chat manager initialized globally');
    } else {
        console.error('⚠️ ChatManager class not found');
    }
    
    // Check if user is already logged in
    if (window.authManager.token) {
        window.authManager.verifyToken().then(isValid => {
            if (isValid) {
                window.authManager.startGame();
            }
        });
    }
});