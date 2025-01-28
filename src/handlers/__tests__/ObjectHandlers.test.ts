import { ObjectHandlers } from '../ObjectHandlers';
import { ADTClient } from 'abap-adt-api';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

// Define minimal interfaces for testing
interface AdtLock {
  LOCK_HANDLE: string;
  CORRNR: string;
  CORRUSER: string;
  CORRTEXT: string;
  IS_LOCAL: string;
  IS_LINK: string;
  IS_DARK: string;
  IS_LINK_UP: string;
  MODIFICATION_SUPPORT: string;
}

interface SearchResult {
  'adtcore:name': string;
  'adtcore:type': string;
  'adtcore:uri': string;
}

jest.mock('abap-adt-api');
jest.mock('../../lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

describe('ObjectHandlers', () => {
  let mockAdtClient: jest.Mocked<ADTClient>;
  let handlers: ObjectHandlers;

  beforeEach(() => {
    mockAdtClient = {
      objectStructure: jest.fn(),
      getObjectSource: jest.fn(),
      setObjectSource: jest.fn(),
      findObjectPath: jest.fn(),
      validateNewObject: jest.fn(),
      createObject: jest.fn(),
      deleteObject: jest.fn(),
      activate: jest.fn(),
      inactiveObjects: jest.fn(),
      mainPrograms: jest.fn(),
      lock: jest.fn(),
      unLock: jest.fn(),
      searchObject: jest.fn()
    } as unknown as jest.Mocked<ADTClient>;
    
    handlers = new ObjectHandlers(mockAdtClient);
  });

  describe('getTools', () => {
    it('should return the list of available tools', () => {
      const tools = handlers.getTools();
      expect(tools).toHaveLength(12);
      expect(tools.map(t => t.name)).toContain('createObject');
      expect(tools.map(t => t.name)).toContain('getObjectSource');
      expect(tools.map(t => t.name)).toContain('searchObject');
    });
  });

  describe('handle', () => {
    describe('createObject', () => {
      const validCreateArgs = {
        objtype: 'CLAS',
        name: 'ZCL_TEST',
        parentName: 'PACKAGE',
        description: 'Test class',
        parentPath: '/source/main',
        responsible: 'DEVELOPER',
        transport: 'DEVK900001'
      };

      it('should handle object creation successfully', async () => {
        mockAdtClient.createObject.mockResolvedValue(undefined);

        const result = await handlers.handle('createObject', validCreateArgs);

        expect(mockAdtClient.createObject).toHaveBeenCalledWith(
          validCreateArgs.objtype,
          validCreateArgs.name,
          validCreateArgs.parentName,
          validCreateArgs.description,
          validCreateArgs.parentPath,
          validCreateArgs.responsible,
          validCreateArgs.transport
        );
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              created: true
            })
          }]
        });
      });

      it('should validate required parameters', async () => {
        const invalidArgs = { objtype: 'CLAS' };
        await expect(handlers.handle('createObject', invalidArgs))
          .rejects
          .toThrow(/Missing required property/);
      });
    });

    describe('getObjectSource', () => {
      it('should retrieve object source successfully', async () => {
        const mockSource = 'class zcl_test definition public.\\nendclass.';
        mockAdtClient.getObjectSource.mockResolvedValue(mockSource);

        const result = await handlers.handle('getObjectSource', {
          objectSourceUrl: '/sap/test/source'
        });

        expect(mockAdtClient.getObjectSource).toHaveBeenCalledWith(
          '/sap/test/source',
          undefined
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
    });

    describe('searchObject', () => {
      it('should search objects successfully', async () => {
        const mockResults: SearchResult[] = [
          { 
            'adtcore:name': 'ZCL_TEST',
            'adtcore:type': 'CLAS',
            'adtcore:uri': '/sap/test/class'
          }
        ];
        mockAdtClient.searchObject.mockResolvedValue(mockResults);

        const result = await handlers.handle('searchObject', {
          query: 'test',
          objType: 'CLAS',
          max: 10
        });

        expect(mockAdtClient.searchObject).toHaveBeenCalledWith(
          'test',
          'CLAS',
          10
        );
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              results: mockResults
            })
          }]
        });
      });

      it('should handle search with minimal parameters', async () => {
        mockAdtClient.searchObject.mockResolvedValue([]);

        await handlers.handle('searchObject', { query: 'test' });

        expect(mockAdtClient.searchObject).toHaveBeenCalledWith(
          'test',
          undefined,
          undefined
        );
      });
    });

    describe('lock/unlock operations', () => {
      it('should handle object locking', async () => {
        const mockLockResult: AdtLock = {
          LOCK_HANDLE: 'handle123',
          CORRNR: 'DEVK900001',
          CORRUSER: 'DEVELOPER',
          CORRTEXT: 'Test lock',
          IS_LOCAL: 'false',
          IS_LINK: 'false',
          IS_DARK: 'false',
          IS_LINK_UP: 'false',
          MODIFICATION_SUPPORT: 'full'
        };
        mockAdtClient.lock.mockResolvedValue(mockLockResult);

        const result = await handlers.handle('lock', {
          objectUrl: '/sap/test/object',
          accessMode: 'MODIFY'
        });

        expect(mockAdtClient.lock).toHaveBeenCalledWith(
          '/sap/test/object',
          'MODIFY'
        );
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              result: mockLockResult
            })
          }]
        });
      });

      it('should handle object unlocking', async () => {
        mockAdtClient.unLock.mockResolvedValue('OK');

        const result = await handlers.handle('unLock', {
          objectUrl: '/sap/test/object',
          lockHandle: 'handle123'
        });

        expect(mockAdtClient.unLock).toHaveBeenCalledWith(
          '/sap/test/object',
          'handle123'
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
    });

    describe('error handling', () => {
      it('should handle unknown tool error', async () => {
        await expect(handlers.handle('unknownTool', {}))
          .rejects
          .toThrow('Unknown object tool: unknownTool');
      });

      it('should handle API errors', async () => {
        const error = new Error('API error');
        mockAdtClient.createObject.mockRejectedValue(error);

        await expect(handlers.handle('createObject', {
          objtype: 'CLAS',
          name: 'ZCL_TEST',
          parentName: 'PACKAGE',
          description: 'Test class',
          parentPath: '/source/main'
        }))
          .rejects
          .toThrow('Failed to create object: API error');
      });

      it('should handle validation errors', async () => {
        await expect(handlers.handle('createObject', {
          objtype: 'INVALID'
        }))
          .rejects
          .toThrow(/Missing required property/);
      });
    });
  });
});
