#!/usr/bin/env node
/**
 * SCP MCP Server
 * 
 * Model Context Protocol server that exposes SCP architecture data to LLMs.
 * Uses the SCP Viewer API (API-first architecture).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import * as api from './api-client.js'

const server = new McpServer({
    name: 'scp-mcp',
    version: '0.1.0',
})

// Tool: list_systems
server.tool(
    'list_systems',
    'List all systems in the SCP graph. Can filter by tier, domain, or team.',
    {
        tier: z.number().min(1).max(5).optional().describe('Filter by tier (1=critical, 5=experimental)'),
        domain: z.string().optional().describe('Filter by business domain'),
        team: z.string().optional().describe('Filter by owning team'),
    },
    async ({ tier, domain, team }) => {
        const systems = await api.listSystems({ tier, domain, team })
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(systems, null, 2)
            }]
        }
    }
)

// Tool: get_system
server.tool(
    'get_system',
    'Get detailed information about a specific system by its URN.',
    {
        urn: z.string().describe('System URN (e.g., urn:scp:my-service:api)'),
    },
    async ({ urn }) => {
        const system = await api.getSystem(urn)
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(system, null, 2)
            }]
        }
    }
)

// Tool: get_dependencies
server.tool(
    'get_dependencies',
    'Get the systems that a specific system depends on (its dependencies).',
    {
        urn: z.string().describe('System URN'),
    },
    async ({ urn }) => {
        const deps = await api.getDependencies(urn)
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(deps, null, 2)
            }]
        }
    }
)

// Tool: get_dependents
server.tool(
    'get_dependents',
    'Get the systems that depend on a specific system (what would break if this system fails).',
    {
        urn: z.string().describe('System URN'),
    },
    async ({ urn }) => {
        const dependents = await api.getDependents(urn)
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(dependents, null, 2)
            }]
        }
    }
)

// Tool: blast_radius
server.tool(
    'blast_radius',
    'Calculate the blast radius for a system - all systems that would be affected if this system fails, up to a specified depth.',
    {
        urn: z.string().describe('System URN'),
        depth: z.number().min(1).max(10).default(3).describe('How many levels of dependencies to traverse (default: 3)'),
    },
    async ({ urn, depth }) => {
        const graph = await api.getBlastRadius(urn, depth)
        const summary = `Blast radius for ${urn}: ${graph.nodes?.length || 0} systems affected`
        return {
            content: [{
                type: 'text',
                text: `${summary}\n\n${JSON.stringify(graph, null, 2)}`
            }]
        }
    }
)

// Tool: get_graph
server.tool(
    'get_graph',
    'Get the complete SCP graph with all systems, capabilities, and dependencies.',
    {},
    async () => {
        const graph = await api.getGraph()
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(graph, null, 2)
            }]
        }
    }
)

// Tool: get_teams
server.tool(
    'get_teams',
    'List all teams and their owned systems.',
    {},
    async () => {
        const teams = await api.getTeams()
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(teams, null, 2)
            }]
        }
    }
)

// Start server
async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('SCP MCP Server running on stdio')
}

main().catch(console.error)
