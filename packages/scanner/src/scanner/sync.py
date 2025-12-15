"""Neo4j sync service for SCP manifests."""

from neo4j import GraphDatabase


class Neo4jSync:
    """Syncs SCP manifests to Neo4j database."""

    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def setup_constraints(self):
        """Create database constraints and indexes."""
        with self.driver.session() as session:
            session.run("CREATE CONSTRAINT system_urn IF NOT EXISTS FOR (s:System) REQUIRE s.urn IS UNIQUE")
            session.run("CREATE CONSTRAINT capability_id IF NOT EXISTS FOR (c:Capability) REQUIRE c.id IS UNIQUE")
            session.run("CREATE INDEX system_tier IF NOT EXISTS FOR (s:System) ON (s.tier)")
            session.run("CREATE INDEX system_team IF NOT EXISTS FOR (s:System) ON (s.team)")

    def sync_manifest(self, manifest, source: str = None):
        """Sync a single SCP manifest to the database."""
        with self.driver.session() as session:
            # Upsert system
            session.run(
                """
                MERGE (s:System {urn: $urn})
                SET s.name = $name,
                    s.description = $description,
                    s.tier = $tier,
                    s.domain = $domain,
                    s.team = $team,
                    s.source = $source,
                    s.updated_at = datetime()
                """,
                {
                    "urn": manifest.system.urn,
                    "name": manifest.system.name,
                    "description": manifest.system.description,
                    "tier": manifest.system.classification.tier if manifest.system.classification else None,
                    "domain": manifest.system.classification.domain if manifest.system.classification else None,
                    "team": manifest.ownership.team if manifest.ownership else None,
                    "source": source,
                },
            )

            # Sync capabilities
            if manifest.provides:
                for cap in manifest.provides:
                    session.run(
                        """
                        MERGE (c:Capability {id: $id})
                        SET c.name = $capability, c.type = $type
                        WITH c
                        MATCH (s:System {urn: $urn})
                        MERGE (s)-[:PROVIDES]->(c)
                        """,
                        {
                            "id": f"{manifest.system.urn}:{cap.capability}",
                            "capability": cap.capability,
                            "type": cap.type,
                            "urn": manifest.system.urn,
                        },
                    )

            # Sync dependencies
            if manifest.depends:
                for dep in manifest.depends:
                    session.run(
                        """
                        MATCH (s:System {urn: $urn})
                        MERGE (dep:System {urn: $dep_urn})
                        MERGE (s)-[r:DEPENDS_ON]->(dep)
                        SET r.type = $type,
                            r.criticality = $criticality,
                            r.failure_mode = $failure_mode
                        """,
                        {
                            "urn": manifest.system.urn,
                            "dep_urn": dep.system,
                            "type": dep.type,
                            "criticality": dep.criticality,
                            "failure_mode": dep.failure_mode,
                        },
                    )

    def sync_manifests(self, manifests: list):
        """Sync multiple manifests."""
        for manifest, source in manifests:
            self.sync_manifest(manifest, source)
