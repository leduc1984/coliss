import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { AdminPanel } from './components/AdminPanel';
import { LoginForm } from './components/LoginForm';
import { GlobalStyles } from './styles/GlobalStyles';
import { AdminUser } from './types/AdminTypes';
import './App.css';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #1e1e1e;
  color: #ffffff;
`;

const AppHeader = styled.header<{ isLoggedIn: boolean }>`
  background-color: #2d2d30;
  padding: 8px 16px;
  border-bottom: 1px solid #3e3e42;
  display: ${props => props.isLoggedIn ? 'flex' : 'none'};
  align-items: center;
  justify-content: space-between;
  height: 48px;
  min-height: 48px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #cccccc;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const Username = styled.div`
  font-size: 12px;
  color: #cccccc;
  font-weight: 600;
`;

const UserRole = styled.div<{ role: string }>`
  font-size: 10px;
  color: ${props => {
    switch (props.role) {
      case 'Admin': return '#ef4444';
      case 'Co-Admin': return '#f59e0b';
      case 'Helper': return '#10b981';
      default: return '#6b7280';
    }
  }};
  font-weight: 500;
  text-transform: uppercase;
`;

const LogoutButton = styled.button`
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #b91c1c;
  }
`;

const ConnectionStatus = styled.div<{ connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${props => props.connected ? '#10b981' : '#ef4444'};
`;

function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    // Check for existing authentication
    const token = localStorage.getItem('admin_token');
    if (token) {
      // Validate token and auto-login
      validateToken(token);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      // TODO: Implement token validation with backend
      console.log('Validating token:', token);
      
      // Mock validation for development
      const mockUser: AdminUser = {
        id: '1',
        username: 'admin',
        role: 'Admin',
        permissions: [],
        loginTime: new Date(),
        ipAddress: '127.0.0.1'
      };
      
      setUser(mockUser);
      setIsConnected(true);
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('admin_token');
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      // TODO: Implement actual authentication
      console.log('Login attempt:', username);
      
      // Mock authentication for development
      if (username === 'admin' && password === 'admin123') {
        const token = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('admin_token', token);
        
        const mockUser: AdminUser = {
          id: '1',
          username,
          role: 'Admin',
          permissions: [],
          loginTime: new Date(),
          ipAddress: '127.0.0.1'
        };
        
        setUser(mockUser);
        setIsConnected(true);
        return true;
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    setIsConnected(false);
    setConnectionAttempts(0);
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    if (!connected) {
      setConnectionAttempts(prev => prev + 1);
    } else {
      setConnectionAttempts(0);
    }
  };

  if (!user) {
    return (
      <>
        <GlobalStyles />
        <LoginForm onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <Router>
        <AppContainer>
          <AppHeader isLoggedIn={!!user}>
            <Title>
              👑 Pokemon MMO - Admin Panel
            </Title>
            <UserInfo>
              <ConnectionStatus connected={isConnected}>
                {isConnected ? '🔗 Connected' : `🔌 Disconnected ${connectionAttempts > 0 ? `(${connectionAttempts})` : ''}`}
              </ConnectionStatus>
              <UserDetails>
                <Username>{user.username}</Username>
                <UserRole role={user.role}>{user.role}</UserRole>
              </UserDetails>
              <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
            </UserInfo>
          </AppHeader>
          
          <Routes>
            <Route 
              path="/*" 
              element={
                <AdminPanel 
                  user={user}
                  onConnectionChange={handleConnectionChange}
                />
              } 
            />
          </Routes>
        </AppContainer>
      </Router>
    </>
  );
}

export default App;