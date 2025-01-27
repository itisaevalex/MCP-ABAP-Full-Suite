import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler';
import type { ToolDefinition } from '../types/tools';

export class ObjectLockHandlers extends BaseHandler {
  getTools(): ToolDefinition[] {
    return [{
      name: 'lock_object',
      description: 'Locks an ABAP object for editing',
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
      case 'lockObject':
        return this.handleLockObject(args);
      case 'unlockObject':
        return this.handleUnlockObject(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown object lock tool: ${toolName}`);
    }
  }

  async handleLockObject(args: any): Promise<any> {
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

  async handleUnlockObject(args: any): Promise<any> {
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
