import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { NodeParents, NodeStructure } from "abap-adt-api";

export class NodeHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'nodeContents',
                description: 'Retrieves the contents of a node in the ABAP repository tree.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        parent_type: {
                            type: 'string',
                            description: 'The type of the parent node.'
                        },
                        parent_name: {
                            type: 'string',
                            description: 'The name of the parent node.',
                            optional: true
                        },
                        user_name: {
                            type: 'string',
                            description: 'The user name.',
                            optional: true
                        },
                        parent_tech_name: {
                            type: 'string',
                            description: 'The technical name of the parent node.',
                            optional: true
                        },
                        rebuild_tree: {
                            type: 'boolean',
                            description: 'Whether to rebuild the tree.',
                            optional: true
                        },
                        parentnodes: {
                            type: 'array',
                            description: 'An array of parent node IDs.',
                            optional: true
                        },
                    },
                    required: ['parent_type']
                }
            },
            {
                name: 'mainPrograms',
                description: 'Retrieves the main programs for a given include.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        includeUrl: {
                            type: 'string',
                            description: 'The URL of the include.'
                        }
                    },
                    required: ['includeUrl']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'nodeContents':
                const nodeContentsArgs: { parent_type: NodeParents, parent_name?: string, user_name?: string, parent_tech_name?: string, rebuild_tree?: boolean, parentnodes?: number[] } = arguments_;
                return this.adtclient.nodeContents(nodeContentsArgs.parent_type, nodeContentsArgs.parent_name, nodeContentsArgs.user_name, nodeContentsArgs.parent_tech_name, nodeContentsArgs.rebuild_tree, nodeContentsArgs.parentnodes);
            case 'mainPrograms':
                const mainProgramsArgs: { includeUrl: string } = arguments_;
                return this.adtclient.mainPrograms(mainProgramsArgs.includeUrl);
            default:
                throw new Error(`Tool ${toolName} not implemented in NodeHandlers`);
        }
    }
}
