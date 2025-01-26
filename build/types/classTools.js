"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classToolSchemas = void 0;
exports.classToolSchemas = [
    {
        name: "classIncludes",
        description: "Get class includes",
        inputSchema: {
            type: "object",
            properties: {
                clas: { type: "object" }
            },
            required: ["clas"]
        }
    },
    {
        name: "createTestInclude",
        description: "Create test include",
        inputSchema: {
            type: "object",
            properties: {
                clas: { type: "string" },
                lockHandle: { type: "string" },
                transport: { type: "string" }
            },
            required: ["clas", "lockHandle"]
        }
    },
    {
        name: "classComponents",
        description: "Get class components",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string" }
            },
            required: ["url"]
        }
    }
];
