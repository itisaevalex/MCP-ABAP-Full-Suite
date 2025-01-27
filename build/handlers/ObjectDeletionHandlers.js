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
exports.ObjectDeletionHandlers = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const BaseHandler_js_1 = require("./BaseHandler.js");
class ObjectDeletionHandlers extends BaseHandler_js_1.BaseHandler {
    getTools() {
        return [
            {
                name: 'deleteObject',
                description: 'Deletes an ABAP object from the system',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objectUrl: { type: 'string' },
                        lockHandle: { type: 'string' },
                        transport: { type: 'string' }
                    },
                    required: ['objectUrl', 'lockHandle']
                }
            }
        ];
    }
    handle(toolName, args) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (toolName) {
                case 'deleteObject':
                    return this.handleDeleteObject(args);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown object deletion tool: ${toolName}`);
            }
        });
    }
    handleDeleteObject(args) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.adtclient.deleteObject(args.objectUrl, args.lockHandle, args.transport);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result)
                        }
                    ]
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ error: error.message })
                        }
                    ],
                    isError: true
                };
            }
        });
    }
}
exports.ObjectDeletionHandlers = ObjectDeletionHandlers;
