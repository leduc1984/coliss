# Admin Features Testing Guide

This document explains how to test all admin features in the Pokemon MMO Omega Ruby Style project using the MCP (Model Context Protocol) server with Playwright automation.

## Prerequisites

1. Ensure the main game server is running:
   ```bash
   npm start
   ```

2. Start the Playwright MCP server:
   ```bash
   npm run mcp-server
   ```

## Available Test Scripts

### 1. Basic Admin Map Test
Tests basic admin map selector functionality:
```bash
npm run test:admin
```

### 2. Full Admin Feature Test
Tests all admin features through MCP endpoints:
```bash
npm run test:admin-full
```

### 3. Comprehensive Admin Test
Complete test of all admin features including authentication, chat commands, map features, and development tools:
```bash
npm run test:admin-comprehensive
```

### 4. MCP Endpoint Test
Tests all MCP server endpoints individually:
```bash
node test-admin-mcp-endpoints.js
```

## Test Coverage

### Authentication
- Admin login with credentials
- Game screen loading
- Player initialization

### User Management (API)
- View all users (`GET /api/admin/users`)
- Promote/demote users (`PUT /api/admin/users/:id/role`)
- Ban/unban users (`PUT /api/admin/users/:id/status`)

### Chat Commands (All Roles)
**Available to ALL users:**
- `/help` - Show help message
- `/commands` - Show available commands
- `/who` - Show online players
- `/time` - Show server time
- `/ping` - Check connection

**HELPER+ commands:**
- `/mute <username>` - Mute a user
- `/unmute <username>` - Unmute a user
- `/warn <username> <reason>` - Warn a user

**CO-ADMIN+ commands:**
- `/kick <username>` - Kick a user
- `/clear` - Clear chat
- `/promote <username> <role>` - Promote user
- `/teleport <username> <x> <y> <z>` - Teleport user
- `/summon <username>` - Summon user to your location
- `/freeze <username>` - Freeze a user
- `/unfreeze <username>` - Unfreeze a user
- `/pokemon <name> [level] [x] [y] [z]` - Spawn wild Pokemon
- `/give <username> <item> [quantity]` - Give item to user
- `/remove <username> <item> [quantity]` - Remove item from user

**ADMIN ONLY commands:**
- `/ban <username>` - Ban a user
- `/unban <username>` - Unban a user
- `/demote <username>` - Demote user
- `/announce <message>` - Server announcement
- `/shutdown <minutes>` - Schedule server shutdown
- `/setmotd <message>` - Set message of the day
- `/reload` - Reload server configuration

### Map Management
- Admin map selector (key `1`)
- Teleportation via chat commands
- Map editor access (key `9`)
- Admin panel access (key `0`)

### Development Tools
- Map editor
- Dialogue editor
- UI editor
- Monster editor
- Admin panel

### Server Management (API)
- Server statistics (`GET /api/admin/stats`)
- Chat messages (`GET /api/admin/chat`)
- Map data (`GET /api/admin/maps`)

## Running the Tests

### Step 1: Start the Game Server
```bash
npm start
```

### Step 2: Start the MCP Server
In a separate terminal:
```bash
npm run mcp-server
```

### Step 3: Run the Tests
Choose one of the test scripts:
```bash
# Run comprehensive admin test
npm run test:admin-comprehensive

# Or run specific test
npm run test:admin-full
```

## Expected Results

### Success Criteria
- Admin authentication works correctly
- All chat commands execute without errors
- Map teleportation functions properly
- Development tools are accessible
- API endpoints return correct responses
- User management functions work as expected

### Screenshots Generated
- `admin-auth-success.png` - Successful admin login
- `admin-chat-commands.png` - Chat commands test
- `admin-map-features.png` - Map features test
- `admin-dev-tools.png` - Development tools test
- Error screenshots if tests fail

## Troubleshooting

### Common Issues

1. **MCP Server Not Running**
   - Ensure `npm run mcp-server` is running
   - Check that port 3001 is available

2. **Game Server Not Running**
   - Ensure `npm start` is running
   - Check that port 3000 is available

3. **Selector Not Found**
   - Page may not have loaded completely
   - Selector strings may have changed in the HTML

4. **Authentication Failed**
   - Check admin credentials in test script
   - Ensure admin user exists in database

### Increasing Timeouts
If tests are failing due to timing issues, you can increase the timeout values in the test scripts:
```javascript
const CONFIG = {
  timeout: 30000, // Increase from 15000
  retryAttempts: 5 // Increase from 3
};
```

## Customization

You can customize the test scripts to:
- Add more specific test cases
- Modify admin credentials
- Change screenshot file names
- Add additional verification steps
- Test specific maps or features

## Integration with CI/CD

To integrate with continuous integration systems:
1. Ensure both game server and MCP server are started
2. Run the comprehensive test script
3. Check exit codes for test results
4. Archive generated screenshots for review

Example CI script:
```bash
#!/bin/bash
# Start game server in background
npm start &
GAME_PID=$!

# Start MCP server in background
npm run mcp-server &
MCP_PID=$!

# Wait for servers to start
sleep 10

# Run comprehensive admin test
npm run test:admin-comprehensive

# Capture exit code
EXIT_CODE=$?

# Kill background processes
kill $GAME_PID
kill $MCP_PID

# Exit with test result
exit $EXIT_CODE
```