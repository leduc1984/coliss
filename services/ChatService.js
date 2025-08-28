const dataAccess = require('../database/data-access');

class ChatService {
  constructor(io) {
    this.io = io;
    
    // Complete command list with role restrictions
    this.commands = {
      // Available to ALL users
      '/help': { func: this.showHelp.bind(this), role: 'user' },
      '/commands': { func: this.showCommands.bind(this), role: 'user' },
      '/who': { func: this.showOnlineUsers.bind(this), role: 'user' },
      '/time': { func: this.showServerTime.bind(this), role: 'user' },
      '/ping': { func: this.showPing.bind(this), role: 'user' },
      
      // HELPER+ commands
      '/mute': { func: this.muteUser.bind(this), role: 'helper' },
      '/unmute': { func: this.unmuteUser.bind(this), role: 'helper' },
      '/warn': { func: this.warnUser.bind(this), role: 'helper' },
      
      // CO-ADMIN+ commands
      '/kick': { func: this.kickUser.bind(this), role: 'co-admin' },
      '/clear': { func: this.clearChat.bind(this), role: 'co-admin' },
      '/promote': { func: this.promoteUser.bind(this), role: 'co-admin' },
      '/teleport': { func: this.teleportUser.bind(this), role: 'co-admin' },
      '/summon': { func: this.summonUser.bind(this), role: 'co-admin' },
      '/freeze': { func: this.freezeUser.bind(this), role: 'co-admin' },
      '/unfreeze': { func: this.unfreezeUser.bind(this), role: 'co-admin' },
      '/pokemon': { func: this.spawnPokemon.bind(this), role: 'co-admin' },
      '/give': { func: this.giveItem.bind(this), role: 'co-admin' },
      '/remove': { func: this.removeItem.bind(this), role: 'co-admin' },
      
      // ADMIN ONLY commands
      '/ban': { func: this.banUser.bind(this), role: 'admin' },
      '/unban': { func: this.unbanUser.bind(this), role: 'admin' },
      '/demote': { func: this.demoteUser.bind(this), role: 'admin' },
      '/announce': { func: this.announce.bind(this), role: 'admin' },
      '/shutdown': { func: this.shutdownServer.bind(this), role: 'admin' },
      '/setmotd': { func: this.setMotd.bind(this), role: 'admin' },
      '/reload': { func: this.reloadServer.bind(this), role: 'admin' }
    };
    
    // Temporary storage for moderation actions
    this.mutedUsers = new Set();
    this.frozenUsers = new Set();
    this.serverMotd = 'Welcome to Pokemon MMO!';
  }

  async handleMessage(socket, data) {
    const { message, channel = 'global' } = data;
    const user = socket.user;

    if (!user || !message || message.trim().length === 0) {
      return;
    }

    // Check if user is muted (can't send regular messages but can use commands)
    if (this.mutedUsers.has(user.username) && !message.startsWith('/')) {
      socket.emit('chat_error', { message: 'You are muted and cannot send messages. Use /help for available commands.' });
      return;
    }

    try {
      // Check if it's a command
      if (message.startsWith('/')) {
        await this.handleCommand(socket, message, channel);
        return;
      }

      // Regular chat message
      await this.sendMessage(socket, {
        user_id: user.id,
        username: user.username,
        message: message.trim(),
        channel,
        role: user.role
      });

    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('chat_error', { message: 'Failed to send message' });
    }
  }

  async handleCommand(socket, message, channel) {
    const args = message.split(' ');
    const command = args[0].toLowerCase();
    const user = socket.user;

    if (!this.commands[command]) {
      socket.emit('chat_system', {
        message: `Unknown command: ${command}. Type /help for available commands.`,
        type: 'error'
      });
      return;
    }

    // Check if user has permission for this command
    if (!this.hasCommandPermission(user, command)) {
      socket.emit('chat_system', {
        message: `You don't have permission to use ${command}. Your role: ${user.role}`,
        type: 'error'
      });
      return;
    }

    try {
      await this.commands[command].func(socket, args.slice(1), channel);
    } catch (error) {
      console.error('Command error:', error);
      socket.emit('chat_system', {
        message: 'Command failed to execute.',
        type: 'error'
      });
    }
  }

