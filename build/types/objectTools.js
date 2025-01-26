"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectToolSchemas = void 0;
exports.objectToolSchemas = [
    {
        name: "objectStructure",
        description: "Get object structure",
        inputSchema: {
            type: "object",
            properties: {
                objectUrl: { type: "string" },
                version: { type: "string" }
            },
            required: ["objectUrl"]
        }
    },
    {
        name: "getObjectSource",
        description: "Get object source",
        inputSchema: {
            type: "object",
            properties: {
                objectSourceUrl: { type: "string" },
                options: { type: "object" }
            },
            required: ["objectSourceUrl"]
        }
    },
    {
        name: "setObjectSource",
        description: "Set object source",
        inputSchema: {
            type: "object",
            properties: {
                objectSourceUrl: { type: "string" },
                source: { type: "string" },
                lockHandle: { type: "string" },
                transport: { type: "string" }
            },
            required: ["objectSourceUrl", "source", "lockHandle"]
        }
    },
    {
        name: "lock",
        description: "Lock object",
        inputSchema: {
            type: "object",
            properties: {
                objectUrl: { type: "string" },
                accessMode: { type: "string" }
            },
            required: ["objectUrl"]
        }
    },
    {
        name: "unLock",
        description: "Unlock object",
        inputSchema: {
            type: "object",
            properties: {
                objectUrl: { type: "string" },
                lockHandle: { type: "string" }
            },
            required: ["objectUrl", "lockHandle"]
        }
    },
    {
        name: "createObject",
        description: "Create object",
        inputSchema: {
            type: "object",
            properties: {
                objtype: { type: "string" },
                name: { type: "string" },
                parentName: { type: "string" },
                description: { type: "string" },
                parentPath: { type: "string" },
                responsible: { type: "string" },
                transport: { type: "string" }
            },
            required: ["objtype", "name", "parentName", "description", "parentPath"]
        }
    },
    {
        name: "deleteObject",
        description: "Delete object",
        inputSchema: {
            type: "object",
            properties: {
                objectUrl: { type: "string" },
                lockHandle: { type: "string" },
                transport: { type: "string" }
            },
            required: ["objectUrl", "lockHandle"]
        }
    }
];
