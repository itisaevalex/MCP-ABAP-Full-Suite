#!/usr/bin/env node

import { config } from 'dotenv';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode
} from "@modelcontextprotocol/sdk/types.js";
import { ADTClient, session_types } from "abap-adt-api";
import fetch from 'node-fetch';
import path from 'path';
import { AuthHandlers } from './handlers/AuthHandlers';
import { TransportHandlers } from './handlers/TransportHandlers';
import { ObjectHandlers } from './handlers/ObjectHandlers';
import { ClassHandlers } from './handlers/ClassHandlers';
import { CodeAnalysisHandlers } from './handlers/CodeAnalysisHandlers';
import { ObjectLockHandlers } from './handlers/ObjectLockHandlers';
import { ObjectSourceHandlers } from './handlers/ObjectSourceHandlers';
import { ObjectDeletionHandlers } from './handlers/ObjectDeletionHandlers';
import { ObjectManagementHandlers } from './handlers/ObjectManagementHandlers';
import { ObjectRegistrationHandlers } from './handlers/ObjectRegistrationHandlers';
import { NodeHandlers } from './handlers/NodeHandlers';
import { DiscoveryHandlers } from './handlers/DiscoveryHandlers';
import { UnitTestHandlers } from './handlers/UnitTestHandlers';
import { PrettyPrinterHandlers } from './handlers/PrettyPrinterHandlers';
import { GitHandlers } from './handlers/GitHandlers';
import { DdicHandlers } from './handlers/DdicHandlers';
import { ServiceBindingHandlers } from './handlers/ServiceBindingHandlers';
import { QueryHandlers } from './handlers/QueryHandlers';
import { FeedHandlers } from './handlers/FeedHandlers';
import { DebugHandlers } from './handlers/DebugHandlers';
import { RenameHandlers } from './handlers/RenameHandlers';
import { AtcHandlers } from './handlers/AtcHandlers';
import { TraceHandlers } from './handlers/TraceHandlers';
import { RefactorHandlers } from './handlers/RefactorHandlers';
import { RevisionHandlers } from './handlers/RevisionHandlers';

config({ path: path.resolve(__dirname, '../.env') });

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Export for testing
export async function fetchOAuthToken(tokenUrl: string, clientId: string, clientSecret: string): Promise<OAuthTokenResponse> {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch OAuth token: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return await response.json() as OAuthTokenResponse;
}

export class AbapAdtServer extends Server {
  private adtClient: ADTClient;
  private authHandlers: AuthHandlers;
  private transportHandlers: TransportHandlers;
  private objectHandlers: ObjectHandlers;
  private classHandlers: ClassHandlers;
  private codeAnalysisHandlers: CodeAnalysisHandlers;
  private objectLockHandlers: ObjectLockHandlers;
  private objectSourceHandlers: ObjectSourceHandlers;
  private objectDeletionHandlers: ObjectDeletionHandlers;
  private objectManagementHandlers: ObjectManagementHandlers;
  private objectRegistrationHandlers: ObjectRegistrationHandlers;
  private nodeHandlers: NodeHandlers;
  private discoveryHandlers: DiscoveryHandlers;
  private unitTestHandlers: UnitTestHandlers;
  private prettyPrinterHandlers: PrettyPrinterHandlers;
  private gitHandlers: GitHandlers;
  private ddicHandlers: DdicHandlers;
  private serviceBindingHandlers: ServiceBindingHandlers;
  private queryHandlers: QueryHandlers;
  private feedHandlers: FeedHandlers;
  private debugHandlers: DebugHandlers;
  private renameHandlers: RenameHandlers;
  private atcHandlers: AtcHandlers;
  private traceHandlers: TraceHandlers;
  private refactorHandlers: RefactorHandlers;
  private revisionHandlers: RevisionHandlers;
  private isBtpConnection: boolean = false;
  private btpClientId?: string;
  private btpClientSecret?: string;
  private btpTokenUrl?: string;
  private oauthToken?: string;

