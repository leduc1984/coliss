# Development Tools Integration Guide

## Overview
This document outlines the integration architecture for connecting all 4 development tools to the main Pokemon MMO system.

## Integration Architecture

### 1. Shared Data Layer
- **Central Database**: PostgreSQL with shared schemas
- **Real-time Sync**: Redis for live data synchronization
- **API Gateway**: Express.js middleware for tool communication

### 2. Data Flow Integration

#### UI Editor → Game Client
```
UI Layouts (JSON) → Asset Pipeline → Game UI System
```
- Export UI layouts as JSON configurations
- Automatic sprite optimization and packaging
- Hot-reload support for development

#### Dialogue Editor → Game Logic
```
Dialogue Trees (JSON) → Script Compiler → NPC Interaction System
```
- Export dialogue trees with variable tracking
- Runtime evaluation of conditions and choices
- Multi-language support integration

#### Monster Editor → Battle System
```
Pokemon Data (SQL) → Game Database → Battle Engine
```
- Direct database integration for live updates
- Stat validation and balance checking
- Evolution trigger integration

#### Admin Panel → Server Management
```
Admin Commands → WebSocket → Game Server
```
- Real-time server control and monitoring
- Live player management and moderation
- Event scheduling and automation

### 3. Integration Endpoints

#### UI Editor Integration
```typescript
// Export endpoint
POST /api/ui-editor/export
{
  layout: UILayout,
  target: 'game-client' | 'preview',
  format: 'json' | 'binary'
}

// Import game assets
GET /api/ui-editor/assets/{type}
Response: AssetManifest[]
```

#### Dialogue Editor Integration
```typescript
// Export dialogue system
POST /api/dialogue-editor/export
{
  dialogueTree: DialogueTree,
  target: 'game-server' | 'test-runner',
  validation: boolean
}

// Character data sync
GET /api/dialogue-editor/characters
Response: Character[]
```

#### Monster Editor Integration
```typescript
// Pokemon data sync
POST /api/monster-editor/sync
{
  pokemon: Pokemon[],
  operation: 'create' | 'update' | 'delete',
  validateBalance: boolean
}

// Battle system integration
GET /api/monster-editor/battle-data/{pokemonId}
Response: BattleReadyPokemon
```

#### Admin Panel Integration
```typescript
// Server control
WebSocket /ws/admin-control
Events: {
  playerManagement: PlayerAction,
  serverControl: ServerCommand,
  eventManagement: WorldEvent,
  monitoring: SystemMetrics
}
```

## Security Integration

### Authentication Flow
1. **OAuth 2.0** integration with main game authentication
2. **Role-based permissions** synchronized with game admin system
3. **Session management** shared across all tools
4. **Audit logging** for all administrative actions

### Data Protection
- **Encryption**: All inter-tool communication uses TLS 1.3
- **API Keys**: Rate-limited API access with rotating keys
- **Validation**: Input sanitization and SQL injection prevention
- **Backup**: Automated backup integration with game data backup system

## Deployment Integration

### Docker Container Setup
```yaml
# docker-compose.integration.yml
version: '3.8'
services:
  pokemon-mmo-server:
    image: pokemon-mmo:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      
  ui-editor:
    image: dev-tools/ui-editor:latest
    ports:
      - "3000:3000"
    environment:
      - API_GATEWAY_URL=http://api-gateway:3001
      - GAME_SERVER_URL=http://pokemon-mmo-server:8080
      
  dialogue-editor:
    image: dev-tools/dialogue-editor:latest
    ports:
      - "3001:3000"
    environment:
      - API_GATEWAY_URL=http://api-gateway:3001
      - GAME_SERVER_URL=http://pokemon-mmo-server:8080
      
  monster-editor:
    image: dev-tools/monster-editor:latest
    ports:
      - "3002:3000"
    environment:
      - API_GATEWAY_URL=http://api-gateway:3001
      - DATABASE_URL=${DATABASE_URL}
      
  admin-panel:
    image: dev-tools/admin-panel:latest
    ports:
      - "3003:3000"
    environment:
      - API_GATEWAY_URL=http://api-gateway:3001
      - WEBSOCKET_URL=ws://pokemon-mmo-server:8080/ws
      
  api-gateway:
    image: dev-tools/api-gateway:latest
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
```

### Environment Configuration
```bash
# .env.integration
DATABASE_URL=postgresql://user:password@localhost:5432/pokemon_mmo
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
API_GATEWAY_URL=http://localhost:3001
WEBSOCKET_URL=ws://localhost:8080/ws
```

## Testing Integration

### End-to-End Testing
```typescript
// integration.test.ts
describe('Development Tools Integration', () => {
  test('UI Editor exports to Game Client', async () => {
    const layout = await createUILayout();
    const exported = await uiEditor.export(layout);
    const imported = await gameClient.importUI(exported);
    expect(imported.isValid).toBe(true);
  });

  test('Pokemon data flows from Monster Editor to Battle System', async () => {
    const pokemon = await createTestPokemon();
    await monsterEditor.savePokemon(pokemon);
    const battleData = await battleSystem.getPokemon(pokemon.id);
    expect(battleData.baseStats).toEqual(pokemon.baseStats);
  });

  test('Admin commands execute on live server', async () => {
    const command = new ServerCommand('restart', { delay: 60 });
    await adminPanel.executeCommand(command);
    const status = await gameServer.getStatus();
    expect(status.restartScheduled).toBe(true);
  });
});
```

