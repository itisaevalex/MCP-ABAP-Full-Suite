import { ObjectDeletionHandlers } from '../ObjectDeletionHandlers';
import { ADTClient } from 'abap-adt-api';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

jest.mock('abap-adt-api');
jest.mock('../../lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

describe('ObjectDeletionHandlers', () => {
  let mockAdtClient: jest.Mocked<ADTClient>;
  let handlers: ObjectDeletionHandlers;

  beforeEach(() => {
    mockAdtClient = {
      deleteObject: jest.fn()
    } as unknown as jest.Mocked<ADTClient>;
    
    handlers = new ObjectDeletionHandlers(mockAdtClient);
  });

  describe('getTools', () => {
    it('should return the list of available tools', () => {
      const tools = handlers.getTools();
      expect(tools).toHaveLength(1);
      expect(tools.map(t => t.name)).toEqual([
        'deleteObject'
      ]);
    });
  });

  describe('handle', () => {
    it('should throw error for unknown tool', async () => {
      await expect(handlers.handle('unknownTool', {}))
        .rejects
        .toThrow('Unknown object deletion tool: unknownTool');
    });
  });

  describe('deleteObject', () => {
    const validArgs = {
      objectUrl: '/source/url',
      lockHandle: 'test-handle',
      transport: 'DEVK900001'
    };

    it('should delete object successfully with all parameters', async () => {
      mockAdtClient.deleteObject.mockResolvedValue(undefined);

      const result = await handlers.handle('deleteObject', validArgs);

      expect(mockAdtClient.deleteObject).toHaveBeenCalledWith(
        validArgs.objectUrl,
        validArgs.lockHandle,
        validArgs.transport
      );
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            result: undefined
          })
        }]
      });
    });

    it('should delete object successfully without transport', async () => {
      const argsWithoutTransport = {
        objectUrl: '/source/url',
        lockHandle: 'test-handle'
      };
      mockAdtClient.deleteObject.mockResolvedValue(undefined);

      const result = await handlers.handle('deleteObject', argsWithoutTransport);

      expect(mockAdtClient.deleteObject).toHaveBeenCalledWith(
        argsWithoutTransport.objectUrl,
        argsWithoutTransport.lockHandle,
        undefined
      );
      expect(result.content[0].text).toContain('success');
    });

    it('should validate required parameters', async () => {
      const invalidCases = [
        {},
        { objectUrl: '/source/url' },
        { lockHandle: 'test-handle' }
      ];

      for (const invalidArgs of invalidCases) {
        await expect(handlers.handle('deleteObject', invalidArgs))
          .rejects
          .toThrow(/Missing required property/);
      }
    });

    it('should handle API errors', async () => {
      const error = new Error('Deletion failed');
      mockAdtClient.deleteObject.mockRejectedValue(error);

      await expect(handlers.handle('deleteObject', validArgs))
        .rejects
        .toThrow('Failed to delete object: Deletion failed');
    });

    it('should handle API errors with missing error message', async () => {
      const error = new Error();
      mockAdtClient.deleteObject.mockRejectedValue(error);

      await expect(handlers.handle('deleteObject', validArgs))
        .rejects
        .toThrow('Failed to delete object: Unknown error');
    });
  });
});
