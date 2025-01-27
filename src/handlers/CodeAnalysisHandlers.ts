import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { ADTClient } from 'abap-adt-api';

export class CodeAnalysisHandlers extends BaseHandler {
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'syntaxCheck',
        description: 'Perform ABAP syntax check',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string' }
          },
          required: ['code']
        }
      },
      {
        name: 'codeCompletion',
        description: 'Get code completion suggestions',
        inputSchema: {
          type: 'object',
          properties: {
            sourceUrl: { type: 'string' },
            source: { type: 'string' },
            line: { type: 'number' },
            column: { type: 'number' }
          },
          required: ['sourceUrl', 'source', 'line', 'column']
        }
      },
      {
        name: 'findDefinition',
        description: 'Find symbol definition',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            source: { type: 'string' },
            line: { type: 'number' },
            startCol: { type: 'number' },
            endCol: { type: 'number' },
            implementation: { type: 'boolean', optional: true },
            mainProgram: { type: 'string', optional: true }
          },
          required: ['url', 'source', 'line', 'startCol', 'endCol']
        }
      },
      {
        name: 'usageReferences',
        description: 'Find symbol references',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            line: { type: 'number', optional: true },
            column: { type: 'number', optional: true }
          },
          required: ['url']
        }
      }
    ];
  }

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'syntaxCheck':
        return this.handleSyntaxCheck(args);
      case 'codeCompletion':
        return this.handleCodeCompletion(args);
      case 'findDefinition':
        return this.handleFindDefinition(args);
      case 'usageReferences':
        return this.handleUsageReferences(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown code analysis tool: ${toolName}`);
    }
  }

  async handleSyntaxCheck(args: any): Promise<any> {
    try {
      // Call syntaxCheck with the correct number of arguments
      const result = await this.adtclient.syntaxCheck(args.code);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: error.message })
          }
        ],
        isError: true
      };
    }
  }

  async handleCodeCompletion(args: any): Promise<any> {
    try {
      // Call codeCompletion with the correct number of arguments
      const result = await this.adtclient.codeCompletion(args.sourceUrl, args.source, args.line, args.column);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: error.message })
          }
        ],
        isError: true
      };
    }
  }

  async handleFindDefinition(args: any): Promise<any> {
    try {
      // Call findDefinition with the correct number of arguments
      const result = await this.adtclient.findDefinition(args.url, args.source, args.line, args.startCol, args.endCol, args.implementation, args.mainProgram);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: error.message })
          }
        ],
        isError: true
      };
    }
  }

  async handleUsageReferences(args: any): Promise<any> {
    try {
      // Call usageReferences with the correct number of arguments
      const result = await this.adtclient.usageReferences(args.url, args.line, args.column);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: error.message })
          }
        ],
        isError: true
      };
    }
  }
}
