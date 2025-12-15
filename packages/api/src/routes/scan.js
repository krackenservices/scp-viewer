import { Router } from 'express'

const router = Router()

// POST /api/scan
router.post('/', async (req, res) => {
    // TODO: Trigger scanner Lambda or queue job
    const scanId = `scan-${Date.now()}`

    res.status(202).json({
        status: 'triggered',
        scanId
    })
})

export default router
