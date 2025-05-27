import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { BaseHandler } from './BaseHandler';
import type { ToolDefinition } from '../types/tools';
import {
    ADTClient, 
    InactiveObject as AdtInactiveObject, 
    ActivationResult as AdtActivationResult,
    InactiveObjectRecord as AdtInactiveObjectRecord
} from 'abap-adt-api';

interface InactiveObject {
  "adtcore:uri": string;
  "adtcore:type": string;
  "adtcore:name": string;
  "adtcore:parentUri": string;
}

interface ActivationResultMessage {
  objDescr: string;
  type: string;
  line: number;
  href: string;
  forceSupported: boolean;
  shortText: string;
}

interface ActivationResult {
  success: boolean;
  messages: ActivationResultMessage[];
  inactive: AdtInactiveObjectRecord[];
}

interface InactiveObjectElement extends InactiveObject {
  user: string;
  deleted: boolean;
}

interface InactiveObjectRecord {
  object?: InactiveObjectElement;
  transport?: InactiveObjectElement;
}

export class ObjectManagementHandlers extends BaseHandler {
  getTools(): ToolDefinition[] {
    return [
      {
        name: 'activateObjects',
        description: 'Activate ABAP objects using object references',
        inputSchema: {
          type: 'object',
          properties: {
            objects: { 
              type: 'string',
              description: 'JSON array of objects to activate. Each object must have adtcore:uri, adtcore:type, adtcore:name, and adtcore:parentUri properties'
            },
            preauditRequested: {
              type: 'boolean',
              description: 'Whether to perform pre-audit checks',
              optional: true
            }
          },
          required: ['objects']
        }
      },
      {
        name: 'activateByName',
        description: 'Activate an ABAP object using name and URL',
        inputSchema: {
          type: 'object',
          properties: {
            objectName: {
              type: 'string',
              description: 'Name of the object'
            },
            objectUrl: {
              type: 'string',
              description: 'URL of the object'
            },
            mainInclude: {
              type: 'string',
              description: 'Main include context',
              optional: true
            },
            preauditRequested: {
              type: 'boolean',
              description: 'Whether to perform pre-audit checks',
              optional: true
            }
          },
          required: ['objectName', 'objectUrl']
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
      case 'activateObjects':
        return this.handleActivateObjects(args);
      case 'activateByName':
        return this.handleActivateByName(args);
      case 'inactiveObjects':
        return this.handleInactiveObjects(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown object management tool: ${toolName}`);
    }
  }

  async handleActivateObjects(args: { objects: AdtInactiveObject[], preauditRequested?: boolean }): Promise<AdtActivationResult> {
    const startTime = performance.now();
    try {
      const result = await this.adtclient.activate(args.objects, args.preauditRequested);
      this.trackRequest(startTime, true);
      return result;
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to activate objects: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleActivateByName(args: { objectName: string, objectUrl: string, mainInclude?: string, preauditRequested?: boolean }): Promise<AdtActivationResult> {
    const startTime = performance.now();
    try {
      const result = await this.adtclient.activate(args.objectName, args.objectUrl, args.mainInclude, args.preauditRequested);
      this.trackRequest(startTime, true);
      return result;
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to activate object: ${error.message || 'Unknown error'}`
      );
    }
  }

  async handleInactiveObjects(args: any): Promise<AdtInactiveObjectRecord[]> {
    const startTime = performance.now();
    try {
      const result = await this.adtclient.inactiveObjects();
      this.trackRequest(startTime, true);
      return result;
    } catch (error: any) {
      this.trackRequest(startTime, false);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list inactive objects: ${error.message || 'Unknown error'}`
      );
    }
  }
}
