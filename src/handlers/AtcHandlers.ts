import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { AtcProposal } from 'abap-adt-api';

export class AtcHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'atcCustomizing',
                description: 'Retrieves ATC customizing information.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'atcCheckVariant',
                description: 'Retrieves information about an ATC check variant.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        variant: {
                            type: 'string',
                            description: 'The name of the ATC check variant.'
                        }
                    },
                    required: ['variant']
                }
            },
            {
                name: 'createAtcRun',
                description: 'Creates an ATC run.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        variant: {
                            type: 'string',
                            description: 'The name of the ATC check variant.'
                        },
                        mainUrl: {
                            type: 'string',
                            description: 'The main URL for the ATC run.'
                        },
                        maxResults: {
                            type: 'number',
                            description: 'The maximum number of results to retrieve.',
                            optional: true
                        }
                    },
                    required: ['variant', 'mainUrl']
                }
            },
            {
                name: 'atcWorklists',
                description: 'Retrieves ATC worklists.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        runResultId: {
                            type: 'string',
                            description: 'The ID of the ATC run result.'
                        },
                        timestamp: {
                            type: 'number',
                            description: 'The timestamp.',
                            optional: true
                        },
                        usedObjectSet: {
                            type: 'string',
                            description: 'The used object set.',
                            optional: true
                        },
                        includeExempted: {
                            type: 'boolean',
                            description: 'Whether to include exempted findings.',
                            optional: true
                        }
                    },
                    required: ['runResultId']
                }
            },
            {
                name: 'atcUsers',
                description: 'Retrieves a list of ATC users.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'atcExemptProposal',
                description: 'Retrieves an ATC exemption proposal.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        markerId: {
                            type: 'string',
                            description: 'The ID of the marker.'
                        }
                    },
                    required: ['markerId']
                }
            },
            {
                name: 'atcRequestExemption',
                description: 'Requests an ATC exemption.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        proposal: {
                            type: 'object',
                            description: 'The ATC exemption proposal.'
                        }
                    },
                    required: ['proposal']
                }
            },
            {
                name: 'isProposalMessage',
                description: 'Checks if a given object is a proposal message.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'atcContactUri',
                description: 'Retrieves the contact URI for an ATC finding.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        findingUri: {
                            type: 'string',
                            description: 'The URI of the ATC finding.'
                        }
                    },
                    required: ['findingUri']
                }
            },
            {
                name: 'atcChangeContact',
                description: 'Changes the contact for an ATC finding.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        itemUri: {
                            type: 'string',
                            description: 'The URI of the item.'
                        },
                        userId: {
                            type: 'string',
                            description: 'The ID of the user.'
                        }
                    },
                    required: ['itemUri', 'userId']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'atcCustomizing':
                return this.adtclient.atcCustomizing();
            case 'atcCheckVariant':
                const atcCheckVariantArgs: { variant: string } = arguments_;
                return this.adtclient.atcCheckVariant(atcCheckVariantArgs.variant);
            case 'createAtcRun':
                const createAtcRunArgs: { variant: string, mainUrl: string, maxResults?: number } = arguments_;
                return this.adtclient.createAtcRun(createAtcRunArgs.variant, createAtcRunArgs.mainUrl, createAtcRunArgs.maxResults);
            case 'atcWorklists':
                const atcWorklistsArgs: { runResultId: string, timestamp?: number, usedObjectSet?: string, includeExempted?: boolean } = arguments_;
                return this.adtclient.atcWorklists(atcWorklistsArgs.runResultId, atcWorklistsArgs.timestamp || 0, atcWorklistsArgs.usedObjectSet || "", atcWorklistsArgs.includeExempted);
            case 'atcUsers':
                return this.adtclient.atcUsers();
            case 'atcExemptProposal':
                const atcExemptProposalArgs: { markerId: string } = arguments_;
                return this.adtclient.atcExemptProposal(atcExemptProposalArgs.markerId);
            case 'atcRequestExemption':
                const atcRequestExemptionArgs: { proposal: AtcProposal } = arguments_;
                return this.adtclient.atcRequestExemption(atcRequestExemptionArgs.proposal);
            case 'isProposalMessage':
                return this.adtclient.isProposalMessage;
            case 'atcContactUri':
                const atcContactUriArgs: { findingUri: string } = arguments_;
                return this.adtclient.atcContactUri(atcContactUriArgs.findingUri);
            case 'atcChangeContact':
                const atcChangeContactArgs: { itemUri: string, userId: string } = arguments_;
                return this.adtclient.atcChangeContact(atcChangeContactArgs.itemUri, atcChangeContactArgs.userId);
            default:
                throw new Error(`Tool ${toolName} not implemented in AtcHandlers`);
        }
    }
}
