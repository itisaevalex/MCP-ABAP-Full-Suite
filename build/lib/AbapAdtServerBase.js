"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbapAdtServerBase = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const abap_adt_api_1 = require("abap-adt-api");
class AbapAdtServerBase extends index_js_1.Server {
    constructor() {
        super({
            name: "mcp-abap-abap-adt-api",
            version: "0.1.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        if (!process.env.ABAP_URL || !process.env.ABAP_USER || !process.env.ABAP_PASSWORD) {
            throw new Error('Missing required environment variables - check .env file');
        }
        this.adtClient = new abap_adt_api_1.ADTClient(process.env.ABAP_URL, process.env.ABAP_USER, process.env.ABAP_PASSWORD);
    }
}
exports.AbapAdtServerBase = AbapAdtServerBase;
