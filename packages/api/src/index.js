import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import systemsRouter from './routes/systems.js'
import graphRouter from './routes/graph.js'
import teamsRouter from './routes/teams.js'
import scanRouter from './routes/scan.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// OpenAPI spec
const openapiSpec = YAML.load(join(__dirname, '..', 'openapi.yaml'))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec))
app.get('/openapi.yaml', (req, res) => {
    res.sendFile(join(__dirname, '..', 'openapi.yaml'))
})

// Routes
app.use('/api/systems', systemsRouter)
app.use('/api/graph', graphRouter)
app.use('/api/teams', teamsRouter)
app.use('/api/scan', scanRouter)

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', version: '0.1.0' })
})

// Error handler
app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`)
    console.log(`📖 API docs: http://localhost:${PORT}/docs`)
})
