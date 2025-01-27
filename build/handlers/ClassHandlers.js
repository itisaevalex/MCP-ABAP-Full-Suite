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
exports.ClassHandlers = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const BaseHandler_js_1 = require("./BaseHandler.js");
const abap_adt_api_1 = require("abap-adt-api");
class ClassHandlers extends BaseHandler_js_1.BaseHandler {
    getTools() {
        return [
            {
                name: 'classIncludes',
                description: 'Get class includes structure',
                inputSchema: {
                    type: 'object',
                    properties: { clas: { type: 'string' } },
                    required: ['clas']
                }
            },
            {
                name: 'classComponents',
                description: 'List class components',
                inputSchema: {
                    type: 'object',
                    properties: { url: { type: 'string' } },
                    required: ['url']
                }
            },
            {
                name: 'createTestInclude',
                description: 'Create test include for class',
                inputSchema: {
                    type: 'object',
                    properties: {
                        clas: { type: 'string' },
                        lockHandle: { type: 'string' },
                        transport: { type: 'string' }
                    },
                    required: ['clas', 'lockHandle']
                }
            }
        ];
    }
    handle(toolName, args) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (toolName) {
                case 'classIncludes':
                    return this.handleClassIncludes(args);
                case 'classComponents':
                    return this.handleClassComponents(args);
                case 'createTestInclude':
                    return this.handleCreateTestInclude(args);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown class tool: ${toolName}`);
            }
        });
    }
    handleClassIncludes(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = performance.now();
            let success = false;
            try {
                this.validateArgs(args, {
                    type: 'object',
                    properties: {
                        clas: { type: 'string' }
                    },
                    required: ['clas']
                });
                this.checkRateLimit(args.ip || 'default');
                const result = yield abap_adt_api_1.ADTClient.classIncludes(args.clas);
                success = true;
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result)
                        }]
                };
            }
            catch (error) {
                this.logger.error('Class includes failed', { error });
                throw error;
            }
            finally {
                this.trackRequest(startTime, success);
            }
        });
    }
    handleClassComponents(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = performance.now();
            let success = false;
            try {
                this.validateArgs(args, {
                    type: 'object',
                    properties: {
                        url: { type: 'string' }
                    },
                    required: ['url']
                });
                this.checkRateLimit(args.ip || 'default');
                const result = yield this.adtclient.classComponents(args.url);
                success = true;
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result)
                        }]
                };
            }
            catch (error) {
                this.logger.error('Class components failed', { error });
                throw error;
            }
            finally {
                this.trackRequest(startTime, success);
            }
        });
    }
    handleCreateTestInclude(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = performance.now();
            let success = false;
            try {
                this.validateArgs(args, {
                    type: 'object',
                    properties: {
                        clas: { type: 'string' },
                        lockHandle: { type: 'string' },
                        transport: { type: 'string', optional: true }
                    },
                    required: ['clas', 'lockHandle']
                });
                this.checkRateLimit(args.ip || 'default');
                const result = yield this.adtclient.createTestInclude(args.clas, args.lockHandle, args.transport);
                success = true;
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result)
                        }]
                };
            }
            catch (error) {
                this.logger.error('Create test include failed', { error });
                throw error;
            }
            finally {
                this.trackRequest(startTime, success);
            }
        });
    }
}
exports.ClassHandlers = ClassHandlers;
