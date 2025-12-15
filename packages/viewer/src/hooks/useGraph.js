import { useState, useEffect } from 'react'

export function useGraph() {
    const [graph, setGraph] = useState({ nodes: [], edges: [] })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch('/api/graph')
            .then(res => res.json())
            .then(data => {
                setGraph(data)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [])

    return { graph, loading, error }
}

export function useSystem(urn) {
    const [system, setSystem] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!urn) {
            setSystem(null)
            setLoading(false)
            return
        }

        setLoading(true)
        fetch(`/api/systems/${encodeURIComponent(urn)}`)
            .then(res => res.json())
            .then(data => {
                setSystem(data)
                setLoading(false)
            })
            .catch(() => {
                setSystem(null)
                setLoading(false)
            })
    }, [urn])

    return { system, loading }
}
