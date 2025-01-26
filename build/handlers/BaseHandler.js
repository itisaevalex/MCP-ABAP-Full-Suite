"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHandler = void 0;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const perf_hooks_1 = require("perf_hooks");
const logger_1 = require("../lib/logger");
var CustomErrorCode;
(function (CustomErrorCode) {
    CustomErrorCode[CustomErrorCode["TooManyRequests"] = 429] = "TooManyRequests";
    CustomErrorCode[CustomErrorCode["InvalidParameters"] = 400] = "InvalidParameters";
})(CustomErrorCode || (CustomErrorCode = {}));
class BaseHandler {
    constructor(adtclient) {
        this.logger = (0, logger_1.createLogger)(this.constructor.name);
        this.rateLimiter = new Map();
        this.metrics = {
            requestCount: 0,
            errorCount: 0,
            successCount: 0,
            totalTime: 0
        };
        this.adtclient = adtclient;
    }
    validateArgs(args, schema) {
        var _a;
        const errors = [];
        // Validate type
        if (schema.type && typeof args !== schema.type) {
            errors.push(`Expected ${schema.type} but got ${typeof args}`);
        }
        // Validate properties
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (args[key] === undefined && ((_a = schema.required) === null || _a === void 0 ? void 0 : _a.includes(key))) {
                    errors.push(`Missing required property: ${key}`);
                    continue;
                }
                if (args[key] !== undefined && typeof args[key] !== propSchema.type) {
                    errors.push(`Property ${key} expected ${propSchema.type} but got ${typeof args[key]}`);
                }
            }
        }
        if (errors.length > 0) {
            this.logger.warn('Validation failed', { errors });
            throw new types_js_1.McpError(CustomErrorCode.InvalidParameters, `Invalid arguments: ${errors.join(', ')}`);
        }
    }
    trackRequest(startTime, success) {
        const duration = perf_hooks_1.performance.now() - startTime;
        this.metrics.requestCount++;
        this.metrics.totalTime += duration;
        if (success) {
            this.metrics.successCount++;
        }
        else {
            this.metrics.errorCount++;
        }
        this.logger.info('Request completed', {
            duration,
            success,
            metrics: this.getMetrics()
        });
    }
    checkRateLimit(ip) {
        const now = Date.now();
        const lastRequest = this.rateLimiter.get(ip) || 0;
        if (now - lastRequest < 1000) { // 1 second rate limit
            this.logger.warn('Rate limit exceeded', { ip });
            throw new types_js_1.McpError(CustomErrorCode.TooManyRequests, 'Rate limit exceeded. Please wait before making another request.');
        }
        this.rateLimiter.set(ip, now);
    }
    getMetrics() {
        return Object.assign(Object.assign({}, this.metrics), { averageTime: this.metrics.requestCount > 0
                ? this.metrics.totalTime / this.metrics.requestCount
                : 0 });
    }
}
exports.BaseHandler = BaseHandler;
