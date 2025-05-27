"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nock_1 = __importDefault(require("nock"));
const index_1 = require("../../src/index"); // Adjusted import path
// Removed temporary fetchOAuthToken definition
describe('fetchOAuthToken', () => {
    const tokenUrl = 'https://test.auth.com/oauth/token';
    const clientId = 'test-client-id';
    const clientSecret = 'test-client-secret';
    afterEach(() => {
        nock_1.default.cleanAll();
    });
    it('should return an access_token on successful request', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockTokenResponse = {
            access_token: 'mockAccessToken',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'test-scope'
        };
        (0, nock_1.default)(tokenUrl)
            .post('', new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
        }).toString())
            .reply(200, mockTokenResponse);
        const tokenData = yield (0, index_1.fetchOAuthToken)(tokenUrl, clientId, clientSecret);
        expect(tokenData.access_token).toBe('mockAccessToken');
        expect(nock_1.default.isDone()).toBe(true); // Ensure the mock was called
    }));
    it('should throw an error with status and body on 401 Unauthorized', () => __awaiter(void 0, void 0, void 0, function* () {
        const errorResponseBody = { error: 'invalid_client', error_description: 'Client authentication failed' };
        (0, nock_1.default)(tokenUrl)
            .post('', new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
        }).toString())
            .reply(401, errorResponseBody);
        yield expect((0, index_1.fetchOAuthToken)(tokenUrl, clientId, clientSecret))
            .rejects
            .toThrow('Failed to fetch OAuth token: 401 Unauthorized - {\"error\":\"invalid_client\",\"error_description\":\"Client authentication failed\"}');
        expect(nock_1.default.isDone()).toBe(true);
    }));
    it('should throw an error with status and body on 500 Internal Server Error', () => __awaiter(void 0, void 0, void 0, function* () {
        const errorResponseBody = 'Internal Server Error';
        (0, nock_1.default)(tokenUrl)
            .post('', new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
        }).toString())
            .reply(500, errorResponseBody);
        yield expect((0, index_1.fetchOAuthToken)(tokenUrl, clientId, clientSecret))
            .rejects
            .toThrow(`Failed to fetch OAuth token: 500 Internal Server Error - ${errorResponseBody}`);
        expect(nock_1.default.isDone()).toBe(true);
    }));
    it('should throw an error if the network request fails', () => __awaiter(void 0, void 0, void 0, function* () {
        (0, nock_1.default)(tokenUrl)
            .post('')
            .replyWithError('Network error');
        yield expect((0, index_1.fetchOAuthToken)(tokenUrl, clientId, clientSecret))
            .rejects
            .toThrow('Network error'); // Or whatever error node-fetch throws
        expect(nock_1.default.isDone()).toBe(true);
    }));
});
