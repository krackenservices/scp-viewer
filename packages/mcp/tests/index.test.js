import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create mock server instance that will be shared
const mockServerInstance = {
    tool: vi.fn(),
    resource: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
}

// Mock modules BEFORE any imports
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
    McpServer: vi.fn(() => mockServerInstance),
}))

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
    StdioServerTransport: vi.fn(),
}))

vi.mock('../src/api-client.js', () => ({
    listSystems: vi.fn(),
    getSystem: vi.fn(),
    getDependencies: vi.fn(),
    getDependents: vi.fn(),
    getBlastRadius: vi.fn(),
    getGraph: vi.fn(),
    getTeams: vi.fn(),
}))

describe('MCP Server', () => {
    beforeEach(async () => {
        // Clear mock call history but keep the mock implementation
        mockServerInstance.tool.mockClear()
        mockServerInstance.resource.mockClear()
        mockServerInstance.connect.mockClear()

        // Suppress console.error during tests
        vi.spyOn(console, 'error').mockImplementation(() => { })

        // Reset modules so index.js re-runs registrations
        vi.resetModules()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('Tool Registration', () => {
        it('should register all expected tools', async () => {
            await import('../src/index.js')

            const toolNames = mockServerInstance.tool.mock.calls.map(call => call[0])

            expect(toolNames).toContain('list_systems')
            expect(toolNames).toContain('get_system')
            expect(toolNames).toContain('get_dependencies')
            expect(toolNames).toContain('get_dependents')
            expect(toolNames).toContain('blast_radius')
            expect(toolNames).toContain('get_graph')
            expect(toolNames).toContain('get_teams')
            expect(toolNames).toHaveLength(7)
        })

        it('should register tools with descriptions', async () => {
            await import('../src/index.js')

            const toolCalls = mockServerInstance.tool.mock.calls

            for (const [name, description] of toolCalls) {
                expect(typeof description).toBe('string')
                expect(description.length).toBeGreaterThan(10)
            }
        })
    })

    describe('Resource Registration', () => {
        it('should register graph-summary resource', async () => {
            await import('../src/index.js')

            const resourceNames = mockServerInstance.resource.mock.calls.map(call => call[0])

            expect(resourceNames).toContain('graph-summary')
        })

        it('should register system resource template', async () => {
            await import('../src/index.js')

            const resourceNames = mockServerInstance.resource.mock.calls.map(call => call[0])

            expect(resourceNames).toContain('system')
        })

        it('should register resources with correct URIs', async () => {
            await import('../src/index.js')

            const resourceUris = mockServerInstance.resource.mock.calls.map(call => call[1])

            expect(resourceUris).toContain('scp://graph/summary')
            expect(resourceUris).toContain('scp://system/{urn}')
        })
    })

    describe('Error Handling', () => {
        it('should return isError: true on tool handler failure', async () => {
            const api = await import('../src/api-client.js')
            api.listSystems.mockRejectedValue(new Error('API connection failed'))

            await import('../src/index.js')

            const listSystemsCall = mockServerInstance.tool.mock.calls.find(
                call => call[0] === 'list_systems'
            )
            const handler = listSystemsCall[3]

            const result = await handler({})

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error: API connection failed')
        })

        it('should return isError: true for get_system failures', async () => {
            const api = await import('../src/api-client.js')
            api.getSystem.mockRejectedValue(new Error('System not found'))

            await import('../src/index.js')

            const getSystemCall = mockServerInstance.tool.mock.calls.find(
                call => call[0] === 'get_system'
            )
            const handler = getSystemCall[3]

            const result = await handler({ urn: 'urn:scp:nonexistent' })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('System not found')
        })
    })

    describe('blast_radius depth handling', () => {
        it('should use default depth of 3 when not specified', async () => {
            const api = await import('../src/api-client.js')
            api.getBlastRadius.mockResolvedValue({ nodes: [], edges: [] })

            await import('../src/index.js')

            const blastRadiusCall = mockServerInstance.tool.mock.calls.find(
                call => call[0] === 'blast_radius'
            )
            const handler = blastRadiusCall[3]

            await handler({ urn: 'urn:scp:test:api' })

            expect(api.getBlastRadius).toHaveBeenCalledWith('urn:scp:test:api', 3)
        })

        it('should use provided depth when specified', async () => {
            const api = await import('../src/api-client.js')
            api.getBlastRadius.mockResolvedValue({ nodes: [], edges: [] })

            await import('../src/index.js')

            const blastRadiusCall = mockServerInstance.tool.mock.calls.find(
                call => call[0] === 'blast_radius'
            )
            const handler = blastRadiusCall[3]

            await handler({ urn: 'urn:scp:test:api', depth: 7 })

            expect(api.getBlastRadius).toHaveBeenCalledWith('urn:scp:test:api', 7)
        })
    })

    describe('Successful tool responses', () => {
        it('should return system data on successful list_systems call', async () => {
            const mockSystems = [{ urn: 'urn:scp:test:api', name: 'Test' }]
            const api = await import('../src/api-client.js')
            api.listSystems.mockResolvedValue(mockSystems)

            await import('../src/index.js')

            const listSystemsCall = mockServerInstance.tool.mock.calls.find(
                call => call[0] === 'list_systems'
            )
            const handler = listSystemsCall[3]

            const result = await handler({})

            expect(result.isError).toBeUndefined()
            expect(result.content[0].type).toBe('text')
            expect(JSON.parse(result.content[0].text)).toEqual(mockSystems)
        })
    })
})
