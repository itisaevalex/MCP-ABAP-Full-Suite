import { AuthHandlers } from '../AuthHandlers';
import { ADTClient } from 'abap-adt-api';
import { McpError } from '@modelcontextprotocol/sdk/types';

jest.mock('abap-adt-api');
jest.mock('../../lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

describe('AuthHandlers', () => {
  let mockAdtClient: jest.Mocked<ADTClient>;
  let handlers: AuthHandlers;

  beforeEach(() => {
    mockAdtClient = {
      login: jest.fn(),
      logout: jest.fn(),
      dropSession: jest.fn()
    } as unknown as jest.Mocked<ADTClient>;
    
    handlers = new AuthHandlers(mockAdtClient);
  });

  describe('getTools', () => {
    it('should return the list of available tools', () => {
      const tools = handlers.getTools();
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toEqual(['login', 'logout', 'dropSession']);
    });
  });

  describe('handle', () => {
    describe('login', () => {
      it('should handle login request successfully', async () => {
        mockAdtClient.login.mockResolvedValue({ success: true });

        const result = await handlers.handle('login', {});

        expect(mockAdtClient.login).toHaveBeenCalled();
        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true })
            }
          ]
        });
      });

      it('should handle login failure', async () => {
        const error = new Error('Connection failed');
        mockAdtClient.login.mockRejectedValue(error);

        await expect(handlers.handle('login', {}))
          .rejects
          .toThrow('Login failed: Connection failed');
      });
    });

    describe('logout', () => {
      it('should handle logout request successfully', async () => {
        mockAdtClient.logout.mockResolvedValue(undefined);

        const result = await handlers.handle('logout', {});

        expect(mockAdtClient.logout).toHaveBeenCalled();
        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'Logged out successfully' })
            }
          ]
        });
      });

      it('should handle logout failure', async () => {
        const error = new Error('Session invalid');
        mockAdtClient.logout.mockRejectedValue(error);

        await expect(handlers.handle('logout', {}))
          .rejects
          .toThrow('Logout failed: Session invalid');
      });
    });

    describe('dropSession', () => {
      it('should handle session drop request successfully', async () => {
        mockAdtClient.dropSession.mockResolvedValue(undefined);

        const result = await handlers.handle('dropSession', {});

        expect(mockAdtClient.dropSession).toHaveBeenCalled();
        expect(result).toEqual({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'Session cleared' })
            }
          ]
        });
      });

      it('should handle session drop failure', async () => {
        const error = new Error('Cache error');
        mockAdtClient.dropSession.mockRejectedValue(error);

        await expect(handlers.handle('dropSession', {}))
          .rejects
          .toThrow('Drop session failed: Cache error');
      });
    });

    it('should throw error for unknown tool', async () => {
      await expect(handlers.handle('unknownTool', {}))
        .rejects
        .toThrow('Unknown auth tool: unknownTool');
    });
  });
});
