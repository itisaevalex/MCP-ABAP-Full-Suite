"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transportToolSchemas = void 0;
exports.transportToolSchemas = [
    {
        name: "transportInfo",
        description: "Get transport info",
        inputSchema: {
            type: "object",
            properties: {
                objSourceUrl: { type: "string" },
                devClass: { type: "string" },
                operation: { type: "string" }
            },
            required: ["objSourceUrl"]
        }
    },
    {
        name: "createTransport",
        description: "Create transport",
        inputSchema: {
            type: "object",
            properties: {
                objSourceUrl: { type: "string" },
                REQUEST_TEXT: { type: "string" },
                DEVCLASS: { type: "string" },
                transportLayer: { type: "string" }
            },
            required: ["objSourceUrl", "REQUEST_TEXT", "DEVCLASS"]
        }
    }
];
