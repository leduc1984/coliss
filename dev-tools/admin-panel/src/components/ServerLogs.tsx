import React from 'react';
import styled from 'styled-components';
import { AdminUser } from '../types/AdminTypes';

const Container = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

interface ServerLogsProps {
  user: AdminUser;
}

export const ServerLogs: React.FC<ServerLogsProps> = ({ user }) => {
  return (
    <Container>
      <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Server Logs</h2>
      <div style={{ color: '#cccccc', fontSize: '12px' }}>
        Server logs and monitoring will be implemented here.
      </div>
    </Container>
  );
};