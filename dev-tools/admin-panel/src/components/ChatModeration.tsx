import React from 'react';
import styled from 'styled-components';
import { AdminUser } from '../types/AdminTypes';

const Container = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

interface ChatModerationProps {
  user: AdminUser;
}

export const ChatModeration: React.FC<ChatModerationProps> = ({ user }) => {
  return (
    <Container>
      <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Chat Moderation</h2>
      <div style={{ color: '#cccccc', fontSize: '12px' }}>
        Chat moderation features will be implemented here.
      </div>
    </Container>
  );
};