"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testToolSchemas = void 0;
exports.testToolSchemas = [
    {
        name: "unitTestRun",
        description: "Run unit tests",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string" },
                flags: { type: "object" }
            },
            required: ["url"]
        }
    },
    {
        name: "unitTestEvaluation",
        description: "Evaluate unit tests",
        inputSchema: {
            type: "object",
            properties: {
                clas: { type: "object" },
                flags: { type: "object" }
            },
            required: ["clas"]
        }
    },
    {
        name: "unitTestOccurrenceMarkers",
        description: "Get unit test occurrence markers",
        inputSchema: {
            type: "object",
            properties: {
                url: { type: "string" },
                source: { type: "string" }
            },
            required: ["url", "source"]
        }
    }
];