  constructor() {
    super(
      {
        name: "mcp-abap-abap-adt-api",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const missingVars = ['SAP_URL', 'SAP_USER', 'SAP_PASSWORD'].filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    this.btpClientId = process.env.BTP_CLIENTID;
    this.btpClientSecret = process.env.BTP_CLIENTSECRET;
    this.btpTokenUrl = process.env.BTP_TOKEN_URL;
    
    this.adtClient = new ADTClient(
      process.env.SAP_URL as string,
      '',
      '',
      process.env.SAP_CLIENT as string,
      process.env.SAP_LANGUAGE as string
    );
    this.adtClient.stateful = session_types.stateful
    
    // Initialize handlers
    this.authHandlers = new AuthHandlers(this.adtClient, () => this.isBtpConnection);
    this.transportHandlers = new TransportHandlers(this.adtClient);
    this.objectHandlers = new ObjectHandlers(this.adtClient);
    this.classHandlers = new ClassHandlers(this.adtClient);
    this.codeAnalysisHandlers = new CodeAnalysisHandlers(this.adtClient);
    this.objectLockHandlers = new ObjectLockHandlers(this.adtClient);
    this.objectSourceHandlers = new ObjectSourceHandlers(this.adtClient);
    this.objectDeletionHandlers = new ObjectDeletionHandlers(this.adtClient);
    this.objectManagementHandlers = new ObjectManagementHandlers(this.adtClient);
    this.objectRegistrationHandlers = new ObjectRegistrationHandlers(this.adtClient);
    this.nodeHandlers = new NodeHandlers(this.adtClient);
    this.discoveryHandlers = new DiscoveryHandlers(this.adtClient);
    this.unitTestHandlers = new UnitTestHandlers(this.adtClient);
    this.prettyPrinterHandlers = new PrettyPrinterHandlers(this.adtClient);
    this.gitHandlers = new GitHandlers(this.adtClient);
    this.ddicHandlers = new DdicHandlers(this.adtClient);
    this.serviceBindingHandlers = new ServiceBindingHandlers(this.adtClient);
    this.queryHandlers = new QueryHandlers(this.adtClient);
    this.feedHandlers = new FeedHandlers(this.adtClient);
    this.debugHandlers = new DebugHandlers(this.adtClient);
    this.renameHandlers = new RenameHandlers(this.adtClient);
    this.atcHandlers = new AtcHandlers(this.adtClient);
    this.traceHandlers = new TraceHandlers(this.adtClient);
    this.refactorHandlers = new RefactorHandlers(this.adtClient);
    this.revisionHandlers = new RevisionHandlers(this.adtClient);

    // Setup tool handlers
    this.setupToolHandlers();
  }

  private serializeResult(result: any) {
    try {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
          )
        }]
      };
    } catch (error) {
      return this.handleError(new McpError(
        ErrorCode.InternalError,
        'Failed to serialize result'
      ));
    }
  }

  private handleError(error: unknown) {
    if (!(error instanceof Error)) {
      error = new Error(String(error));
    }
    if (error instanceof McpError) {
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
          code: ErrorCode.InternalError
        })
      }],
      isError: true
    };
  }

  private setupToolHandlers() {
    this.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          ...this.authHandlers.getTools(),
          ...this.transportHandlers.getTools(),
          ...this.objectHandlers.getTools(),
          ...this.classHandlers.getTools(),
          ...this.codeAnalysisHandlers.getTools(),
          ...this.objectLockHandlers.getTools(),
          ...this.objectSourceHandlers.getTools(),
          ...this.objectDeletionHandlers.getTools(),
          ...this.objectManagementHandlers.getTools(),
          ...this.objectRegistrationHandlers.getTools(),
          ...this.nodeHandlers.getTools(),
          ...this.discoveryHandlers.getTools(),
          ...this.unitTestHandlers.getTools(),
          ...this.prettyPrinterHandlers.getTools(),
          ...this.gitHandlers.getTools(),
          ...this.ddicHandlers.getTools(),
          ...this.serviceBindingHandlers.getTools(),
          ...this.queryHandlers.getTools(),
          ...this.feedHandlers.getTools(),
          ...this.debugHandlers.getTools(),
          ...this.renameHandlers.getTools(),
          ...this.atcHandlers.getTools(),
          ...this.traceHandlers.getTools(),
          ...this.refactorHandlers.getTools(),
          ...this.revisionHandlers.getTools(),
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
    });

    this.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        let result: any;
        
        switch (request.params.name) {
          case 'login':
          case 'logout':
          case 'dropSession':
            result = await this.authHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'transportInfo':
          case 'createTransport':
          case 'hasTransportConfig':
          case 'transportConfigurations':
          case 'getTransportConfiguration':
          case 'setTransportsConfig':
          case 'createTransportsConfig':
          case 'userTransports':
          case 'transportsByConfig':
          case 'transportDelete':
          case 'transportRelease':
          case 'transportSetOwner':
          case 'transportAddUser':
          case 'systemUsers':
          case 'transportReference':
            result = await this.transportHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'lock':
          case 'unLock':
            result = await this.objectLockHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'objectStructure':
          case 'searchObject':
          case 'findObjectPath':
          case 'objectTypes':
          case 'reentranceTicket':
            result = await this.objectHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'classIncludes':
          case 'classComponents':
            result = await this.classHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'syntaxCheckCode':
          case 'syntaxCheckCdsUrl':
          case 'codeCompletion':
          case 'findDefinition':
          case 'usageReferences':
          case 'syntaxCheckTypes':
          case 'codeCompletionFull':
          case 'runClass':
          case 'codeCompletionElement':
          case 'usageReferenceSnippets':
          case 'fixProposals':
          case 'fixEdits':
          case 'fragmentMappings':
          case 'abapDocumentation':
            result = await this.codeAnalysisHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'getObjectSource':
          case 'setObjectSource':
            result = await this.objectSourceHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'deleteObject':
            result = await this.objectDeletionHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'activateObjects':
          case 'activateByName':
          case 'inactiveObjects':
            result = await this.objectManagementHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'objectRegistrationInfo':
          case 'validateNewObject':
          case 'createObject':
            result = await this.objectRegistrationHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'nodeContents':
          case 'mainPrograms':
            result = await this.nodeHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'featureDetails':
          case 'collectionFeatureDetails':
          case 'findCollectionByUrl':
          case 'loadTypes':
          case 'adtDiscovery':
          case 'adtCoreDiscovery':
          case 'adtCompatibiliyGraph':
            result = await this.discoveryHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'unitTestRun':
          case 'unitTestEvaluation':
          case 'unitTestOccurrenceMarkers':
          case 'createTestInclude':
            result = await this.unitTestHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'prettyPrinterSetting':
          case 'setPrettyPrinterSetting':
          case 'prettyPrinter':
            result = await this.prettyPrinterHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'gitRepos':
          case 'gitExternalRepoInfo':
          case 'gitCreateRepo':
          case 'gitPullRepo':
          case 'gitUnlinkRepo':
          case 'stageRepo':
          case 'pushRepo':
          case 'checkRepo':
          case 'remoteRepoInfo':
          case 'switchRepoBranch':
            result = await this.gitHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'annotationDefinitions':
          case 'ddicElement':
          case 'ddicRepositoryAccess':
          case 'packageSearchHelp':
            result = await this.ddicHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'publishServiceBinding':
          case 'unPublishServiceBinding':
          case 'bindingDetails':
            result = await this.serviceBindingHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'tableContents':
          case 'runQuery':
            result = await this.queryHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'feeds':
          case 'dumps':
            result = await this.feedHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'debuggerListeners':
          case 'debuggerListen':
          case 'debuggerDeleteListener':
          case 'debuggerSetBreakpoints':
          case 'debuggerDeleteBreakpoints':
          case 'debuggerAttach':
          case 'debuggerSaveSettings':
          case 'debuggerStackTrace':
          case 'debuggerVariables':
          case 'debuggerChildVariables':
          case 'debuggerStep':
          case 'debuggerGoToStack':
          case 'debuggerSetVariableValue':
            result = await this.debugHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'renameEvaluate':
          case 'renamePreview':
          case 'renameExecute':
            result = await this.renameHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'atcCustomizing':
          case 'atcCheckVariant':
          case 'createAtcRun':
          case 'atcWorklists':
          case 'atcUsers':
          case 'atcExemptProposal':
          case 'atcRequestExemption':
          case 'isProposalMessage':
          case 'atcContactUri':
          case 'atcChangeContact':
            result = await this.atcHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'tracesList':
          case 'tracesListRequests':
          case 'tracesHitList':
          case 'tracesDbAccess':
          case 'tracesStatements':
          case 'tracesSetParameters':
          case 'tracesCreateConfiguration':
          case 'tracesDeleteConfiguration':
          case 'tracesDelete':
            result = await this.traceHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'extractMethodEvaluate':
          case 'extractMethodPreview':
          case 'extractMethodExecute':
            result = await this.refactorHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'revisions':
            result = await this.revisionHandlers.handle(request.params.name, request.params.arguments);
            break;
          case 'healthcheck':
            result = { status: 'healthy', timestamp: new Date().toISOString() };
            break;
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }

        return this.serializeResult(result);
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  private async initializeAdtClient() {
    if (this.btpClientId && this.btpClientSecret && this.btpTokenUrl) {
      try {
        console.log('Attempting BTP OAuth connection setup with BearerFetcher...');
        
        // Define the BearerFetcher function for ADTClient
        const fetchBearerToken = async (): Promise<string> => {
          if (!this.btpTokenUrl || !this.btpClientId || !this.btpClientSecret) {
            // This should ideally not happen if we are in this block
            throw new Error('BTP credentials missing for BearerFetcher');
          }
          console.log('BearerFetcher: Fetching new OAuth token...');
          const tokenResponse = await fetchOAuthToken(this.btpTokenUrl, this.btpClientId, this.btpClientSecret);
          this.oauthToken = tokenResponse.access_token; // Store for potential inspection/refresh
          this.isBtpConnection = true; // Set connection type
          console.log('BearerFetcher: Successfully fetched and stored OAuth token.');
          return tokenResponse.access_token;
        };

        this.adtClient = new ADTClient(
          process.env.SAP_URL as string,
          '', // User not strictly needed by ADTClient when BearerFetcher is used
          fetchBearerToken, // Pass the fetcher function
          process.env.SAP_CLIENT as string,
          process.env.SAP_LANGUAGE as string,
          { // ClientOptions object
            headers: { // Standard ADT headers
              'Accept': 'application/vnd.sap.adt.core.v1+xml',
              'Content-Type': 'application/vnd.sap.adt.core.v1+xml'
              // Authorization header will be handled by ADTClient via BearerFetcher
            }
          }
        );
        this.adtClient.stateful = session_types.stateful;
        this.isBtpConnection = true; // Confirm BTP mode
        console.log('ADTClient configured for BTP OAuth using BearerFetcher.');
      } catch (error) {
        console.error('BTP OAuth token fetch or ADTClient setup failed, falling back to basic auth if configured:', error);
        if (process.env.SAP_USER && process.env.SAP_PASSWORD) {
          this.isBtpConnection = false;
          this.adtClient = new ADTClient(
            process.env.SAP_URL as string,
            process.env.SAP_USER as string,
            process.env.SAP_PASSWORD as string,
            process.env.SAP_CLIENT as string,
            process.env.SAP_LANGUAGE as string
          );
          this.adtClient.stateful = session_types.stateful;
          console.log('ADTClient configured for basic authentication after OAuth fallback.');
        } else {
          throw new Error('BTP OAuth failed and no basic authentication credentials provided.');
        }
      }
    } else {
      console.log('Configuring ADTClient for basic authentication (no BTP OAuth credentials found).');
      this.isBtpConnection = false;
      this.adtClient = new ADTClient(
        process.env.SAP_URL as string,
        process.env.SAP_USER as string,
        process.env.SAP_PASSWORD as string,
        process.env.SAP_CLIENT as string,
        process.env.SAP_LANGUAGE as string
      );
      this.adtClient.stateful = session_types.stateful;
    }

    this.authHandlers = new AuthHandlers(this.adtClient, () => this.isBtpConnection);
    this.transportHandlers = new TransportHandlers(this.adtClient);
    this.objectHandlers = new ObjectHandlers(this.adtClient);
    this.classHandlers = new ClassHandlers(this.adtClient);
    this.codeAnalysisHandlers = new CodeAnalysisHandlers(this.adtClient);
    this.objectLockHandlers = new ObjectLockHandlers(this.adtClient);
    this.objectSourceHandlers = new ObjectSourceHandlers(this.adtClient);
    this.objectDeletionHandlers = new ObjectDeletionHandlers(this.adtClient);
    this.objectManagementHandlers = new ObjectManagementHandlers(this.adtClient);
    this.objectRegistrationHandlers = new ObjectRegistrationHandlers(this.adtClient);
    this.nodeHandlers = new NodeHandlers(this.adtClient);
    this.discoveryHandlers = new DiscoveryHandlers(this.adtClient);
    this.unitTestHandlers = new UnitTestHandlers(this.adtClient);
    this.prettyPrinterHandlers = new PrettyPrinterHandlers(this.adtClient);
    this.gitHandlers = new GitHandlers(this.adtClient);
    this.ddicHandlers = new DdicHandlers(this.adtClient);
    this.serviceBindingHandlers = new ServiceBindingHandlers(this.adtClient);
    this.queryHandlers = new QueryHandlers(this.adtClient);
    this.feedHandlers = new FeedHandlers(this.adtClient);
    this.debugHandlers = new DebugHandlers(this.adtClient);
    this.renameHandlers = new RenameHandlers(this.adtClient);
    this.atcHandlers = new AtcHandlers(this.adtClient);
    this.traceHandlers = new TraceHandlers(this.adtClient);
    this.refactorHandlers = new RefactorHandlers(this.adtClient);
    this.revisionHandlers = new RevisionHandlers(this.adtClient);
  }

  async run() {
    await this.initializeAdtClient();
    this.setupToolHandlers();
    
    const transport = new StdioServerTransport();
    await this.connect(transport);
    console.log(`mcp-abap-abap-adt-api server running. Mode: ${this.isBtpConnection ? 'BTP OAuth' : 'Basic Auth'}`);
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      await this.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await this.close();
      process.exit(0);
    });
    
    // Handle errors
    this.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
  }
}

// Create and run server instance only if this script is executed directly
if (require.main === module) {
  const server = new AbapAdtServer();
  server.run().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}
