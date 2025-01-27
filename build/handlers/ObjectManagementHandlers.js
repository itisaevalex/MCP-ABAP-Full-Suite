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
exports.ObjectManagementHandlers = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const BaseHandler_1 = require("./BaseHandler");
class ObjectManagementHandlers extends BaseHandler_1.BaseHandler {
    getTools() {
        return [{
                name: 'manage_object',
                description: 'Manages ABAP object lifecycle operations',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objectName: { type: 'string' },
                        objectType: { type: 'string' }
                    },
                    required: ['objectName', 'objectType']
                }
            }];
    }
    handle(toolName, args) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (toolName) {
                case 'createObject':
                    return this.handleCreateObject(args);
                case 'deleteObject':
                    return this.handleDeleteObject(args);
                case 'activate':
                    return this.handleActivate(args);
                case 'inactiveObjects':
                    return this.handleInactiveObjects(args);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown object management tool: ${toolName}`);
            }
        });
    }
    handleCreateObject(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    objtype: { type: 'string' },
                    name: { type: 'string' },
                    parentName: { type: 'string' },
                    description: { type: 'string' },
                    parentPath: { type: 'string' },
                    responsible: { type: 'string' },
                    transport: { type: 'string' }
                },
                required: ['objtype', 'name', 'parentName', 'description', 'parentPath']
            });
            const startTime = performance.now();
            try {
                const result = yield this.adtclient.createObject(args.objtype, args.name, args.parentName, args.description, args.parentPath, args.responsible, args.transport);
                this.trackRequest(startTime, true);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                result
                            })
                        }]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to create object: ${error.message || 'Unknown error'}`);
            }
        });
    }
    handleDeleteObject(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    objectUrl: { type: 'string' },
                    lockHandle: { type: 'string' },
                    transport: { type: 'string' }
                },
                required: ['objectUrl', 'lockHandle']
            });
            const startTime = performance.now();
            try {
                yield this.adtclient.deleteObject(args.objectUrl, args.lockHandle, args.transport);
                this.trackRequest(startTime, true);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                deleted: true
                            })
                        }]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to delete object: ${error.message || 'Unknown error'}`);
            }
        });
    }
    handleActivate(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    object: { type: ['object', 'array'] },
                    preauditRequested: { type: 'boolean' }
                },
                required: ['object']
            });
            const startTime = performance.now();
            try {
                const result = yield this.adtclient.activate(args.object, args.preauditRequested);
                this.trackRequest(startTime, true);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                result
                            })
                        }]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to activate object: ${error.message || 'Unknown error'}`);
            }
        });
    }
    handleInactiveObjects(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {},
                required: []
            });
            const startTime = performance.now();
            try {
                const result = yield this.adtclient.inactiveObjects();
                this.trackRequest(startTime, true);
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                result
                            })
                        }]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to get inactive objects: ${error.message || 'Unknown error'}`);
            }
        });
    }
}
exports.ObjectManagementHandlers = ObjectManagementHandlers;
