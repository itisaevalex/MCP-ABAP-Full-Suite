"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const nock_1 = __importDefault(require("nock"));
const ROOT_DIR = path.join(__dirname, '../../'); // Adjust as necessary to point to project root
const SERVER_ENTRY = path.join(ROOT_DIR, 'dist/index.js');
const MOCKED_BTP_TOKEN_URL = 'http://localhost:12345/oauth/token';
const MOCKED_SAP_URL = 'http://dummy.sap.system:443';
const DUMMY_OBJECT_PATH = '/sap/bc/adt/repository/nodestructure/DEV/CLAS/SOME_NON_EXISTENT_OBJECT';
// Helper to manage message IDs for JSON-RPC
let messageCounter = 1;
function nextMessageId() {
    return messageCounter++;
}
describe('MCP ABAP ADT API - Integration Tests', () => {
    let serverProcess;
    let serverReady = false;
    let stdoutBuffer = [];
    let stderrBuffer = [];
    const DEFAULT_TIMEOUT = 15000; // 15 seconds for server ops
    function sendMessage(child, message) {
        const strMessage = JSON.stringify(message) + '\n';
        // console.log(`SENDING: ${strMessage.trim()}`);
        child.stdin.write(strMessage);
    }
    function waitForResponse(stream, expectedId, timeout = DEFAULT_TIMEOUT) {
        return new Promise((resolve, reject) => {
            let accumulatedData = '';
            const onData = (chunk) => {
                accumulatedData += chunk.toString();
                // console.log(`ACCUMULATED: ${accumulatedData}`);
                const lines = accumulatedData.split('\n');
                accumulatedData = lines.pop() || ''; // Keep last partial line
                for (const line of lines) {
                    if (line.trim() === '')
                        continue;
                    // console.log(`PROCESSING LINE: ${line.trim()}`);
                    try {
                        const parsed = JSON.parse(line.trim());
                        if (parsed.id === expectedId) {
                            // console.log(`MATCHED RESPONSE: ${JSON.stringify(parsed)}`);
                            stream.removeListener('data', onData);
                            clearTimeout(timer);
                            resolve(parsed);
                            return;
                        }
                    }
                    catch (e) {
                        console.warn('Failed to parse JSON line from stdout:', line, e);
                        // Continue, might be a log line
                    }
                }
            };
            const timer = setTimeout(() => {
                stream.removeListener('data', onData);
                console.error('waitForResponse timed out. Current stdoutBuffer:', stdoutBuffer.join('\n'));
                console.error('Current stderrBuffer:', stderrBuffer.join('\n'));
                reject(new Error(`Timeout waiting for response ID ${expectedId} after ${timeout}ms`));
            }, timeout);
            stream.on('data', onData);
        });
    }
    function waitForServerReady(child, timeout = DEFAULT_TIMEOUT) {
        return new Promise((resolve, reject) => {
            const onData = (chunk) => {
                const output = chunk.toString();
                stdoutBuffer.push(output);
                // console.log(`SERVER STDOUT: ${output}`);
                if (output.includes('MCP ABAP ADT API server running...')) {
                    child.stdout.removeListener('data', onData);
                    clearTimeout(timer);
                    serverReady = true;
                    resolve();
                }
            };
            const onStderrData = (chunk) => {
                const output = chunk.toString();
                stderrBuffer.push(output);
                // console.error(`SERVER STDERR: ${output}`);
            };
            child.stdout.on('data', onData);
            child.stderr.on('data', onStderrData);
            child.on('error', (err) => {
                clearTimeout(timer);
                reject(new Error('Server process errored: ' + err.message));
            });
            child.on('exit', (code, signal) => {
                if (!serverReady) {
                    clearTimeout(timer);
                    const fullStderr = stderrBuffer.join('');
                    reject(new Error(`Server process exited before ready. Code: ${code}, Signal: ${signal}. Stderr: ${fullStderr.substring(0, 500)}`));
                }
            });
            const timer = setTimeout(() => {
                child.stdout.removeListener('data', onData);
                child.stderr.removeListener('data', onStderrData);
                const fullStdout = stdoutBuffer.join('');
                const fullStderr = stderrBuffer.join('');
                reject(new Error(`Timeout waiting for server ready after ${timeout}ms. Stdout: ${fullStdout.substring(0, 500)}. Stderr: ${fullStderr.substring(0, 500)}`));
            }, timeout);
        });
    }
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        nock_1.default.disableNetConnect(); // Ensure no real network calls are made
        nock_1.default.enableNetConnect('127.0.0.1'); // Allow localhost connections (e.g. if server uses 127.0.0.1)
        // Mock BTP OAuth token endpoint
        (0, nock_1.default)(MOCKED_BTP_TOKEN_URL)
            .persist() // Persist this mock for multiple calls if needed
            .post('') // Assuming POST to /oauth/token
            .reply(200, {
            access_token: 'mocked-oauth-token-xyz',
            expires_in: 3600,
            token_type: 'Bearer',
        });
        // Mock ADT health check (non-existent object causing a 404-like error)
        // This is the *expected* error for the health check to pass for BTP
        const mockAdtNotFoundError = {
            "error": {
                "code": "SY/530",
                "message": "Resource SOME_NON_EXISTENT_OBJECT not found",
                "longtext": [
                    { "severity": "E", "text": "Resource SOME_NON_EXISTENT_OBJECT not found" }
                ]
            }
        };
        // This will simulate ADTClient throwing an error with an adtStatus property
        (0, nock_1.default)(MOCKED_SAP_URL)
            .persist()
            .get(DUMMY_OBJECT_PATH)
            .reply(404, mockAdtNotFoundError, { 'Content-Type': 'application/xml' }); // ADT errors are often XML
        const env = Object.assign(Object.assign({}, process.env), { BTP_CLIENT_ID: 'test-client-id', BTP_CLIENT_SECRET: 'test-client-secret', BTP_TOKEN_URL: MOCKED_BTP_TOKEN_URL, SAP_URL: MOCKED_SAP_URL, MCP_LOG_LEVEL: 'info', NO_COLOR: '1', 
            // Ensure ADTClient doesn't ask for user/pass for BTP connection
            SAP_USER: '', SAP_PASSWORD: '' });
        serverProcess = (0, child_process_1.spawn)('node', [SERVER_ENTRY], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env,
            cwd: ROOT_DIR, // Run from project root
        });
        stdoutBuffer = [];
        stderrBuffer = [];
        yield waitForServerReady(serverProcess);
        if (!serverReady) {
            throw new Error("Server did not become ready.");
        }
    }), DEFAULT_TIMEOUT + 5000); // Add a bit more time for beforeAll
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (serverProcess && serverProcess.pid && !serverProcess.killed) {
            const exitPromise = new Promise((resolve) => {
                serverProcess.on('exit', () => resolve());
            });
            serverProcess.kill('SIGTERM'); // Send SIGTERM
            yield exitPromise;
        }
        nock_1.default.cleanAll();
        nock_1.default.enableNetConnect(); // Re-enable net connections for other tests
    }));
    it('server boots, lists tools, and login round-trips for BTP', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(serverReady).toBe(true);
        // 1. Test tools/list
        const listToolsId = nextMessageId();
        sendMessage(serverProcess, {
            jsonrpc: '2.0',
            id: listToolsId,
            method: 'tools/list',
            params: {},
        });
        const listToolsResponse = yield waitForResponse(serverProcess.stdout, listToolsId);
        expect(listToolsResponse.error).toBeUndefined();
        expect(listToolsResponse.result).toBeDefined();
        expect(Array.isArray(listToolsResponse.result.tools)).toBe(true);
        const tools = listToolsResponse.result.tools;
        const loginTool = tools.find((t) => t.name === 'login');
        expect(loginTool).toBeDefined();
        expect(loginTool.description).toBe('Authenticate with ABAP system');
        // Check for other expected tools from AuthHandlers
        const logoutTool = tools.find((t) => t.name === 'logout');
        expect(logoutTool).toBeDefined();
        const dropSessionTool = tools.find((t) => t.name === 'dropSession');
        expect(dropSessionTool).toBeDefined();
        // 2. Test callTool(login) for BTP/OAuth
        const loginId = nextMessageId();
        sendMessage(serverProcess, {
            jsonrpc: '2.0',
            id: loginId,
            method: 'callTool',
            params: { toolName: 'login', arguments: {} },
        });
        const loginResponse = yield waitForResponse(serverProcess.stdout, loginId);
        // console.log('Login Response:', JSON.stringify(loginResponse, null, 2));
        // console.log('Stdout buffer during login:', stdoutBuffer.join('\n'));
        // console.log('Stderr buffer during login:', stderrBuffer.join('\n'));
        expect(loginResponse.error).toBeUndefined();
        expect(loginResponse.result).toBeDefined();
        expect(loginResponse.result.content).toBeDefined();
        expect(Array.isArray(loginResponse.result.content)).toBe(true);
        expect(loginResponse.result.content.length).toBeGreaterThan(0);
        expect(loginResponse.result.content[0].type).toBe('text');
        // Verify BTP OAuth success message (health check OK)
        // The message is: { status: 'BTP OAuth connection active (health check indicates auth OK)' }
        const expectedLoginStatus = { status: 'BTP OAuth connection active (health check indicates auth OK)' };
        expect(loginResponse.result.content[0].text).toBe(JSON.stringify(expectedLoginStatus));
        // Verify that the server logged the BTP health check attempt
        const stdoutString = stdoutBuffer.join('');
        expect(stdoutString).toContain('AuthHandlers: BTP connection detected for login. Performing health check...');
        expect(stdoutString).toContain('AuthHandlers: BTP health check completed (expected error for non-existent object)');
    }), DEFAULT_TIMEOUT * 2); // Allow more time for multiple operations
});
