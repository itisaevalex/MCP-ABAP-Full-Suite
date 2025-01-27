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
exports.CodeAnalysisHandlers = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const BaseHandler_js_1 = require("./BaseHandler.js");
class CodeAnalysisHandlers extends BaseHandler_js_1.BaseHandler {
    getTools() {
        return [
            {
                name: 'syntaxCheck',
                description: 'Perform ABAP syntax check',
                inputSchema: {
                    type: 'object',
                    properties: {
                        code: { type: 'string' }
                    },
                    required: ['code']
                }
            },
            {
                name: 'codeCompletion',
                description: 'Get code completion suggestions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sourceUrl: { type: 'string' },
                        source: { type: 'string' },
                        line: { type: 'number' },
                        column: { type: 'number' }
                    },
                    required: ['sourceUrl', 'source', 'line', 'column']
                }
            },
            {
                name: 'findDefinition',
                description: 'Find symbol definition',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: { type: 'string' },
                        source: { type: 'string' },
                        line: { type: 'number' },
                        startCol: { type: 'number' },
                        endCol: { type: 'number' },
                        implementation: { type: 'boolean', optional: true },
                        mainProgram: { type: 'string', optional: true }
                    },
                    required: ['url', 'source', 'line', 'startCol', 'endCol']
                }
            },
            {
                name: 'usageReferences',
                description: 'Find symbol references',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: { type: 'string' },
                        line: { type: 'number', optional: true },
                        column: { type: 'number', optional: true }
                    },
                    required: ['url']
                }
            }
        ];
    }
    handle(toolName, args) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (toolName) {
                case 'syntaxCheck':
                    return this.handleSyntaxCheck(args);
                case 'codeCompletion':
                    return this.handleCodeCompletion(args);
                case 'findDefinition':
                    return this.handleFindDefinition(args);
                case 'usageReferences':
                    return this.handleUsageReferences(args);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown code analysis tool: ${toolName}`);
            }
        });
    }
    handleSyntaxCheck(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    code: { type: 'string' }
                },
                required: ['code']
            });
            const startTime = performance.now();
            try {
                const result = yield this.adtclient.syntaxCheck(args.code);
                this.trackRequest(startTime, true);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                result
                            })
                        }
                    ]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Syntax check failed: ${error.message || 'Unknown error'}`);
            }
        });
    }
    handleCodeCompletion(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    sourceUrl: { type: 'string' },
                    source: { type: 'string' },
                    line: { type: 'number' },
                    column: { type: 'number' }
                },
                required: ['sourceUrl', 'source', 'line', 'column']
            });
            const startTime = performance.now();
            try {
                const result = yield this.adtclient.codeCompletion(args.sourceUrl, args.source, args.line, args.column);
                this.trackRequest(startTime, true);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                result
                            })
                        }
                    ]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Code completion failed: ${error.message || 'Unknown error'}`);
            }
        });
    }
    handleFindDefinition(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    url: { type: 'string' },
                    source: { type: 'string' },
                    line: { type: 'number' },
                    startCol: { type: 'number' },
                    endCol: { type: 'number' },
                    implementation: { type: 'boolean', optional: true },
                    mainProgram: { type: 'string', optional: true }
                },
                required: ['url', 'source', 'line', 'startCol', 'endCol']
            });
            const startTime = performance.now();
            try {
                const result = yield this.adtclient.findDefinition(args.url, args.source, args.line, args.startCol, args.endCol, args.implementation, args.mainProgram);
                this.trackRequest(startTime, true);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                result
                            })
                        }
                    ]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Find definition failed: ${error.message || 'Unknown error'}`);
            }
        });
    }
    handleUsageReferences(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    url: { type: 'string' },
                    line: { type: 'number', optional: true },
                    column: { type: 'number', optional: true }
                },
                required: ['url']
            });
            const startTime = performance.now();
            try {
                const result = yield this.adtclient.usageReferences(args.url, args.line, args.column);
                this.trackRequest(startTime, true);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                result
                            })
                        }
                    ]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Usage references failed: ${error.message || 'Unknown error'}`);
            }
        });
    }
}
exports.CodeAnalysisHandlers = CodeAnalysisHandlers;
