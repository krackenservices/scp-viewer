import neo4j from 'neo4j-driver'

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'scpviewer'

let driver = null

export function getDriver() {
    if (!driver) {
        driver = neo4j.driver(
            NEO4J_URI,
            neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
        )
    }
    return driver
}

export async function runQuery(cypher, params = {}) {
    const session = getDriver().session()
    try {
        const result = await session.run(cypher, params)
        return result.records.map(record => {
            const obj = {}
            record.keys.forEach(key => {
                const value = record.get(key)
                // Handle Neo4j integers
                if (neo4j.isInt(value)) {
                    obj[key] = value.toNumber()
                } else if (value && value.properties) {
                    obj[key] = value.properties
                } else {
                    obj[key] = value
                }
            })
            return obj
        })
    } finally {
        await session.close()
    }
}

export async function close() {
    if (driver) {
        await driver.close()
        driver = null
    }
}
