import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler';
import type { ToolDefinition } from '../types/tools';

export class TransportHandlers extends BaseHandler {
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'transportInfo',
        description: 'Get transport information for an object source',
        inputSchema: {
          type: 'object',
          properties: {
            objSourceUrl: { 
              type: 'string',
              description: 'URL of the object source'
            },
            devClass: {
              type: 'string',
              description: 'Development class',
              optional: true
            },
            operation: {
              type: 'string',
              description: 'Transport operation',
              optional: true
            }
          },
          required: ['objSourceUrl']
        }
      },
      {
        name: 'createTransport',
        description: 'Create a new transport request',
        inputSchema: {
          type: 'object',
          properties: {
            objSourceUrl: {
              type: 'string',
              description: 'URL of the object source'
            },
            REQUEST_TEXT: {
              type: 'string',
              description: 'Description of the transport request'
            },
            DEVCLASS: {
              type: 'string',
              description: 'Development class'
            },
            transportLayer: {
              type: 'string',
              description: 'Transport layer',
              optional: true
            }
          },
          required: ['objSourceUrl', 'REQUEST_TEXT', 'DEVCLASS']
        }
      },
      {
        name: 'hasTransportConfig',
        description: 'Check if transport configuration exists',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'transportInfo':
        return this.handleTransportInfo(args);
      case 'createTransport':
        return this.handleCreateTransport(args);
      case 'hasTransportConfig':
        return this.handleHasTransportConfig(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown transport tool: ${toolName}`);
    }
  }

  async handleTransportInfo(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        objSourceUrl: { type: 'string' },
        devClass: { type: 'string', optional: true },
        operation: { type: 'string', optional: true }
      },
      required: ['objSourceUrl']
    });
    
    const startTime = performance.now();
    try {
      const transportInfo = await this.adtclient.transportInfo(
        args.objSourceUrl,
        args.devClass,
        args.operation
      );
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              transportInfo
            })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get transport info: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleCreateTransport(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        objSourceUrl: { type: 'string' },
        REQUEST_TEXT: { type: 'string' },
        DEVCLASS: { type: 'string' },
        transportLayer: { type: 'string', optional: true }
      },
      required: ['objSourceUrl', 'REQUEST_TEXT', 'DEVCLASS']
    });
    
    const startTime = performance.now();
    try {
      const transportResult = await this.adtclient.createTransport(
        args.objSourceUrl,
        args.REQUEST_TEXT,
        args.DEVCLASS,
        args.transportLayer
      );
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              transportNumber: transportResult,
              message: 'Transport created successfully'
            })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to create transport: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleHasTransportConfig(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {}
    });
    
    const startTime = performance.now();
    try {
      const hasConfig = await this.adtclient.hasTransportConfig();
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              hasConfig
            })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to check transport config: ${error.message || 'Unknown error'}`
      );
    }
  }
}
