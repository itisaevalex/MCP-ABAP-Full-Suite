import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { Range, ExtractMethodProposal, GenericRefactoring } from 'abap-adt-api';

export class RefactorHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'extractMethodEvaluate',
                description: 'Evaluates an extract method refactoring.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uri: {
                            type: 'string',
                            description: 'The URI of the object.'
                        },
                        range: {
                            type: 'string',
                            description: 'The range to extract.'
                        }
                    },
                    required: ['uri', 'range']
                }
            },
            {
                name: 'extractMethodPreview',
                description: 'Previews an extract method refactoring.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        proposal: {
                            type: 'string',
                            description: 'The extract method proposal.'
                        }
                    },
                    required: ['proposal']
                }
            },
            {
                name: 'extractMethodExecute',
                description: 'Executes an extract method refactoring.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        refactoring: {
                            type: 'string',
                            description: 'The refactoring object.'
                        }
                    },
                    required: ['refactoring']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'extractMethodEvaluate':
                const extractMethodEvaluateArgs: { uri: string, range: Range } = arguments_;
                return this.adtclient.extractMethodEvaluate(extractMethodEvaluateArgs.uri, extractMethodEvaluateArgs.range);
            case 'extractMethodPreview':
                const extractMethodPreviewArgs: { proposal: ExtractMethodProposal } = arguments_;
                return this.adtclient.extractMethodPreview(extractMethodPreviewArgs.proposal);
            case 'extractMethodExecute':
                const extractMethodExecuteArgs: { refactoring: GenericRefactoring } = arguments_;
                return this.adtclient.extractMethodExecute(extractMethodExecuteArgs.refactoring);
            default:
                throw new Error(`Tool ${toolName} not implemented in RefactorHandlers`);
        }
    }
}
