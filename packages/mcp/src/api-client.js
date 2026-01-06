/**
 * API client for SCP Viewer API.
 * All data access goes through the API (API-first architecture).
 */

const API_URL = process.env.SCP_API_URL || 'http://localhost:4000'

/**
 * Make a request to the SCP API.
 * @param {string} path - API path (e.g., '/api/systems')
 * @param {object} params - Query parameters
 * @returns {Promise<any>} Response data
 */
export async function apiRequest(path, params = {}) {
    const url = new URL(path, API_URL)
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value))
        }
    })

    const response = await fetch(url.toString())
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(error.error || `API error: ${response.status}`)
    }
    return response.json()
}

// API methods matching the SCP Viewer API endpoints

export async function listSystems(filters = {}) {
    return apiRequest('/api/systems', filters)
}

export async function getSystem(urn) {
    return apiRequest(`/api/systems/${encodeURIComponent(urn)}`)
}

export async function getDependencies(urn) {
    return apiRequest(`/api/systems/${encodeURIComponent(urn)}/dependencies`)
}

export async function getDependents(urn) {
    return apiRequest(`/api/systems/${encodeURIComponent(urn)}/dependents`)
}

export async function getBlastRadius(urn, depth = 3) {
    return apiRequest(`/api/systems/${encodeURIComponent(urn)}/blast-radius`, { depth })
}

export async function getGraph() {
    return apiRequest('/api/graph')
}

export async function getTeams() {
    return apiRequest('/api/teams')
}
