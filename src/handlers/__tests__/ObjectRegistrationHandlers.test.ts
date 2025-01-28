import { ObjectRegistrationHandlers } from '../ObjectRegistrationHandlers';
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

describe('ObjectRegistrationHandlers', () => {
  let mockAdtClient: jest.Mocked<ADTClient>;
  let handlers: ObjectRegistrationHandlers;

  beforeEach(() => {
    mockAdtClient = {
      objectRegistrationInfo: jest.fn(),
      validateNewObject: jest.fn(),
      createObject: jest.fn()
    } as unknown as jest.Mocked<ADTClient>;
    
    handlers = new ObjectRegistrationHandlers(mockAdtClient);
  });

  describe('getTools', () => {
    it('should return the list of available tools', () => {
      const tools = handlers.getTools();
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toEqual([
        'objectRegistrationInfo',
        'validateNewObject',
        'createObject'
      ]);
    });
  });

  describe('handle', () => {
    it('should throw error for unknown tool', async () => {
      await expect(handlers.handle('unknownTool', {}))
        .rejects
        .toThrow('Unknown object registration tool: unknownTool');
    });
  });

  describe('objectRegistrationInfo', () => {
    const validArgs = {
      objectUrl: '/source/url'
    };

    it('should get registration info successfully', async () => {
      const mockResult = {
        supported: true,
        properties: {
          CLAS: {
            category: 'source',
            supported: true
          }
        }
      } as unknown as any;
      mockAdtClient.objectRegistrationInfo.mockResolvedValue(mockResult);

      const result = await handlers.handle('objectRegistrationInfo', validArgs);

      expect(mockAdtClient.objectRegistrationInfo).toHaveBeenCalledWith(
        validArgs.objectUrl
      );
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            info: mockResult
          })
        }]
      });
    });

    it('should validate required parameters', async () => {
      await expect(handlers.handle('objectRegistrationInfo', {}))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('Registration info failed');
      mockAdtClient.objectRegistrationInfo.mockRejectedValue(error);

      await expect(handlers.handle('objectRegistrationInfo', validArgs))
        .rejects
        .toThrow('Failed to get registration info: Registration info failed');
    });
  });

  describe('validateNewObject', () => {
    const validArgs = {
      options: {
        type: 'CLAS',
        name: 'TEST_CLASS',
        description: 'Test class',
        parentName: 'PACKAGE',
        parentPath: '/parent/url'
      }
    };

    it('should validate new object successfully', async () => {
      const mockResult = {
        valid: true,
        messages: []
      } as unknown as any;
      mockAdtClient.validateNewObject.mockResolvedValue(mockResult);

      const result = await handlers.handle('validateNewObject', validArgs);

      expect(mockAdtClient.validateNewObject).toHaveBeenCalledWith(validArgs.options);
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

    it('should handle validation with messages', async () => {
      const mockResult = {
        valid: false,
        messages: [{
          type: 'error',
          text: 'Invalid class name'
        }]
      } as unknown as any;
      mockAdtClient.validateNewObject.mockResolvedValue(mockResult);

      const result = await handlers.handle('validateNewObject', validArgs);

      expect(result.content[0].text).toContain('error');
    });

    it('should validate required parameters', async () => {
      await expect(handlers.handle('validateNewObject', {}))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('Validation failed');
      mockAdtClient.validateNewObject.mockRejectedValue(error);

      await expect(handlers.handle('validateNewObject', validArgs))
        .rejects
        .toThrow('Failed to validate new object: Validation failed');
    });
  });

  describe('createObject', () => {
    const validArgs = {
      objtype: 'CLAS',
      name: 'TEST_CLASS',
      description: 'Test class',
      parentName: 'PACKAGE',
      parentPath: '/parent/url',
      responsible: 'TESTUSER',
      transport: 'DEVK900001'
    };

    it('should create object successfully with all parameters', async () => {
      mockAdtClient.createObject.mockResolvedValue(undefined);

      const result = await handlers.handle('createObject', validArgs);

      expect(mockAdtClient.createObject).toHaveBeenCalledWith(
        validArgs.objtype,
        validArgs.name,
        validArgs.parentName,
        validArgs.description,
        validArgs.parentPath,
        validArgs.responsible,
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

    it('should create object successfully with required parameters only', async () => {
      const minimalArgs = {
        objtype: 'CLAS',
        name: 'TEST_CLASS',
        description: 'Test class',
        parentName: 'PACKAGE',
        parentPath: '/parent/url'
      };
      mockAdtClient.createObject.mockResolvedValue(undefined);

      const result = await handlers.handle('createObject', minimalArgs);

      expect(mockAdtClient.createObject).toHaveBeenCalledWith(
        minimalArgs.objtype,
        minimalArgs.name,
        minimalArgs.parentName,
        minimalArgs.description,
        minimalArgs.parentPath,
        undefined,
        undefined
      );
      expect(result.content[0].text).toContain('success');
    });

    it('should validate required parameters', async () => {
      const invalidCases = [
        {},
        { objtype: 'CLAS' },
        { objtype: 'CLAS', name: 'TEST' },
        { objtype: 'CLAS', name: 'TEST', parentName: 'PKG' },
        { objtype: 'CLAS', name: 'TEST', parentName: 'PKG', description: 'Test' }
      ];

      for (const invalidArgs of invalidCases) {
        await expect(handlers.handle('createObject', invalidArgs))
          .rejects
          .toThrow(/Missing required property/);
      }
    });

    it('should handle API errors', async () => {
      const error = new Error('Creation failed');
      mockAdtClient.createObject.mockRejectedValue(error);

      await expect(handlers.handle('createObject', validArgs))
        .rejects
        .toThrow('Failed to create object: Creation failed');
    });
  });
});