### Performance Testing
```typescript
// Load testing configuration
const loadTestConfig = {
  concurrent_users: 1000,
  test_duration: '10m',
  scenarios: [
    'ui_editor_export_stress',
    'monster_editor_bulk_update',
    'admin_panel_monitoring',
    'dialogue_editor_tree_validation'
  ]
};
```

## Data Migration Integration

### Pokemon Data Migration
```sql
-- Migration script for Pokemon data
CREATE OR REPLACE FUNCTION migrate_pokemon_data()
RETURNS void AS $$
BEGIN
  -- Backup existing data
  CREATE TABLE pokemon_backup AS SELECT * FROM pokemon;
  
  -- Update schema for new fields from Monster Editor
  ALTER TABLE pokemon ADD COLUMN IF NOT EXISTS editor_metadata JSONB;
  ALTER TABLE pokemon ADD COLUMN IF NOT EXISTS balance_score INTEGER;
  ALTER TABLE pokemon ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP DEFAULT NOW();
  
  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_pokemon_balance_score ON pokemon(balance_score);
  CREATE INDEX IF NOT EXISTS idx_pokemon_last_modified ON pokemon(last_modified);
END;
$$ LANGUAGE plpgsql;
```

### UI Asset Migration
```typescript
// Asset migration utility
export class AssetMigrator {
  async migrateUIAssets(sourcePath: string, targetPath: string) {
    const layouts = await this.loadUILayouts(sourcePath);
    const optimized = await this.optimizeAssets(layouts);
    await this.deployToGameClient(optimized, targetPath);
    return optimized.length;
  }
  
  async validateAssetIntegrity(assets: UIAsset[]) {
    return assets.every(asset => 
      asset.isValid && asset.sizeOptimized && asset.formatSupported
    );
  }
}
```

## Monitoring Integration

### Health Checks
```typescript
// Health monitoring for all tools
export const healthChecks = {
  'ui-editor': () => uiEditor.healthCheck(),
  'dialogue-editor': () => dialogueEditor.healthCheck(),
  'monster-editor': () => monsterEditor.healthCheck(),
  'admin-panel': () => adminPanel.healthCheck(),
  'api-gateway': () => apiGateway.healthCheck(),
  'game-server': () => gameServer.healthCheck()
};

// Automated monitoring
setInterval(async () => {
  const results = await Promise.allSettled(
    Object.entries(healthChecks).map(async ([name, check]) => ({
      service: name,
      status: await check(),
      timestamp: new Date()
    }))
  );
  
  await logHealthStatus(results);
}, 30000); // Check every 30 seconds
```

### Metrics Collection
```typescript
// Metrics integration with Pokemon MMO monitoring
export const metricsCollector = {
  toolUsage: new Counter('dev_tools_usage_total'),
  exportOperations: new Counter('export_operations_total'),
  integrationLatency: new Histogram('integration_latency_seconds'),
  errorRate: new Counter('integration_errors_total')
};
```

## Troubleshooting Integration

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check database connectivity
docker exec -it pokemon-mmo-db psql -U postgres -c "\l"

# Verify tool database access
curl -f http://localhost:3002/api/health/database || echo "Monster Editor DB connection failed"
```

#### API Gateway Issues
```bash
# Check API Gateway logs
docker logs pokemon-mmo-api-gateway --tail 100

# Test API endpoints
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:3001/api/health
```

#### WebSocket Connection Issues
```bash
# Test WebSocket connection
wscat -c ws://localhost:8080/ws/admin -H "Authorization: Bearer $JWT_TOKEN"
```

## Production Deployment

### Blue-Green Deployment Strategy
1. Deploy new versions to green environment
2. Run integration tests against green
3. Switch traffic from blue to green
4. Keep blue as rollback option

### Scaling Considerations
- **Load Balancing**: NGINX for tool distribution
- **Database Scaling**: Read replicas for Monster Editor
- **Caching**: Redis for UI asset caching
- **CDN Integration**: Asset delivery optimization

## Backup and Recovery

### Automated Backup Strategy
```bash
#!/bin/bash
# backup-integration.sh

# Backup Pokemon data
pg_dump $DATABASE_URL > "pokemon_data_$(date +%Y%m%d_%H%M%S).sql"

# Backup UI layouts
tar -czf "ui_layouts_$(date +%Y%m%d_%H%M%S).tar.gz" /app/ui-editor/exports/

# Backup dialogue trees
tar -czf "dialogue_trees_$(date +%Y%m%d_%H%M%S).tar.gz" /app/dialogue-editor/exports/

# Upload to cloud storage
aws s3 sync ./backups/ s3://pokemon-mmo-backups/dev-tools/
```

This integration architecture ensures seamless communication between all development tools and the main Pokemon MMO system while maintaining security, performance, and reliability standards.