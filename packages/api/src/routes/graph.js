import { Router } from 'express'
import { runQuery } from '../services/neo4j.js'

const router = Router()

// GET /api/graph
router.get('/', async (req, res) => {
    const cypher = `
    MATCH (s:System)
    OPTIONAL MATCH (s)-[r:DEPENDS_ON]->(dep:System)
    WITH collect(DISTINCT {id: s.urn, label: s.name, tier: s.tier, domain: s.domain, team: s.team}) AS nodes,
         collect(DISTINCT CASE WHEN dep IS NOT NULL THEN {source: s.urn, target: dep.urn, type: r.type, criticality: r.criticality} END) AS edges
    RETURN nodes, [e IN edges WHERE e IS NOT NULL] AS edges
  `

    const results = await runQuery(cypher)

    if (results.length === 0) {
        return res.json({ nodes: [], edges: [] })
    }

    res.json(results[0])
})

export default router
