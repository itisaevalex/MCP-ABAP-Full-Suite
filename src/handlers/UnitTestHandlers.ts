import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { UnitTestRunFlags } from 'abap-adt-api';

export class UnitTestHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'unitTestRun',
                description: 'Runs unit tests.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'The URL of the object to test.'
                        },
                        flags: {
                            type: 'string',
                            description: 'Flags for the unit test run.',
                            optional: true
                        }
                    },
                    required: ['url']
                }
            },
            {
                name: 'unitTestEvaluation',
                description: 'Evaluates unit test results.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        clas: {
                            type: 'string',
                            description: 'The class to evaluate.'
                        },
                        flags: {
                            type: 'string',
                            description: 'Flags for the unit test evaluation.',
                            optional: true
                        }
                    },
                    required: ['clas']
                }
            },
            {
                name: 'unitTestOccurrenceMarkers',
                description: 'Retrieves unit test occurrence markers.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'The URL of the object.'
                        },
                        source: {
                            type: 'string',
                            description: 'The source code.'
                        }
                    },
                    required: ['url', 'source']
                }
            },
            {
                name: 'createTestInclude',
                description: 'Creates a test include for a class.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        clas: {
                            type: 'string',
                            description: 'The class name.'
                        },
                        lockHandle: {
                            type: 'string',
                            description: 'The lock handle.'
                        },
                        transport: {
                            type: 'string',
                            description: 'The transport.',
                            optional: true
                        }
                    },
                    required: ['clas', 'lockHandle']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'unitTestRun':
                const unitTestRunArgs: { url: string, flags?: UnitTestRunFlags } = arguments_;
                return this.adtclient.unitTestRun(unitTestRunArgs.url, unitTestRunArgs.flags);
            case 'unitTestEvaluation':
                const unitTestEvalArgs: { clas: any, flags?: UnitTestRunFlags } = arguments_;
                return this.adtclient.unitTestEvaluation(unitTestEvalArgs.clas, unitTestEvalArgs.flags);
            case 'unitTestOccurrenceMarkers':
                const unitTestMarkersArgs: { url: string, source: string } = arguments_;
                return this.adtclient.unitTestOccurrenceMarkers(unitTestMarkersArgs.url, unitTestMarkersArgs.source);
            case 'createTestInclude':
                const createTestIncludeArgs: { clas: string, lockHandle: string, transport?: string } = arguments_;
                return this.adtclient.createTestInclude(createTestIncludeArgs.clas, createTestIncludeArgs.lockHandle, createTestIncludeArgs.transport);
            default:
                throw new Error(`Tool ${toolName} not implemented in UnitTestHandlers`);
        }
    }
}
