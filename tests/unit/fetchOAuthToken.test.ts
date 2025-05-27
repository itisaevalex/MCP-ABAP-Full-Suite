import nock from 'nock';
import { fetchOAuthToken } from '../../src/index'; // Adjusted import path
// Removed temporary fetchOAuthToken definition

describe('fetchOAuthToken', () => {
    const tokenUrl = 'https://test.auth.com/oauth/token';
    const clientId = 'test-client-id';
    const clientSecret = 'test-client-secret';

    afterEach(() => {
        nock.cleanAll();
    });

    it('should return an access_token on successful request', async () => {
        const mockTokenResponse = {
            access_token: 'mockAccessToken',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'test-scope'
        };

        nock(tokenUrl)
            .post('', new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            }).toString())
            .reply(200, mockTokenResponse);

        const tokenData = await fetchOAuthToken(tokenUrl, clientId, clientSecret);
        expect(tokenData.access_token).toBe('mockAccessToken');
        expect(nock.isDone()).toBe(true); // Ensure the mock was called
    });

    it('should throw an error with status and body on 401 Unauthorized', async () => {
        const errorResponseBody = { error: 'invalid_client', error_description: 'Client authentication failed' };

        nock(tokenUrl)
            .post('', new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            }).toString())
            .reply(401, errorResponseBody);

        await expect(fetchOAuthToken(tokenUrl, clientId, clientSecret))
            .rejects
            .toThrow('Failed to fetch OAuth token: 401 Unauthorized - {\"error\":\"invalid_client\",\"error_description\":\"Client authentication failed\"}');
        expect(nock.isDone()).toBe(true);
    });

    it('should throw an error with status and body on 500 Internal Server Error', async () => {
        const errorResponseBody = 'Internal Server Error';

        nock(tokenUrl)
            .post('', new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            }).toString())
            .reply(500, errorResponseBody);

        await expect(fetchOAuthToken(tokenUrl, clientId, clientSecret))
            .rejects
            .toThrow(`Failed to fetch OAuth token: 500 Internal Server Error - ${errorResponseBody}`);
        expect(nock.isDone()).toBe(true);
    });

    it('should throw an error if the network request fails', async () => {
        nock(tokenUrl)
            .post('')
            .replyWithError('Network error');

        await expect(fetchOAuthToken(tokenUrl, clientId, clientSecret))
            .rejects
            .toThrow('Network error'); // Or whatever error node-fetch throws
         expect(nock.isDone()).toBe(true);
    });
}); 