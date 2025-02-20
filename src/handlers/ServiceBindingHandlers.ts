import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { ServiceBinding } from 'abap-adt-api';

export class ServiceBindingHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'publishServiceBinding',
                description: 'Publishes a service binding.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'The name of the service binding.'
                        },
                        version: {
                            type: 'string',
                            description: 'The version of the service binding.'
                        }
                    },
                    required: ['name', 'version']
                }
            },
            {
                name: 'unPublishServiceBinding',
                description: 'Unpublishes a service binding.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'The name of the service binding.'
                        },
                        version: {
                            type: 'string',
                            description: 'The version of the service binding.'
                        }
                    },
                    required: ['name', 'version']
                }
            },
            {
                name: 'bindingDetails',
                description: 'Retrieves details of a service binding.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        binding: {
                            type: 'string',
                            description: 'The service binding.'
                        },
                        index: {
                            type: 'number',
                            description: 'The index of the service binding.',
                            optional: true
                        }
                    },
                    required: ['binding']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'publishServiceBinding':
                const publishServiceBindingArgs: { name: string, version: string } = arguments_;
                return this.adtclient.publishServiceBinding(publishServiceBindingArgs.name, publishServiceBindingArgs.version);
            case 'unPublishServiceBinding':
                const unPublishServiceBindingArgs: { name: string, version: string } = arguments_;
                return this.adtclient.unPublishServiceBinding(unPublishServiceBindingArgs.name, unPublishServiceBindingArgs.version);
            case 'bindingDetails':
                const bindingDetailsArgs: { binding: ServiceBinding, index?: number } = arguments_;
                return this.adtclient.bindingDetails(bindingDetailsArgs.binding, bindingDetailsArgs.index);
            default:
                throw new Error(`Tool ${toolName} not implemented in ServiceBindingHandlers`);
        }
    }
}
