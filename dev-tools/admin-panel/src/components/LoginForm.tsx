import React, { useState } from 'react';
import styled from 'styled-components';

const LoginContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
`;

const LoginCard = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 32px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #cccccc;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #999;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 12px;
  color: #cccccc;
  font-weight: 500;
`;

const Input = styled.input`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 4px;
  color: #cccccc;
  font-size: 14px;
  padding: 10px 12px;
  transition: border-color 0.2s;

  &:focus {
    border-color: #007acc;
    background-color: #404040;
    outline: none;
  }

  &::placeholder {
    color: #999;
  }
`;

const LoginButton = styled.button<{ loading: boolean }>`
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${props => props.loading ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s;
  margin-top: 8px;
  position: relative;

  &:hover {
    background-color: ${props => props.loading ? '#0e639c' : '#1177bb'};
  }

  &:disabled {
    background-color: #5a5a5a;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: #fca5a5;
  margin-top: 8px;
`;

const SecurityNote = styled.div`
  background-color: rgba(251, 191, 36, 0.1);
  border: 1px solid #f59e0b;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 11px;
  color: #fcd34d;
  margin-top: 16px;
  text-align: center;
`;

const DemoCredentials = styled.div`
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid #22c55e;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 11px;
  color: #86efac;
  margin-top: 8px;
`;

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await onLogin(username.trim(), password);
      if (!success) {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <Title>
            👑 Admin Panel
          </Title>
          <Subtitle>Pokemon MMO Server Management</Subtitle>
        </LoginHeader>

        <LoginForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Username</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              autoComplete="username"
            />
          </FormGroup>

          <FormGroup>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
            />
          </FormGroup>

          <LoginButton type="submit" loading={loading} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </LoginButton>

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </LoginForm>

        <DemoCredentials>
          <strong>Demo Credentials:</strong><br />
          Username: admin<br />
          Password: admin123
        </DemoCredentials>

        <SecurityNote>
          🔒 This is a secure admin interface. All actions are logged and monitored.
        </SecurityNote>
      </LoginCard>
    </LoginContainer>
  );
};