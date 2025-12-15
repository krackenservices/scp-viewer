import { Router } from 'express'
import { runQuery } from '../services/neo4j.js'

const router = Router()

// GET /api/teams
router.get('/', async (req, res) => {
    const cypher = `
    MATCH (s:System)
    RETURN s.team AS id, s.team AS name, count(s) AS systemCount
    ORDER BY systemCount DESC
  `

    const teams = await runQuery(cypher)
    res.json(teams)
})

export default router
