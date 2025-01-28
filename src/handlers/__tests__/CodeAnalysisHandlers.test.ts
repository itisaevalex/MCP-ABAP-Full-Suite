import { CodeAnalysisHandlers } from '../CodeAnalysisHandlers';
import { ADTClient, SyntaxCheckResult, CompletionProposal, DefinitionLocation, UsageReference } from 'abap-adt-api';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

jest.mock('abap-adt-api');
jest.mock('../../lib/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

describe('CodeAnalysisHandlers', () => {
  let mockAdtClient: jest.Mocked<ADTClient>;
  let handlers: CodeAnalysisHandlers;

  beforeEach(() => {
    mockAdtClient = {
      syntaxCheck: jest.fn(),
      codeCompletion: jest.fn(),
      findDefinition: jest.fn(),
      usageReferences: jest.fn()
    } as unknown as jest.Mocked<ADTClient>;
    
    handlers = new CodeAnalysisHandlers(mockAdtClient);
  });

  describe('getTools', () => {
    it('should return the list of available tools', () => {
      const tools = handlers.getTools();
      expect(tools).toHaveLength(4);
      expect(tools.map(t => t.name)).toEqual([
        'syntaxCheck',
        'codeCompletion',
        'findDefinition',
        'usageReferences'
      ]);
    });
  });

  describe('handle', () => {
    it('should throw error for unknown tool', async () => {
      await expect(handlers.handle('unknownTool', {}))
        .rejects
        .toThrow('Unknown code analysis tool: unknownTool');
    });
  });

  describe('syntaxCheck', () => {
    const validArgs = {
      code: 'WRITE: hello.'
    };

    it('should perform syntax check successfully', async () => {
      const mockResult = [{
        uri: '/source/url',
        line: 1,
        offset: 0,
        severity: 'error',
        text: 'Test error'
      }] as unknown as SyntaxCheckResult[];
      mockAdtClient.syntaxCheck.mockResolvedValue(mockResult);

      const result = await handlers.handle('syntaxCheck', validArgs);

      expect(mockAdtClient.syntaxCheck).toHaveBeenCalledWith(validArgs.code);
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

    it('should validate required parameters', async () => {
      await expect(handlers.handle('syntaxCheck', {}))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('Syntax check failed');
      mockAdtClient.syntaxCheck.mockRejectedValue(error);

      await expect(handlers.handle('syntaxCheck', validArgs))
        .rejects
        .toThrow('Syntax check failed: Syntax check failed');
    });
  });

  describe('codeCompletion', () => {
    const validArgs = {
      sourceUrl: '/source/url',
      source: 'WRITE:',
      line: 1,
      column: 5
    };

    it('should get code completion suggestions successfully', async () => {
      const mockResult = [{
        KIND: 'method',
        IDENTIFIER: 'test',
        ICON: 'icon',
        SUBICON: 'subicon',
        PROPOSALTYPE: 'type',
        DESCRIPTION: 'description',
        LONGTEXT_INDEX: 1,
        LONGTEXT: 'longtext',
        QUICK_INFO_INDEX: 1,
        QUICK_INFO: 'quickinfo',
        CATEGORY: 'category',
        SEARCH_ONLY: false,
        SORTING: 1,
        GROUPING: 1,
        SCOPE: 1,
        DISPLAY_TEXT: 'displaytext',
        FILTER_TEXT: 'filtertext',
        INSERT_TEXT: 'inserttext',
        OVERWRITE_TEXT: 'overwritetext',
        BOLD: false,
        COLOR: '',
        QUICKINFO_EVENT: '',
        INSERT_EVENT: '',
        OVERWRITE_EVENT: '',
        ADDITIONAL_INFO: '',
        CONTEXT_EVENT: '',
        CONTEXT_EVENT_DATA: '',
        CONTEXT_EVENT_TYPE: '',
        CONTEXT_EVENT_HANDLER: '',
        CONTEXT_EVENT_POSITION: '',
        CONTEXT_EVENT_SOURCE: '',
        CONTEXT_EVENT_SOURCETYPE: '',
        CONTEXT_EVENT_SOURCEID: '',
        CONTEXT_EVENT_SOURCEURI: ''
      }] as unknown as CompletionProposal[];
      mockAdtClient.codeCompletion.mockResolvedValue(mockResult);

      const result = await handlers.handle('codeCompletion', validArgs);

      expect(mockAdtClient.codeCompletion).toHaveBeenCalledWith(
        validArgs.sourceUrl,
        validArgs.source,
        validArgs.line,
        validArgs.column
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

    it('should validate required parameters', async () => {
      await expect(handlers.handle('codeCompletion', {}))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('Completion failed');
      mockAdtClient.codeCompletion.mockRejectedValue(error);

      await expect(handlers.handle('codeCompletion', validArgs))
        .rejects
        .toThrow('Code completion failed: Completion failed');
    });
  });

  describe('findDefinition', () => {
    const validArgs = {
      url: '/source/url',
      source: 'DATA: lv_var.',
      line: 1,
      startCol: 6,
      endCol: 12
    };

    it('should find symbol definition successfully', async () => {
      const mockResult = {
        objectIdentifier: 'TEST_CLASS',
        objectType: 'CLAS',
        uri: '/some/uri',
        parentUri: '/parent/uri',
        isResult: true,
        start: { line: 1, column: 1 },
        end: { line: 1, column: 10 },
        canHaveChildren: false,
        'adtcore:name': 'TEST_CLASS',
        'adtcore:type': 'CLAS',
        'adtcore:uri': '/some/uri',
        'adtcore:packageName': 'TEST_PACKAGE'
      } as unknown as DefinitionLocation;
      mockAdtClient.findDefinition.mockResolvedValue(mockResult);

      const result = await handlers.handle('findDefinition', validArgs);

      expect(mockAdtClient.findDefinition).toHaveBeenCalledWith(
        validArgs.url,
        validArgs.source,
        validArgs.line,
        validArgs.startCol,
        validArgs.endCol,
        undefined,
        undefined
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

    it('should handle optional parameters', async () => {
      const argsWithOptional = {
        ...validArgs,
        implementation: true,
        mainProgram: 'ZTEST'
      };
      const mockResult = {
        objectIdentifier: 'TEST_CLASS',
        objectType: 'CLAS',
        uri: '/some/uri',
        parentUri: '/parent/uri',
        isResult: true,
        start: { line: 1, column: 1 },
        end: { line: 1, column: 10 },
        canHaveChildren: false,
        'adtcore:name': 'TEST_CLASS',
        'adtcore:type': 'CLAS',
        'adtcore:uri': '/some/uri',
        'adtcore:packageName': 'TEST_PACKAGE'
      } as unknown as DefinitionLocation;
      mockAdtClient.findDefinition.mockResolvedValue(mockResult);

      await handlers.handle('findDefinition', argsWithOptional);

      expect(mockAdtClient.findDefinition).toHaveBeenCalledWith(
        argsWithOptional.url,
        argsWithOptional.source,
        argsWithOptional.line,
        argsWithOptional.startCol,
        argsWithOptional.endCol,
        argsWithOptional.implementation,
        argsWithOptional.mainProgram
      );
    });

    it('should validate required parameters', async () => {
      await expect(handlers.handle('findDefinition', {}))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('Definition not found');
      mockAdtClient.findDefinition.mockRejectedValue(error);

      await expect(handlers.handle('findDefinition', validArgs))
        .rejects
        .toThrow('Find definition failed: Definition not found');
    });
  });

  describe('usageReferences', () => {
    const validArgs = {
      url: '/source/url',
      line: 1,
      column: 5
    };

    it('should find usage references successfully', async () => {
      const mockResult = [{
        uri: '/some/uri',
        objectIdentifier: 'TEST_CLASS',
        parentUri: '/parent/uri',
        isResult: true,
        start: { line: 1, column: 1 },
        end: { line: 1, column: 10 },
        snippet: {
          text: 'test snippet',
          start: { line: 1, column: 1 },
          end: { line: 1, column: 10 }
        },
        type: 'method',
        category: 'reference',
        canHaveChildren: false,
        usageInformation: '',
        'adtcore:responsible': '',
        'adtcore:name': 'TEST_CLASS',
        packageRef: null
      }] as unknown as UsageReference[];
      mockAdtClient.usageReferences.mockResolvedValue(mockResult);

      const result = await handlers.handle('usageReferences', validArgs);

      expect(mockAdtClient.usageReferences).toHaveBeenCalledWith(
        validArgs.url,
        validArgs.line,
        validArgs.column
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

    it('should handle minimal required parameters', async () => {
      const minimalArgs = {
        url: '/source/url'
      };
      mockAdtClient.usageReferences.mockResolvedValue([]);

      await handlers.handle('usageReferences', minimalArgs);

      expect(mockAdtClient.usageReferences).toHaveBeenCalledWith(
        minimalArgs.url,
        undefined,
        undefined
      );
    });

    it('should validate required parameters', async () => {
      await expect(handlers.handle('usageReferences', {}))
        .rejects
        .toThrow(/Missing required property/);
    });

    it('should handle API errors', async () => {
      const error = new Error('References lookup failed');
      mockAdtClient.usageReferences.mockRejectedValue(error);

      await expect(handlers.handle('usageReferences', validArgs))
        .rejects
        .toThrow('Usage references failed: References lookup failed');
    });
  });
});
