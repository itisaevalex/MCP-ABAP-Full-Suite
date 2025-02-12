import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { AbapObjectStructure, classIncludes } from 'abap-adt-api';

export class RevisionHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'revisions',
                description: 'Retrieves revisions for an object.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objectUrl: {
                            type: 'string',
                            description: 'The URL of the object.'
                        },
                        clsInclude: {
                            type: 'string',
                            description: 'The class include.',
                            optional: true
                        }
                    },
                    required: ['objectUrl']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'revisions':
                const revisionsArgs: { objectUrl: string | AbapObjectStructure, clsInclude?: classIncludes } = arguments_;
                return this.adtclient.revisions(revisionsArgs.objectUrl, revisionsArgs.clsInclude);
            default:
                throw new Error(`Tool ${toolName} not implemented in RevisionHandlers`);
        }
    }
}
