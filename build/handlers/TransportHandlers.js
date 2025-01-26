"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportHandlers = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const BaseHandler_1 = require("./BaseHandler");
class TransportHandlers extends BaseHandler_1.BaseHandler {
    getTools() {
        return [
            {
                name: 'transportInfo',
                description: 'Get transport information for an object source',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objSourceUrl: {
                            type: 'string',
                            description: 'URL of the object source'
                        },
                        devClass: {
                            type: 'string',
                            description: 'Development class',
                            optional: true
                        },
                        operation: {
                            type: 'string',
                            description: 'Transport operation',
                            optional: true
                        }
                    },
                    required: ['objSourceUrl']
                }
            },
            {
                name: 'createTransport',
                description: 'Create a new transport request',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objSourceUrl: {
                            type: 'string',
                            description: 'URL of the object source'
                        },
                        REQUEST_TEXT: {
                            type: 'string',
                            description: 'Description of the transport request'
                        },
                        DEVCLASS: {
                            type: 'string',
                            description: 'Development class'
                        },
                        transportLayer: {
                            type: 'string',
                            description: 'Transport layer',
                            optional: true
                        }
                    },
                    required: ['objSourceUrl', 'REQUEST_TEXT', 'DEVCLASS']
                }
            },
            {
                name: 'hasTransportConfig',
                description: 'Check if transport configuration exists',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            }
        ];
    }
    handle(toolName, args) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (toolName) {
                case 'transportInfo':
                    return this.handleTransportInfo(args);
                case 'createTransport':
                    return this.handleCreateTransport(args);
                case 'hasTransportConfig':
                    return this.handleHasTransportConfig(args);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown transport tool: ${toolName}`);
            }
        });
    }
    handleTransportInfo(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    objSourceUrl: { type: 'string' },
                    devClass: { type: 'string', optional: true },
                    operation: { type: 'string', optional: true }
                },
                required: ['objSourceUrl']
            });
            // TODO: Implement actual transport info logic
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            status: 'success',
                            transportInfo: {
                                objSourceUrl: args.objSourceUrl,
                                devClass: args.devClass || 'DEFAULT',
                                operation: args.operation || 'INSERT'
                            }
                        })
                    }
                ]
            };
        });
    }
    handleCreateTransport(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    objSourceUrl: { type: 'string' },
                    REQUEST_TEXT: { type: 'string' },
                    DEVCLASS: { type: 'string' },
                    transportLayer: { type: 'string', optional: true }
                },
                required: ['objSourceUrl', 'REQUEST_TEXT', 'DEVCLASS']
            });
            // TODO: Implement actual transport creation
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            status: 'success',
                            transportNumber: 'placeholder-transport-number',
                            message: 'Transport created successfully'
                        })
                    }
                ]
            };
        });
    }
    handleHasTransportConfig(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {}
            });
            // TODO: Implement actual transport config check
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            status: 'success',
                            hasConfig: true
                        })
                    }
                ]
            };
        });
    }
}
exports.TransportHandlers = TransportHandlers;
