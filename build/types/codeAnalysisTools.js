"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeAnalysisToolSchemas = void 0;
exports.codeAnalysisToolSchemas = [
    {
        name: "syntaxCheck",
        description: "Perform syntax check",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string" },
                mainUrl: { type: "string" },
                content: { type: "string" },
                mainProgram: { type: "string" },
                version: { type: "string" }
            },
            required: ["url"]
        }
    },
    {
        name: "codeCompletion",
        description: "Get code completion",
        inputSchema: {
            type: "object",
            properties: {
                sourceUrl: { type: "string" },
                source: { type: "string" },
                line: { type: "number" },
                column: { type: "number" }
            },
            required: ["sourceUrl", "source", "line", "column"]
        }
    },
    {
        name: "findDefinition",
        description: "Find definition",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string" },
                source: { type: "string" },
                line: { type: "number" },
                startCol: { type: "number" },
                endCol: { type: "number" },
                implementation: { type: "boolean" },
                mainProgram: { type: "string" }
            },
            required: ["url", "source", "line", "startCol", "endCol"]
        }
    }
];
