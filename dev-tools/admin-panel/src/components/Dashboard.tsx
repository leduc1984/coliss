import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminUser } from '../types/AdminTypes';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const MetricCard = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const MetricValue = styled.div<{ color?: string }>`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.color || '#ffffff'};
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 12px;
  color: #999999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricChange = styled.div<{ positive?: boolean }>`
  font-size: 10px;
  color: ${props => props.positive ? '#4caf50' : '#f44336'};
  margin-top: 4px;
`;

const ActivityPanel = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 300px;
`;

const PanelHeader = styled.div`
  background-color: #2d2d30;
  padding: 8px 12px;
  border-bottom: 1px solid #3e3e42;
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 12px;
  overflow-y: auto;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #3e3e42;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div<{ type: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  background-color: ${props => {
    switch (props.type) {
      case 'login': return '#4caf50';
      case 'logout': return '#999999';
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'info': return '#2196f3';
      default: return '#666666';
    }
  }};
  color: white;
`;

const ActivityDetails = styled.div`
  flex: 1;
`;

const ActivityText = styled.div`
  color: #ffffff;
  font-size: 11px;
`;

const ActivityTime = styled.div`
  color: #999999;
  font-size: 10px;
`;

const StatusIndicator = styled.div<{ status: 'online' | 'warning' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'online': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#666666';
    }
  }};
  margin-right: 8px;
`;

const SystemStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cccccc;
  font-size: 12px;
`;

interface DashboardProps {
  user: AdminUser;
}

interface SystemMetric {
  label: string;
  value: string | number;
  change?: number;
  color?: string;
}

interface Activity {
  id: string;
  type: 'login' | 'logout' | 'error' | 'warning' | 'info';
  text: string;
  timestamp: Date;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [systemStatus, setSystemStatus] = useState<'online' | 'warning' | 'error'>('online');

  useEffect(() => {
    // Mock system metrics
    const mockMetrics: SystemMetric[] = [
      { label: 'Online Players', value: 1247, change: 12, color: '#4caf50' },
      { label: 'Server Uptime', value: '127h 32m', color: '#2196f3' },
      { label: 'CPU Usage', value: '34%', change: -5, color: '#ff9800' },
      { label: 'Memory Usage', value: '8.2GB', color: '#9c27b0' },
      { label: 'Active Events', value: 3, color: '#00bcd4' },
      { label: 'Support Tickets', value: 12, change: 3, color: '#f44336' },
    ];

    // Mock recent activities
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'login',
        text: 'Player "Ash_Ketchum" logged in from 192.168.1.100',
        timestamp: new Date(Date.now() - 120000) // 2 minutes ago
      },
      {
        id: '2',
        type: 'warning',
        text: 'High CPU usage detected on server node 2',
        timestamp: new Date(Date.now() - 300000) // 5 minutes ago
      },
      {
        id: '3',
        type: 'info',
        text: 'World event "Shiny Charizard Hunt" started',
        timestamp: new Date(Date.now() - 600000) // 10 minutes ago
      },
      {
        id: '4',
        type: 'error',
        text: 'Database connection timeout (resolved)',
        timestamp: new Date(Date.now() - 900000) // 15 minutes ago
      },
      {
        id: '5',
        type: 'login',
        text: 'Admin "GameMaster" logged in',
        timestamp: new Date(Date.now() - 1200000) // 20 minutes ago
      },
      {
        id: '6',
        type: 'logout',
        text: 'Player "Misty_Gym" logged out',
        timestamp: new Date(Date.now() - 1500000) // 25 minutes ago
      },
    ];

    setMetrics(mockMetrics);
    setActivities(mockActivities);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        if (metric.label === 'Online Players') {
          const change = Math.floor(Math.random() * 10) - 5;
          return {
            ...metric,
            value: Math.max(0, (metric.value as number) + change),
            change: change
          };
        }
        if (metric.label === 'CPU Usage') {
          const newValue = Math.max(10, Math.min(90, 
            parseInt(metric.value.toString()) + (Math.random() * 10 - 5)
          ));
          return {
            ...metric,
            value: `${Math.round(newValue)}%`
          };
        }
        return metric;
      }));

      // Add new activity occasionally
      if (Math.random() < 0.3) {
        const newActivity: Activity = {
          id: Date.now().toString(),
          type: ['login', 'logout', 'info'][Math.floor(Math.random() * 3)] as Activity['type'],
          text: 'New activity detected',
          timestamp: new Date()
        };
        
        setActivities(prev => [newActivity, ...prev].slice(0, 20));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: Activity['type']): string => {
    switch (type) {
      case 'login': return '🟢';
      case 'logout': return '⚪';
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚫';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DashboardContainer>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ color: '#ffffff', margin: '0 0 8px 0' }}>
          Welcome back, {user.username}
        </h2>
        <SystemStatus>
          <StatusIndicator status={systemStatus} />
          <span>All systems operational</span>
          <span style={{ marginLeft: 'auto', fontSize: '10px' }}>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </SystemStatus>
      </div>

      <DashboardGrid>
        {metrics.map((metric, index) => (
          <MetricCard key={index}>
            <MetricValue color={metric.color}>
              {metric.value}
            </MetricValue>
            <MetricLabel>{metric.label}</MetricLabel>
            {metric.change !== undefined && (
              <MetricChange positive={metric.change >= 0}>
                {metric.change >= 0 ? '+' : ''}{metric.change}
                {metric.label === 'Online Players' ? ' players' : ''}
              </MetricChange>
            )}
          </MetricCard>
        ))}
      </DashboardGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <ActivityPanel>
          <PanelHeader>
            Recent Activity
            <span>{activities.length} events</span>
          </PanelHeader>
          <PanelContent>
            <ActivityList>
              {activities.map(activity => (
                <ActivityItem key={activity.id}>
                  <ActivityIcon type={activity.type}>
                    {getActivityIcon(activity.type)}
                  </ActivityIcon>
                  <ActivityDetails>
                    <ActivityText>{activity.text}</ActivityText>
                    <ActivityTime>{formatTime(activity.timestamp)}</ActivityTime>
                  </ActivityDetails>
                </ActivityItem>
              ))}
            </ActivityList>
          </PanelContent>
        </ActivityPanel>

        <ActivityPanel>
          <PanelHeader>
            Quick Actions
          </PanelHeader>
          <PanelContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                style={{
                  backgroundColor: '#0e639c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => alert('Viewing online players...')}
              >
                👥 View Online Players
              </button>
              
              <button 
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => alert('Creating world event...')}
              >
                🌟 Create Event
              </button>
              
              <button 
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => alert('Viewing server logs...')}
              >
                📋 Server Logs
              </button>
              
              <button 
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const message = prompt('Enter server announcement:');
                  if (message) {
                    alert('Announcement sent to all players!');
                  }
                }}
              >
                📢 Send Announcement
              </button>
            </div>
          </PanelContent>
        </ActivityPanel>
      </div>
    </DashboardContainer>
  );
};