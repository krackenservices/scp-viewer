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

// Suppress logging unless DEBUG is set (avoid contaminating JSON-RPC stream)
const DEBUG = process.env.DEBUG === 'true' || process.env.DEBUG === '1'
function log(...args) {
    if (DEBUG) {
        console.error(...args)
    }
}

/**
 * Wrap a tool handler with error handling.
 * Returns MCP-compliant error response on failure.
 */
function wrapHandler(handler) {
    return async (params) => {
        try {
            return await handler(params)
        } catch (err) {
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${err.message}`
                }],
                isError: true
            }
        }
    }
}

const server = new McpServer({
    name: 'scp-mcp',
    version: '0.1.0',
})

// ============================================================================
// TOOLS
// ============================================================================

// Tool: list_systems
server.tool(
    'list_systems',
    'Global search and discovery for the SCP registry. Use this to find system URNs when you only have a name or need to browse by domain/team. Returns a list of system summaries (URN, name, description, tier).',
    {
        tier: z.number().min(1).max(5).optional().describe('Filter by tier (1=critical, 5=experimental)'),
        domain: z.string().optional().describe('Filter by business domain'),
        team: z.string().optional().describe('Filter by owning team'),
    },
    wrapHandler(async ({ tier, domain, team }) => {
        const systems = await api.listSystems({ tier, domain, team })
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(systems, null, 2)
            }]
        }
    })
)

// Tool: get_system
server.tool(
    'get_system',
    'Retrieve the authoritative definition of a single system. Returns the full scp.yaml manifest including: ownership, classification, provided capabilities, runtime details (trace IDs), failure modes, and security constraints.',
    {
        urn: z.string().describe('System URN (e.g., urn:scp:my-service:api)'),
    },
    wrapHandler(async ({ urn }) => {
        const system = await api.getSystem(urn)
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(system, null, 2)
            }]
        }
    })
)

// Tool: get_dependencies
server.tool(
    'get_dependencies',
    "Resolve upstream dependencies (the 'builds-on' graph). Returns a list of systems that the target directly relies on. Includes dependency metadata like criticality (required/optional) and coupling. Use for understanding composition or finding upstream root causes.",
    {
        urn: z.string().describe('System URN'),
    },
    wrapHandler(async ({ urn }) => {
        const deps = await api.getDependencies(urn)
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(deps, null, 2)
            }]
        }
    })
)

// Tool: get_dependents
server.tool(
    'get_dependents',
    "Resolve downstream consumers (the 'supports' graph). Returns a list of systems that depend on the target. Use for impact analysis ('If I change X, who breaks?') or identifying stakeholders.",
    {
        urn: z.string().describe('System URN'),
    },
    wrapHandler(async ({ urn }) => {
        const dependents = await api.getDependents(urn)
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(dependents, null, 2)
            }]
        }
    })
)

// Tool: blast_radius
server.tool(
    'blast_radius',
    'Calculate the full cascading impact of a failure. Performs a recursive graph traversal to find all systems eventually affected if the target fails. Returns a subgraph of all affected nodes/edges.',
    {
        urn: z.string().describe('System URN'),
        depth: z.number().min(1).max(10).optional().describe('How many levels of dependencies to traverse (default: 3)'),
    },
    wrapHandler(async ({ urn, depth }) => {
        // Explicit default handling since Zod .default() may not propagate through MCP SDK
        const effectiveDepth = depth ?? 3
        const graph = await api.getBlastRadius(urn, effectiveDepth)
        const summary = `Blast radius for ${urn}: ${graph.nodes?.length || 0} systems affected`
        return {
            content: [{
                type: 'text',
                text: `${summary}\n\n${JSON.stringify(graph, null, 2)}`
            }]
        }
    })
)

// Tool: get_graph
server.tool(
    'get_graph',
    'Dump the entire architecture graph state (all nodes and edges). WARNING: Output helps visualization but can be very large. Prefer targeted exploration with list_systems/get_system where possible.',
    {},
    wrapHandler(async () => {
        const graph = await api.getGraph()
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(graph, null, 2)
            }]
        }
    })
)

// Tool: get_teams
server.tool(
    'get_teams',
    'Directory of organizational ownership. Returns a list of all teams and the systems they own. Use to map architecture to org chart or bulk-find systems by team.',
    {},
    wrapHandler(async () => {
        const teams = await api.getTeams()
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(teams, null, 2)
            }]
        }
    })
)

// ============================================================================
// RESOURCES
// ============================================================================

// Resource: Graph Summary
server.resource(
    'graph-summary',
    'scp://graph/summary',
    {
        mimeType: 'application/json',
        description: 'Summary of the SCP graph: system count, edge count, domains, and teams',
    },
    async (uri) => {
        try {
            const graph = await api.getGraph()
            const summary = {
                systemCount: graph.nodes?.length || 0,
                edgeCount: graph.edges?.length || 0,
                domains: [...new Set(graph.nodes?.map(n => n.domain).filter(Boolean) || [])],
                teams: [...new Set(graph.nodes?.map(n => n.team).filter(Boolean) || [])],
            }
            return {
                contents: [{
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify(summary, null, 2)
                }]
            }
        } catch (err) {
            return {
                contents: [{
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: err.message })
                }]
            }
        }
    }
)

// Resource: System by URN (template)
server.resource(
    'system',
    'scp://system/{urn}',
    {
        mimeType: 'application/json',
        description: 'Get system details by URN',
    },
    async (uri) => {
        try {
            // Extract URN from path: scp://system/urn:scp:foo:bar -> urn:scp:foo:bar
            const urn = decodeURIComponent(uri.pathname.slice(1)) // remove leading /
            const system = await api.getSystem(urn)
            return {
                contents: [{
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify(system, null, 2)
                }]
            }
        } catch (err) {
            return {
                contents: [{
                    uri: uri.href,
                    mimeType: 'application/json',
                    text: JSON.stringify({ error: err.message })
                }]
            }
        }
    }
)

// ============================================================================
// STARTUP
// ============================================================================

async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    log('SCP MCP Server running on stdio')
}

main().catch((err) => {
    log('Failed to start SCP MCP Server:', err)
    process.exit(1)
})
