import { ObjectManagementHandlers } from '../ObjectManagementHandlers';
import { ADTClient, ActivationResult, InactiveObjectRecord, ActivationResultMessage } from 'abap-adt-api';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

jest.mock('abap-adt-api');
jest.mock('../../lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

describe('ObjectManagementHandlers', () => {
  let mockAdtClient: jest.Mocked<ADTClient>;
  let handlers: ObjectManagementHandlers;

  beforeEach(() => {
    mockAdtClient = {
      activate: jest.fn(),
      inactiveObjects: jest.fn()
    } as unknown as jest.Mocked<ADTClient>;
    
    handlers = new ObjectManagementHandlers(mockAdtClient);
  });

  describe('getTools', () => {
    it('should return the list of available tools', () => {
      const tools = handlers.getTools();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toEqual([
        'activate',
        'inactiveObjects'
      ]);
    });
  });

  describe('handle', () => {
    it('should throw error for unknown tool', async () => {
      await expect(handlers.handle('unknownTool', {}))
        .rejects
        .toThrow('Unknown object management tool: unknownTool');
    });
  });

  describe('activate', () => {
    const singleObject = {
      uri: '/source/url',
      type: 'CLAS',
      name: 'TEST_CLASS'
    };

    const multipleObjects = [
      {
        uri: '/source/url1',
        type: 'CLAS',
        name: 'TEST_CLASS1'
      },
      {
        uri: '/source/url2',
        type: 'CLAS',
        name: 'TEST_CLASS2'
      }
    ];

    it('should activate single object successfully', async () => {
      const mockResult = {
        success: true,
        messages: [],
        inactive: []
      } as unknown as ActivationResult;
      mockAdtClient.activate.mockResolvedValue(mockResult);

      const args = {
        object: singleObject,
        preauditRequested: true
      };

      const result = await handlers.handle('activate', args);

      expect(mockAdtClient.activate).toHaveBeenCalledWith(
        args.object,
        args.preauditRequested
      );
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            result: mockResult
          })
        }]
      });
    });

    it('should activate multiple objects successfully', async () => {
      const mockResult = {
        success: true,
        messages: [],
        inactive: []
      } as unknown as ActivationResult;
      mockAdtClient.activate.mockResolvedValue(mockResult);

      const args = {
        object: multipleObjects,
        preauditRequested: true
      };

      const result = await handlers.handle('activate', args);

      expect(mockAdtClient.activate).toHaveBeenCalledWith(
        args.object,
        args.preauditRequested
      );
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            result: mockResult
          })
        }]
      });
    });

    it('should handle activation with warnings', async () => {
      const mockResult = {
        success: true,
        messages: [{
          text: 'Warning message'
        }] as unknown as ActivationResultMessage[],
        inactive: []
      } as unknown as ActivationResult;
      mockAdtClient.activate.mockResolvedValue(mockResult);

      const args = {
        object: singleObject
      };

      const result = await handlers.handle('activate', args);

      expect(mockAdtClient.activate).toHaveBeenCalledWith(
        args.object,
        undefined
      );
      expect(result.content[0].text).toContain('warning');
    });

    it('should validate required parameters', async () => {
      await expect(handlers.handle('activate', {}))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('Activation failed');
      mockAdtClient.activate.mockRejectedValue(error);

      await expect(handlers.handle('activate', { object: singleObject }))
        .rejects
        .toThrow('Failed to activate object: Activation failed');
    });
  });

  describe('inactiveObjects', () => {
    it('should get inactive objects successfully', async () => {
      const mockResult = [{
        object: {
          name: 'TEST_CLASS',
          type: 'CLAS',
          uri: '/source/url',
          parentUri: '/parent/url',
          description: 'Test class'
        },
        objectIdentifier: 'TEST_CLASS',
        packageName: 'TEST_PACKAGE',
        transportId: 'DEVK900001',
        owner: 'TESTUSER',
        responsible: 'TESTUSER'
      }] as unknown as InactiveObjectRecord[];
      mockAdtClient.inactiveObjects.mockResolvedValue(mockResult);

      const result = await handlers.handle('inactiveObjects', {});

      expect(mockAdtClient.inactiveObjects).toHaveBeenCalled();
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            result: mockResult
          })
        }]
      });
    });

    it('should handle empty inactive objects list', async () => {
      mockAdtClient.inactiveObjects.mockResolvedValue([]);

      const result = await handlers.handle('inactiveObjects', {});

      expect(mockAdtClient.inactiveObjects).toHaveBeenCalled();
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            result: []
          })
        }]
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch inactive objects');
      mockAdtClient.inactiveObjects.mockRejectedValue(error);

      await expect(handlers.handle('inactiveObjects', {}))
        .rejects
        .toThrow('Failed to get inactive objects: Failed to fetch inactive objects');
    });
  });
});
