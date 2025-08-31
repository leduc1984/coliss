(function() {
    'use strict';

    /**
     * Manages user authentication, including login, registration, and session management.
     */
    class AuthManager {
        constructor() {
            this.token = localStorage.getItem('pokemon_mmo_token');
            this.user = null;

            // Cache DOM elements for performance and maintainability
            this.dom = {
                authScreen: document.getElementById('auth-screen'),
                loadingScreen: document.getElementById('loading-screen'),
                gameScreen: document.getElementById('game-screen'),
                loginForm: document.getElementById('loginForm'),
                registerForm: document.getElementById('registerForm'),
                showRegister: document.getElementById('showRegister'),
                showLogin: document.getElementById('showLogin'),
                regPassword: document.getElementById('regPassword'),
                regConfirmPassword: document.getElementById('regConfirmPassword'),
                authMessage: document.getElementById('auth-message'),
                loginSubmit: document.querySelector('#loginForm button[type="submit"]'),
                registerSubmit: document.querySelector('#registerForm button[type="submit"]'),
            };

            this.initializeEventListeners();
        }

        /**
         * Sets up all necessary event listeners for the authentication forms.
         */
        initializeEventListeners() {
            if (!this.dom.loginForm) return; // Exit if auth elements are not on the page

            this.dom.showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });

            this.dom.showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });

            this.dom.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });

            this.dom.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });

            this.dom.regPassword.addEventListener('input', () => this.validatePasswordLive());
            this.dom.regConfirmPassword.addEventListener('input', () => this.validatePasswordMatch());
        }

        showRegisterForm() {
            this.dom.loginForm.parentElement.classList.remove('active');
            this.dom.registerForm.parentElement.classList.add('active');
            this.clearMessage();
        }

        showLoginForm() {
            this.dom.registerForm.parentElement.classList.remove('active');
            this.dom.loginForm.parentElement.classList.add('active');
            this.clearMessage();
        }

        /**
         * Provides live feedback on password strength during registration.
         */
        validatePasswordLive() {
            const password = this.dom.regPassword.value;
            const errors = this.validatePassword(password, true); // `true` for partial validation
            const small = this.dom.regPassword.nextElementSibling;

            if (password.length > 0) {
                if (errors.length > 0) {
                    small.textContent = `Missing: ${errors.join(', ')}`;
                    small.style.color = '#ff6b6b';
                } else {
                    small.textContent = 'Password strength: Strong ✓';
                    small.style.color = '#66bb6a';
                }
            } else {
                small.textContent = '';
            }
        }

        /**
         * Checks if the two password fields match during registration.
         */
        validatePasswordMatch() {
            const password = this.dom.regPassword.value;
            const confirmPassword = this.dom.regConfirmPassword.value;
            const small = this.dom.regConfirmPassword.nextElementSibling;

            if (confirmPassword.length > 0) {
                if (password === confirmPassword) {
                    small.textContent = 'Passwords match ✓';
                    small.style.color = '#66bb6a';
                } else {
                    small.textContent = 'Passwords do not match';
                    small.style.color = '#ff6b6b';
                }
            } else {
                small.textContent = '';
            }
        }

        async handleLogin() {
            const formData = new FormData(this.dom.loginForm);
            const loginData = Object.fromEntries(formData.entries());

            if (!loginData.login || !loginData.password) {
                return this.showMessage('Please fill in all fields', 'error');
            }

            this.setLoading(true);
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Login failed');

                this.onAuthSuccess(result);
            } catch (error) {
                this.showMessage(error.message, 'error');
            } finally {
                this.setLoading(false);
            }
        }

        async handleRegister() {
            const formData = new FormData(this.dom.registerForm);
            const registerData = Object.fromEntries(formData.entries());

            if (!this.validateRegisterData(registerData)) return;

            this.setLoading(true);
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registerData)
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Registration failed');
                
                this.onAuthSuccess(result);
            } catch (error) {
                this.showMessage(error.message, 'error');
            } finally {
                this.setLoading(false);
            }
        }

        /**
         * Handles successful authentication by storing session and starting the game.
         * @param {object} result - The successful response from the server.
         */
        onAuthSuccess(result) {
            localStorage.setItem('pokemon_mmo_token', result.token);
            this.token = result.token;
            this.user = result.user;
            this.showMessage('Welcome!', 'success');
            setTimeout(() => this.startGame(), 1000);
        }

        validateRegisterData(data) {
            if (!data.username || data.username.length < 3) {
                return this.showMessage('Username must be at least 3 characters', 'error'), false;
            }
            if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
                return this.showMessage('Username can only contain letters, numbers, and underscores', 'error'), false;
            }
            if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                return this.showMessage('Please enter a valid email', 'error'), false;
            }
            const passwordErrors = this.validatePassword(data.password);
            if (passwordErrors.length > 0) {
                return this.showMessage(passwordErrors.join('. '), 'error'), false;
            }
            if (data.password !== data.confirmPassword) {
                return this.showMessage('Passwords do not match', 'error'), false;
            }
            return true;
        }

        validatePassword(password, partial = false) {
            const errors = [];
            if (!password) return ['Password is required'];
            if (password.length < 8) errors.push(partial ? '8+ characters' : 'at least 8 characters');
            if (!/[A-Z]/.test(password)) errors.push(partial ? 'uppercase' : 'an uppercase letter');
            if (!/[a-z]/.test(password)) errors.push(partial ? 'lowercase' : 'a lowercase letter');
            if (!/[0-9]/.test(password)) errors.push(partial ? 'number' : 'a number');
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push(partial ? 'special' : 'a special character');
            return errors;
        }

        showMessage(message, type) {
            this.dom.authMessage.textContent = message;
            this.dom.authMessage.className = `message ${type}`;
        }

        clearMessage() {
            this.dom.authMessage.textContent = '';
            this.dom.authMessage.className = 'message';
        }

        /**
         * Verifies the stored token with the server to resume a session.
         */
        async verifyTokenAndStart() {
            if (!this.token) return;

            try {
                const response = await fetch('/api/auth/verify', {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });

                if (response.ok) {
                    const result = await response.json();
                    this.user = result.user;
                    this.startGame();
                } else {
                    this.logout(); // Token is invalid, clear it
                }
            } catch (error) {
                console.error('Token verification failed:', error);
            }
        }

        startGame() {
            this.dom.authScreen.classList.remove('active');
            this.dom.loadingScreen.classList.add('active');

            if (window.gameManager) {
                window.gameManager.initialize(this.user, this.token);
            }
        }

        logout() {
            localStorage.removeItem('pokemon_mmo_token');
            this.token = null;
            this.user = null;
            if (window.socket) window.socket.disconnect();

            // Force reload to ensure a clean state
            window.location.reload();
        }

        setLoading(isLoading) {
            this.dom.loginSubmit.disabled = isLoading;
            this.dom.registerSubmit.disabled = isLoading;
            this.dom.loginSubmit.textContent = isLoading ? 'Connecting...' : 'Login';
            this.dom.registerSubmit.textContent = isLoading ? 'Creating...' : 'Register';
        }
    }

    // Initialize the application
    document.addEventListener('DOMContentLoaded', () => {
        const authManager = new AuthManager();
        window.authManager = authManager; // Expose for other scripts if needed

        // Initialize other global managers
        if (typeof ChatManager !== 'undefined') {
            window.chatManager = new ChatManager();
        }

        authManager.verifyTokenAndStart();
    });

})();