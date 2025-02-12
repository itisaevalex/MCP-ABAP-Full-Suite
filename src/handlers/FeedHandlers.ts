import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';

export class FeedHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'feeds',
                description: 'Retrieves a list of feeds.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'dumps',
                description: 'Retrieves a list of dumps.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'An optional query string to filter the dumps.',
                            optional: true
                        }
                    }
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'feeds':
                return this.adtclient.feeds();
            case 'dumps':
                const dumpsArgs: { query?: string } = arguments_;
                return this.adtclient.dumps(dumpsArgs.query);
            default:
                throw new Error(`Tool ${toolName} not implemented in FeedHandlers`);
        }
    }
}
