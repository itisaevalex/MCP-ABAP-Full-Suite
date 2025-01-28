import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler';
import type { ToolDefinition } from '../types/tools';

export class ObjectLockHandlers extends BaseHandler {
  getTools(): ToolDefinition[] {
    return [{
      name: 'lock',
      description: 'Lock an object',
      inputSchema: {
        type: 'object',
        properties: {
          objectUrl: { type: 'string' },
          accessMode: { type: 'string', optional: true }
        },
        required: ['objectUrl']
      }
    }, {
      name: 'unLock',
      description: 'Unlock an object',
      inputSchema: {
        type: 'object',
        properties: {
          objectUrl: { type: 'string' },
          lockHandle: { type: 'string' }
        },
        required: ['objectUrl', 'lockHandle']
      }
    }];
  }
  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'lock':
        return this.lock(args);
      case 'unLock':
        return this.unlock(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown object lock tool: ${toolName}`);
    }
  }

  async lock(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        objectUrl: { type: 'string' },
        accessMode: { type: 'string' }
      },
      required: ['objectUrl']
    });
    
    const startTime = performance.now();
    try {
      const lockResult = await this.adtclient.lock(args.objectUrl, args.accessMode);
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              locked: true,
              lockHandle: lockResult.LOCK_HANDLE
            })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to lock object: ${error.message || 'Unknown error'}`
      );
    }
  }

  async unlock(args: any): Promise<any> {
    this.validateArgs(args, {
      type: 'object',
      properties: {
        objectUrl: { type: 'string' },
        lockHandle: { type: 'string' }
      },
      required: ['objectUrl', 'lockHandle']
    });
    
    const startTime = performance.now();
    try {
      await this.adtclient.unLock(args.objectUrl, args.lockHandle);
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              unlocked: true
            })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to unlock object: ${error.message || 'Unknown error'}`
      );
    }
  }
}
