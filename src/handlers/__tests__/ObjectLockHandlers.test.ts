import { ObjectLockHandlers } from '../ObjectLockHandlers';
import { ADTClient, AdtLock } from 'abap-adt-api';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

jest.mock('abap-adt-api');
jest.mock('../../lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

describe('ObjectLockHandlers', () => {
  let mockAdtClient: jest.Mocked<ADTClient>;
  let handlers: ObjectLockHandlers;

  beforeEach(() => {
    mockAdtClient = {
      lock: jest.fn(),
      unLock: jest.fn()
    } as unknown as jest.Mocked<ADTClient>;
    
    handlers = new ObjectLockHandlers(mockAdtClient);
  });

  describe('getTools', () => {
    it('should return the list of available tools', () => {
      const tools = handlers.getTools();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toEqual([
        'lock',
        'unLock'
      ]);
    });
  });

  describe('handle', () => {
    it('should throw error for unknown tool', async () => {
      await expect(handlers.handle('unknownTool', {}))
        .rejects
        .toThrow('Unknown object lock tool: unknownTool');
    });
  });

  describe('lock', () => {
    const validArgs = {
      objectUrl: '/source/url',
      accessMode: 'exclusive'
    };

    it('should lock object successfully', async () => {
      const mockResult = {
        LOCK_HANDLE: 'test-handle',
        CORRNR: 'DEVK900001',
        CORRUSER: 'DEVELOPER',
        CORRTEXT: 'Test lock',
        IS_LOCAL: 'false',
        IS_LINK: 'false',
        IS_DARK: 'false',
        IS_LINK_UP: 'false',
        MODIFICATION_SUPPORT: 'full'
      } as unknown as AdtLock;
      mockAdtClient.lock.mockResolvedValue(mockResult);

      const result = await handlers.handle('lock', validArgs);

      expect(mockAdtClient.lock).toHaveBeenCalledWith(
        validArgs.objectUrl,
        validArgs.accessMode
      );
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            locked: true,
            lockHandle: mockResult.LOCK_HANDLE
          })
        }]
      });
    });

    it('should handle lock without accessMode', async () => {
      const minimalArgs = {
        objectUrl: '/source/url'
      };
      const mockResult = {
        LOCK_HANDLE: 'test-handle'
      } as unknown as AdtLock;
      mockAdtClient.lock.mockResolvedValue(mockResult);

      const result = await handlers.handle('lock', minimalArgs);

      expect(mockAdtClient.lock).toHaveBeenCalledWith(
        minimalArgs.objectUrl,
        undefined
      );
      expect(result.content[0].text).toContain('success');
    });

    it('should validate required parameters', async () => {
      await expect(handlers.handle('lock', {}))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('Lock failed');
      mockAdtClient.lock.mockRejectedValue(error);

      await expect(handlers.handle('lock', validArgs))
        .rejects
        .toThrow('Failed to lock object: Lock failed');
    });
  });

  describe('unLock', () => {
    const validArgs = {
      objectUrl: '/source/url',
      lockHandle: 'test-handle'
    };

    it('should unlock object successfully', async () => {
      mockAdtClient.unLock.mockResolvedValue('OK');

      const result = await handlers.handle('unLock', validArgs);

      expect(mockAdtClient.unLock).toHaveBeenCalledWith(
        validArgs.objectUrl,
        validArgs.lockHandle
      );
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            unlocked: true
          })
        }]
      });
    });

    it('should validate required parameters', async () => {
      await expect(handlers.handle('unLock', {}))
        .rejects
        .toThrow(/Missing required property/);

      await expect(handlers.handle('unLock', { objectUrl: '/source/url' }))
        .rejects
        .toThrow(/Missing required property/);

      await expect(handlers.handle('unLock', { lockHandle: 'test-handle' }))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('Unlock failed');
      mockAdtClient.unLock.mockRejectedValue(error);

      await expect(handlers.handle('unLock', validArgs))
        .rejects
        .toThrow('Failed to unlock object: Unlock failed');
    });
  });
});
