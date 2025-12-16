import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe('API Health', () => {
    test('should return health status', async ({ request }) => {
        const response = await request.get(`${API_BASE}/health`);

        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.status).toBe('healthy');
        expect(body.version).toBeDefined();
    });
});

test.describe('Systems API', () => {
    test('GET /api/systems should return array', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems`);

        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('GET /api/systems with tier filter should filter results', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems?tier=1`);

        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
        // All returned systems should be tier 1
        body.forEach(system => {
            if (system.tier !== null) {
                expect(system.tier).toBe(1);
            }
        });
    });

    test('GET /api/systems/:urn should return system details', async ({ request }) => {
        // First get a system URN
        const listResponse = await request.get(`${API_BASE}/api/systems`);
        const systems = await listResponse.json();

        if (systems.length > 0) {
            const urn = systems[0].urn;
            const response = await request.get(`${API_BASE}/api/systems/${encodeURIComponent(urn)}`);

            expect(response.ok()).toBeTruthy();

            const body = await response.json();
            expect(body.urn).toBe(urn);
            expect(body.name).toBeDefined();
        }
    });

    test('GET /api/systems/invalid-urn should return 404', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/systems/urn:scp:nonexistent:system`);

        expect(response.status()).toBe(404);
    });
});

test.describe('Graph API', () => {
    test('GET /api/graph should return nodes and edges', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/graph`);

        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body).toHaveProperty('nodes');
        expect(body).toHaveProperty('edges');
        expect(Array.isArray(body.nodes)).toBeTruthy();
        expect(Array.isArray(body.edges)).toBeTruthy();
    });

    test('graph nodes should have required properties', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/graph`);
        const body = await response.json();

        body.nodes.forEach(node => {
            expect(node).toHaveProperty('id');
            expect(node).toHaveProperty('label');
        });
    });

    test('graph edges should have source and target', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/graph`);
        const body = await response.json();

        body.edges.forEach(edge => {
            expect(edge).toHaveProperty('source');
            expect(edge).toHaveProperty('target');
        });
    });
});

test.describe('Teams API', () => {
    test('GET /api/teams should return team list', async ({ request }) => {
        const response = await request.get(`${API_BASE}/api/teams`);

        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();

        body.forEach(team => {
            expect(team).toHaveProperty('id');
            expect(team).toHaveProperty('name');
            expect(team).toHaveProperty('systemCount');
        });
    });
});

test.describe('Scan API', () => {
    test('POST /api/scan should return accepted status', async ({ request }) => {
        const response = await request.post(`${API_BASE}/api/scan`);

        expect(response.status()).toBe(202);

        const body = await response.json();
        expect(body.status).toBe('triggered');
        expect(body.scanId).toBeDefined();
    });
});

test.describe('Dependencies API', () => {
    test('GET /api/systems/:urn/dependencies should return array', async ({ request }) => {
        const listResponse = await request.get(`${API_BASE}/api/systems`);
        const systems = await listResponse.json();

        if (systems.length > 0) {
            const urn = systems[0].urn;
            const response = await request.get(`${API_BASE}/api/systems/${encodeURIComponent(urn)}/dependencies`);

            expect(response.ok()).toBeTruthy();

            const body = await response.json();
            expect(Array.isArray(body)).toBeTruthy();
        }
    });

    test('GET /api/systems/:urn/dependents should return array', async ({ request }) => {
        const listResponse = await request.get(`${API_BASE}/api/systems`);
        const systems = await listResponse.json();

        if (systems.length > 0) {
            const urn = systems[0].urn;
            const response = await request.get(`${API_BASE}/api/systems/${encodeURIComponent(urn)}/dependents`);

            expect(response.ok()).toBeTruthy();

            const body = await response.json();
            expect(Array.isArray(body)).toBeTruthy();
        }
    });

    test('GET /api/systems/:urn/blast-radius should return graph structure', async ({ request }) => {
        const listResponse = await request.get(`${API_BASE}/api/systems`);
        const systems = await listResponse.json();

        if (systems.length > 0) {
            const urn = systems[0].urn;
            const response = await request.get(`${API_BASE}/api/systems/${encodeURIComponent(urn)}/blast-radius`);

            expect(response.ok()).toBeTruthy();

            const body = await response.json();
            expect(body).toHaveProperty('nodes');
            expect(body).toHaveProperty('edges');
        }
    });
});
