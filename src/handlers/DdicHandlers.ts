import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { PackageValueHelpType } from 'abap-adt-api';

export class DdicHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'annotationDefinitions',
                description: 'Retrieves annotation definitions.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'ddicElement',
                description: 'Retrieves information about a DDIC element.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'The path to the DDIC element.'
                        },
                        getTargetForAssociation: {
                            type: 'boolean',
                            description: 'Whether to get the target for association.',
                            optional: true
                        },
                        getExtensionViews: {
                            type: 'boolean',
                            description: 'Whether to get extension views.',
                            optional: true
                        },
                        getSecondaryObjects: {
                            type: 'boolean',
                            description: 'Whether to get secondary objects.',
                            optional: true
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'ddicRepositoryAccess',
                description: 'Accesses the DDIC repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        path: {
                            type: 'string',
                            description: 'The path to the DDIC element.'
                        }
                    },
                    required: ['path']
                }
            },
            {
                name: 'packageSearchHelp',
                description: 'Performs a package search help.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            description: 'The package value help type.'
                        },
                        name: {
                            type: 'string',
                            description: 'The package name.',
                            optional: true
                        }
                    },
                    required: ['type']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'annotationDefinitions':
                return this.adtclient.annotationDefinitions();
            case 'ddicElement':
                const ddicElementArgs: { path: string | string[], getTargetForAssociation?: boolean, getExtensionViews?: boolean, getSecondaryObjects?: boolean } = arguments_;
                return this.adtclient.ddicElement(ddicElementArgs.path, ddicElementArgs.getTargetForAssociation, ddicElementArgs.getExtensionViews, ddicElementArgs.getSecondaryObjects);
            case 'ddicRepositoryAccess':
                const ddicRepositoryAccessArgs: { path: string | string[] } = arguments_;
                return this.adtclient.ddicRepositoryAccess(ddicRepositoryAccessArgs.path);
            case 'packageSearchHelp':
                const packageSearchHelpArgs: { type: PackageValueHelpType, name?: string } = arguments_;
                return this.adtclient.packageSearchHelp(packageSearchHelpArgs.type, packageSearchHelpArgs.name);
            default:
                throw new Error(`Tool ${toolName} not implemented in DdicHandlers`);
        }
    }
}
