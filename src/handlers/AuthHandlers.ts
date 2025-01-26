import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';

export class AuthHandlers extends BaseHandler {
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'login',
        description: 'Authenticate with ABAP system',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'logout',
        description: 'Terminate ABAP session',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'dropSession',
        description: 'Clear local session cache',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async handle(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case 'login':
        return this.handleLogin(args);
      case 'logout':
        return this.handleLogout(args);
      case 'dropSession':
        return this.handleDropSession(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown auth tool: ${toolName}`);
    }
  }

  private async handleLogin(args: any) {
    const loginResult = await this.adtclient.login();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(loginResult)
        }
      ]
    };
  }

  private async handleLogout(args: any) {
    this.adtclient.logout();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ status: 'Logged out successfully' })
        }
      ]
    };
  }

  private async handleDropSession(args: any) {
    this.adtclient.dropSession();
    return {
      content: [
        {
          type: 'text', 
          text: JSON.stringify({ status: 'Session cleared' })
        }
      ]
    };
  }
}
