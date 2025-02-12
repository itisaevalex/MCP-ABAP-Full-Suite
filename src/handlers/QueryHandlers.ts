import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';

export class QueryHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'tableContents',
                description: 'Retrieves the contents of an ABAP table.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        ddicEntityName: {
                            type: 'string',
                            description: 'The name of the DDIC entity (table or view).'
                        },
                        rowNumber: {
                            type: 'number',
                            description: 'The maximum number of rows to retrieve.',
                            optional: true
                        },
                        decode: {
                            type: 'boolean',
                            description: 'Whether to decode the data.',
                            optional: true
                        },
                        sqlQuery: {
                            type: 'string',
                            description: 'An optional SQL query to filter the data.',
                            optional: true
                        }
                    },
                    required: ['ddicEntityName']
                }
            },
            {
                name: 'runQuery',
                description: 'Runs a SQL query on the target system.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sqlQuery: {
                            type: 'string',
                            description: 'The SQL query to execute.'
                        },
                        rowNumber: {
                            type: 'number',
                            description: 'The maximum number of rows to retrieve.',
                            optional: true
                        },
                        decode: {
                            type: 'boolean',
                            description: 'Whether to decode the data.',
                            optional: true
                        }
                    },
                    required: ['sqlQuery']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'tableContents':
                const tableContentsArgs: { ddicEntityName: string, rowNumber?: number, decode?: boolean, sqlQuery?: string } = arguments_;
                return this.adtclient.tableContents(tableContentsArgs.ddicEntityName, tableContentsArgs.rowNumber, tableContentsArgs.decode, tableContentsArgs.sqlQuery);
            case 'runQuery':
                const runQueryArgs: { sqlQuery: string, rowNumber?: number, decode?: boolean } = arguments_;
                return this.adtclient.runQuery(runQueryArgs.sqlQuery, runQueryArgs.rowNumber, runQueryArgs.decode);
            default:
                throw new Error(`Tool ${toolName} not implemented in QueryHandlers`);
        }
    }
}
