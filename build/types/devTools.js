"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devToolSchemas = void 0;
exports.devToolSchemas = [
    {
        name: "prettyPrinterSetting",
        description: "Get pretty printer settings",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "setPrettyPrinterSetting",
        description: "Set pretty printer settings",
        inputSchema: {
            type: "object",
            properties: {
                indent: { type: "boolean" },
                style: { type: "string" }
            },
            required: ["indent", "style"]
        }
    },
    {
        name: "prettyPrinter",
        description: "Format source with pretty printer",
        inputSchema: {
            type: "object",
            properties: {
                source: { type: "string" }
            },
            required: ["source"]
        }
    }
];
