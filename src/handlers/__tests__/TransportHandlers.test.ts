import { TransportHandlers } from '../TransportHandlers';
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

describe('TransportHandlers', () => {
  let mockAdtClient: jest.Mocked<ADTClient>;
  let handlers: TransportHandlers;

  beforeEach(() => {
    mockAdtClient = {
      transportInfo: jest.fn(),
      createTransport: jest.fn(),
      hasTransportConfig: jest.fn()
    } as unknown as jest.Mocked<ADTClient>;
    
    handlers = new TransportHandlers(mockAdtClient);
  });

  describe('getTools', () => {
    it('should return the list of available tools', () => {
      const tools = handlers.getTools();
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toEqual([
        'transportInfo',
        'createTransport',
        'hasTransportConfig'
      ]);
    });
  });

  describe('handle', () => {
    describe('transportInfo', () => {
      const validInfoArgs = {
        objSourceUrl: '/sap/bc/adt/classes/zcl_test/source/main',
        devClass: 'ZTEST_PKG',
        operation: 'INSERT'
      };

      it('should retrieve transport info successfully', async () => {
        const mockTransportInfo = {
          PGMID: 'R3TR',
          OBJECT: 'CLAS',
          OBJECTNAME: 'ZCL_TEST',
          OPERATION: 'INSERT',
          DEVCLASS: 'ZTEST_PKG',
          DLVUNIT: 'HOME',
          NAMESPACE: '/SAP/',
          PACKAGE_TYPE: 'development',
          SUPER_PACKAGE: '',
          SOFTWARE_COMPONENT: 'LOCAL',
          APPLICATION_COMPONENT: 'TEST',
          TRANSPORT_LAYER: 'HOME',
          CORRFLAG: '',
          URI: '/sap/bc/adt/packages/ztest_pkg',
          CTEXT: 'Test Class',
          KORRFLAG: '',
          AS4USER: 'DEVELOPER',
          PDEVCLASS: '',
          MASTERLANG: 'E',
          CREATED_ON: '20240127',
          CREATED_AT: '120600',
          CREATED_BY: 'DEVELOPER',
          RESULT: 'SUCCESS',
          RECORDING: 'false',
          EXISTING_REQ_ONLY: 'false',
          TRANSPORTS: []
        };

        mockAdtClient.transportInfo.mockResolvedValue(mockTransportInfo);

        const result = await handlers.handle('transportInfo', validInfoArgs);

        expect(mockAdtClient.transportInfo).toHaveBeenCalledWith(
          validInfoArgs.objSourceUrl,
          validInfoArgs.devClass,
          validInfoArgs.operation
        );
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              transportInfo: mockTransportInfo
            })
          }]
        });
      });

      it('should handle transport info with minimal parameters', async () => {
        const emptyTransportInfo = {
          PGMID: '',
          OBJECT: '',
          OBJECTNAME: '',
          OPERATION: '',
          DEVCLASS: '',
          DLVUNIT: '',
          NAMESPACE: '',
          PACKAGE_TYPE: '',
          SUPER_PACKAGE: '',
          SOFTWARE_COMPONENT: '',
          APPLICATION_COMPONENT: '',
          TRANSPORT_LAYER: '',
          CORRFLAG: '',
          URI: '',
          CTEXT: '',
          KORRFLAG: '',
          AS4USER: '',
          PDEVCLASS: '',
          MASTERLANG: '',
          CREATED_ON: '',
          CREATED_AT: '',
          CREATED_BY: '',
          RESULT: '',
          RECORDING: 'false',
          EXISTING_REQ_ONLY: 'false',
          TRANSPORTS: []
        };
        mockAdtClient.transportInfo.mockResolvedValue(emptyTransportInfo);

        await handlers.handle('transportInfo', {
          objSourceUrl: '/sap/bc/adt/classes/zcl_test/source/main'
        });

        expect(mockAdtClient.transportInfo).toHaveBeenCalledWith(
          '/sap/bc/adt/classes/zcl_test/source/main',
          undefined,
          undefined
        );
      });

      it('should validate required parameters', async () => {
        await expect(handlers.handle('transportInfo', {}))
          .rejects
          .toThrow(/Missing required property/);
      });
    });

    describe('createTransport', () => {
      const validCreateArgs = {
        objSourceUrl: '/sap/bc/adt/classes/zcl_test/source/main',
        REQUEST_TEXT: 'Test transport request',
        DEVCLASS: 'ZTEST_PKG',
        transportLayer: 'HOME'
      };

      it('should create transport request successfully', async () => {
        const mockTransportNumber = 'DEVK900001';
        mockAdtClient.createTransport.mockResolvedValue(mockTransportNumber);

        const result = await handlers.handle('createTransport', validCreateArgs);

        expect(mockAdtClient.createTransport).toHaveBeenCalledWith(
          validCreateArgs.objSourceUrl,
          validCreateArgs.REQUEST_TEXT,
          validCreateArgs.DEVCLASS,
          validCreateArgs.transportLayer
        );
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              transportNumber: mockTransportNumber,
              message: 'Transport created successfully'
            })
          }]
        });
      });

      it('should validate required parameters', async () => {
        const invalidArgs = {
          objSourceUrl: '/sap/bc/adt/classes/zcl_test/source/main'
        };
        await expect(handlers.handle('createTransport', invalidArgs))
          .rejects
          .toThrow(/Missing required property/);
      });
    });

    describe('hasTransportConfig', () => {
      it('should check transport configuration successfully', async () => {
        mockAdtClient.hasTransportConfig.mockResolvedValue(true);

        const result = await handlers.handle('hasTransportConfig', {});

        expect(mockAdtClient.hasTransportConfig).toHaveBeenCalled();
        expect(result).toEqual({
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              hasConfig: true
            })
          }]
        });
      });
    });

    describe('error handling', () => {
      it('should handle unknown tool error', async () => {
        await expect(handlers.handle('unknownTool', {}))
          .rejects
          .toThrow('Unknown transport tool: unknownTool');
      });

      it('should handle transport info API error', async () => {
        const error = new Error('Transport info failed');
        mockAdtClient.transportInfo.mockRejectedValue(error);

        await expect(handlers.handle('transportInfo', {
          objSourceUrl: '/sap/bc/adt/classes/zcl_test/source/main'
        }))
          .rejects
          .toThrow('Failed to get transport info: Transport info failed');
      });

      it('should handle create transport API error', async () => {
        const error = new Error('Transport creation failed');
        mockAdtClient.createTransport.mockRejectedValue(error);

        await expect(handlers.handle('createTransport', {
          objSourceUrl: '/sap/bc/adt/classes/zcl_test/source/main',
          REQUEST_TEXT: 'Test transport',
          DEVCLASS: 'ZTEST_PKG'
        }))
          .rejects
          .toThrow('Failed to create transport: Transport creation failed');
      });

      it('should handle transport config check API error', async () => {
        const error = new Error('Config check failed');
        mockAdtClient.hasTransportConfig.mockRejectedValue(error);

        await expect(handlers.handle('hasTransportConfig', {}))
          .rejects
          .toThrow('Failed to check transport config: Config check failed');
      });
    });
  });
});
