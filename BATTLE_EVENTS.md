# Battle Event System Documentation

## Overview
The battle system uses an event-based communication model between the BattleModule and the main game. This allows for loose coupling and easier maintenance.

## Event Flow

### Battle Start Sequence
1. Player triggers battle (via admin controls or encounter)
2. `PlayerController` calls `gameManager.startPokengineBattle(battleData)`
3. `GameManager` creates/initializes `BattleModule` if needed
4. `BattleModule` emits `battle_started` event
5. `GameManager` listens for event and handles accordingly

### Battle Action Sequence
1. Player interacts with pokengine UI
2. `BattleModule` emits `battle_action` event with action data
3. `GameManager` listens for event and forwards to server via Socket.io
4. Server processes action and sends response
5. `GameManager` receives server response
6. `GameManager` calls `battleModule.updateBattleState(newState)`
7. `BattleModule` updates pokengine UI

### Battle End Sequence
1. Battle concludes (win, loss, escape)
2. `BattleModule` emits `battle_ended` event
3. `GameManager` listens for event and cleans up
4. Battle container is hidden
5. Game controls are re-enabled

## Event Types

### battle_started
Emitted when a battle is successfully started.

**Data:**
```javascript
{
  battleId: string // Unique identifier for the battle
}
```

### battle_action
Emitted when the player takes an action in battle.

**Data:**
```javascript
{
  type: string,     // Action type (move, switch, item, run)
  data: Object,     // Action-specific data
  battleId: string  // Battle identifier
}
```

### battle_state_updated
Emitted when the battle state is updated.

**Data:**
```javascript
{
  // Battle state data from server
  // Structure depends on server implementation
}
```

### battle_ended
Emitted when a battle is ended.

**Data:**
```javascript
{
  // Optional end battle data
  // May include results, rewards, etc.
}
```

### battle_error
Emitted when an error occurs in the battle system.

**Data:**
```javascript
{
  error: string // Error message
}
```

## Event Registration

### In GameManager
```javascript
// Listen for battle start
this.battleModule.on('battle_started', (data) => {
  console.log('Battle started', data);
});

// Listen for battle actions
this.battleModule.on('battle_action', (data) => {
  // Forward to server
  this.socket.emit('battle_action', data);
});

// Listen for battle end
this.battleModule.on('battle_ended', () => {
  this.endPokengineBattle();
});
```

### In BattleModule
```javascript
// Emit battle start event
this.emit('battle_started', { battleId: this.battleId });

// Emit battle action event
this.emit('battle_action', {
  type: actionType,
  data: actionData,
  battleId: this.battleId
});
```

## Socket.IO Integration

### Client to Server Events
- `battle_action` - Sent when player takes an action
- `battle_escape` - Sent when player tries to escape

### Server to Client Events
- `battle_action_result` - Sent when server processes an action
- `battle_update` - Sent when battle state changes
- `battle_end` - Sent when battle concludes

## Error Handling

The event system includes error handling for:
1. Failed event listener execution
2. Missing event listeners
3. Invalid event data

Errors are logged to the console but do not break the event flow.

## Best Practices

1. Always check if event listeners exist before emitting events
2. Handle errors in event listeners to prevent crashes
3. Use specific event names to avoid conflicts
4. Document event data structures for maintainability
5. Clean up event listeners when components are destroyed