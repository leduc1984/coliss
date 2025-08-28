import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Pokemon } from '../types/PokemonTypes';

const VersionContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
`;

const VersionHeader = styled.div`
  margin-bottom: 16px;
`;

const Title = styled.h2`
  color: #ffffff;
  font-size: 18px;
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  color: #cccccc;
  font-size: 12px;
  margin: 0;
`;

const VersionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: calc(100% - 80px);
`;

const Panel = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
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

const VersionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VersionItem = styled.div<{ selected?: boolean; current?: boolean }>`
  padding: 12px;
  background-color: ${props => {
    if (props.current) return '#1e4f72';
    if (props.selected) return '#094771';
    return '#3c3c3c';
  }};
  border: 1px solid ${props => {
    if (props.current) return '#007acc';
    if (props.selected) return '#007acc';
    return '#5e5e5e';
  }};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => {
      if (props.current) return '#2a5f82';
      if (props.selected) return '#0a5f8a';
      return '#4a4a4a';
    }};
  }
`;

const VersionMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const VersionId = styled.span`
  color: #ffffff;
  font-weight: bold;
  font-size: 12px;
`;

const VersionDate = styled.span`
  color: #999999;
  font-size: 10px;
`;

const VersionMessage = styled.div`
  color: #cccccc;
  font-size: 11px;
  margin-bottom: 8px;
`;

const VersionAuthor = styled.div`
  color: #999999;
  font-size: 10px;
`;

const VersionBadge = styled.span<{ type: 'current' | 'tag' | 'branch' }>`
  background-color: ${props => {
    switch (props.type) {
      case 'current': return '#4caf50';
      case 'tag': return '#ff9800';
      case 'branch': return '#2196f3';
      default: return '#666666';
    }
  }};
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 9px;
  margin-left: 4px;
`;

const DiffContainer = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 11px;
`;

const DiffSection = styled.div`
  margin-bottom: 12px;
`;

const DiffHeader = styled.div`
  color: #ffffff;
  font-weight: bold;
  margin-bottom: 4px;
  padding: 4px 8px;
  background-color: #3e3e42;
  border-radius: 3px;
`;

const DiffLine = styled.div<{ type: 'added' | 'removed' | 'unchanged' }>`
  padding: 2px 8px;
  background-color: ${props => {
    switch (props.type) {
      case 'added': return '#1e3a1e';
      case 'removed': return '#3a1e1e';
      case 'unchanged': return 'transparent';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'added': return '#4caf50';
      case 'removed': return '#f44336';
      case 'unchanged': return '#cccccc';
    }
  }};
  border-left: 2px solid ${props => {
    switch (props.type) {
      case 'added': return '#4caf50';
      case 'removed': return '#f44336';
      case 'unchanged': return 'transparent';
    }
  }};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Button = styled.button`
  background-color: #0e639c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background-color: #1177bb;
  }

  &:disabled {
    background-color: #5a5a5a;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(Button)`
  background-color: #d73a49;

  &:hover {
    background-color: #e74c3c;
  }
`;

const SuccessButton = styled(Button)`
  background-color: #28a745;

  &:hover {
    background-color: #34ce57;
  }
`;

const CommitForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #2d2d30;
  border-radius: 4px;
`;

const Input = styled.input`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 6px 8px;
  font-size: 12px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

const TextArea = styled.textarea`
  background-color: #3c3c3c;
  border: 1px solid #5e5e5e;
  border-radius: 3px;
  color: #cccccc;
  padding: 6px 8px;
  font-size: 12px;
  resize: vertical;
  min-height: 60px;

  &:focus {
    border-color: #007acc;
    outline: none;
  }
