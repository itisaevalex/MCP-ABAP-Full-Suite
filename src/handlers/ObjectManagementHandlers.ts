import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler';
import type { ToolDefinition } from '../types/tools';

export class ObjectManagementHandlers extends BaseHandler {
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'activate',
        description: 'Activate ABAP objects',
        inputSchema: {
          type: 'object',
          properties: {
            object: { 
              type: "object",
              description: 'Single object or array of objects to activate'
            },
            preauditRequested: { 
              type: 'boolean',
              description: 'Whether to perform pre-audit checks',
              optional: true
            }
          },
          required: ['object']
        }
      },
      {
        name: 'inactiveObjects',
        description: 'Get list of inactive objects',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }
  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'activate':
        return this.handleActivate(args);
      case 'inactiveObjects':
        return this.handleInactiveObjects(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown object management tool: ${toolName}`);
    }
  }

  async handleActivate(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        object: { 
          type: "object"
        },
        preauditRequested: { type: 'boolean' }
      },
      required: ['object']
    });
    
    const startTime = performance.now();
    try {
      const result = await this.adtclient.activate(args.object, args.preauditRequested);
      this.trackRequest(startTime, true);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            result
          })
        }]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to activate object: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleInactiveObjects(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {},
      required: []
    });
    
    const startTime = performance.now();
    try {
      const result = await this.adtclient.inactiveObjects();
      this.trackRequest(startTime, true);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            result
          })
        }]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get inactive objects: ${error.message || 'Unknown error'}`
      );
    }
  }
}
