import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { PrettyPrinterStyle } from 'abap-adt-api';

export class PrettyPrinterHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'prettyPrinterSetting',
                description: 'Retrieves the pretty printer settings.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'setPrettyPrinterSetting',
                description: 'Sets the pretty printer settings.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        indent: {
                            type: 'boolean',
                            description: 'Whether to indent the code.'
                        },
                        style: {
                            type: 'string',
                            description: 'The pretty printer style.'
                        }
                    },
                    required: ['indent', 'style']
                }
            },
            {
                name: 'prettyPrinter',
                description: 'Formats ABAP code using the pretty printer.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        source: {
                            type: 'string',
                            description: 'The ABAP source code to format.'
                        }
                    },
                    required: ['source']
                }
            },
            {
                name: 'typeHierarchy',
                description: 'Retrieves the type hierarchy for a given object.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'The URL of the object.'
                        },
                        body: {
                            type: 'string',
                            description: 'The request body.'
                        },
                        line: {
                            type: 'number',
                            description: 'The line number.'
                        },
                        offset: {
                            type: 'number',
                            description: 'The offset.'
                        },
                        superTypes: {
                            type: 'boolean',
                            description: 'Whether to include supertypes.',
                            optional: true
                        }
                    },
                    required: ['url', 'body', 'line', 'offset']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'prettyPrinterSetting':
                return this.adtclient.prettyPrinterSetting();
            case 'setPrettyPrinterSetting':
                const setPrettyPrinterSettingArgs: { indent: boolean, style: PrettyPrinterStyle } = arguments_;
                return this.adtclient.setPrettyPrinterSetting(setPrettyPrinterSettingArgs.indent, setPrettyPrinterSettingArgs.style);
            case 'prettyPrinter':
                const prettyPrinterArgs: { source: string } = arguments_;
                return this.adtclient.prettyPrinter(prettyPrinterArgs.source);
            case 'typeHierarchy':
                const typeHierarchyArgs: { url: string, body: string, line: number, offset: number, superTypes?: boolean } = arguments_;
                return this.adtclient.typeHierarchy(typeHierarchyArgs.url, typeHierarchyArgs.body, typeHierarchyArgs.line, typeHierarchyArgs.offset, typeHierarchyArgs.superTypes);
            default:
                throw new Error(`Tool ${toolName} not implemented in PrettyPrinterHandlers`);
        }
    }
}