`;

interface VersionData {
  id: string;
  timestamp: Date;
  message: string;
  author: string;
  changes: ChangeSet[];
  tags: string[];
  isCurrent: boolean;
}

interface ChangeSet {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
}

interface VersionControlProps {
  pokemon: Pokemon | null;
  onRevert: (versionId: string) => void;
  onCreateTag: (versionId: string, tagName: string) => void;
}

export const VersionControl: React.FC<VersionControlProps> = ({
  pokemon,
  onRevert,
  onCreateTag
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [tagName, setTagName] = useState('');
  const [showCommitForm, setShowCommitForm] = useState(false);

  // Mock version data - in a real application, this would come from a database
  const versionHistory: VersionData[] = useMemo(() => {
    if (!pokemon) return [];

    return [
      {
        id: 'v1.0.3',
        timestamp: new Date('2024-01-15T10:30:00'),
        message: 'Updated base stats for better balance',
        author: 'GameDesigner',
        changes: [
          { field: 'baseStats.attack', oldValue: 49, newValue: 52, type: 'modified' },
          { field: 'baseStats.speed', oldValue: 45, newValue: 48, type: 'modified' },
          { field: 'baseStats.total', oldValue: 318, newValue: 324, type: 'modified' },
        ],
        tags: ['balance-patch'],
        isCurrent: true,
      },
      {
        id: 'v1.0.2',
        timestamp: new Date('2024-01-10T14:15:00'),
        message: 'Added new ability and movesets',
        author: 'ContentCreator',
        changes: [
          { field: 'abilities', oldValue: ['Overgrow'], newValue: ['Overgrow', 'Chlorophyll'], type: 'modified' },
          { field: 'moveset.tmMoves', oldValue: [], newValue: [{ moveId: 6, tmNumber: 6 }], type: 'added' },
        ],
        tags: [],
        isCurrent: false,
      },
      {
        id: 'v1.0.1',
        timestamp: new Date('2024-01-05T09:45:00'),
        message: 'Fixed evolution chain data',
        author: 'DataValidator',
        changes: [
          { field: 'evolution.evolutionChain.species[0].evolvesTo[0].evolutionDetails[0].minLevel', oldValue: 15, newValue: 16, type: 'modified' },
        ],
        tags: ['bugfix'],
        isCurrent: false,
      },
      {
        id: 'v1.0.0',
        timestamp: new Date('2024-01-01T08:00:00'),
        message: 'Initial Pokemon data entry',
        author: 'DataEntry',
        changes: [
          { field: 'name', oldValue: null, newValue: pokemon.name, type: 'added' },
          { field: 'species', oldValue: null, newValue: pokemon.species, type: 'added' },
          { field: 'baseStats', oldValue: null, newValue: pokemon.baseStats, type: 'added' },
        ],
        tags: ['initial-release'],
        isCurrent: false,
      },
    ];
  }, [pokemon]);

  const selectedVersionData = versionHistory.find(v => v.id === selectedVersion);

  const handleCommit = () => {
    if (!commitMessage.trim()) return;

    // In a real application, this would save the current state as a new version
    console.log('Creating new version with message:', commitMessage);
    setCommitMessage('');
    setShowCommitForm(false);
  };

  const handleCreateTag = () => {
    if (!selectedVersion || !tagName.trim()) return;

    onCreateTag(selectedVersion, tagName);
    setTagName('');
  };

  const handleRevert = (versionId: string) => {
    if (window.confirm('Are you sure you want to revert to this version? This will create a new version with the reverted changes.')) {
      onRevert(versionId);
    }
  };

  const renderDiff = (changes: ChangeSet[]) => {
    return changes.map((change, index) => (
      <DiffSection key={index}>
        <DiffHeader>{change.field}</DiffHeader>
        {change.type === 'modified' && (
          <>
            <DiffLine type="removed">- {JSON.stringify(change.oldValue)}</DiffLine>
            <DiffLine type="added">+ {JSON.stringify(change.newValue)}</DiffLine>
          </>
        )}
        {change.type === 'added' && (
          <DiffLine type="added">+ {JSON.stringify(change.newValue)}</DiffLine>
        )}
        {change.type === 'removed' && (
          <DiffLine type="removed">- {JSON.stringify(change.oldValue)}</DiffLine>
        )}
      </DiffSection>
    ));
  };

  if (!pokemon) {
    return (
      <VersionContainer>
        <VersionHeader>
          <Title>Version Control</Title>
          <Description>Select a Pokemon to view its version history.</Description>
        </VersionHeader>
      </VersionContainer>
    );
  }

  return (
    <VersionContainer>
      <VersionHeader>
        <Title>Version Control</Title>
        <Description>
          Manage versions and track changes for {pokemon.name}.
        </Description>
      </VersionHeader>

      <ButtonGroup>
        <Button onClick={() => setShowCommitForm(!showCommitForm)}>
          {showCommitForm ? 'Cancel' : 'Create Version'}
        </Button>
        <SuccessButton 
          onClick={() => handleCreateTag()}
          disabled={!selectedVersion || !tagName.trim()}
        >
          Create Tag
        </SuccessButton>
        <DangerButton 
          onClick={() => selectedVersion && handleRevert(selectedVersion)}
          disabled={!selectedVersion || versionHistory.find(v => v.id === selectedVersion)?.isCurrent}
        >
          Revert to Selected
        </DangerButton>
      </ButtonGroup>

      {showCommitForm && (
        <CommitForm>
          <Input
            placeholder="Version message (required)"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleCommit} disabled={!commitMessage.trim()}>
              Commit Changes
            </Button>
            <Button onClick={() => setShowCommitForm(false)}>
              Cancel
            </Button>
          </div>
        </CommitForm>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <Input
          placeholder="Tag name"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <VersionGrid>
        <Panel>
          <PanelHeader>
            Version History
            <span>{versionHistory.length} versions</span>
          </PanelHeader>
          <PanelContent>
            <VersionList>
              {versionHistory.map((version) => (
                <VersionItem
                  key={version.id}
                  selected={selectedVersion === version.id}
                  current={version.isCurrent}
                  onClick={() => setSelectedVersion(version.id)}
                >
                  <VersionMeta>
                    <VersionId>
                      {version.id}
                      {version.isCurrent && <VersionBadge type="current">CURRENT</VersionBadge>}
                      {version.tags.map(tag => (
                        <VersionBadge key={tag} type="tag">{tag}</VersionBadge>
                      ))}
                    </VersionId>
                    <VersionDate>
                      {version.timestamp.toLocaleDateString()} {version.timestamp.toLocaleTimeString()}
                    </VersionDate>
                  </VersionMeta>
                  <VersionMessage>{version.message}</VersionMessage>
                  <VersionAuthor>by {version.author} • {version.changes.length} changes</VersionAuthor>
                </VersionItem>
              ))}
            </VersionList>
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            Changes
            {selectedVersionData && (
              <span>{selectedVersionData.changes.length} changes</span>
            )}
          </PanelHeader>
          <PanelContent>
            {selectedVersionData ? (
              <DiffContainer>
                {renderDiff(selectedVersionData.changes)}
              </DiffContainer>
            ) : (
              <div style={{ 
                color: '#999999', 
                textAlign: 'center', 
                padding: '20px',
                fontSize: '12px'
              }}>
                Select a version to view changes
              </div>
            )}
          </PanelContent>
        </Panel>
      </VersionGrid>
    </VersionContainer>
  );
};