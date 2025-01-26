#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbapAdtServer = void 0;
const dotenv_1 = require("dotenv");
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const abap_adt_api_1 = require("abap-adt-api");
const path_1 = __importDefault(require("path"));
const AuthHandlers_js_1 = require("./handlers/AuthHandlers.js");
const TransportHandlers_js_1 = require("./handlers/TransportHandlers.js");
const ObjectHandlers_js_1 = require("./handlers/ObjectHandlers.js");
const ClassHandlers_js_1 = require("./handlers/ClassHandlers.js");
const CodeAnalysisHandlers_js_1 = require("./handlers/CodeAnalysisHandlers.js");
(0, dotenv_1.config)({ path: path_1.default.resolve(__dirname, '../.env') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
class AbapAdtServer extends index_js_1.Server {
    constructor() {
        super({
            name: "mcp-abap-abap-adt-api",
            version: "0.1.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        const missingVars = ['ABAP_URL', 'ABAP_USER', 'ABAP_PASSWORD'].filter(v => !process.env[v]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
        this.adtClient = new abap_adt_api_1.ADTClient(process.env.ABAP_URL, process.env.ABAP_USER, process.env.ABAP_PASSWORD);
        // Initialize handlers
        this.authHandlers = new AuthHandlers_js_1.AuthHandlers(this.adtClient);
        this.transportHandlers = new TransportHandlers_js_1.TransportHandlers(this.adtClient);
        this.objectHandlers = new ObjectHandlers_js_1.ObjectHandlers(this.adtClient);
        this.classHandlers = new ClassHandlers_js_1.ClassHandlers(this.adtClient);
        this.codeAnalysisHandlers = new CodeAnalysisHandlers_js_1.CodeAnalysisHandlers(this.adtClient);
        // Setup tool handlers
        this.setupToolHandlers();
    }
    serializeResult(result) {
        try {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(result, (key, value) => typeof value === 'bigint' ? value.toString() : value)
                    }]
            };
        }
        catch (error) {
            return this.handleError(new types_js_1.McpError(types_js_1.ErrorCode.InternalError, 'Failed to serialize result'));
        }
    }
    handleError(error) {
        if (!(error instanceof Error)) {
            error = new Error(String(error));
        }
        if (error instanceof types_js_1.McpError) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            error: error.message,
                            code: error.code
                        })
                    }],
                isError: true
            };
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: 'Internal server error',
                        code: types_js_1.ErrorCode.InternalError
                    })
                }],
            isError: true
        };
    }
    setupToolHandlers() {
        this.setRequestHandler(types_js_1.ListToolsRequestSchema, () => __awaiter(this, void 0, void 0, function* () {
            return {
                tools: [
                    ...this.authHandlers.getTools(),
                    ...this.transportHandlers.getTools(),
                    ...this.objectHandlers.getTools(),
                    ...this.classHandlers.getTools(),
                    ...this.codeAnalysisHandlers.getTools(),
                    {
                        name: 'healthcheck',
                        description: 'Check server health and connectivity',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    }
                ]
            };
        }));
        this.setRequestHandler(types_js_1.CallToolRequestSchema, (request) => __awaiter(this, void 0, void 0, function* () {
            try {
                let result;
                switch (request.params.name) {
                    case 'login':
                    case 'logout':
                    case 'dropSession':
                        result = yield this.authHandlers.handle(request.params.name, request.params.arguments);
                        break;
                    case 'transportInfo':
                    case 'createTransport':
                    case 'lock':
                    case 'unLock':
                        result = yield this.transportHandlers.handle(request.params.name, request.params.arguments);
                        break;
                    case 'objectStructure':
                    case 'getObjectSource':
                    case 'setObjectSource':
                    case 'searchObject':
                    case 'findObjectPath':
                    case 'createObject':
                    case 'deleteObject':
                        result = yield this.objectHandlers.handle(request.params.name, request.params.arguments);
                        break;
                    case 'classIncludes':
                    case 'mainInclude':
                    case 'mainPrograms':
                    case 'classComponents':
                        result = yield this.classHandlers.handle(request.params.name, request.params.arguments);
                        break;
                    case 'syntaxCheck':
                    case 'codeCompletion':
                    case 'findDefinition':
                    case 'usageReferences':
                        result = yield this.codeAnalysisHandlers.handle(request.params.name, request.params.arguments);
                        break;
                    case 'healthcheck':
                        result = { status: 'healthy', timestamp: new Date().toISOString() };
                        break;
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
                return this.serializeResult(result);
            }
            catch (error) {
                return this.handleError(error);
            }
        }));
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = new stdio_js_1.StdioServerTransport();
            yield this.connect(transport);
            console.error('MCP ABAP ADT API server running on stdio');
            // Handle shutdown
            process.on('SIGINT', () => __awaiter(this, void 0, void 0, function* () {
                yield this.close();
                process.exit(0);
            }));
            process.on('SIGTERM', () => __awaiter(this, void 0, void 0, function* () {
                yield this.close();
                process.exit(0);
            }));
            // Handle errors
            this.onerror = (error) => {
                console.error('[MCP Error]', error);
            };
        });
    }
}
exports.AbapAdtServer = AbapAdtServer;
// Create and run server instance
const server = new AbapAdtServer();
server.run().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});