  async sendMessage(socket, messageData) {
    try {
      // Save message to database
      await dataAccess.saveChatMessage(messageData);

      // Broadcast message to all users in the channel
      const chatMessage = {
        id: Date.now(),
        username: messageData.username,
        message: messageData.message,
        channel: messageData.channel,
        role: messageData.role,
        timestamp: new Date().toISOString()
      };

      this.io.emit('chat_message', chatMessage);

    } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('chat_error', { message: 'Failed to send message' });
    }
  }

  // Command implementations
  hasCommandPermission(user, command) {
    const commandInfo = this.commands[command];
    if (!commandInfo) return false;
    
    const roleHierarchy = { 'user': 1, 'helper': 2, 'co-admin': 3, 'admin': 4 };
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[commandInfo.role] || 0;
    
    return userLevel >= requiredLevel;
  }

  async showHelp(socket, args, channel) {
    const user = socket.user;
    const helpText = [
      '=== POKEMON MMO HELP ===',
      '',
      'AVAILABLE TO ALL:',
      '/help - Show this help message',
      '/commands - Show your available commands',
      '/who - Show online players',
      '/time - Show server time',
      '/ping - Check your connection',
      ''
    ];

    if (this.hasPermission(user, 'helper')) {
      helpText.push('HELPER COMMANDS:');
      helpText.push('/mute <username> - Mute a user');
      helpText.push('/unmute <username> - Unmute a user');
      helpText.push('/warn <username> <reason> - Warn a user');
      helpText.push('');
    }

    if (this.hasPermission(user, 'co-admin')) {
      helpText.push('CO-ADMIN COMMANDS:');
      helpText.push('/kick <username> - Kick a user');
      helpText.push('/clear - Clear chat');
      helpText.push('/promote <username> <role> - Promote user');
      helpText.push('/teleport <username> <x> <y> <z> - Teleport user');
      helpText.push('/freeze <username> - Freeze a user');
      helpText.push('/unfreeze <username> - Unfreeze a user');
      helpText.push('');
    }

    if (this.hasPermission(user, 'admin')) {
      helpText.push('ADMIN COMMANDS:');
      helpText.push('/ban <username> - Ban a user');
      helpText.push('/unban <username> - Unban a user');
      helpText.push('/demote <username> - Demote user');
      helpText.push('/announce <message> - Server announcement');
      helpText.push('/shutdown <minutes> - Schedule server shutdown');
      helpText.push('/setmotd <message> - Set message of the day');
      helpText.push('/reload - Reload server configuration');
    }

    socket.emit('chat_system', {
      message: helpText.join('\n'),
      type: 'info'
    });
  }

  async showCommands(socket, args, channel) {
    const user = socket.user;
    const availableCommands = Object.keys(this.commands).filter(cmd => {
      return this.hasCommandPermission(user, cmd);
    });

    const commandsByRole = {
      user: [],
      helper: [],
      'co-admin': [],
      admin: []
    };

    availableCommands.forEach(cmd => {
      const role = this.commands[cmd].role;
      commandsByRole[role].push(cmd);
    });

    const output = [];
    
    if (commandsByRole.user.length > 0) {
      output.push(`USER: ${commandsByRole.user.join(', ')}`);
    }
    
    if (commandsByRole.helper.length > 0 && this.hasPermission(user, 'helper')) {
      output.push(`HELPER: ${commandsByRole.helper.join(', ')}`);
    }
    
    if (commandsByRole['co-admin'].length > 0 && this.hasPermission(user, 'co-admin')) {
      output.push(`CO-ADMIN: ${commandsByRole['co-admin'].join(', ')}`);
    }
    
    if (commandsByRole.admin.length > 0 && this.hasPermission(user, 'admin')) {
      output.push(`ADMIN: ${commandsByRole.admin.join(', ')}`);
    }

    socket.emit('chat_system', {
      message: `Your available commands:\n${output.join('\n')}`,
      type: 'info'
    });
  }

  async showOnlineUsers(socket, args, channel) {
    const onlineUsers = [];
    
    for (const [socketId, socketObj] of this.io.sockets.sockets) {
      if (socketObj.user) {
        onlineUsers.push({
          username: socketObj.user.username,
          role: socketObj.user.role
        });
      }
    }

    const userList = onlineUsers
      .map(u => `${u.username} (${u.role})`)
      .join(', ');

    socket.emit('chat_system', {
      message: `Online players (${onlineUsers.length}): ${userList}`,
      type: 'info'
    });
  }

  // New basic commands
  async showServerTime(socket, args, channel) {
    const now = new Date();
    socket.emit('chat_system', {
      message: `Server time: ${now.toLocaleString()}`,
      type: 'info'
    });
  }

  async showPing(socket, args, channel) {
    const startTime = Date.now();
    socket.emit('ping_test', { startTime }, (response) => {
      const latency = Date.now() - startTime;
      socket.emit('chat_system', {
        message: `Ping: ${latency}ms`,
        type: 'info'
      });
    });
  }

  // Helper commands
  async muteUser(socket, args, channel) {
    const targetUsername = args[0];
    const duration = parseInt(args[1]) || 10; // minutes
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /mute <username> [duration_minutes]',
        type: 'error'
      });
      return;
    }

    const targetSocket = this.findUserSocket(targetUsername);
    if (!targetSocket) {
      socket.emit('chat_system', {
        message: 'User not found online.',
        type: 'error'
      });
      return;
    }

    // Can't mute higher or equal rank
    if (!this.canModerateUser(socket.user, targetSocket.user)) {
      socket.emit('chat_system', {
        message: 'Cannot mute user with equal or higher rank.',
        type: 'error'
      });
      return;
    }

    this.mutedUsers.add(targetUsername);
    
    // Auto-unmute after duration
    setTimeout(() => {
      this.mutedUsers.delete(targetUsername);
      if (targetSocket.connected) {
        targetSocket.emit('chat_system', {
          message: 'You have been automatically unmuted.',
          type: 'info'
        });
      }
    }, duration * 60 * 1000);

    this.io.emit('chat_system', {
      message: `${targetUsername} has been muted for ${duration} minutes by ${socket.user.username}`,
      type: 'warning'
    });
  }

  async unmuteUser(socket, args, channel) {
    const targetUsername = args[0];
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /unmute <username>',
        type: 'error'
      });
      return;
    }

    if (!this.mutedUsers.has(targetUsername)) {
      socket.emit('chat_system', {
        message: 'User is not muted.',
        type: 'error'
      });
      return;
    }

    this.mutedUsers.delete(targetUsername);
    
    this.io.emit('chat_system', {
      message: `${targetUsername} has been unmuted by ${socket.user.username}`,
      type: 'info'
    });
  }

  async warnUser(socket, args, channel) {
    const targetUsername = args[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /warn <username> <reason>',
        type: 'error'
      });
      return;
    }

    const targetSocket = this.findUserSocket(targetUsername);
    if (!targetSocket) {
      socket.emit('chat_system', {
        message: 'User not found online.',
        type: 'error'
      });
      return;
    }

    if (!this.canModerateUser(socket.user, targetSocket.user)) {
      socket.emit('chat_system', {
        message: 'Cannot warn user with equal or higher rank.',
        type: 'error'
      });
      return;
    }

    targetSocket.emit('chat_system', {
      message: `⚠️ WARNING from ${socket.user.username}: ${reason}`,
      type: 'warning'
    });

    socket.emit('chat_system', {
      message: `Warning sent to ${targetUsername}`,
      type: 'info'
    });
  }

  async kickUser(socket, args, channel) {
    const targetUsername = args[0];
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /kick <username>',
        type: 'error'
      });
      return;
    }

    const targetSocket = this.findUserSocket(targetUsername);
    if (!targetSocket) {
      socket.emit('chat_system', {
        message: 'User not found online.',
        type: 'error'
      });
      return;
    }

    if (!this.canModerateUser(socket.user, targetSocket.user)) {
      socket.emit('chat_system', {
        message: 'Cannot kick user with equal or higher rank.',
        type: 'error'
      });
      return;
    }

    targetSocket.emit('kicked', { reason: `Kicked by ${socket.user.username}` });
    targetSocket.disconnect();

    this.io.emit('chat_system', {
      message: `${targetUsername} has been kicked by ${socket.user.username}`,
      type: 'warning'
    });
  }

  async teleportUser(socket, args, channel) {
    const targetUsername = args[0];
    const x = parseFloat(args[1]) || 0;
    const y = parseFloat(args[2]) || 0;
    const z = parseFloat(args[3]) || 0;
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /teleport <username> <x> <y> <z>',
        type: 'error'
      });
      return;
    }

    const targetSocket = this.findUserSocket(targetUsername);
    if (!targetSocket) {
      socket.emit('chat_system', {
        message: 'User not found online.',
        type: 'error'
      });
      return;
    }

    targetSocket.emit('force_teleport', { x, y, z });
    
    socket.emit('chat_system', {
      message: `Teleported ${targetUsername} to (${x}, ${y}, ${z})`,
      type: 'info'
    });
    
    targetSocket.emit('chat_system', {
      message: `You have been teleported by ${socket.user.username}`,
      type: 'info'
    });
  }

  async summonUser(socket, args, channel) {
    const targetUsername = args[0];
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /summon <username>',
        type: 'error'
      });
      return;
    }
    
    // Find target user
    const targetSocket = this.findUserSocket(targetUsername);
    if (!targetSocket) {
      socket.emit('chat_system', {
        message: `User ${targetUsername} not found or not online`,
        type: 'error'
      });
      return;
    }
    
    // Get admin's current position
    const adminUser = socket.user;
    
    // Send summon command to target user
    targetSocket.emit('summon_to_admin', { 
      adminUsername: adminUser.username,
      adminPosition: adminUser.position
    });
    
    // Notify admin and target user
    socket.emit('chat_system', {
      message: `Summoned ${targetUsername} to your location`,
      type: 'success'
    });
    
    targetSocket.emit('chat_system', {
      message: `You have been summoned by ${adminUser.username}`,
      type: 'info'
    });
    
    // Broadcast to all admins
    this.broadcastToRole('admin', 'chat_system', {
      message: `${adminUser.username} summoned ${targetUsername}`,
      type: 'info'
    });
    
    this.broadcastToRole('co-admin', 'chat_system', {
      message: `${adminUser.username} summoned ${targetUsername}`,
      type: 'info'
    });
  }

  async spawnPokemon(socket, args, channel) {
    const pokemonName = args[0];
    const level = parseInt(args[1]) || 10;
    const x = parseFloat(args[2]) || 0;
    const y = parseFloat(args[3]) || 0;
    const z = parseFloat(args[4]) || 0;
    
    if (!pokemonName) {
      socket.emit('chat_system', {
        message: 'Usage: /pokemon <name> [level] [x] [y] [z]',
        type: 'error'
      });
      return;
    }
    
    // Send spawn command to all users
    this.io.emit('spawn_wild_pokemon', {
      name: pokemonName,
      level: level,
      position: { x, y, z }
    });
    
    // Notify admin
    socket.emit('chat_system', {
      message: `Spawned wild ${pokemonName} (level ${level}) at ${x}, ${y}, ${z}`,
      type: 'success'
    });
    
    // Broadcast to all admins
    this.broadcastToRole('admin', 'chat_system', {
      message: `${socket.user.username} spawned wild ${pokemonName} (level ${level})`,
      type: 'info'
    });
    
    this.broadcastToRole('co-admin', 'chat_system', {
      message: `${socket.user.username} spawned wild ${pokemonName} (level ${level})`,
      type: 'info'
    });
  }

  async giveItem(socket, args, channel) {
    const targetUsername = args[0];
    const itemName = args[1];
    const quantity = parseInt(args[2]) || 1;
    
    if (!targetUsername || !itemName) {
      socket.emit('chat_system', {
        message: 'Usage: /give <username> <item> [quantity]',
        type: 'error'
      });
      return;
    }
    
    // Find target user
    const targetSocket = this.findUserSocket(targetUsername);
    if (!targetSocket) {
      socket.emit('chat_system', {
        message: `User ${targetUsername} not found or not online`,
        type: 'error'
      });
      return;
    }
    
    // Send item to target user
    targetSocket.emit('receive_item', {
      item: itemName,
      quantity: quantity
    });
    
    // Notify admin and target user
    socket.emit('chat_system', {
      message: `Gave ${quantity}x ${itemName} to ${targetUsername}`,
      type: 'success'
    });
    
    targetSocket.emit('chat_system', {
      message: `You received ${quantity}x ${itemName} from an administrator`,
      type: 'info'
    });
    
    // Broadcast to all admins
    this.broadcastToRole('admin', 'chat_system', {
      message: `${socket.user.username} gave ${quantity}x ${itemName} to ${targetUsername}`,
      type: 'info'
    });
    
    this.broadcastToRole('co-admin', 'chat_system', {
      message: `${socket.user.username} gave ${quantity}x ${itemName} to ${targetUsername}`,
      type: 'info'
    });
  }

  async removeItem(socket, args, channel) {
    const targetUsername = args[0];
    const itemName = args[1];
    const quantity = parseInt(args[2]) || 1;
    
    if (!targetUsername || !itemName) {
      socket.emit('chat_system', {
        message: 'Usage: /remove <username> <item> [quantity]',
        type: 'error'
      });
      return;
    }
    
    // Find target user
    const targetSocket = this.findUserSocket(targetUsername);
    if (!targetSocket) {
      socket.emit('chat_system', {
        message: `User ${targetUsername} not found or not online`,
        type: 'error'
      });
      return;
    }
    
    // Send remove item command to target user
    targetSocket.emit('remove_item', {
      item: itemName,
      quantity: quantity
    });
    
    // Notify admin and target user
    socket.emit('chat_system', {
      message: `Removed ${quantity}x ${itemName} from ${targetUsername}`,
      type: 'success'
    });
    
    targetSocket.emit('chat_system', {
      message: `An administrator removed ${quantity}x ${itemName} from your inventory`,
      type: 'info'
    });
    
    // Broadcast to all admins
    this.broadcastToRole('admin', 'chat_system', {
      message: `${socket.user.username} removed ${quantity}x ${itemName} from ${targetUsername}`,
      type: 'info'
    });
    
    this.broadcastToRole('co-admin', 'chat_system', {
      message: `${socket.user.username} removed ${quantity}x ${itemName} from ${targetUsername}`,
      type: 'info'
    });
  }

  async freezeUser(socket, args, channel) {
    const targetUsername = args[0];
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /freeze <username>',
        type: 'error'
      });
      return;
    }

    const targetSocket = this.findUserSocket(targetUsername);
    if (!targetSocket) {
      socket.emit('chat_system', {
        message: 'User not found online.',
        type: 'error'
      });
      return;
    }

    if (!this.canModerateUser(socket.user, targetSocket.user)) {
      socket.emit('chat_system', {
        message: 'Cannot freeze user with equal or higher rank.',
        type: 'error'
      });
      return;
    }

    this.frozenUsers.add(targetUsername);
    targetSocket.emit('player_frozen', { frozen: true });
    
    this.io.emit('chat_system', {
      message: `${targetUsername} has been frozen by ${socket.user.username}`,
      type: 'warning'
    });
  }

  async unfreezeUser(socket, args, channel) {
    const targetUsername = args[0];
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /unfreeze <username>',
        type: 'error'
      });
      return;
    }

    if (!this.frozenUsers.has(targetUsername)) {
      socket.emit('chat_system', {
        message: 'User is not frozen.',
        type: 'error'
      });
      return;
    }

    const targetSocket = this.findUserSocket(targetUsername);
    this.frozenUsers.delete(targetUsername);
    
    if (targetSocket) {
      targetSocket.emit('player_frozen', { frozen: false });
    }
    
    this.io.emit('chat_system', {
      message: `${targetUsername} has been unfrozen by ${socket.user.username}`,
      type: 'info'
    });
  }

  async promoteUser(socket, args, channel) {
    const targetUsername = args[0];
    const newRole = args[1];
    
    if (!targetUsername || !newRole) {
      socket.emit('chat_system', {
        message: 'Usage: /promote <username> <role> (user, helper, co-admin)',
        type: 'error'
      });
      return;
    }

    const validRoles = ['user', 'helper', 'co-admin'];
    if (socket.user.role === 'admin') {
      validRoles.push('admin');
    }
    
    if (!validRoles.includes(newRole)) {
      socket.emit('chat_system', {
        message: `Invalid role. Valid roles: ${validRoles.join(', ')}`,
        type: 'error'
      });
      return;
    }

    try {
      const result = await dataAccess.updateUserRole(targetUsername, newRole);

      if (!result) {
        socket.emit('chat_system', {
          message: 'User not found in database.',
          type: 'error'
        });
        return;
      }

      this.io.emit('chat_system', {
        message: `${targetUsername} has been promoted to ${newRole} by ${socket.user.username}`,
        type: 'info'
      });

      const targetSocket = this.findUserSocket(targetUsername);
      if (targetSocket) {
        targetSocket.user.role = newRole;
        targetSocket.emit('role_updated', { newRole });
      }
    } catch (error) {
      console.error('Promote user error:', error);
      socket.emit('chat_system', {
        message: 'Failed to promote user.',
        type: 'error'
      });
    }
  }

  // Admin-only commands
  async banUser(socket, args, channel) {
    const targetUsername = args[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /ban <username> [reason]',
        type: 'error'
      });
      return;
    }

    // Prevent self-ban
    if (targetUsername === socket.user.username) {
      socket.emit('chat_system', {
        message: 'Cannot ban yourself.',
        type: 'error'
      });
      return;
    }

    try {
      const result = await dataAccess.banUser(targetUsername);

      if (!result) {
        socket.emit('chat_system', {
          message: 'User not found.',
          type: 'error'
        });
        return;
      }

      const targetSocket = this.findUserSocket(targetUsername);
      if (targetSocket) {
        targetSocket.emit('banned', { reason: `Banned by ${socket.user.username}: ${reason}` });
        targetSocket.disconnect();
      }

      this.io.emit('chat_system', {
        message: `${targetUsername} has been banned by ${socket.user.username}. Reason: ${reason}`,
        type: 'warning'
      });
    } catch (error) {
      console.error('Ban user error:', error);
      socket.emit('chat_system', {
        message: 'Failed to ban user.',
        type: 'error'
      });
    }
  }

  async unbanUser(socket, args, channel) {
    const targetUsername = args[0];
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /unban <username>',
        type: 'error'
      });
      return;
    }

    try {
      const result = await dataAccess.unbanUser(targetUsername);

      if (!result) {
        socket.emit('chat_system', {
          message: 'User not found.',
          type: 'error'
        });
        return;
      }

      this.io.emit('chat_system', {
        message: `${targetUsername} has been unbanned by ${socket.user.username}`,
        type: 'info'
      });
    } catch (error) {
      console.error('Unban user error:', error);
      socket.emit('chat_system', {
        message: 'Failed to unban user.',
        type: 'error'
      });
    }
  }

  async demoteUser(socket, args, channel) {
    const targetUsername = args[0];
    
    if (!targetUsername) {
      socket.emit('chat_system', {
        message: 'Usage: /demote <username>',
        type: 'error'
      });
      return;
    }

    // Prevent self-demotion
    if (targetUsername === socket.user.username) {
      socket.emit('chat_system', {
        message: 'Cannot demote yourself.',
        type: 'error'
      });
      return;
    }

    try {
      const result = await dataAccess.demoteUser(targetUsername);

      if (!result) {
        socket.emit('chat_system', {
          message: 'User not found or cannot be demoted.',
          type: 'error'
        });
        return;
      }

      this.io.emit('chat_system', {
        message: `${targetUsername} has been demoted to user by ${socket.user.username}`,
        type: 'warning'
      });

      const targetSocket = this.findUserSocket(targetUsername);
      if (targetSocket) {
        targetSocket.user.role = 'user';
        targetSocket.emit('role_updated', { newRole: 'user' });
      }
    } catch (error) {
      console.error('Demote user error:', error);
      socket.emit('chat_system', {
        message: 'Failed to demote user.',
        type: 'error'
      });
    }
  }

  async announce(socket, args, channel) {
    const announcement = args.join(' ');
    if (!announcement) {
      socket.emit('chat_system', {
        message: 'Usage: /announce <message>',
        type: 'error'
      });
      return;
    }

    this.io.emit('chat_announcement', {
      message: announcement,
      from: socket.user.username,
      timestamp: new Date().toISOString()
    });
  }

  async shutdownServer(socket, args, channel) {
    const minutes = parseInt(args[0]) || 5;
    
    this.io.emit('chat_announcement', {
      message: `Server will shutdown in ${minutes} minutes for maintenance.`,
      from: 'SYSTEM',
      timestamp: new Date().toISOString()
    });
    
    socket.emit('chat_system', {
      message: `Shutdown scheduled in ${minutes} minutes.`,
      type: 'warning'
    });
    
    // Note: Actual shutdown would be implemented based on your deployment
  }

  async setMotd(socket, args, channel) {
    const motd = args.join(' ');
    if (!motd) {
      socket.emit('chat_system', {
        message: 'Usage: /setmotd <message>',
        type: 'error'
      });
      return;
    }

    this.serverMotd = motd;
    
    this.io.emit('chat_system', {
      message: `Message of the day updated: ${motd}`,
      type: 'info'
    });
  }

  async reloadServer(socket, args, channel) {
    socket.emit('chat_system', {
      message: 'Server configuration reloaded.',
      type: 'info'
    });
    
    // Note: Actual reload would restart certain services
  }

  async clearChat(socket, args, channel) {
    this.io.emit('chat_clear');
    
    this.io.emit('chat_system', {
      message: `Chat cleared by ${socket.user.username}`,
      type: 'info'
    });
  }

  // Helper methods
  hasPermission(user, requiredRole) {
    const roleHierarchy = { 'user': 1, 'helper': 2, 'co-admin': 3, 'admin': 4 };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  canModerateUser(moderator, target) {
    const roleHierarchy = { 'user': 1, 'helper': 2, 'co-admin': 3, 'admin': 4 };
    return roleHierarchy[moderator.role] > roleHierarchy[target.role];
  }

  sendPermissionError(socket) {
    socket.emit('chat_system', {
      message: 'You do not have permission to use this command.',
      type: 'error'
    });
  }

  findUserSocket(username) {
    for (const [socketId, socketObj] of this.io.sockets.sockets) {
      if (socketObj.user && socketObj.user.username === username) {
        return socketObj;
      }
    }
    return null;
  }

  // Get user status for moderation
  isUserMuted(username) {
    return this.mutedUsers.has(username);
  }

  isUserFrozen(username) {
    return this.frozenUsers.has(username);
  }

  // Get server stats
  getServerStats() {
    const onlineUsers = this.io.sockets.sockets.size;
    const mutedCount = this.mutedUsers.size;
    const frozenCount = this.frozenUsers.size;
    
    return {
      onlineUsers,
      mutedCount,
      frozenCount,
      motd: this.serverMotd
    };
  }
}

module.exports = ChatService;