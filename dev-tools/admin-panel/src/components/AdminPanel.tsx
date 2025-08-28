import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Dashboard } from './Dashboard';
import { PlayerManagement } from './PlayerManagement';
import { ChatModeration } from './ChatModeration';
import { SupportTickets } from './SupportTickets';
import { WorldEvents } from './WorldEvents';
import { ServerLogs } from './ServerLogs';
import { GameMasterTools } from './GameMasterTools';
import { AdminUser, AdminTab } from '../types/AdminTypes';

const PanelContainer = styled.div`
  display: flex;
  flex: 1;
  height: calc(100vh - 48px);
  overflow: hidden;
`;

const Sidebar = styled.nav`
  width: 240px;
  min-width: 240px;
  background-color: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const SidebarSection = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid #3e3e42;
`;

const SectionTitle = styled.h3`
  margin: 0 0 8px 0;
  padding: 0 16px;
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const NavItem = styled.button<{ active: boolean }>`
  width: 100%;
  background: none;
  border: none;
  padding: 8px 16px;
  text-align: left;
  color: ${props => props.active ? '#ffffff' : '#cccccc'};
  background-color: ${props => props.active ? '#094771' : 'transparent'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.active ? '#094771' : '#3e3e42'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NavIcon = styled.span`
  width: 16px;
  font-size: 14px;
  text-align: center;
`;

const MainContent = styled.main`
  flex: 1;
  background-color: #1e1e1e;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const QuickActions = styled.div`
  padding: 12px 16px;
  background-color: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const QuickActionButton = styled.button<{ variant?: 'danger' | 'warning' | 'success' }>`
  background-color: ${props => {
    switch (props.variant) {
      case 'danger': return '#dc2626';
      case 'warning': return '#f59e0b';
      case 'success': return '#059669';
      default: return '#0e639c';
    }
  }};
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
`;

interface AdminPanelProps {
  user: AdminUser;
  onConnectionChange: (connected: boolean) => void;
}

interface NavSection {
  title: string;
  items: Array<{
    id: AdminTab;
    label: string;
    icon: string;
    path: string;
    requiresPermission?: string;
  }>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, onConnectionChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
      ]
    },
    {
      title: 'Player Management',
      items: [
        { id: 'players', label: 'Online Players', icon: '👥', path: '/players' },
        { id: 'chat', label: 'Chat Moderation', icon: '💬', path: '/chat' },
        { id: 'support', label: 'Support Tickets', icon: '🎫', path: '/support' },
      ]
    },
    {
      title: 'Game Management',
      items: [
        { id: 'events', label: 'World Events', icon: '🌟', path: '/events' },
        { id: 'gm_tools', label: 'GM Tools', icon: '🛠️', path: '/gm-tools' },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'logs', label: 'Server Logs', icon: '📋', path: '/logs' },
        { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' },
      ]
    }
  ];

  useEffect(() => {
    const path = location.pathname;
    const currentItem = navSections
      .flatMap(section => section.items)
      .find(item => path.startsWith(item.path));
    
    if (currentItem) {
      setActiveTab(currentItem.id);
    } else {
      // Default to dashboard if no match
      setActiveTab('dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleNavClick = (tab: AdminTab, path: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'announcement':
        const message = prompt('Enter server announcement:');
        if (message) {
          console.log('Sending announcement:', message);
          // TODO: Implement announcement
        }
        break;
      case 'restart':
        if (window.confirm('Are you sure you want to restart the server?')) {
          console.log('Restarting server...');
          // TODO: Implement server restart
        }
        break;
      case 'emergency_stop':
        if (window.confirm('EMERGENCY STOP: This will immediately disconnect all players. Continue?')) {
          console.log('Emergency stop initiated...');
          // TODO: Implement emergency stop
        }
        break;
      case 'backup':
        console.log('Creating backup...');
        // TODO: Implement backup
        break;
    }
  };

  const canAccessFeature = (requiredPermission?: string): boolean => {
    if (!requiredPermission) return true;
    if (user.role === 'Admin') return true;
    // TODO: Implement proper permission checking
    return user.permissions.some(p => p.name === requiredPermission);
  };

  return (
    <PanelContainer>
      <Sidebar>
        {navSections.map(section => (
          <SidebarSection key={section.title}>
            <SectionTitle>{section.title}</SectionTitle>
            {section.items.map(item => (
              <NavItem
                key={item.id}
                active={activeTab === item.id}
                disabled={!canAccessFeature(item.requiresPermission)}
                onClick={() => handleNavClick(item.id, item.path)}
              >
                <NavIcon>{item.icon}</NavIcon>
                {item.label}
              </NavItem>
            ))}
          </SidebarSection>
        ))}
      </Sidebar>

      <MainContent>
        <QuickActions>
          <QuickActionButton onClick={() => handleQuickAction('announcement')}>
            📢 Announcement
          </QuickActionButton>
          <QuickActionButton onClick={() => handleQuickAction('backup')}>
            💾 Backup
          </QuickActionButton>
          <QuickActionButton 
            variant="warning" 
            onClick={() => handleQuickAction('restart')}
          >
            🔄 Restart Server
          </QuickActionButton>
          <QuickActionButton 
            variant="danger" 
            onClick={() => handleQuickAction('emergency_stop')}
          >
            🛑 Emergency Stop
          </QuickActionButton>
        </QuickActions>

        <ContentArea>
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/players" element={<PlayerManagement user={user} />} />
            <Route path="/chat" element={<ChatModeration user={user} />} />
            <Route path="/support" element={<SupportTickets user={user} />} />
            <Route path="/events" element={<WorldEvents user={user} />} />
            <Route path="/logs" element={<ServerLogs user={user} />} />
            <Route path="/gm-tools" element={<GameMasterTools user={user} />} />
            <Route path="/*" element={<Dashboard user={user} />} />
          </Routes>
        </ContentArea>
      </MainContent>
    </PanelContainer>
  );
};