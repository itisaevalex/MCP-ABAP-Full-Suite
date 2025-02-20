import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { RenameRefactoringProposal, RenameRefactoring } from 'abap-adt-api';

export class RenameHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'renameEvaluate',
                description: 'Evaluates a rename refactoring.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        uri: {
                            type: 'string',
                            description: 'The URI of the object to rename.'
                        },
                        line: {
                            type: 'number',
                            description: 'The line number.'
                        },
                        startColumn: {
                            type: 'number',
                            description: 'The starting column.'
                        },
                        endColumn: {
                            type: 'number',
                            description: 'The ending column.'
                        }
                    },
                    required: ['uri', 'line', 'startColumn', 'endColumn']
                }
            },
            {
                name: 'renamePreview',
                description: 'Previews a rename refactoring.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        renameRefactoring: {
                            type: 'string',
                            description: 'The rename refactoring proposal.'
                        },
                        transport: {
                            type: 'string',
                            description: 'The transport.',
                            optional: true
                        }
                    },
                    required: ['renameRefactoring']
                }
            },
            {
                name: 'renameExecute',
                description: 'Executes a rename refactoring.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        refactoring: {
                            type: 'string',
                            description: 'The rename refactoring.'
                        }
                    },
                    required: ['refactoring']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'renameEvaluate':
                const renameEvaluateArgs: { uri: string, line: number, startColumn: number, endColumn: number } = arguments_;
                return this.adtclient.renameEvaluate(renameEvaluateArgs.uri, renameEvaluateArgs.line, renameEvaluateArgs.startColumn, renameEvaluateArgs.endColumn);
            case 'renamePreview':
                const renamePreviewArgs: { renameRefactoring: RenameRefactoringProposal, transport?: string } = arguments_;
                return this.adtclient.renamePreview(renamePreviewArgs.renameRefactoring, renamePreviewArgs.transport);
            case 'renameExecute':
                const renameExecuteArgs: { refactoring: RenameRefactoring } = arguments_;
                return this.adtclient.renameExecute(renameExecuteArgs.refactoring);
            default:
                throw new Error(`Tool ${toolName} not implemented in RenameHandlers`);
        }
    }
}
