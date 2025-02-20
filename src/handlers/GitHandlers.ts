import { ADTClient } from 'abap-adt-api';
import { BaseHandler } from './BaseHandler.js';
import type { ToolDefinition } from '../types/tools.js';
import { GitRepo, GitStaging } from 'abap-adt-api';

export class GitHandlers extends BaseHandler {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'gitRepos',
                description: 'Retrieves a list of Git repositories.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'gitExternalRepoInfo',
                description: 'Retrieves information about an external Git repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repourl: {
                            type: 'string',
                            description: 'The URL of the repository.'
                        },
                        user: {
                            type: 'string',
                            description: 'The username.',
                            optional: true
                        },
                        password: {
                            type: 'string',
                            description: 'The password.',
                            optional: true
                        }
                    },
                    required: ['repourl']
                }
            },
            {
                name: 'gitCreateRepo',
                description: 'Creates a new Git repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        packageName: {
                            type: 'string',
                            description: 'The name of the package.'
                        },
                        repourl: {
                            type: 'string',
                            description: 'The URL of the repository.'
                        },
                        branch: {
                            type: 'string',
                            description: 'The branch name.',
                            optional: true
                        },
                        transport: {
                            type: 'string',
                            description: 'The transport.',
                            optional: true
                        },
                        user: {
                            type: 'string',
                            description: 'The username.',
                            optional: true
                        },
                        password: {
                            type: 'string',
                            description: 'The password.',
                            optional: true
                        }
                    },
                    required: ['packageName', 'repourl']
                }
            },
            {
                name: 'gitPullRepo',
                description: 'Pulls changes from a Git repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repoId: {
                            type: 'string',
                            description: 'The ID of the repository.'
                        },
                        branch: {
                            type: 'string',
                            description: 'The branch name.',
                            optional: true
                        },
                        transport: {
                            type: 'string',
                            description: 'The transport.',
                            optional: true
                        },
                        user: {
                            type: 'string',
                            description: 'The username.',
                            optional: true
                        },
                        password: {
                            type: 'string',
                            description: 'The password.',
                            optional: true
                        }
                    },
                    required: ['repoId']
                }
            },
            {
                name: 'gitUnlinkRepo',
                description: 'Unlinks a Git repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repoId: {
                            type: 'string',
                            description: 'The ID of the repository.'
                        }
                    },
                    required: ['repoId']
                }
            },
            {
                name: 'stageRepo',
                description: 'Stages changes in a Git repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repo: {
                            type: 'string',
                            description: 'The Git repository.'
                        },
                        user: {
                            type: 'string',
                            description: 'The username.',
                            optional: true
                        },
                        password: {
                            type: 'string',
                            description: 'The password.',
                            optional: true
                        }
                    },
                    required: ['repo']
                }
            },
            {
                name: 'pushRepo',
                description: 'Pushes changes to a Git repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repo: {
                            type: 'string',
                            description: 'The Git repository.'
                        },
                        staging: {
                            type: 'string',
                            description: 'The staging information.'
                        },
                        user: {
                            type: 'string',
                            description: 'The username.',
                            optional: true
                        },
                        password: {
                            type: 'string',
                            description: 'The password.',
                            optional: true
                        }
                    },
                    required: ['repo', 'staging']
                }
            },
            {
                name: 'checkRepo',
                description: 'Checks a Git repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repo: {
                            type: 'string',
                            description: 'The Git repository.'
                        },
                        user: {
                            type: 'string',
                            description: 'The username.',
                            optional: true
                        },
                        password: {
                            type: 'string',
                            description: 'The password.',
                            optional: true
                        }
                    },
                    required: ['repo']
                }
            },
            {
                name: 'remoteRepoInfo',
                description: 'Retrieves information about a remote Git repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repo: {
                            type: 'string',
                            description: 'The Git repository.'
                        },
                        user: {
                            type: 'string',
                            description: 'The username.',
                            optional: true
                        },
                        password: {
                            type: 'string',
                            description: 'The password.',
                            optional: true
                        }
                    },
                    required: ['repo']
                }
            },
            {
                name: 'switchRepoBranch',
                description: 'Switches the branch of a Git repository.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        repo: {
                            type: 'string',
                            description: 'The Git repository.'
                        },
                        branch: {
                            type: 'string',
                            description: 'The branch name.'
                        },
                        create: {
                            type: 'boolean',
                            description: 'Whether to create the branch if it doesn\'t exist.',
                            optional: true
                        },
                        user: {
                            type: 'string',
                            description: 'The username.',
                            optional: true
                        },
                        password: {
                            type: 'string',
                            description: 'The password.',
                            optional: true
                        }
                    },
                    required: ['repo', 'branch']
                }
            }
        ];
    }

    async handle(toolName: string, arguments_: any): Promise<any> {
        switch (toolName) {
            case 'gitRepos':
                return this.adtclient.gitRepos();
            case 'gitExternalRepoInfo':
                const gitExternalRepoInfoArgs: { repourl: string, user?: string, password?: string } = arguments_;
                return this.adtclient.gitExternalRepoInfo(gitExternalRepoInfoArgs.repourl, gitExternalRepoInfoArgs.user, gitExternalRepoInfoArgs.password);
            case 'gitCreateRepo':
                const gitCreateRepoArgs: { packageName: string, repourl: string, branch?: string, transport?: string, user?: string, password?: string } = arguments_;
                return this.adtclient.gitCreateRepo(gitCreateRepoArgs.packageName, gitCreateRepoArgs.repourl, gitCreateRepoArgs.branch, gitCreateRepoArgs.transport, gitCreateRepoArgs.user, gitCreateRepoArgs.password);
            case 'gitPullRepo':
                const gitPullRepoArgs: { repoId: string, branch?: string, transport?: string, user?: string, password?: string } = arguments_;
                return this.adtclient.gitPullRepo(gitPullRepoArgs.repoId, gitPullRepoArgs.branch, gitPullRepoArgs.transport, gitPullRepoArgs.user, gitPullRepoArgs.password);
            case 'gitUnlinkRepo':
                const gitUnlinkRepoArgs: { repoId: string } = arguments_;
                return this.adtclient.gitUnlinkRepo(gitUnlinkRepoArgs.repoId);
            case 'stageRepo':
                const stageRepoArgs: { repo: GitRepo, user?: string, password?: string } = arguments_;
                return this.adtclient.stageRepo(stageRepoArgs.repo, stageRepoArgs.user, stageRepoArgs.password);
            case 'pushRepo':
                const pushRepoArgs: { repo: GitRepo, staging: GitStaging, user?: string, password?: string } = arguments_;
                return this.adtclient.pushRepo(pushRepoArgs.repo, pushRepoArgs.staging, pushRepoArgs.user, pushRepoArgs.password);
            case 'checkRepo':
                const checkRepoArgs: { repo: GitRepo, user?: string, password?: string } = arguments_;
                return this.adtclient.checkRepo(checkRepoArgs.repo, checkRepoArgs.user, checkRepoArgs.password);
            case 'remoteRepoInfo':
                const remoteRepoInfoArgs: { repo: GitRepo, user?: string, password?: string } = arguments_;
                return this.adtclient.remoteRepoInfo(remoteRepoInfoArgs.repo, remoteRepoInfoArgs.user, remoteRepoInfoArgs.password);
            case 'switchRepoBranch':
                const switchRepoBranchArgs: { repo: GitRepo, branch: string, create?: boolean, user?: string, password?: string } = arguments_;
                return this.adtclient.switchRepoBranch(switchRepoBranchArgs.repo, switchRepoBranchArgs.branch, switchRepoBranchArgs.create, switchRepoBranchArgs.user, switchRepoBranchArgs.password);
            default:
                throw new Error(`Tool ${toolName} not implemented in GitHandlers`);
        }
    }
}
