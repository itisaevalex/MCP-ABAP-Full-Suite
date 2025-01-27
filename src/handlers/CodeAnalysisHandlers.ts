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
    this.validateArgs(args, {
      type: 'object',
      properties: {
        code: { type: 'string' }
      },
      required: ['code']
    });

    const startTime = performance.now();
    try {
      const result = await this.adtclient.syntaxCheck(args.code);
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              result
            })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Syntax check failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleCodeCompletion(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        sourceUrl: { type: 'string' },
        source: { type: 'string' },
        line: { type: 'number' },
        column: { type: 'number' }
      },
      required: ['sourceUrl', 'source', 'line', 'column']
    });

    const startTime = performance.now();
    try {
      const result = await this.adtclient.codeCompletion(
        args.sourceUrl,
        args.source,
        args.line,
        args.column
      );
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              result
            })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Code completion failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleFindDefinition(args: any): Promise<any> {
    this.validateArgs(args, {
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
    });

    const startTime = performance.now();
    try {
      const result = await this.adtclient.findDefinition(
        args.url,
        args.source,
        args.line,
        args.startCol,
        args.endCol,
        args.implementation,
        args.mainProgram
      );
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              result
            })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Find definition failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleUsageReferences(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        url: { type: 'string' },
        line: { type: 'number', optional: true },
        column: { type: 'number', optional: true }
      },
      required: ['url']
    });

    const startTime = performance.now();
    try {
      const result = await this.adtclient.usageReferences(
        args.url,
        args.line,
        args.column
      );
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              result
            })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Usage references failed: ${error.message || 'Unknown error'}`
      );
    }
  }
}
