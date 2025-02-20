import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { TraceStatementOptions, TraceParameters, TracesCreationConfig } from 'abap-adt-api';

export class TraceHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'tracesList',
                description: 'Retrieves a list of traces.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'string',
                            description: 'The user.',
                            optional: true
                        }
                    }
                }
            },
            {
                name: 'tracesListRequests',
                description: 'Retrieves a list of trace requests.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        user: {
                            type: 'string',
                            description: 'The user.',
                            optional: true
                        }
                    }
                }
            },
            {
                name: 'tracesHitList',
                description: 'Retrieves the hit list for a trace.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'The ID of the trace.'
                        },
                        withSystemEvents: {
                            type: 'boolean',
                            description: 'Whether to include system events.',
                            optional: true
                        }
                    },
                    required: ['id']
                }
            },
            {
                name: 'tracesDbAccess',
                description: 'Retrieves database access information for a trace.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'The ID of the trace.'
                        },
                        withSystemEvents: {
                            type: 'boolean',
                            description: 'Whether to include system events.',
                            optional: true
                        }
                    },
                    required: ['id']
                }
            },
            {
                name: 'tracesStatements',
                description: 'Retrieves statements for a trace.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'The ID of the trace.'
                        },
                        options: {
                            type: 'string',
                            description: 'Options for retrieving statements.',
                            optional: true
                        }
                    },
                    required: ['id']
                }
            },
            {
                name: 'tracesSetParameters',
                description: 'Sets trace parameters.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        parameters: {
                            type: 'string',
                            description: 'The trace parameters.'
                        }
                    },
                    required: ['parameters']
                }
            },
            {
                name: 'tracesCreateConfiguration',
                description: 'Creates a trace configuration.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        config: {
                            type: 'string',
                            description: 'The trace configuration.'
                        }
                    },
                    required: ['config']
                }
            },
            {
                name: 'tracesDeleteConfiguration',
                description: 'Deletes a trace configuration.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'The ID of the trace configuration.'
                        }
                    },
                    required: ['id']
                }
            },
            {
                name: 'tracesDelete',
                description: 'Deletes a trace.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'The ID of the trace.'
                        }
                    },
                    required: ['id']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'tracesList':
                const tracesListArgs: { user?: string } = arguments_;
                return this.adtclient.tracesList(tracesListArgs.user);
            case 'tracesListRequests':
                const tracesListRequestsArgs: { user?: string } = arguments_;
                return this.adtclient.tracesListRequests(tracesListRequestsArgs.user);
            case 'tracesHitList':
                const tracesHitListArgs: { id: string, withSystemEvents?: boolean } = arguments_;
                return this.adtclient.tracesHitList(tracesHitListArgs.id, tracesHitListArgs.withSystemEvents);
            case 'tracesDbAccess':
                const tracesDbAccessArgs: { id: string, withSystemEvents?: boolean } = arguments_;
                return this.adtclient.tracesDbAccess(tracesDbAccessArgs.id, tracesDbAccessArgs.withSystemEvents);
            case 'tracesStatements':
                const tracesStatementsArgs: { id: string, options?: TraceStatementOptions } = arguments_;
                return this.adtclient.tracesStatements(tracesStatementsArgs.id, tracesStatementsArgs.options);
            case 'tracesSetParameters':
                const tracesSetParametersArgs: { parameters: TraceParameters } = arguments_;
                return this.adtclient.tracesSetParameters(tracesSetParametersArgs.parameters);
            case 'tracesCreateConfiguration':
                const tracesCreateConfigurationArgs: { config: TracesCreationConfig } = arguments_;
                return this.adtclient.tracesCreateConfiguration(tracesCreateConfigurationArgs.config);
            case 'tracesDeleteConfiguration':
                const tracesDeleteConfigurationArgs: { id: string } = arguments_;
                return this.adtclient.tracesDeleteConfiguration(tracesDeleteConfigurationArgs.id);
            case 'tracesDelete':
                const tracesDeleteArgs: { id: string } = arguments_;
                return this.adtclient.tracesDelete(tracesDeleteArgs.id);
            default:
                throw new Error(`Tool ${toolName} not implemented in TraceHandlers`);
        }
    }
}
