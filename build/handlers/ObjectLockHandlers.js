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
exports.ObjectLockHandlers = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const BaseHandler_1 = require("./BaseHandler");
class ObjectLockHandlers extends BaseHandler_1.BaseHandler {
    getTools() {
        return [{
                name: 'lock_object',
                description: 'Locks an ABAP object for editing',
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
                case 'lockObject':
                    return this.handleLockObject(args);
                case 'unlockObject':
                    return this.handleUnlockObject(args);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown object lock tool: ${toolName}`);
            }
        });
    }
    handleLockObject(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    objectUrl: { type: 'string' },
                    accessMode: { type: 'string' }
                },
                required: ['objectUrl']
            });
            const startTime = performance.now();
            try {
                const lockResult = yield this.adtclient.lock(args.objectUrl, args.accessMode);
                this.trackRequest(startTime, true);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                locked: true,
                                lockHandle: lockResult.LOCK_HANDLE
                            })
                        }
                    ]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to lock object: ${error.message || 'Unknown error'}`);
            }
        });
    }
    handleUnlockObject(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateArgs(args, {
                type: 'object',
                properties: {
                    objectUrl: { type: 'string' },
                    lockHandle: { type: 'string' }
                },
                required: ['objectUrl', 'lockHandle']
            });
            const startTime = performance.now();
            try {
                yield this.adtclient.unLock(args.objectUrl, args.lockHandle);
                this.trackRequest(startTime, true);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                status: 'success',
                                unlocked: true
                            })
                        }
                    ]
                };
            }
            catch (error) {
                this.trackRequest(startTime, false);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to unlock object: ${error.message || 'Unknown error'}`);
            }
        });
    }
}
exports.ObjectLockHandlers = ObjectLockHandlers;
