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
exports.AuthHandlers = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const BaseHandler_js_1 = require("./BaseHandler.js");
class AuthHandlers extends BaseHandler_js_1.BaseHandler {
    getTools() {
        return [
            {
                name: 'login',
                description: 'Authenticate with ABAP system',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'logout',
                description: 'Terminate ABAP session',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'dropSession',
                description: 'Clear local session cache',
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
                case 'login':
                    return this.handleLogin(args);
                case 'logout':
                    return this.handleLogout(args);
                case 'dropSession':
                    return this.handleDropSession(args);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown auth tool: ${toolName}`);
            }
        });
    }
    handleLogin(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const loginResult = yield this.adtclient.login();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(loginResult)
                    }
                ]
            };
        });
    }
    handleLogout(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.adtclient.logout();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ status: 'Logged out successfully' })
                    }
                ]
            };
        });
    }
    handleDropSession(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.adtclient.dropSession();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ status: 'Session cleared' })
                    }
                ]
            };
        });
    }
}
exports.AuthHandlers = AuthHandlers;
