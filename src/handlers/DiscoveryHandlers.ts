import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';

export class DiscoveryHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'featureDetails',
                description: 'Retrieves details for a given feature.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'The title of the feature.'
                        }
                    },
                    required: ['title']
                }
            },
            {
                name: 'collectionFeatureDetails',
                description: 'Retrieves details for a given collection feature.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'The URL of the collection feature.'
                        }
                    },
                    required: ['url']
                }
            },
            {
                name: 'findCollectionByUrl',
                description: 'Finds a collection by its URL.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'The URL of the collection.'
                        }
                    },
                    required: ['url']
                }
            },
            {
                name: 'loadTypes',
                description: 'Loads object types.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'adtDiscovery',
                description: 'Performs ADT discovery.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'adtCoreDiscovery',
                description: 'Performs ADT core discovery.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'adtCompatibiliyGraph',
                description: 'Retrieves the ADT compatibility graph.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'featureDetails':
                return this.adtclient.featureDetails(arguments_.title);
            case 'collectionFeatureDetails':
                return this.adtclient.collectionFeatureDetails(arguments_.url);
            case 'findCollectionByUrl':
                return this.adtclient.findCollectionByUrl(arguments_.url);
            case 'loadTypes':
                return this.adtclient.loadTypes();
            case 'adtDiscovery':
                return this.adtclient.adtDiscovery();
            case 'adtCoreDiscovery':
                return this.adtclient.adtCoreDiscovery();
            case 'adtCompatibiliyGraph':
                return this.adtclient.adtCompatibiliyGraph();
            default:
                throw new Error(`Tool ${toolName} not implemented in DiscoveryHandlers`);
        }
    }
}
