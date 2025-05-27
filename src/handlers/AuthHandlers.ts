import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler';
import type { ToolDefinition } from '../types/tools';
import { ADTClient } from "abap-adt-api";

export class AuthHandlers extends BaseHandler {
  private isBtpConnectionGetter: () => boolean;

  constructor(adtclient: ADTClient, isBtpConnectionGetter: () => boolean) {
    super(adtclient);
    this.isBtpConnectionGetter = isBtpConnectionGetter;
  }

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
    if (this.isBtpConnectionGetter()) {
      const startTime = performance.now();
      try {
        await this.adtclient.getObjectSource('/sap/bc/adt/repository/nodestructure/DEV/CLAS/SOME_NON_EXISTENT_OBJECT');
        this.trackRequest(startTime, true);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'BTP OAuth connection active and healthy' })
            }
          ]
        };
      } catch (error: any) {
        this.trackRequest(startTime, false);
        if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            throw new McpError(
                ErrorCode.InternalError,
                `BTP OAuth token validation failed: ${error.message || 'Unknown error'}`
            );
        }
        // Expected error for non-existent object indicates auth is working
        return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ status: 'BTP OAuth connection active (health check indicates auth OK)' })
              }
            ]
          };
      }
    }

    const startTime = performance.now();
    try {
      const loginResult = await this.adtclient.login();
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(loginResult)
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Login failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  private async handleLogout(args: any) {
    const startTime = performance.now();
    try {
      await this.adtclient.logout();
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'Logged out successfully' })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Logout failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  private async handleDropSession(args: any) {
    const startTime = performance.now();
    try {
      await this.adtclient.dropSession();
      this.trackRequest(startTime, true);
      return {
        content: [
          {
            type: 'text', 
            text: JSON.stringify({ status: 'Session cleared' })
          }
        ]
      };
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Drop session failed: ${error.message || 'Unknown error'}`
      );
    }
  }
}
