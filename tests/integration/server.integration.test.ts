import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import nock from 'nock';
import { Readable } from 'stream';

const ROOT_DIR = path.join(__dirname, '../../'); // Adjust as necessary to point to project root
const SERVER_ENTRY = path.join(ROOT_DIR, 'dist/index.js');
const MOCKED_BTP_TOKEN_URL = 'http://localhost:12345/oauth/token';
const MOCKED_SAP_URL = 'http://dummy.sap.system:443';
const DUMMY_OBJECT_PATH = '/sap/bc/adt/repository/nodestructure/DEV/CLAS/SOME_NON_EXISTENT_OBJECT';

// Helper to manage message IDs for JSON-RPC
let messageCounter = 1;
function nextMessageId(): number {
  return messageCounter++;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: any;
}

describe('MCP ABAP ADT API - Integration Tests', () => {
  let serverProcess: ChildProcessWithoutNullStreams;
  let serverReady = false;
  let stdoutBuffer: string[] = [];
  let stderrBuffer: string[] = [];

  const DEFAULT_TIMEOUT = 15000; // 15 seconds for server ops

  function sendMessage(child: ChildProcessWithoutNullStreams, message: JsonRpcRequest) {
    const strMessage = JSON.stringify(message) + '\n';
    // console.log(`SENDING: ${strMessage.trim()}`);
    child.stdin.write(strMessage);
  }

  function waitForResponse(
    stream: Readable,
    expectedId: number,
    timeout: number = DEFAULT_TIMEOUT
  ): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      let accumulatedData = '';
      const onData = (chunk: Buffer) => {
        accumulatedData += chunk.toString();
        // console.log(`ACCUMULATED: ${accumulatedData}`);
        const lines = accumulatedData.split('\n');
        accumulatedData = lines.pop() || ''; // Keep last partial line

        for (const line of lines) {
          if (line.trim() === '') continue;
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
          } catch (e) {
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
  
  function waitForServerReady(child: ChildProcessWithoutNullStreams, timeout: number = DEFAULT_TIMEOUT): Promise<void> {
    return new Promise((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        const output = chunk.toString();
        stdoutBuffer.push(output);
        // console.log(`SERVER STDOUT: ${output}`);
        if (output.includes('mcp-abap-abap-adt-api server running.')) {
          child.stdout.removeListener('data', onData);
          clearTimeout(timer);
          serverReady = true;
          resolve();
        }
      };
      const onStderrData = (chunk: Buffer) => {
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
        reject(new Error(`Timeout waiting for server ready after ${timeout}ms. Stdout: ${fullStdout.substring(0,500)}. Stderr: ${fullStderr.substring(0,500)}`));
      }, timeout);
    });
  }


  beforeAll(async () => {
    nock.disableNetConnect(); // Ensure no real network calls are made
    nock.enableNetConnect('127.0.0.1'); // Allow localhost connections (e.g. if server uses 127.0.0.1)


    // Mock BTP OAuth token endpoint
    nock(MOCKED_BTP_TOKEN_URL)
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
    nock(MOCKED_SAP_URL)
        .persist()
        .get(DUMMY_OBJECT_PATH)
        .reply(404, mockAdtNotFoundError, { 'Content-Type': 'application/xml' }); // ADT errors are often XML
    
    const env = {
      ...process.env,
      BTP_CLIENT_ID: 'test-client-id',
      BTP_CLIENT_SECRET: 'test-client-secret',
      BTP_TOKEN_URL: MOCKED_BTP_TOKEN_URL,
      SAP_URL: MOCKED_SAP_URL,
      MCP_LOG_LEVEL: 'info', // or 'debug' for more verbose server logs
      NO_COLOR: '1',
      // Provide dummy user/pass even for BTP to satisfy ADTClient's initial non-empty check
      // This is a workaround; ADTClient should ideally rely on the bearer fetcher alone.
      SAP_USER: 'dummyBtpUser', 
      SAP_PASSWORD: 'dummyBtpPassword',
    };

    serverProcess = spawn('node', [SERVER_ENTRY], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      cwd: ROOT_DIR, // Run from project root
    });
    
    stdoutBuffer = [];
    stderrBuffer = [];

    await waitForServerReady(serverProcess);
    if (!serverReady) {
        throw new Error("Server did not become ready.");
    }
  }, DEFAULT_TIMEOUT + 5000); // Add a bit more time for beforeAll

  afterAll(async () => {
    if (serverProcess && serverProcess.pid && !serverProcess.killed) {
      const exitPromise = new Promise<void>((resolve) => {
        serverProcess.on('exit', () => resolve());
      });
      serverProcess.kill('SIGTERM'); // Send SIGTERM
      await exitPromise;
    }
    nock.cleanAll();
    nock.enableNetConnect(); // Re-enable net connections for other tests
  });

  it('server boots, lists tools, and login round-trips for BTP', async () => {
    expect(serverReady).toBe(true);

    // 1. Test tools/list
    const listToolsId = nextMessageId();
    sendMessage(serverProcess, {
      jsonrpc: '2.0',
      id: listToolsId,
      method: 'tools/list',
      params: {},
    });

    const listToolsResponse = await waitForResponse(serverProcess.stdout, listToolsId);
    expect(listToolsResponse.error).toBeUndefined();
    expect(listToolsResponse.result).toBeDefined();
    expect(Array.isArray(listToolsResponse.result.tools)).toBe(true);
    const tools = listToolsResponse.result.tools;
    
    const loginTool = tools.find((t: any) => t.name === 'login');
    expect(loginTool).toBeDefined();
    expect(loginTool.description).toBe('Authenticate with ABAP system');

    // Check for other expected tools from AuthHandlers
    const logoutTool = tools.find((t: any) => t.name === 'logout');
    expect(logoutTool).toBeDefined();
    const dropSessionTool = tools.find((t: any) => t.name === 'dropSession');
    expect(dropSessionTool).toBeDefined();


    // 2. Test callTool(login) for BTP/OAuth
    const loginId = nextMessageId();
    sendMessage(serverProcess, {
      jsonrpc: '2.0',
      id: loginId,
      method: 'tools/call',
      params: { name: 'login', arguments: {} },
    });

    const loginResponse = await waitForResponse(serverProcess.stdout, loginId);
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

  }, DEFAULT_TIMEOUT * 2); // Allow more time for multiple operations
}); 