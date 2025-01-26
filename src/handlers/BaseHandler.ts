import type { ToolDefinition } from "../types/tools";
import type { ADTClient } from "abap-adt-api";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { performance } from 'perf_hooks';
import { createLogger } from '../lib/logger';

enum CustomErrorCode {
  TooManyRequests = 429,
  InvalidParameters = 400
}

export abstract class BaseHandler {
  protected readonly adtclient: ADTClient;
  protected readonly logger = createLogger(this.constructor.name);
  private readonly rateLimiter = new Map<string, number>();
  private readonly metrics = {
    requestCount: 0,
    errorCount: 0,
    successCount: 0,
    totalTime: 0
  };

  constructor(adtclient: ADTClient) {
    this.adtclient = adtclient;
  }

  protected validateArgs(args: any, schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  }): void {
    const errors: string[] = [];
    
    // Validate type
    if (schema.type && typeof args !== schema.type) {
      errors.push(`Expected ${schema.type} but got ${typeof args}`);
    }

    // Validate properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (args[key] === undefined && schema.required?.includes(key)) {
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
      throw new McpError(
        CustomErrorCode.InvalidParameters,
        `Invalid arguments: ${errors.join(', ')}`
      );
    }
  }

  protected trackRequest(startTime: number, success: boolean): void {
    const duration = performance.now() - startTime;
    this.metrics.requestCount++;
    this.metrics.totalTime += duration;
    
    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    this.logger.info('Request completed', {
      duration,
      success,
      metrics: this.getMetrics()
    });
  }

  protected checkRateLimit(ip: string): void {
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(ip) || 0;
    
    if (now - lastRequest < 1000) { // 1 second rate limit
      this.logger.warn('Rate limit exceeded', { ip });
      throw new McpError(
        CustomErrorCode.TooManyRequests,
        'Rate limit exceeded. Please wait before making another request.'
      );
    }
    
    this.rateLimiter.set(ip, now);
  }

  protected getMetrics() {
    return {
      ...this.metrics,
      averageTime: this.metrics.requestCount > 0 
        ? this.metrics.totalTime / this.metrics.requestCount 
        : 0
    };
  }

  abstract getTools(): ToolDefinition[];
}
