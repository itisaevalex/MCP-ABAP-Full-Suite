import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler';
import type { ToolDefinition } from '../types/tools.js';

export class ObjectHandlers extends BaseHandler {
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'objectStructure',
        description: 'Get object structure details',
        inputSchema: {
          type: 'object',
          properties: {
            objectUrl: { 
              type: 'string',
              description: 'URL of the object'
            },
            version: {
              type: 'string',
              description: 'Version of the object',
              optional: true
            }
          },
          required: ['objectUrl']
        }
      },
      {
        name: 'searchObject',
        description: 'Search for objects',
        inputSchema: {
          type: 'object',
          properties: {
            query: { 
              type: 'string',
              description: 'Search query string'
            },
            objType: { 
              type: 'string',
              description: 'Object type filter',
              optional: true
            },
            max: { 
              type: 'number',
              description: 'Maximum number of results',
              optional: true
            }
          },
          required: ['query']
        }
      },
      {
        name: 'findObjectPath',
        description: 'Find path for an object',
        inputSchema: {
          type: 'object',
          properties: {
            objectUrl: { 
              type: 'string',
              description: 'URL of the object to find path for'
            }
          },
          required: ['objectUrl']
        }
      }
    ];
  }
  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'objectStructure':
        return this.handleObjectStructure(args);
      case 'findObjectPath':
        return this.handleFindObjectPath(args);
      case 'searchObject':
        return this.handleSearchObject(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown object tool: ${toolName}`);
    }
  }

  async handleObjectStructure(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        objectUrl: { type: 'string' },
        version: { type: 'string', optional: true }
      },
      required: ['objectUrl']
    });
    
    const startTime = performance.now();
    try {
      const structure = await this.adtclient.objectStructure(args.objectUrl);
      this.trackRequest(startTime, true);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            structure
          })
        }]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get object structure: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleFindObjectPath(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        objectUrl: { type: 'string' }
      },
      required: ['objectUrl']
    });
    
    const startTime = performance.now();
    try {
      const path = await this.adtclient.findObjectPath(args.objectUrl);
      this.trackRequest(startTime, true);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            path
          })
        }]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to find object path: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleSearchObject(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        query: { type: 'string' },
        objType: { type: 'string', optional: true },
        max: { type: 'number', optional: true }
      },
      required: ['query']
    });
    
    const startTime = performance.now();
    try {
      const results = await this.adtclient.searchObject(
        args.query,
        args.objType,
        args.max
      );
      this.trackRequest(startTime, true);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            results
          })
        }]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search objects: ${error.message || 'Unknown error'}`
      );
    }
  }
}
