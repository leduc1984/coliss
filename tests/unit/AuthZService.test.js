/**
 * Comprehensive Unit Tests for AuthZService
 * Tests scope-based permissions, JWT validation, user authentication,
 * and integration with the unified authentication system.
 */

const AuthZService = require('../../services/core/AuthZService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    release: jest.fn(),
  };
  
  const mPool = {
    connect: jest.fn(() => Promise.resolve(mClient)),
    query: jest.fn(),
  };
  
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('../../utils/FeatureFlags', () => ({
  isEnabled: jest.fn(() => Promise.resolve(true))
}));

describe('AuthZService', () => {
  let mockClient;
  let mockPool;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    const { Pool } = require('pg');
    mockPool = new Pool();
    mockClient = {
      connect: jest.fn(),
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);

    // Set test environment variables
    process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
    process.env.DB_NAME = 'test_pokemon_mmo';
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.JWT_SECRET;
    delete process.env.DB_NAME;
  });

  describe('Scope-based Permission System', () => {
    describe('can() method', () => {
      test('should return true for admin with editor:map.write scope', () => {
        const admin = { role: 'admin' };
        const result = AuthZService.can(admin, 'editor:map.write');
        expect(result).toBe(true);
      });

      test('should return true for co_admin with editor:map.write scope', () => {
        const coAdmin = { role: 'co_admin' };
        const result = AuthZService.can(coAdmin, 'editor:map.write');
        expect(result).toBe(true);
      });

      test('should return false for user with editor:map.write scope', () => {
        const user = { role: 'user' };
        const result = AuthZService.can(user, 'editor:map.write');
        expect(result).toBe(false);
      });

      test('should return false for helper with admin.access scope', () => {
        const helper = { role: 'helper' };
        const result = AuthZService.can(helper, 'admin.access');
        expect(result).toBe(false);
      });

      test('should return true for all roles with battle.start scope', () => {
        const roles = ['user', 'helper', 'co_admin', 'admin'];
        roles.forEach(role => {
          const user = { role };
          expect(AuthZService.can(user, 'battle.start')).toBe(true);
        });
      });

      test('should return false for invalid user object', () => {
        expect(AuthZService.can(null, 'editor:map.write')).toBe(false);
        expect(AuthZService.can(undefined, 'editor:map.write')).toBe(false);
        expect(AuthZService.can({}, 'editor:map.write')).toBe(false);
      });

      test('should return false for invalid scope', () => {
        const admin = { role: 'admin' };
        expect(AuthZService.can(admin, null)).toBe(false);
        expect(AuthZService.can(admin, undefined)).toBe(false);
        expect(AuthZService.can(admin, '')).toBe(false);
        expect(AuthZService.can(admin, 'nonexistent:scope')).toBe(false);
      });

      test('should warn about unknown scopes', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const admin = { role: 'admin' };
        
        AuthZService.can(admin, 'unknown:scope');
        
        expect(consoleSpy).toHaveBeenCalledWith('Unknown scope: unknown:scope');
        consoleSpy.mockRestore();
      });
    });

    describe('hasHigherRole() method', () => {
      test('should return true when admin compared to user', () => {
        const admin = { role: 'admin' };
        const user = { role: 'user' };
        expect(AuthZService.hasHigherRole(admin, user)).toBe(true);
      });

      test('should return false when user compared to admin', () => {
        const admin = { role: 'admin' };
        const user = { role: 'user' };
        expect(AuthZService.hasHigherRole(user, admin)).toBe(false);
      });

      test('should return false when comparing same roles', () => {
        const admin1 = { role: 'admin' };
        const admin2 = { role: 'admin' };
        expect(AuthZService.hasHigherRole(admin1, admin2)).toBe(false);
      });

      test('should handle hierarchy correctly: admin > co_admin > helper > user', () => {
        const admin = { role: 'admin' };
        const coAdmin = { role: 'co_admin' };
        const helper = { role: 'helper' };
        const user = { role: 'user' };

        expect(AuthZService.hasHigherRole(admin, coAdmin)).toBe(true);
        expect(AuthZService.hasHigherRole(coAdmin, helper)).toBe(true);
        expect(AuthZService.hasHigherRole(helper, user)).toBe(true);
        
        expect(AuthZService.hasHigherRole(user, helper)).toBe(false);
        expect(AuthZService.hasHigherRole(helper, coAdmin)).toBe(false);
        expect(AuthZService.hasHigherRole(coAdmin, admin)).toBe(false);
      });
    });
  });

  describe('JWT Token Management', () => {
    describe('generateToken() method', () => {
      test('should generate valid JWT token', () => {
        const user = {
          id: 1,
          username: 'testuser',
          role: 'user'
        };

        const token = AuthZService.generateToken(user);
        
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        
        // Verify token content
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.userId).toBe(user.id);
        expect(decoded.username).toBe(user.username);
        expect(decoded.role).toBe(user.role);
        expect(decoded.iss).toBe('pokemon-mmo');
        expect(decoded.aud).toBe('game-client');
      });

      test('should set correct expiration time (8 hours)', () => {
        const user = { id: 1, username: 'test', role: 'user' };
        const beforeTime = Math.floor(Date.now() / 1000);
        
        const token = AuthZService.generateToken(user);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const expectedExp = beforeTime + (8 * 60 * 60); // 8 hours
        expect(decoded.exp).toBeCloseTo(expectedExp, -2); // Within 100 seconds
      });
    });

    describe('validateToken() method', () => {
      test('should validate valid token and return user data', async () => {
        // Mock database response
        mockClient.query.mockResolvedValueOnce({
          rows: [{
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            is_active: true,
            created_at: '2024-01-01',
            last_login: '2024-01-01'
          }]
        });

        const user = { id: 1, username: 'testuser', role: 'user' };
        const token = AuthZService.generateToken(user);

        const result = await AuthZService.validateToken(token);

        expect(result.id).toBe(1);
        expect(result.username).toBe('testuser');
        expect(result.role).toBe('user');
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT id, username, email, role'),
          [1]
        );
      });

      test('should reject expired token', async () => {
        const user = { id: 1, username: 'test', role: 'user' };
        
        // Create token with past expiration
        const expiredPayload = {
          userId: user.id,
          username: user.username,
          role: user.role,
          iat: Math.floor(Date.now() / 1000) - (10 * 60 * 60), // 10 hours ago
          exp: Math.floor(Date.now() / 1000) - (2 * 60 * 60)   // 2 hours ago
        };

        const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET);

        await expect(AuthZService.validateToken(expiredToken)).rejects.toThrow('Token validation failed');
      });

      test('should reject token for inactive user', async () => {
        mockClient.query.mockResolvedValueOnce({ rows: [] }); // No active user found

        const user = { id: 1, username: 'test', role: 'user' };
        const token = AuthZService.generateToken(user);

        await expect(AuthZService.validateToken(token)).rejects.toThrow('User not found or inactive');
      });

      test('should log audit events for token validation', async () => {
        // Mock successful user query
        mockClient.query.mockResolvedValueOnce({
          rows: [{ id: 1, username: 'test', role: 'user', is_active: true }]
        });
        
        // Mock audit log insertion
        mockClient.query.mockResolvedValueOnce({});

        const user = { id: 1, username: 'test', role: 'user' };
        const token = AuthZService.generateToken(user);

        await AuthZService.validateToken(token);

        // Check that audit log was called
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO auth_audit_log'),
          expect.arrayContaining([1, 'token_validated', expect.any(String)])
        );
      });
    });
  });

  describe('User Authentication', () => {
    describe('authenticate() method', () => {
      test('should authenticate valid user credentials', async () => {
        const hashedPassword = await bcrypt.hash('Test123!@#', 12);
        
        // Mock user query
        mockClient.query
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
              password: hashedPassword,
              role: 'user',
              is_active: true
            }]
          })
          .mockResolvedValueOnce({}); // Mock update last_login

        const result = await AuthZService.authenticate('testuser', 'Test123!@#');

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('token');
        expect(result.user.username).toBe('testuser');
        expect(result.user.password).toBeUndefined(); // Password should be removed
        expect(typeof result.token).toBe('string');
      });

      test('should reject invalid username format', async () => {
        await expect(AuthZService.authenticate('ab', 'password')).rejects.toThrow('Invalid username format');
        await expect(AuthZService.authenticate('test@user', 'password')).rejects.toThrow('Invalid username format');
      });

      test('should reject empty credentials', async () => {
        await expect(AuthZService.authenticate('', 'password')).rejects.toThrow('Username and password are required');
        await expect(AuthZService.authenticate('username', '')).rejects.toThrow('Username and password are required');
      });

      test('should reject non-existent user', async () => {
        mockClient.query.mockResolvedValueOnce({ rows: [] }); // User not found

        await expect(AuthZService.authenticate('nonexistent', 'password')).rejects.toThrow('Invalid credentials');
      });

      test('should reject incorrect password', async () => {
        const hashedPassword = await bcrypt.hash('correct_password', 12);
        
        mockClient.query.mockResolvedValueOnce({
          rows: [{
            id: 1,
            username: 'testuser',
            password: hashedPassword,
            is_active: true
          }]
        });

        await expect(AuthZService.authenticate('testuser', 'wrong_password')).rejects.toThrow('Invalid credentials');
      });
    });

    describe('register() method', () => {
      test('should register new user with valid data', async () => {
        // Mock: Check no existing user
        mockClient.query
          .mockResolvedValueOnce({ rows: [] }) // No existing user
          .mockResolvedValueOnce({ // Insert new user
            rows: [{
              id: 2,
              username: 'newuser',
              email: 'new@example.com',
              role: 'user',
              is_active: true,
              created_at: '2024-01-01',
              last_login: '2024-01-01'
            }]
          });

        const result = await AuthZService.register('newuser', 'new@example.com', 'NewPass123!@#');

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('token');
        expect(result.user.username).toBe('newuser');
        expect(result.user.email).toBe('new@example.com');
      });

      test('should validate email format', async () => {
        await expect(AuthZService.register('user', 'invalid_email', 'Pass123!@#')).rejects.toThrow('Invalid email format');
      });

      test('should enforce password strength requirements', async () => {
        await expect(AuthZService.register('user', 'test@example.com', 'weak')).rejects.toThrow('Password must be at least 8 characters');
        await expect(AuthZService.register('user', 'test@example.com', 'password123')).rejects.toThrow('Password must contain uppercase, lowercase, digit, and special character');
        await expect(AuthZService.register('user', 'test@example.com', 'PASSWORD123!')).rejects.toThrow('Password must contain uppercase, lowercase, digit, and special character');
      });

      test('should reject duplicate username', async () => {
        mockClient.query.mockResolvedValueOnce({
          rows: [{ username: 'existinguser', email: 'other@example.com' }]
        });

        await expect(AuthZService.register('existinguser', 'new@example.com', 'Pass123!@#')).rejects.toThrow('Username already exists');
      });

      test('should reject duplicate email', async () => {
        mockClient.query.mockResolvedValueOnce({
          rows: [{ username: 'otheruser', email: 'existing@example.com' }]
        });

        await expect(AuthZService.register('newuser', 'existing@example.com', 'Pass123!@#')).rejects.toThrow('Email already exists');
      });
    });
  });

  describe('Express Middleware', () => {
    describe('requireAuth() middleware', () => {
      test('should pass through valid authenticated request', async () => {
        const user = { id: 1, username: 'test', role: 'user' };
        const token = AuthZService.generateToken(user);

        // Mock database response
        mockClient.query.mockResolvedValueOnce({
          rows: [{ id: 1, username: 'test', role: 'user', is_active: true }]
        });

        const req = {
          headers: { authorization: `Bearer ${token}` }
        };
        const res = {};
        const next = jest.fn();

        const middleware = AuthZService.requireAuth();
        await middleware(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user.username).toBe('test');
        expect(next).toHaveBeenCalled();
      });

      test('should reject request without token', async () => {
        const req = { headers: {} };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const next = jest.fn();

        const middleware = AuthZService.requireAuth();
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Access token required',
          code: 'TOKEN_MISSING'
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('should reject request with invalid token', async () => {
        const req = {
          headers: { authorization: 'Bearer invalid_token' }
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const next = jest.fn();

        const middleware = AuthZService.requireAuth();
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Invalid token',
          code: 'TOKEN_INVALID',
          error: expect.any(String)
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('requireScope() middleware', () => {
      test('should allow admin user with editor:map.write scope', async () => {
        const user = { id: 1, username: 'admin', role: 'admin' };
        const token = AuthZService.generateToken(user);

        mockClient.query.mockResolvedValueOnce({
          rows: [{ id: 1, username: 'admin', role: 'admin', is_active: true }]
        });

        const req = {
          headers: { authorization: `Bearer ${token}` }
        };
        const res = {};
        const next = jest.fn();

        const middleware = AuthZService.requireScope('editor:map.write');
        await middleware(req, res, next);

        expect(req.user).toBeDefined();
        expect(next).toHaveBeenCalled();
      });

      test('should deny user without required scope', async () => {
        const user = { id: 1, username: 'user', role: 'user' };
        const token = AuthZService.generateToken(user);

        mockClient.query.mockResolvedValueOnce({
          rows: [{ id: 1, username: 'user', role: 'user', is_active: true }]
        });

        const req = {
          headers: { authorization: `Bearer ${token}` }
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const next = jest.fn();

        const middleware = AuthZService.requireScope('editor:map.write');
        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Insufficient permissions. Required scope: editor:map.write',
          userRole: 'user',
          requiredScope: 'editor:map.write',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('Administrative Functions', () => {
    describe('updateUserRole() method', () => {
      test('should allow admin to update user role', async () => {
        // Mock get actor (admin)
        mockClient.query
          .mockResolvedValueOnce({
            rows: [{ id: 1, username: 'admin', role: 'admin', is_active: true }]
          })
          // Mock get target (user)  
          .mockResolvedValueOnce({
            rows: [{ id: 2, username: 'user', role: 'user', is_active: true }]
          })
          // Mock update role
          .mockResolvedValueOnce({})
          // Mock audit log
          .mockResolvedValueOnce({});

        const result = await AuthZService.updateUserRole(1, 2, 'helper');

        expect(result.success).toBe(true);
        expect(result.message).toBe('User role updated to helper');
      });

      test('should prevent non-admin from updating roles', async () => {
        mockClient.query
          .mockResolvedValueOnce({
            rows: [{ id: 2, username: 'user', role: 'user', is_active: true }]
          })
          .mockResolvedValueOnce({
            rows: [{ id: 3, username: 'target', role: 'user', is_active: true }]
          });

        await expect(AuthZService.updateUserRole(2, 3, 'helper')).rejects.toThrow('Insufficient permissions to change roles');
      });

      test('should prevent admin self-demotion', async () => {
        mockClient.query
          .mockResolvedValueOnce({
            rows: [{ id: 1, username: 'admin', role: 'admin', is_active: true }]
          })
          .mockResolvedValueOnce({
            rows: [{ id: 1, username: 'admin', role: 'admin', is_active: true }]
          });

        await expect(AuthZService.updateUserRole(1, 1, 'user')).rejects.toThrow('Admins cannot demote themselves');
      });

      test('should validate role values', async () => {
        await expect(AuthZService.updateUserRole(1, 2, 'invalid_role')).rejects.toThrow('Invalid role');
      });
    });

    describe('getHealthStatus() method', () => {
      test('should return healthy status when database is connected', async () => {
        mockClient.query.mockResolvedValueOnce({
          rows: [{ user_count: '42' }]
        });

        const health = await AuthZService.getHealthStatus();

        expect(health.status).toBe('healthy');
        expect(health.database).toBe('connected');
        expect(health.activeUsers).toBe(42);
        expect(health.uptime).toBeGreaterThan(0);
      });

      test('should return unhealthy status on database error', async () => {
        mockClient.connect.mockRejectedValue(new Error('Connection failed'));

        const health = await AuthZService.getHealthStatus();

        expect(health.status).toBe('unhealthy');
        expect(health.database).toBe('disconnected');
        expect(health.error).toBe('Connection failed');
      });
    });
  });

  describe('Audit Logging', () => {
    describe('logAuthEvent() method', () => {
      test('should log authentication events', async () => {
        mockClient.query.mockResolvedValueOnce({});

        await AuthZService.logAuthEvent(1, 'user_logged_in', {
          username: 'test',
          timestamp: '2024-01-01'
        });

        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO auth_audit_log'),
          [1, 'user_logged_in', expect.any(String)]
        );
      });

      test('should handle logging errors gracefully', async () => {
        mockClient.query.mockRejectedValue(new Error('DB error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await AuthZService.logAuthEvent(1, 'test_event', {});

        expect(consoleSpy).toHaveBeenCalledWith('Failed to log auth event:', 'DB error');
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete authentication flow', async () => {
      const password = 'TestPass123!@#';
      const hashedPassword = await bcrypt.hash(password, 12);

      // Mock registration
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({ // Insert new user
          rows: [{
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            is_active: true
          }]
        });

      // Register user
      const registerResult = await AuthZService.register('testuser', 'test@example.com', password);
      expect(registerResult.user.username).toBe('testuser');

      // Mock authentication
      mockClient.query
        .mockResolvedValueOnce({ // Get user for auth
          rows: [{
            id: 1,
            username: 'testuser',
            password: hashedPassword,
            role: 'user',
            is_active: true
          }]
        })
        .mockResolvedValueOnce({}); // Update last_login

      // Authenticate user
      const authResult = await AuthZService.authenticate('testuser', password);
      expect(authResult.user.username).toBe('testuser');

      // Mock token validation
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          username: 'testuser',
          role: 'user',
          is_active: true
        }]
      });

      // Validate token
      const user = await AuthZService.validateToken(authResult.token);
      expect(user.username).toBe('testuser');

      // Test permissions
      expect(AuthZService.can(user, 'battle.start')).toBe(true);
      expect(AuthZService.can(user, 'admin.access')).toBe(false);
    });
  });
});

describe('AuthZService Error Handling', () => {
  test('should handle database connection failures gracefully', async () => {
    const { Pool } = require('pg');
    const mockPool = new Pool();
    mockPool.connect.mockRejectedValue(new Error('Connection failed'));

    await expect(AuthZService.authenticate('test', 'password')).rejects.toThrow();
  });

  test('should handle malformed JWT tokens', async () => {
    await expect(AuthZService.validateToken('invalid.jwt.token')).rejects.toThrow('Token validation failed');
  });

  test('should handle SQL injection attempts', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    await expect(AuthZService.authenticate(maliciousInput, 'password')).rejects.toThrow('Invalid username format');
  });
});

describe('AuthZService Performance', () => {
  test('should validate token in reasonable time', async () => {
    const user = { id: 1, username: 'test', role: 'user' };
    const token = AuthZService.generateToken(user);

    const { Pool } = require('pg');
    const mockPool = new Pool();
    const mockClient = await mockPool.connect();
    mockClient.query.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'test', role: 'user', is_active: true }]
    });

    const startTime = Date.now();
    await AuthZService.validateToken(token);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
  });

  test('should handle scope checks efficiently', () => {
    const user = { role: 'admin' };
    
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      AuthZService.can(user, 'editor:map.write');
    }
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(50); // 1000 checks in <50ms
  });
});

module.exports = {
  // Export test utilities for integration tests
  createTestUser: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    is_active: true,
    ...overrides
  }),
  
  createValidToken: (user = null) => {
    const testUser = user || { id: 1, username: 'test', role: 'user' };
    return AuthZService.generateToken(testUser);
  }
};