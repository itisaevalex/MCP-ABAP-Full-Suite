import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { DebuggingMode, DebuggerScope, DebugBreakpoint, DebugSettings } from 'abap-adt-api';

export class DebugHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'debuggerListeners',
                description: 'Retrieves a list of debugger listeners.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        debuggingMode: {
                            type: 'string',
                            description: 'The debugging mode.'
                        },
                        terminalId: {
                            type: 'string',
                            description: 'The terminal ID.'
                        },
                        ideId: {
                            type: 'string',
                            description: 'The IDE ID.'
                        },
                        user: {
                            type: 'string',
                            description: 'The user.'
                        },
                        checkConflict: {
                            type: 'boolean',
                            description: 'Whether to check for conflicts.',
                            optional: true
                        }
                    },
                    required: ['debuggingMode', 'terminalId', 'ideId', 'user']
                }
            },
            {
                name: 'debuggerListen',
                description: 'Listens for debugging events.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        debuggingMode: {
                            type: 'string',
                            description: 'The debugging mode.'
                        },
                        terminalId: {
                            type: 'string',
                            description: 'The terminal ID.'
                        },
                        ideId: {
                            type: 'string',
                            description: 'The IDE ID.'
                        },
                        user: {
                            type: 'string',
                            description: 'The user.'
                        },
                        checkConflict: {
                            type: 'boolean',
                            description: 'Whether to check for conflicts.',
                            optional: true
                        },
                        isNotifiedOnConflict: {
                            type: 'boolean',
                            description: 'Whether to be notified on conflict.',
                            optional: true
                        }
                    },
                    required: ['debuggingMode', 'terminalId', 'ideId', 'user']
                }
            },
            {
                name: 'debuggerDeleteListener',
                description: 'Stops a debug listener.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        debuggingMode: {
                            type: 'string',
                            description: 'The debugging mode.'
                        },
                        terminalId: {
                            type: 'string',
                            description: 'The terminal ID.'
                        },
                        ideId: {
                            type: 'string',
                            description: 'The IDE ID.'
                        },
                        user: {
                            type: 'string',
                            description: 'The user.'
                        }
                    },
                    required: ['debuggingMode', 'terminalId', 'ideId', 'user']
                }
            },
            {
                name: 'debuggerSetBreakpoints',
                description: 'Sets breakpoints.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        debuggingMode: {
                            type: 'string',
                            description: 'The debugging mode.'
                        },
                        terminalId: {
                            type: 'string',
                            description: 'The terminal ID.'
                        },
                        ideId: {
                            type: 'string',
                            description: 'The IDE ID.'
                        },
                        clientId: {
                            type: 'string',
                            description: 'The client ID.'
                        },
                        breakpoints: {
                            type: 'array',
                            description: 'An array of breakpoints.'
                        },
                        user: {
                            type: 'string',
                            description: 'The user.'
                        },
                        scope: {
                            type: 'string',
                            description: 'The debugger scope.',
                            optional: true
                        },
                        systemDebugging: {
                            type: 'boolean',
                            description: 'Whether to enable system debugging.',
                            optional: true
                        },
                        deactivated: {
                            type: 'boolean',
                            description: 'Whether to deactivate the breakpoints.',
                            optional: true
                        },
                        syncScupeUrl: {
                            type: 'string',
                            description: 'The URL for scope synchronization.',
                            optional: true
                        }
                    },
                    required: ['debuggingMode', 'terminalId', 'ideId', 'clientId', 'breakpoints', 'user']
                }
            },
            {
                name: 'debuggerDeleteBreakpoints',
                description: 'Deletes breakpoints.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        breakpoint: {
                            type: 'string',
                            description: 'The breakpoint to delete.'
                        },
                        debuggingMode: {
                            type: 'string',
                            description: 'The debugging mode.'
                        },
                        terminalId: {
                            type: 'string',
                            description: 'The terminal ID.'
                        },
                        ideId: {
                            type: 'string',
                            description: 'The IDE ID.'
                        },
                        requestUser: {
                            type: 'string',
                            description: 'The requesting user.'
                        },
                        scope: {
                            type: 'string',
                            description: 'The debugger scope.',
                            optional: true
                        }
                    },
                    required: ['breakpoint', 'debuggingMode', 'terminalId', 'ideId', 'requestUser']
                }
            },
            {
                name: 'debuggerAttach',
                description: 'Attaches the debugger.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        debuggingMode: {
                            type: 'string',
                            description: 'The debugging mode.'
                        },
                        debuggeeId: {
                            type: 'string',
                            description: 'The ID of the debuggee.'
                        },
                        user: {
                            type: 'string',
                            description: 'The user.'
                        },
                        dynproDebugging: {
                            type: 'boolean',
                            description: 'Whether to enable Dynpro debugging.',
                            optional: true
                        }
                    },
                    required: ['debuggingMode', 'debuggeeId', 'user']
                }
            },
            {
                name: 'debuggerSaveSettings',
                description: 'Saves debugger settings.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        settings: {
                            type: 'string',
                            description: 'The debugger settings.'
                        }
                    },
                    required: ['settings']
                }
            },
            {
                name: 'debuggerStackTrace',
                description: 'Retrieves the debugger stack trace.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        semanticURIs: {
                            type: 'boolean',
                            description: 'Whether to use semantic URIs.',
                            optional: true
                        }
                    }
                }
            },
            {
                name: 'debuggerVariables',
                description: 'Retrieves debugger variables.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        parents: {
                            type: 'array',
                            description: 'An array of parent variable names.'
                        }
                    },
                    required: ['parents']
                }
            },
            {
                name: 'debuggerChildVariables',
                description: 'Retrieves child variables of a debugger variable.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        parent: {
                            type: 'array',
                            description: 'The parent variable name.',
                            optional: true
                        }
                    }
                }
            },
            {
                name: 'debuggerStep',
                description: 'Performs a debugger step.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        steptype: {
                            type: 'string',
                            description: 'The type of step to perform.'
                        },
                        url: {
                            type: 'string',
                            description: 'The URL for step types "stepRunToLine" or "stepJumpToLine".',
                            optional: true
                        }
                    },
                    required: ['steptype']
                }
            },
            {
                name: 'debuggerGoToStack',
                description: 'Navigates to a specific stack entry in the debugger.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        urlOrPosition: {
                            type: 'string',
                            description: 'The URL or position of the stack entry.'
                        }
                    },
                    required: ['urlOrPosition']
                }
            },
            {
                name: 'debuggerSetVariableValue',
                description: 'Sets the value of a debugger variable.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        variableName: {
                            type: 'string',
                            description: 'The name of the variable.'
                        },
                        value: {
                            type: 'string',
                            description: 'The new value of the variable.'
                        }
                    },
                    required: ['variableName', 'value']
                }
            }
        ];
    }

    // Simplified handle method using "any" for arguments
    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'debuggerListeners':
                return this.adtclient.debuggerListeners(arguments_.debuggingMode, arguments_.terminalId, arguments_.ideId, arguments_.user, arguments_.checkConflict);
            case 'debuggerListen':
                return this.adtclient.debuggerListen(arguments_.debuggingMode, arguments_.terminalId, arguments_.ideId, arguments_.user, arguments_.checkConflict, arguments_.isNotifiedOnConflict);
            case 'debuggerDeleteListener':
                return this.adtclient.debuggerDeleteListener(arguments_.debuggingMode, arguments_.terminalId, arguments_.ideId, arguments_.user);
            case 'debuggerSetBreakpoints':
                return this.adtclient.debuggerSetBreakpoints(arguments_.debuggingMode, arguments_.terminalId, arguments_.ideId, arguments_.clientId, arguments_.breakpoints, arguments_.user, arguments_.scope, arguments_.systemDebugging, arguments_.deactivated, arguments_.syncScupeUrl);
            case 'debuggerDeleteBreakpoints':
                return this.adtclient.debuggerDeleteBreakpoints(arguments_.breakpoint, arguments_.debuggingMode, arguments_.terminalId, arguments_.ideId, arguments_.requestUser, arguments_.scope);
            case 'debuggerAttach':
                return this.adtclient.debuggerAttach(arguments_.debuggingMode, arguments_.debuggeeId, arguments_.user, arguments_.dynproDebugging);
            case 'debuggerSaveSettings':
                return this.adtclient.debuggerSaveSettings(arguments_.settings);
            case 'debuggerStackTrace':
                return this.adtclient.debuggerStackTrace(arguments_.semanticURIs);
            case 'debuggerVariables':
                return this.adtclient.debuggerVariables(arguments_.parents);
            case 'debuggerChildVariables':
                return this.adtclient.debuggerChildVariables(arguments_.parent);
            case 'debuggerStep':
                return this.adtclient.debuggerStep(arguments_.steptype, arguments_.url);
            case 'debuggerGoToStack':
                return this.adtclient.debuggerGoToStack(arguments_.urlOrPosition);
            case 'debuggerSetVariableValue':
                return this.adtclient.debuggerSetVariableValue(arguments_.variableName, arguments_.value);
            default:
                throw new Error(`Tool ${toolName} not implemented in DebugHandlers`);
        }
    }
}
