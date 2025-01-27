import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler';
import type { ToolDefinition } from '../types/tools';

export class ObjectManagementHandlers extends BaseHandler {
  getTools(): ToolDefinition[] {
    return [{
      name: 'manage_object',
      description: 'Manages ABAP object lifecycle operations',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: { type: 'string' },
          objectType: { type: 'string' }
        },
        required: ['objectName', 'objectType']
      }
    }];
  }
  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'createObject':
        return this.handleCreateObject(args);
      case 'deleteObject':
        return this.handleDeleteObject(args);
      case 'activate':
        return this.handleActivate(args);
      case 'inactiveObjects':
        return this.handleInactiveObjects(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown object management tool: ${toolName}`);
    }
  }

  async handleCreateObject(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        objtype: { type: 'string' },
        name: { type: 'string' },
        parentName: { type: 'string' },
        description: { type: 'string' },
        parentPath: { type: 'string' },
        responsible: { type: 'string' },
        transport: { type: 'string' }
      },
      required: ['objtype', 'name', 'parentName', 'description', 'parentPath']
    });
    
    const startTime = performance.now();
    try {
      const result = await this.adtclient.createObject(
        args.objtype,
        args.name,
        args.parentName,
        args.description,
        args.parentPath,
        args.responsible,
        args.transport
      );
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
        `Failed to create object: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleDeleteObject(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        objectUrl: { type: 'string' },
        lockHandle: { type: 'string' },
        transport: { type: 'string' }
      },
      required: ['objectUrl', 'lockHandle']
    });
    
    const startTime = performance.now();
    try {
      await this.adtclient.deleteObject(
        args.objectUrl,
        args.lockHandle,
        args.transport
      );
      this.trackRequest(startTime, true);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            deleted: true
          })
        }]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to delete object: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleActivate(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        object: { type: ['object', 'array'] },
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
