"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authToolSchemas = void 0;
exports.authToolSchemas = [
    {
        name: "login",
        description: "Log in to ADT server",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "logout",
        description: "Log out from ADT server",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "dropSession",
        description: "Drop current session",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "createSSLConfig",
        description: "Create SSL configuration",
        inputSchema: {
            type: "object",
            properties: {
                allowUnauthorized: { type: "boolean" },
                ca: { type: "string" }
            },
            required: ["allowUnauthorized"]
        }
    }
];
