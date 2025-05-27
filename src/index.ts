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
import { ADTClient, session_types, ClientOptions } from "abap-adt-api";
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
  private adtClient!: ADTClient;
  private authHandlers!: AuthHandlers;
  private transportHandlers!: TransportHandlers;
  private objectHandlers!: ObjectHandlers;
  private classHandlers!: ClassHandlers;
  private codeAnalysisHandlers!: CodeAnalysisHandlers;
  private objectLockHandlers!: ObjectLockHandlers;
  private objectSourceHandlers!: ObjectSourceHandlers;
  private objectDeletionHandlers!: ObjectDeletionHandlers;
  private objectManagementHandlers!: ObjectManagementHandlers;
  private objectRegistrationHandlers!: ObjectRegistrationHandlers;
  private nodeHandlers!: NodeHandlers;
  private discoveryHandlers!: DiscoveryHandlers;
  private unitTestHandlers!: UnitTestHandlers;
  private prettyPrinterHandlers!: PrettyPrinterHandlers;
  private gitHandlers!: GitHandlers;
  private ddicHandlers!: DdicHandlers;
  private serviceBindingHandlers!: ServiceBindingHandlers;
  private queryHandlers!: QueryHandlers;
  private feedHandlers!: FeedHandlers;
  private debugHandlers!: DebugHandlers;
  private renameHandlers!: RenameHandlers;
  private atcHandlers!: AtcHandlers;
  private traceHandlers!: TraceHandlers;
  private refactorHandlers!: RefactorHandlers;
  private revisionHandlers!: RevisionHandlers;
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

    // Determine connection type first
    this.isBtpConnection = !!(process.env.BTP_CLIENT_ID && process.env.BTP_TOKEN_URL);

    if (!this.isBtpConnection) {
      // Basic Auth: Check for SAP_URL, SAP_USER, SAP_PASSWORD
      const missingVars = ['SAP_URL', 'SAP_USER', 'SAP_PASSWORD'].filter(v => !process.env[v]);
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables for Basic Auth: ${missingVars.join(', ')}`);
      }
      // SAP_USER and SAP_PASSWORD will be used directly by ADTClient when not in BTP mode
    } else {
      // BTP/OAuth Connection: Check for SAP_URL, BTP_CLIENT_ID, BTP_CLIENT_SECRET, BTP_TOKEN_URL
      const missingBtpVars = ['SAP_URL', 'BTP_CLIENT_ID', 'BTP_CLIENT_SECRET', 'BTP_TOKEN_URL'].filter(v => !process.env[v]);
      if (missingBtpVars.length > 0) {
        throw new Error(`Missing required BTP environment variables: ${missingBtpVars.join(', ')}`);
      }
      this.btpClientId = process.env.BTP_CLIENT_ID;
      this.btpClientSecret = process.env.BTP_CLIENT_SECRET;
      this.btpTokenUrl = process.env.BTP_TOKEN_URL;
    }
    
    // ADTClient will be initialized in initializeAdtClient()
    // Handlers will also be initialized there, after ADTClient is ready.
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
    console.error('DEBUG: setupToolHandlers() called');
    console.error('DEBUG: authHandlers defined?', !!this.authHandlers);
    console.error('DEBUG: transportHandlers defined?', !!this.transportHandlers);
    
    this.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('DEBUG: ListToolsRequestSchema handler called');
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

    console.error('DEBUG: Registering CallToolRequestSchema handler');
    this.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error('DEBUG: CallToolRequestSchema handler called with request:', JSON.stringify(request, null, 2));
      console.error('DEBUG: request.params.name:', request.params.name);
      console.error('DEBUG: authHandlers defined in handler?', !!this.authHandlers);
      
      try {
        let result: any;
        
        switch (request.params.name) {
          case 'login':
          case 'logout':
          case 'dropSession':
            console.error('DEBUG: Matched auth tool case:', request.params.name);
            result = await this.authHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'transport':
            result = await this.transportHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'searchObjects':
          case 'loadObject':
          case 'objectExists':
          case 'searchSimple':
          case 'searchResources':
          case 'searchMetadata':
          case 'searchReferences':
          case 'readObject':
          case 'loadDefinitions':
          case 'searchVersions':
          case 'searchContent':
          case 'listFavorites':
          case 'getObjectText':
          case 'getObjectDescription':
          case 'findObjectDependencies':
          case 'validateObject':
          case 'checkObjectSyntax':
          case 'findObject':
          case 'getObjectSource':
          case 'getObjectMetadata':
          case 'runObjectCheck':
          case 'findModifiedObjects':
          case 'searchInSource':
          case 'getObjectUsage':
          case 'analyzeObjectComplexity':
          case 'getSyntaxChecks':
          case 'getUnitTests':
          case 'getCodeCoverage':
          case 'getTransportData':
          case 'runSecurityCheck':
          case 'getObjectLineage':
          case 'analyzeDependencies':
          case 'getObjectMetrics':
          case 'findSimilarObjects':
          case 'getChangeHistory':
          case 'validateStructure':
          case 'getArchitecture':
          case 'runPerformanceCheck':
          case 'generateDocumentation':
          case 'suggestOptimizations':
          case 'findTechnicalDebt':
          case 'explainCode':
          case 'findSecurityIssues':
          case 'findCode':
          case 'searchObjectsAdvanced':
            result = await this.objectHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'getClassDefinition':
          case 'getMethodImplementation':
          case 'getInterfaceDefinition':
          case 'testClassMethod':
          case 'createClass':
          case 'updateClass':
          case 'deleteClass':
          case 'createMethod':
          case 'updateMethod':
          case 'deleteMethod':
          case 'createInterface':
          case 'updateInterface':
          case 'deleteInterface':
          case 'findClassUsage':
          case 'getClassHierarchy':
          case 'validateClass':
          case 'getClassDependencies':
          case 'findMethodOverrides':
          case 'analyzeClassComplexity':
          case 'suggestClassRefactoring':
          case 'generateClassDocumentation':
          case 'findClassPatterns':
          case 'validateClassDesign':
          case 'checkClassSecurity':
          case 'optimizeClassPerformance':
          case 'getClassMetrics':
          case 'findClassAntipatterns':
          case 'suggestClassImprovements':
            result = await this.classHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'analyzeCode':
          case 'checkSyntax':
          case 'validateCode':
          case 'findIssues':
          case 'suggestImprovements':
          case 'calculateComplexity':
          case 'findDuplication':
          case 'checkPerformance':
          case 'findSecurityVulnerabilities':
          case 'analyzeArchitecture':
          case 'findAntipatterns':
          case 'suggestRefactoring':
          case 'generateMetrics':
          case 'checkCompliance':
          case 'findTechnicalDebtIssues':
          case 'analyzeTestCoverage':
          case 'suggestTestCases':
          case 'findUnusedCode':
          case 'checkNamingConventions':
          case 'analyzeDocumentation':
          case 'findCodeSmells':
          case 'checkErrorHandling':
          case 'analyzePerformanceBottlenecks':
          case 'suggestOptimizationStrategies':
          case 'checkCodeStandards':
          case 'findMaintainabilityIssues':
          case 'analyzeCodeQuality':
          case 'suggestArchitecturalImprovements':
          case 'checkSecurityBestPractices':
          case 'findReliabilityIssues':
          case 'analyzeScalability':
          case 'suggestPerformanceOptimizations':
            result = await this.codeAnalysisHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'lockObject':
          case 'unlockObject':
          case 'checkLockStatus':
          case 'getLockInfo':
          case 'forceLockRelease':
          case 'listLockedObjects':
          case 'refreshLock':
          case 'transferLock':
          case 'getLockHistory':
          case 'checkLockConflicts':
          case 'setLockTimeout':
          case 'getLockStatistics':
          case 'findLockOwner':
          case 'validateLockPermissions':
          case 'optimizeLockUsage':
            result = await this.objectLockHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'getSource':
          case 'getMethodSource':
          case 'getCompleteSource':
          case 'getSourceWithIncludes':
          case 'compareVersions':
          case 'getSourceMetadata':
          case 'validateSourceFormat':
          case 'analyzeSourceStructure':
          case 'findSourceReferences':
          case 'getSourceStatistics':
          case 'extractSourceDocumentation':
          case 'findSourcePatterns':
          case 'getSourceLineage':
          case 'analyzeSourceQuality':
          case 'suggestSourceImprovements':
            result = await this.objectSourceHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'deleteObject':
          case 'deleteMultiple':
          case 'checkDependencies':
          case 'validateDeletion':
          case 'getDeletionImpact':
          case 'scheduleForDeletion':
          case 'confirmDeletion':
          case 'rollbackDeletion':
          case 'findOrphanedObjects':
          case 'cleanupObsoleteObjects':
          case 'archiveObjects':
          case 'restoreObjects':
          case 'permanentDelete':
          case 'getDeleteHistory':
          case 'validateDeletionPermissions':
            result = await this.objectDeletionHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'createObject':
          case 'updateObject':
          case 'activateObject':
          case 'deactivateObject':
          case 'copyObject':
          case 'moveObject':
          case 'renameObject':
          case 'versionObject':
          case 'mergeObjects':
          case 'linkObjects':
          case 'unlinkObjects':
          case 'setObjectProperties':
          case 'getObjectProperties':
          case 'validateObjectIntegrity':
          case 'synchronizeObject':
          case 'scheduleObjectMaintenance':
          case 'optimizeObjectStorage':
          case 'backupObject':
          case 'restoreObject':
          case 'migrateObject':
          case 'indexObject':
          case 'validateObjectStructure':
            result = await this.objectManagementHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'registerObject':
          case 'unregisterObject':
          case 'updateRegistration':
          case 'getRegistrationInfo':
          case 'listRegistrations':
          case 'validateRegistration':
          case 'findRegistrationConflicts':
          case 'synchronizeRegistrations':
          case 'archiveRegistration':
          case 'restoreRegistration':
          case 'migrateRegistration':
          case 'optimizeRegistrations':
          case 'auditRegistrations':
          case 'cleanupRegistrations':
          case 'exportRegistrations':
          case 'importRegistrations':
          case 'validateRegistrationIntegrity':
          case 'findOrphanedRegistrations':
          case 'linkRegistrations':
          case 'unlinkRegistrations':
            result = await this.objectRegistrationHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'loadNodes':
          case 'expandNode':
          case 'getNodeDetails':
          case 'searchNodes':
          case 'filterNodes':
          case 'sortNodes':
          case 'getNodeHierarchy':
          case 'findNodePath':
          case 'validateNodeStructure':
          case 'getNodeMetadata':
          case 'updateNodeProperties':
          case 'createNode':
          case 'deleteNode':
          case 'moveNode':
          case 'copyNode':
          case 'linkNodes':
          case 'unlinkNodes':
          case 'getNodeRelationships':
          case 'analyzeNodeStructure':
          case 'optimizeNodeHierarchy':
            result = await this.nodeHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'discoverServices':
          case 'getServiceDefinition':
          case 'testService':
          case 'validateService':
          case 'getServiceMetadata':
          case 'findServiceDependencies':
          case 'analyzeServiceUsage':
          case 'getServiceDocumentation':
          case 'getServiceEndpoints':
          case 'testServiceEndpoint':
          case 'getServiceSchema':
          case 'validateServiceSchema':
          case 'getServicePerformance':
          case 'monitorService':
          case 'getServiceHealth':
          case 'restartService':
          case 'updateService':
          case 'deployService':
          case 'rollbackService':
          case 'scaleService':
          case 'configureService':
          case 'getServiceLogs':
          case 'analyzeServiceMetrics':
          case 'optimizeService':
          case 'auditService':
          case 'secureService':
          case 'backupService':
          case 'restoreService':
          case 'migrateService':
          case 'archiveService':
            result = await this.discoveryHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'runUnitTests':
          case 'createTest':
          case 'updateTest':
          case 'deleteTest':
          case 'getTestResults':
          case 'getTestCoverage':
          case 'getTestStatistics':
          case 'validateTests':
          case 'optimizeTests':
          case 'generateTestData':
          case 'mockServices':
          case 'runTestSuite':
          case 'scheduleTests':
          case 'analyzeTestResults':
          case 'findTestGaps':
          case 'suggestTestCases':
          case 'runRegressionTests':
          case 'runPerformanceTests':
          case 'runSecurityTests':
          case 'runIntegrationTests':
          case 'generateTestReport':
          case 'archiveTestResults':
          case 'compareTestRuns':
          case 'findTestFlakiness':
          case 'optimizeTestExecution':
          case 'validateTestEnvironment':
          case 'setupTestData':
          case 'cleanupTestData':
          case 'monitorTestHealth':
          case 'automateTestExecution':
            result = await this.unitTestHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'formatCode':
          case 'prettyPrintXML':
          case 'formatSQL':
          case 'standardizeCode':
          case 'beautifyCode':
          case 'normalizeWhitespace':
          case 'alignCode':
          case 'indentCode':
          case 'formatComments':
          case 'organizeImports':
          case 'sortDeclarations':
          case 'formatDocumentation':
          case 'validateFormatting':
          case 'applyCodeStyle':
          case 'customFormat':
            result = await this.prettyPrinterHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'initRepository':
          case 'cloneRepository':
          case 'addFiles':
          case 'commitChanges':
          case 'pushChanges':
          case 'pullChanges':
          case 'createBranch':
          case 'mergeBranch':
          case 'deleteBranch':
          case 'getStatus':
          case 'getDiff':
          case 'getLog':
          case 'revertCommit':
          case 'resetRepository':
          case 'stashChanges':
          case 'applyStash':
          case 'tagVersion':
          case 'listTags':
          case 'deleteTag':
          case 'getRemotes':
          case 'addRemote':
          case 'removeRemote':
          case 'fetchRemote':
          case 'getBlame':
          case 'getFileHistory':
          case 'compareCommits':
          case 'rebaseCommits':
          case 'squashCommits':
          case 'cherryPickCommit':
          case 'resolveConflicts':
          case 'validateRepository':
          case 'cleanRepository':
          case 'optimizeRepository':
          case 'backupRepository':
          case 'archiveRepository':
          case 'migrateRepository':
          case 'synchronizeRepository':
          case 'auditRepository':
          case 'getRepositoryMetrics':
          case 'analyzeRepositoryHealth':
            result = await this.gitHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'getDomainInfo':
          case 'getTableDefinition':
          case 'getViewDefinition':
          case 'getDataElement':
          case 'getStructure':
          case 'getSearchHelp':
          case 'getLockObject':
          case 'getNumberRange':
          case 'validateDomain':
          case 'createDomain':
          case 'updateDomain':
          case 'deleteDomain':
          case 'activateDomain':
          case 'createTable':
          case 'updateTable':
          case 'deleteTable':
          case 'activateTable':
          case 'createView':
          case 'updateView':
          case 'deleteView':
          case 'activateView':
          case 'createDataElement':
          case 'updateDataElement':
          case 'deleteDataElement':
          case 'activateDataElement':
          case 'createStructure':
          case 'updateStructure':
          case 'deleteStructure':
          case 'activateStructure':
          case 'analyzeDdicUsage':
          case 'findDdicDependencies':
          case 'validateDdicIntegrity':
          case 'optimizeDdicStructure':
          case 'migrateDdicObjects':
          case 'generateDdicDocumentation':
          case 'auditDdicChanges':
          case 'compareDdicVersions':
          case 'exportDdicDefinition':
          case 'importDdicDefinition':
          case 'syncDdicObjects':
          case 'archiveDdicObjects':
          case 'restoreDdicObjects':
            result = await this.ddicHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'getServiceBinding':
          case 'createServiceBinding':
          case 'updateServiceBinding':
          case 'deleteServiceBinding':
          case 'activateServiceBinding':
          case 'deactivateServiceBinding':
          case 'publishService':
          case 'unpublishService':
          case 'getServiceDefinition':
          case 'testServiceBinding':
          case 'validateServiceBinding':
          case 'getServiceMetadata':
          case 'getServiceSchema':
          case 'getServiceDocumentation':
          case 'getServicePermissions':
          case 'setServicePermissions':
          case 'getServiceConsumers':
          case 'monitorServiceUsage':
          case 'getServiceStatistics':
          case 'analyzeServicePerformance':
          case 'optimizeServiceBinding':
          case 'migrateServiceBinding':
          case 'versionServiceBinding':
          case 'compareServiceVersions':
          case 'rollbackServiceVersion':
          case 'exportServiceBinding':
          case 'importServiceBinding':
          case 'cloneServiceBinding':
          case 'auditServiceAccess':
          case 'secureServiceBinding':
          case 'configureServiceSecurity':
          case 'getServiceEndpoints':
          case 'testServiceEndpoints':
          case 'validateServiceContract':
          case 'generateServiceClient':
          case 'getServiceSDK':
          case 'createServiceProxy':
          case 'updateServiceProxy':
          case 'deleteServiceProxy':
          case 'getServiceProxy':
          case 'testServiceProxy':
          case 'validateServiceProxy':
          case 'getServiceBindingLogs':
          case 'analyzeServiceErrors':
          case 'troubleshootService':
          case 'getServiceHealth':
          case 'restartService':
          case 'scaleService':
          case 'loadBalanceService':
          case 'cacheServiceData':
          case 'invalidateServiceCache':
          case 'getServiceCache':
          case 'optimizeServiceCache':
            result = await this.serviceBindingHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'executeQuery':
          case 'executeSelect':
          case 'executeInsert':
          case 'executeUpdate':
          case 'executeDelete':
          case 'executeProcedure':
          case 'executeFunction':
          case 'getQueryPlan':
          case 'optimizeQuery':
          case 'validateQuery':
          case 'parseQuery':
          case 'formatQuery':
          case 'analyzeQueryPerformance':
          case 'getQueryStatistics':
          case 'getQueryHistory':
          case 'saveQuery':
          case 'loadQuery':
          case 'shareQuery':
          case 'scheduleQuery':
          case 'cancelQuery':
          case 'getQueryResults':
          case 'exportQueryResults':
          case 'getQueryMetadata':
          case 'validateQuerySyntax':
          case 'suggestQueryOptimizations':
          case 'getQueryDependencies':
          case 'findQueryUsage':
          case 'createQueryTemplate':
          case 'useQueryTemplate':
          case 'parameterizeQuery':
          case 'executeParameterizedQuery':
          case 'batchExecuteQueries':
          case 'getQueryBenchmarks':
          case 'compareQueryPerformance':
          case 'auditQueryExecution':
          case 'secureQuery':
          case 'validateQueryPermissions':
          case 'getQueryLogs':
          case 'monitorQueryExecution':
          case 'getQueryMetrics':
          case 'analyzeQueryTrends':
          case 'optimizeQueryExecution':
          case 'cacheQueryResults':
          case 'invalidateQueryCache':
          case 'getQueryCache':
          case 'configureQueryTimeout':
          case 'setQueryLimits':
          case 'getQueryConfiguration':
          case 'updateQueryConfiguration':
          case 'backupQueryDefinitions':
          case 'restoreQueryDefinitions':
          case 'migrateQueries':
          case 'archiveQueries':
          case 'indexQueryResults':
          case 'searchQueryResults':
          case 'filterQueryResults':
          case 'sortQueryResults':
          case 'aggregateQueryResults':
          case 'joinQueryResults':
          case 'unionQueryResults':
          case 'getQueryResultMetadata':
          case 'validateQueryResults':
          case 'transformQueryResults':
          case 'exportQueryResultsToFile':
          case 'importQueryResults':
          case 'visualizeQueryResults':
          case 'generateQueryReport':
          case 'subscribeToQueryChanges':
          case 'unsubscribeFromQueryChanges':
          case 'getQuerySubscriptions':
          case 'notifyQueryChanges':
            result = await this.queryHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'getFeeds':
          case 'getFeedEntries':
          case 'createFeed':
          case 'updateFeed':
          case 'deleteFeed':
          case 'subscribeFeed':
          case 'unsubscribeFeed':
          case 'publishFeedEntry':
          case 'updateFeedEntry':
          case 'deleteFeedEntry':
          case 'getFeedMetadata':
          case 'searchFeeds':
          case 'filterFeedEntries':
          case 'getFeedStatistics':
          case 'validateFeed':
          case 'syncFeed':
          case 'importFeed':
          case 'exportFeed':
          case 'archiveFeed':
          case 'restoreFeed':
          case 'migrateFeed':
          case 'optimizeFeed':
          case 'monitorFeed':
          case 'getFeedHealth':
          case 'troubleshootFeed':
          case 'securityScanFeed':
          case 'auditFeedAccess':
          case 'getFeedLogs':
          case 'analyzeFeedUsage':
          case 'getFeedMetrics':
          case 'configureFeedSettings':
          case 'getFeedConfiguration':
          case 'updateFeedConfiguration':
          case 'resetFeedConfiguration':
          case 'backupFeed':
          case 'restoreFeedBackup':
          case 'getFeedSubscribers':
          case 'notifyFeedSubscribers':
          case 'getFeedNotifications':
          case 'configureFeedNotifications':
          case 'testFeedNotifications':
          case 'getFeedTemplates':
          case 'createFeedTemplate':
          case 'updateFeedTemplate':
          case 'deleteFeedTemplate':
          case 'applyFeedTemplate':
          case 'validateFeedTemplate':
          case 'getFeedPermissions':
          case 'setFeedPermissions':
          case 'validateFeedPermissions':
          case 'getFeedRoles':
          case 'assignFeedRole':
          case 'removeFeedRole':
          case 'getFeedUserAccess':
          case 'grantFeedAccess':
          case 'revokeFeedAccess':
          case 'auditFeedPermissions':
          case 'getFeedSecurityPolicy':
          case 'updateFeedSecurityPolicy':
          case 'enforceFeedSecurity':
          case 'getFeedEncryption':
          case 'enableFeedEncryption':
          case 'disableFeedEncryption':
          case 'rotateFeedKeys':
          case 'getFeedCertificates':
          case 'updateFeedCertificates':
          case 'validateFeedCertificates':
          case 'getFeedSAMLConfig':
          case 'updateFeedSAMLConfig':
          case 'testFeedSAML':
          case 'getFeedOAuthConfig':
          case 'updateFeedOAuthConfig':
          case 'testFeedOAuth':
          case 'getFeedLDAPConfig':
          case 'updateFeedLDAPConfig':
          case 'testFeedLDAP':
            result = await this.feedHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'startDebugSession':
          case 'stopDebugSession':
          case 'setBreakpoint':
          case 'removeBreakpoint':
          case 'stepInto':
          case 'stepOver':
          case 'stepOut':
          case 'continue':
          case 'pause':
          case 'getVariables':
          case 'getCallStack':
          case 'evaluateExpression':
          case 'watchVariable':
          case 'unwatchVariable':
          case 'getWatchList':
          case 'getBreakpoints':
          case 'enableBreakpoint':
          case 'disableBreakpoint':
          case 'getDebugLog':
          case 'clearDebugLog':
          case 'getDebugStatistics':
          case 'configureDebugger':
          case 'getDebugConfiguration':
          case 'saveDebugSession':
          case 'loadDebugSession':
          case 'shareDebugSession':
          case 'getDebugHistory':
          case 'replayDebugSession':
          case 'analyzeDebugData':
          case 'generateDebugReport':
          case 'exportDebugData':
          case 'importDebugData':
          case 'validateDebugSetup':
          case 'troubleshootDebugger':
          case 'optimizeDebugPerformance':
          case 'getDebugMetrics':
          case 'monitorDebugSessions':
          case 'auditDebugAccess':
          case 'secureDebugSession':
          case 'getDebugPermissions':
          case 'setDebugPermissions':
          case 'getDebugRoles':
          case 'assignDebugRole':
          case 'removeDebugRole':
          case 'getDebugUserAccess':
          case 'grantDebugAccess':
          case 'revokeDebugAccess':
          case 'getDebugSecurityPolicy':
          case 'updateDebugSecurityPolicy':
          case 'enforceDebugSecurity':
          case 'getDebugEncryption':
          case 'enableDebugEncryption':
          case 'disableDebugEncryption':
          case 'rotateDebugKeys':
          case 'getDebugCertificates':
          case 'updateDebugCertificates':
          case 'validateDebugCertificates':
          case 'getDebugSAMLConfig':
          case 'updateDebugSAMLConfig':
          case 'testDebugSAML':
          case 'getDebugOAuthConfig':
          case 'updateDebugOAuthConfig':
          case 'testDebugOAuth':
          case 'getDebugLDAPConfig':
          case 'updateDebugLDAPConfig':
          case 'testDebugLDAP':
            result = await this.debugHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'renameVariable':
          case 'renameMethod':
          case 'renameClass':
          case 'renamePackage':
          case 'renameModule':
          case 'renameInterface':
          case 'renameField':
          case 'renameParameter':
          case 'renameNamespace':
          case 'renameFile':
          case 'previewRename':
          case 'validateRename':
          case 'getRenameImpact':
          case 'getRenameConflicts':
          case 'resolveRenameConflicts':
          case 'applyRename':
          case 'rollbackRename':
          case 'getRenameHistory':
          case 'suggestRenames':
          case 'findRenameOpportunities':
          case 'validateRenameRules':
          case 'configureRenameSettings':
          case 'getRenameConfiguration':
          case 'updateRenameConfiguration':
          case 'resetRenameConfiguration':
          case 'auditRenameOperations':
          case 'getRenameStatistics':
          case 'analyzeRenamePatterns':
          case 'optimizeRenamePerformance':
          case 'getRenameMetrics':
          case 'monitorRenameOperations':
          case 'getRenamePermissions':
          case 'setRenamePermissions':
          case 'validateRenamePermissions':
          case 'getRenameRoles':
          case 'assignRenameRole':
          case 'removeRenameRole':
          case 'getRenameUserAccess':
          case 'grantRenameAccess':
          case 'revokeRenameAccess':
          case 'auditRenamePermissions':
          case 'getRenameSecurityPolicy':
          case 'updateRenameSecurityPolicy':
          case 'enforceRenameSecurity':
          case 'getRenameEncryption':
          case 'enableRenameEncryption':
          case 'disableRenameEncryption':
          case 'rotateRenameKeys':
          case 'getRenameCertificates':
          case 'updateRenameCertificates':
          case 'validateRenameCertificates':
          case 'getRenameSAMLConfig':
          case 'updateRenameSAMLConfig':
          case 'testRenameSAML':
          case 'getRenameOAuthConfig':
          case 'updateRenameOAuthConfig':
          case 'testRenameOAuth':
          case 'getRenameLDAPConfig':
          case 'updateRenameLDAPConfig':
          case 'testRenameLDAP':
            result = await this.renameHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'runAtcCheck':
          case 'getAtcResults':
          case 'getAtcConfiguration':
          case 'updateAtcConfiguration':
          case 'createAtcVariant':
          case 'updateAtcVariant':
          case 'deleteAtcVariant':
          case 'getAtcVariants':
          case 'applyAtcVariant':
          case 'scheduleAtcCheck':
          case 'cancelAtcCheck':
          case 'getAtcHistory':
          case 'getAtcStatistics':
          case 'analyzeAtcTrends':
          case 'getAtcMetrics':
          case 'compareAtcResults':
          case 'exportAtcResults':
          case 'importAtcResults':
          case 'validateAtcSetup':
          case 'troubleshootAtc':
          case 'optimizeAtcPerformance':
          case 'monitorAtcExecution':
          case 'auditAtcAccess':
          case 'getAtcPermissions':
          case 'setAtcPermissions':
          case 'validateAtcPermissions':
          case 'getAtcRoles':
          case 'assignAtcRole':
          case 'removeAtcRole':
          case 'getAtcUserAccess':
          case 'grantAtcAccess':
          case 'revokeAtcAccess':
          case 'auditAtcPermissions':
          case 'getAtcSecurityPolicy':
          case 'updateAtcSecurityPolicy':
          case 'enforceAtcSecurity':
          case 'getAtcEncryption':
          case 'enableAtcEncryption':
          case 'disableAtcEncryption':
          case 'rotateAtcKeys':
          case 'getAtcCertificates':
          case 'updateAtcCertificates':
          case 'validateAtcCertificates':
          case 'getAtcSAMLConfig':
          case 'updateAtcSAMLConfig':
          case 'testAtcSAML':
          case 'getAtcOAuthConfig':
          case 'updateAtcOAuthConfig':
          case 'testAtcOAuth':
          case 'getAtcLDAPConfig':
          case 'updateAtcLDAPConfig':
          case 'testAtcLDAP':
            result = await this.atcHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'startTrace':
          case 'stopTrace':
          case 'getTraceResults':
          case 'analyzeTrace':
          case 'getTraceStatistics':
          case 'configureTrace':
          case 'getTraceConfiguration':
          case 'updateTraceConfiguration':
          case 'resetTraceConfiguration':
          case 'saveTraceSession':
          case 'loadTraceSession':
          case 'deleteTraceSession':
          case 'getTraceSessions':
          case 'shareTraceSession':
          case 'exportTraceData':
          case 'importTraceData':
          case 'compareTraces':
          case 'mergeTraces':
          case 'filterTraceData':
          case 'searchTraceData':
          case 'getTraceMetrics':
          case 'visualizeTrace':
          case 'generateTraceReport':
          case 'scheduleTrace':
          case 'cancelTrace':
          case 'getTraceHistory':
          case 'analyzeTracePatterns':
          case 'findTraceAnomalies':
          case 'optimizeTracePerformance':
          case 'monitorTraceExecution':
          case 'validateTraceSetup':
          case 'troubleshootTrace':
          case 'auditTraceAccess':
          case 'getTracePermissions':
          case 'setTracePermissions':
          case 'validateTracePermissions':
          case 'getTraceRoles':
          case 'assignTraceRole':
          case 'removeTraceRole':
          case 'getTraceUserAccess':
          case 'grantTraceAccess':
          case 'revokeTraceAccess':
          case 'auditTracePermissions':
          case 'getTraceSecurityPolicy':
          case 'updateTraceSecurityPolicy':
          case 'enforceTraceSecurity':
          case 'getTraceEncryption':
          case 'enableTraceEncryption':
          case 'disableTraceEncryption':
          case 'rotateTraceKeys':
          case 'getTraceCertificates':
          case 'updateTraceCertificates':
          case 'validateTraceCertificates':
          case 'getTraceSAMLConfig':
          case 'updateTraceSAMLConfig':
          case 'testTraceSAML':
          case 'getTraceOAuthConfig':
          case 'updateTraceOAuthConfig':
          case 'testTraceOAuth':
          case 'getTraceLDAPConfig':
          case 'updateTraceLDAPConfig':
          case 'testTraceLDAP':
            result = await this.traceHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'extractMethod':
          case 'extractClass':
          case 'extractInterface':
          case 'extractVariable':
          case 'inlineMethod':
          case 'inlineVariable':
          case 'moveMethod':
          case 'moveClass':
          case 'moveField':
          case 'replaceConditionalWithPolymorphism':
          case 'introduceParameterObject':
          case 'removeParameter':
          case 'addParameter':
          case 'changeMethodSignature':
          case 'pullUpMethod':
          case 'pushDownMethod':
          case 'pullUpField':
          case 'pushDownField':
          case 'introduceExplainingVariable':
          case 'introduceSafeguardClause':
          case 'consolidateConditionalExpression':
          case 'decomposeBooleanExpression':
          case 'replaceParameterWithExplicitMethods':
          case 'preserveWholeObject':
          case 'replaceTempWithQuery':
          case 'introduceForeignMethod':
          case 'introduceLocalExtension':
          case 'hideMethod':
          case 'hideDelegate':
          case 'replaceDelegationWithInheritance':
          case 'replaceInheritanceWithDelegation':
          case 'previewRefactoring':
          case 'validateRefactoring':
          case 'getRefactoringImpact':
          case 'getRefactoringConflicts':
          case 'resolveRefactoringConflicts':
          case 'applyRefactoring':
          case 'rollbackRefactoring':
          case 'getRefactoringHistory':
          case 'suggestRefactorings':
          case 'findRefactoringOpportunities':
          case 'analyzeRefactoringBenefits':
          case 'calculateRefactoringCosts':
          case 'prioritizeRefactorings':
          case 'planRefactoringSequence':
          case 'executeRefactoringPlan':
          case 'monitorRefactoringProgress':
          case 'validateRefactoringRules':
          case 'configureRefactoringSettings':
          case 'getRefactoringConfiguration':
          case 'updateRefactoringConfiguration':
          case 'resetRefactoringConfiguration':
          case 'auditRefactoringOperations':
          case 'getRefactoringStatistics':
          case 'analyzeRefactoringPatterns':
          case 'optimizeRefactoringPerformance':
          case 'getRefactoringMetrics':
          case 'monitorRefactoringOperations':
          case 'getRefactoringPermissions':
          case 'setRefactoringPermissions':
          case 'validateRefactoringPermissions':
          case 'getRefactoringRoles':
          case 'assignRefactoringRole':
          case 'removeRefactoringRole':
          case 'getRefactoringUserAccess':
          case 'grantRefactoringAccess':
          case 'revokeRefactoringAccess':
          case 'auditRefactoringPermissions':
          case 'getRefactoringSecurityPolicy':
          case 'updateRefactoringSecurityPolicy':
          case 'enforceRefactoringSecurity':
          case 'getRefactoringEncryption':
          case 'enableRefactoringEncryption':
          case 'disableRefactoringEncryption':
          case 'rotateRefactoringKeys':
          case 'getRefactoringCertificates':
          case 'updateRefactoringCertificates':
          case 'validateRefactoringCertificates':
          case 'getRefactoringSAMLConfig':
          case 'updateRefactoringSAMLConfig':
          case 'testRefactoringSAML':
          case 'getRefactoringOAuthConfig':
          case 'updateRefactoringOAuthConfig':
          case 'testRefactoringOAuth':
          case 'getRefactoringLDAPConfig':
          case 'updateRefactoringLDAPConfig':
          case 'testRefactoringLDAP':
            result = await this.refactorHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'getRevisionHistory':
          case 'getRevisionDetails':
          case 'compareRevisions':
          case 'restoreRevision':
          case 'createRevision':
          case 'deleteRevision':
          case 'tagRevision':
          case 'untagRevision':
          case 'getRevisionTags':
          case 'searchRevisions':
          case 'filterRevisions':
          case 'getRevisionStatistics':
          case 'analyzeRevisionTrends':
          case 'getRevisionMetrics':
          case 'validateRevision':
          case 'mergeRevisions':
          case 'forkRevision':
          case 'getRevisionBranches':
          case 'createRevisionBranch':
          case 'deleteRevisionBranch':
          case 'switchRevisionBranch':
          case 'mergeRevisionBranch':
          case 'getRevisionConflicts':
          case 'resolveRevisionConflicts':
          case 'getRevisionDiff':
          case 'exportRevision':
          case 'importRevision':
          case 'archiveRevision':
          case 'restoreArchivedRevision':
          case 'getRevisionArchive':
          case 'cleanupRevisions':
          case 'optimizeRevisionStorage':
          case 'compressRevisions':
          case 'indexRevisions':
          case 'searchRevisionContent':
          case 'getRevisionPermissions':
          case 'setRevisionPermissions':
          case 'validateRevisionPermissions':
          case 'getRevisionRoles':
          case 'assignRevisionRole':
          case 'removeRevisionRole':
          case 'getRevisionUserAccess':
          case 'grantRevisionAccess':
          case 'revokeRevisionAccess':
          case 'auditRevisionPermissions':
          case 'getRevisionSecurityPolicy':
          case 'updateRevisionSecurityPolicy':
          case 'enforceRevisionSecurity':
          case 'getRevisionEncryption':
          case 'enableRevisionEncryption':
          case 'disableRevisionEncryption':
          case 'rotateRevisionKeys':
          case 'getRevisionCertificates':
          case 'updateRevisionCertificates':
          case 'validateRevisionCertificates':
          case 'getRevisionSAMLConfig':
          case 'updateRevisionSAMLConfig':
          case 'testRevisionSAML':
          case 'getRevisionOAuthConfig':
          case 'updateRevisionOAuthConfig':
          case 'testRevisionOAuth':
          case 'getRevisionLDAPConfig':
          case 'updateRevisionLDAPConfig':
          case 'testRevisionLDAP':
            result = await this.revisionHandlers.handle(request.params.name, request.params.arguments);
            break;
          
          case 'healthcheck':
            result = {
              status: 'Server is running',
              timestamp: new Date().toISOString(),
              mode: this.isBtpConnection ? 'BTP OAuth' : 'Basic Auth',
              adtClient: !!this.adtClient,
              handlers: {
                auth: !!this.authHandlers,
                transport: !!this.transportHandlers,
                // ... etc
              }
            };
            break;
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
        
        return result;
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  private async initializeAdtClient() {
    let adtClientOptions: ClientOptions | undefined = undefined;

    if (this.isBtpConnection) {
      if (!this.btpClientId || !this.btpTokenUrl) {
        throw new Error("BTP Client ID or Token URL is not configured for OAuth in initializeAdtClient.");
      }
      const BTP_CLIENT_ID = this.btpClientId;
      const BTP_CLIENT_SECRET = this.btpClientSecret || ''; 
      const BTP_TOKEN_URL = this.btpTokenUrl;

      console.error('Attempting BTP OAuth connection setup with BearerFetcher...');
      
      const fetchBearerToken = async (): Promise<string> => {
        console.error('BearerFetcher: Fetching new OAuth token...');
        const tokenResponse = await fetchOAuthToken(BTP_TOKEN_URL, BTP_CLIENT_ID, BTP_CLIENT_SECRET);
        this.oauthToken = tokenResponse.access_token;
        console.error('BearerFetcher: Successfully fetched OAuth token.');
        return tokenResponse.access_token;
      };

      adtClientOptions = {
        headers: { 
          'Accept': 'application/vnd.sap.adt.core.v1+xml',
          'Content-Type': 'application/vnd.sap.adt.core.v1+xml'
        }
      };
      this.adtClient = new ADTClient(
        process.env.SAP_URL as string,
        'dummyBtpUser', // Non-empty dummy user
        fetchBearerToken, 
        process.env.SAP_CLIENT as string,
        process.env.SAP_LANGUAGE as string,
        adtClientOptions
      );
      console.error('ADTClient configured for BTP OAuth using BearerFetcher.');

    } else {
      // Basic Auth
      console.error('Configuring ADTClient for basic authentication...');
      this.adtClient = new ADTClient(
        process.env.SAP_URL as string,
        process.env.SAP_USER as string, // Use actual user
        process.env.SAP_PASSWORD as string, // Use actual password
        process.env.SAP_CLIENT as string,
        process.env.SAP_LANGUAGE as string
        // No specific options needed here for basic auth with user/pass
      );
      console.error('ADTClient configured for basic authentication.');
    }
    this.adtClient.stateful = session_types.stateful;

    // Initialize handlers now that adtClient is ready
    console.error('DEBUG: About to initialize all handlers');
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
    console.error('DEBUG: All handlers initialized.');
  }

  async run() {
    console.error('DEBUG: run() method called');
    
    console.error('DEBUG: About to call initializeAdtClient()');
    await this.initializeAdtClient();
    console.error('DEBUG: initializeAdtClient() completed');
    
    console.error('DEBUG: About to call setupToolHandlers()');
    this.setupToolHandlers();
    console.error('DEBUG: setupToolHandlers() completed');
    
    console.error('DEBUG: About to create transport and connect');
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
