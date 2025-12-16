import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock neo4j-driver
vi.mock('neo4j-driver', () => ({
    default: {
        driver: vi.fn(() => ({
            session: vi.fn(() => ({
                run: vi.fn(),
                close: vi.fn(),
            })),
            close: vi.fn(),
        })),
        auth: {
            basic: vi.fn(),
        },
        isInt: vi.fn(() => false),
    },
}));

import { runQuery, close } from '../src/services/neo4j.js';

describe('Neo4j Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should export runQuery function', () => {
        expect(typeof runQuery).toBe('function');
    });

    it('should export close function', () => {
        expect(typeof close).toBe('function');
    });
});
