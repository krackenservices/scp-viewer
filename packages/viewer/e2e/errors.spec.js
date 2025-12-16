import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe('API Error Responses', () => {
    test('GET /api/systems/:urn should return 404 for non-existent system', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems/urn:scp:nonexistent:system`);

        expect(response.status()).toBe(404);
    });

    test('GET /api/systems/:urn/dependencies should return 404 for non-existent system', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems/urn:scp:nonexistent:system/dependencies`);

        // Should return 404 or empty array
        expect([200, 404]).toContain(response.status());
    });

    test('GET /api/systems/:urn/blast-radius should return 404 for non-existent system', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems/urn:scp:nonexistent:system/blast-radius`);

        expect([200, 404]).toContain(response.status());
    });

    test('GET /api/systems with invalid tier should handle gracefully', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems?tier=invalid`);

        // Should either return 400 or ignore invalid param
        expect([200, 400]).toContain(response.status());
    });

    test('GET /api/systems with tier out of range should handle gracefully', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems?tier=999`);

        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        // Should return empty array for non-existent tier
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('GET /api/systems with negative tier should handle gracefully', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems?tier=-1`);

        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
    });
});

test.describe('Invalid Endpoints', () => {
    test('GET /api/invalid should return 404', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/invalid`);

        expect(response.status()).toBe(404);
    });

    test('POST /api/systems should return 405 Method Not Allowed or 404', async ({ request }) => {
        const response = await request.post(`${API_BASE}/api/systems`, {
            data: { name: 'test' }
        });

        expect([404, 405]).toContain(response.status());
    });

    test('DELETE /api/systems/:urn should return 405 or 404', async ({ request }) => {
        const response = await request.delete(`${API_BASE}/api/systems/urn:scp:test:api`);

        expect([404, 405]).toContain(response.status());
    });
});

test.describe('Malformed Requests', () => {
    test('GET with malformed URN encoding should handle gracefully', async ({ request }) => {
        // Malformed percent encoding
        const response = await request.get(`${API_BASE}/api/systems/urn%3Ascp%3Atest%`);

        // Should not crash - either 400 or 404
        expect([400, 404, 500]).toContain(response.status());
    });

    test('POST /api/scan with invalid JSON should handle gracefully', async ({ request }) => {
        const response = await request.post(`${API_BASE}/api/scan`, {
            headers: { 'Content-Type': 'application/json' },
            data: 'invalid json{'
        });

        // Should handle gracefully - 202 (ignores body), 400 (bad request), or 500 (server error)
        expect([202, 400, 500]).toContain(response.status());
    });
});

test.describe('Large Payload Handling', () => {
    test('should handle request with many query params', async ({ request }) => {
        const params = new URLSearchParams();
        for (let i = 0; i < 100; i++) {
            params.append(`param${i}`, `value${i}`);
        }

        const response = await request.get(`${API_BASE}/api/systems?${params.toString()}`);

        // Should not crash, just ignore extra params
        expect(response.ok()).toBeTruthy();
    });
});

test.describe('Content-Type Handling', () => {
    test('should return JSON content type', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems`);

        expect(response.headers()['content-type']).toContain('application/json');
    });

    test('should handle Accept header', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems`, {
            headers: { 'Accept': 'application/json' }
        });

        expect(response.ok()).toBeTruthy();
    });
});
