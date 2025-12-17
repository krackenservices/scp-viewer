import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from '../src/api-client.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Client', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('apiRequest', () => {
        it('should make GET request to correct URL', async () => {
            const mockResponse = [{ urn: 'urn:scp:test:api', name: 'Test' }]
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            })

            const result = await api.listSystems()

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/systems')
            expect(result).toEqual(mockResponse)
        })

        it('should include query parameters', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            })

            await api.listSystems({ tier: 1, domain: 'platform' })

            const calledUrl = global.fetch.mock.calls[0][0]
            expect(calledUrl).toContain('tier=1')
            expect(calledUrl).toContain('domain=platform')
        })

        it('should throw on API error', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ error: 'System not found' }),
            })

            await expect(api.getSystem('urn:scp:nonexistent')).rejects.toThrow('System not found')
        })
    })

    describe('getSystem', () => {
        it('should encode URN in path', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ urn: 'urn:scp:test:api' }),
            })

            await api.getSystem('urn:scp:test:api')

            const calledUrl = global.fetch.mock.calls[0][0]
            expect(calledUrl).toContain('/api/systems/urn%3Ascp%3Atest%3Aapi')
        })
    })

    describe('getBlastRadius', () => {
        it('should include depth parameter', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ nodes: [], edges: [] }),
            })

            await api.getBlastRadius('urn:scp:test:api', 5)

            const calledUrl = global.fetch.mock.calls[0][0]
            expect(calledUrl).toContain('depth=5')
        })
    })

    describe('getDependencies', () => {
        it('should call dependencies endpoint', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            })

            await api.getDependencies('urn:scp:test:api')

            const calledUrl = global.fetch.mock.calls[0][0]
            expect(calledUrl).toContain('/dependencies')
        })
    })

    describe('getDependents', () => {
        it('should call dependents endpoint', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            })

            await api.getDependents('urn:scp:test:api')

            const calledUrl = global.fetch.mock.calls[0][0]
            expect(calledUrl).toContain('/dependents')
        })
    })
})
