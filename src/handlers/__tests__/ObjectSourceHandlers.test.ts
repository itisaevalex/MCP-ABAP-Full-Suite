import { ObjectSourceHandlers } from '../ObjectSourceHandlers';
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

describe('ObjectSourceHandlers', () => {
  let mockAdtClient: jest.Mocked<ADTClient>;
  let handlers: ObjectSourceHandlers;

  beforeEach(() => {
    mockAdtClient = {
      getObjectSource: jest.fn(),
      setObjectSource: jest.fn()
    } as unknown as jest.Mocked<ADTClient>;
    
    handlers = new ObjectSourceHandlers(mockAdtClient);
  });

  describe('getTools', () => {
    it('should return the list of available tools', () => {
      const tools = handlers.getTools();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toEqual([
        'getObjectSource',
        'setObjectSource'
      ]);
    });
  });

  describe('handle', () => {
    it('should throw error for unknown tool', async () => {
      await expect(handlers.handle('unknownTool', {}))
        .rejects
        .toThrow('Unknown object source tool: unknownTool');
    });
  });

  describe('getObjectSource', () => {
    const validArgs = {
      objectSourceUrl: '/source/url',
      options: {
        version: 'active'
      }
    };

    it('should get object source successfully with options', async () => {
      const mockSource = 'REPORT test.\nWRITE: hello.';
      mockAdtClient.getObjectSource.mockResolvedValue(mockSource);

      const result = await handlers.handle('getObjectSource', validArgs);

      expect(mockAdtClient.getObjectSource).toHaveBeenCalledWith(
        validArgs.objectSourceUrl,
        validArgs.options
      );
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            source: mockSource
          })
        }]
      });
    });

    it('should get object source successfully without options', async () => {
      const mockSource = 'REPORT test.\nWRITE: hello.';
      mockAdtClient.getObjectSource.mockResolvedValue(mockSource);

      const minimalArgs = {
        objectSourceUrl: '/source/url'
      };

      const result = await handlers.handle('getObjectSource', minimalArgs);

      expect(mockAdtClient.getObjectSource).toHaveBeenCalledWith(
        minimalArgs.objectSourceUrl,
        undefined
      );
      expect(result.content[0].text).toContain('success');
    });

    it('should validate required parameters', async () => {
      await expect(handlers.handle('getObjectSource', {}))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('Source retrieval failed');
      mockAdtClient.getObjectSource.mockRejectedValue(error);

      await expect(handlers.handle('getObjectSource', validArgs))
        .rejects
        .toThrow('Failed to get object source: Source retrieval failed');
    });
  });

  describe('setObjectSource', () => {
    const validArgs = {
      objectSourceUrl: '/source/url',
      source: 'REPORT test.\nWRITE: hello.',
      lockHandle: 'test-handle',
      transport: 'DEVK900001'
    };

    it('should set object source successfully with all parameters', async () => {
      mockAdtClient.setObjectSource.mockResolvedValue(undefined);

      const result = await handlers.handle('setObjectSource', validArgs);

      expect(mockAdtClient.setObjectSource).toHaveBeenCalledWith(
        validArgs.objectSourceUrl,
        validArgs.source,
        validArgs.lockHandle,
        validArgs.transport
      );
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            updated: true
          })
        }]
      });
    });

    it('should set object source successfully without transport', async () => {
      const argsWithoutTransport = {
        objectSourceUrl: '/source/url',
        source: 'REPORT test.\nWRITE: hello.',
        lockHandle: 'test-handle'
      };
      mockAdtClient.setObjectSource.mockResolvedValue(undefined);

      const result = await handlers.handle('setObjectSource', argsWithoutTransport);

      expect(mockAdtClient.setObjectSource).toHaveBeenCalledWith(
        argsWithoutTransport.objectSourceUrl,
        argsWithoutTransport.source,
        argsWithoutTransport.lockHandle,
        undefined
      );
      expect(result.content[0].text).toContain('success');
    });

    it('should validate required parameters', async () => {
      const invalidCases = [
        {},
        { objectSourceUrl: '/source/url' },
        { objectSourceUrl: '/source/url', source: 'test' },
        { source: 'test', lockHandle: 'handle' }
      ];

      for (const invalidArgs of invalidCases) {
        await expect(handlers.handle('setObjectSource', invalidArgs))
          .rejects
          .toThrow(/Missing required property/);
      }
    });

    it('should handle API errors', async () => {
      const error = new Error('Source update failed');
      mockAdtClient.setObjectSource.mockRejectedValue(error);

      await expect(handlers.handle('setObjectSource', validArgs))
        .rejects
        .toThrow('Failed to set object source: Source update failed');
    });
  });
});
