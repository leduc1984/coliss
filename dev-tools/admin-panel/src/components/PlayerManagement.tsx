import React, { useState } from 'react';
import styled from 'styled-components';
import { AdminUser } from '../types/AdminTypes';

const Container = styled.div`
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const PlayerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: #cccccc;
  font-size: 12px;
`;

const TableHeader = styled.th`
  background-color: #2d2d30;
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #3e3e42;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #3e3e42;
  }
`;

const TableCell = styled.td`
  padding: 8px;
  border-bottom: 1px solid #3e3e42;
`;

interface PlayerManagementProps {
  user: AdminUser;
}

export const PlayerManagement: React.FC<PlayerManagementProps> = ({ user }) => {
  const [players] = useState([
    { id: 1, username: 'Ash_Ketchum', level: 25, location: 'Pewter City', status: 'online' },
    { id: 2, username: 'Misty_Gym', level: 32, location: 'Cerulean City', status: 'online' },
    { id: 3, username: 'Brock_Breeder', level: 28, location: 'Route 3', status: 'away' },
  ]);

  return (
    <Container>
      <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Player Management</h2>
      <PlayerTable>
        <thead>
          <tr>
            <TableHeader>Username</TableHeader>
            <TableHeader>Level</TableHeader>
            <TableHeader>Location</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Actions</TableHeader>
          </tr>
        </thead>
        <tbody>
          {players.map(player => (
            <TableRow key={player.id}>
              <TableCell>{player.username}</TableCell>
              <TableCell>{player.level}</TableCell>
              <TableCell>{player.location}</TableCell>
              <TableCell>{player.status}</TableCell>
              <TableCell>
                <button style={{ fontSize: '10px', padding: '2px 6px' }}>
                  Manage
                </button>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </PlayerTable>
    </Container>
  );
};