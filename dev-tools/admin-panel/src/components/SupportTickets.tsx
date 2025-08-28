import React from 'react';
import styled from 'styled-components';
import { AdminUser } from '../types/AdminTypes';

const Container = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

interface SupportTicketsProps {
  user: AdminUser;
}

export const SupportTickets: React.FC<SupportTicketsProps> = ({ user }) => {
  return (
    <Container>
      <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Support Tickets</h2>
      <div style={{ color: '#cccccc', fontSize: '12px' }}>
        Support ticket system will be implemented here.
      </div>
    </Container>
  );
};