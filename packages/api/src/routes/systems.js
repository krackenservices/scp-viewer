import { Router } from 'express'
import { runQuery } from '../services/neo4j.js'

const router = Router()

// GET /api/systems
router.get('/', async (req, res) => {
    const { tier, domain, team } = req.query

    let where = []
    let params = {}

    if (tier) {
        where.push('s.tier = $tier')
        params.tier = parseInt(tier)
    }
    if (domain) {
        where.push('s.domain = $domain')
        params.domain = domain
    }
    if (team) {
        where.push('s.team = $team')
        params.team = team
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

    const cypher = `
    MATCH (s:System)
    ${whereClause}
    RETURN s.urn AS urn, s.name AS name, s.tier AS tier, s.domain AS domain, s.team AS team
    ORDER BY s.tier, s.name
  `

    const systems = await runQuery(cypher, params)
    res.json(systems)
})

// GET /api/systems/:urn
router.get('/:urn', async (req, res) => {
    const { urn } = req.params

    const cypher = `
    MATCH (s:System {urn: $urn})
    OPTIONAL MATCH (s)-[:PROVIDES]->(c:Capability)
    OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dep:System)
    OPTIONAL MATCH (dependent:System)-[:DEPENDS_ON]->(s)
    RETURN s.urn AS urn, s.name AS name, s.tier AS tier, s.domain AS domain, 
           s.team AS team, s.description AS description, s.otel_service_name AS otelServiceName,
           collect(DISTINCT c.name) AS capabilities,
           count(DISTINCT dep) AS dependencyCount,
           count(DISTINCT dependent) AS dependentCount
  `

    const results = await runQuery(cypher, { urn })

    if (results.length === 0 || !results[0].urn) {
        return res.status(404).json({ error: 'System not found' })
    }

    res.json(results[0])
})

// GET /api/systems/:urn/dependencies
router.get('/:urn/dependencies', async (req, res) => {
    const { urn } = req.params

    const cypher = `
    MATCH (s:System {urn: $urn})-[r:DEPENDS_ON]->(dep:System)
    RETURN dep.urn AS urn, dep.name AS name, dep.tier AS tier, dep.domain AS domain, dep.team AS team,
           r.type AS type, r.criticality AS criticality, r.failure_mode AS failureMode
  `

    const deps = await runQuery(cypher, { urn })
    res.json(deps.map(d => ({
        system: { urn: d.urn, name: d.name, tier: d.tier, domain: d.domain, team: d.team },
        type: d.type,
        criticality: d.criticality,
        failureMode: d.failureMode
    })))
})

// GET /api/systems/:urn/dependents
router.get('/:urn/dependents', async (req, res) => {
    const { urn } = req.params

    const cypher = `
    MATCH (dependent:System)-[:DEPENDS_ON]->(s:System {urn: $urn})
    RETURN dependent.urn AS urn, dependent.name AS name, dependent.tier AS tier, 
           dependent.domain AS domain, dependent.team AS team
  `

    const dependents = await runQuery(cypher, { urn })
    res.json(dependents)
})

// GET /api/systems/:urn/blast-radius
router.get('/:urn/blast-radius', async (req, res) => {
    const { urn } = req.params
    const depth = parseInt(req.query.depth) || 3

    const cypher = `
    MATCH path = (s:System {urn: $urn})<-[:DEPENDS_ON*1..${depth}]-(dependent:System)
    WITH collect(DISTINCT s) + collect(DISTINCT dependent) AS allNodes, 
         collect(DISTINCT relationships(path)) AS allRels
    UNWIND allNodes AS n
    WITH collect(DISTINCT {id: n.urn, label: n.name, tier: n.tier, domain: n.domain, team: n.team}) AS nodes, 
         allRels
    UNWIND allRels AS rels
    UNWIND rels AS r
    WITH nodes, collect(DISTINCT {source: startNode(r).urn, target: endNode(r).urn, type: r.type, criticality: r.criticality}) AS edges
    RETURN nodes, edges
  `

    const results = await runQuery(cypher, { urn })

    if (results.length === 0) {
        return res.json({ nodes: [], edges: [] })
    }

    res.json(results[0])
})

export default router
