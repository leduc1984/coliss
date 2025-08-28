# Development Tools Configuration

## Port Assignments
- **UI Editor**: http://localhost:3000
- **Dialogue Editor**: http://localhost:3001  
- **Monster Editor**: http://localhost:3002
- **Admin Panel**: http://localhost:3003

## Database Configuration
All tools that require database access should use the following configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pokemon_mmo
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_change_in_production_pokemon_mmo_2024
```

## Development Setup

### Environment Variables
Create `.env` files in each tool directory with appropriate configurations:

**UI Editor** (.env):
```env
PORT=3000
REACT_APP_API_URL=http://localhost:3000/api
```

**Dialogue Editor** (.env):
```env
PORT=3001
REACT_APP_API_URL=http://localhost:3001/api
```

**Monster Editor** (.env):
```env
PORT=3002
REACT_APP_API_URL=http://localhost:3002/api
REACT_APP_DB_URL=postgresql://postgres:password@localhost:5432/pokemon_mmo
```

**Admin Panel** (.env):
```env
PORT=3003
REACT_APP_API_URL=http://localhost:3003/api
REACT_APP_SOCKET_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pokemon_mmo
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_change_in_production_pokemon_mmo_2024
```

## Shared Dependencies

All tools use these common dependencies:
- React 19 with TypeScript
- styled-components for styling
- Socket.io-client for real-time features
- axios for HTTP requests
- react-router-dom for navigation

## Integration Points

### UI Editor → Game
- Exports: `public/ui-layouts/*.json`
- Import in game: UI loading system
- Data binding: Game state variables

### Dialogue Editor → Game  
- Exports: `public/dialogues/*.json`
- Import in game: NPC dialogue system
- Integration: Quest and character systems

### Monster Editor → Game
- Exports: Database migration files
- Import: Via database update scripts
- Integration: Battle system, encounters

### Admin Panel → Game
- Direct database connection
- Real-time Socket.io communication
- Authentication via JWT tokens

## Development Commands

### Start All Tools
```bash
# Terminal 1 - UI Editor
cd dev-tools/ui-editor && npm start

# Terminal 2 - Dialogue Editor  
cd dev-tools/dialogue-editor && npm start

# Terminal 3 - Monster Editor
cd dev-tools/monster-editor && npm start

# Terminal 4 - Admin Panel
cd dev-tools/admin-panel && npm start
```

### Build All Tools
```bash
cd dev-tools
for dir in ui-editor dialogue-editor monster-editor admin-panel; do
  cd $dir && npm run build && cd ..
done
```

## Security Considerations

### Admin Panel Security
- JWT authentication required
- Role-based access control (Admin, Moderator, Developer)
- Rate limiting on all endpoints
- Input validation and sanitization
- Audit logging for all actions

### Development vs Production
- Development: All tools run on localhost
- Production: Deploy behind reverse proxy with SSL
- Use environment-specific configurations
- Secure database connections with SSL

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 3000-3003 are available
2. **Database connection**: Verify PostgreSQL is running and credentials are correct
3. **Missing dependencies**: Run `npm install` in each tool directory
4. **Build errors**: Check TypeScript compilation errors

### Log Locations
- UI Editor: Browser console
- Dialogue Editor: Browser console  
- Monster Editor: Browser console + server logs
- Admin Panel: Browser console + server logs + database logs