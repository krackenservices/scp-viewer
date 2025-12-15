"""CLI for SCP Viewer scanner."""

import os
import sys

from scp_constructor.scanner.local import scan_directory
from scp_constructor.scanner.github import scan_github_org
from scp_constructor.parser import load_scp

from .sync import Neo4jSync


def main():
    """Run the scanner."""
    # Environment variables
    neo4j_uri = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user = os.environ.get("NEO4J_USER", "neo4j")
    neo4j_password = os.environ.get("NEO4J_PASSWORD", "scpviewer")
    
    scan_path = os.environ.get("SCAN_PATH")
    github_org = os.environ.get("GITHUB_ORG")
    github_token = os.environ.get("GITHUB_TOKEN")

    print("🔍 SCP Viewer Scanner")
    print(f"   Neo4j: {neo4j_uri}")

    with Neo4jSync(neo4j_uri, neo4j_user, neo4j_password) as sync:
        sync.setup_constraints()

        manifests = []

        # Scan local path
        if scan_path:
            print(f"\n📁 Scanning local path: {scan_path}")
            scp_files = scan_directory(scan_path)
            print(f"   Found {len(scp_files)} SCP files")

            for scp_file in scp_files:
                try:
                    manifest = load_scp(scp_file)
                    manifests.append((manifest, str(scp_file)))
                    print(f"   ✓ {manifest.system.name}")
                except Exception as e:
                    print(f"   ✗ {scp_file}: {e}")

        # Scan GitHub org
        if github_org and github_token:
            print(f"\n🐙 Scanning GitHub org: {github_org}")
            try:
                github_files = scan_github_org(github_org, github_token)
                print(f"   Found {len(github_files)} SCP files")

                for gf in github_files:
                    manifests.append((gf.manifest, gf.repo))
                    print(f"   ✓ {gf.manifest.system.name} ({gf.repo})")
            except Exception as e:
                print(f"   ✗ GitHub scan failed: {e}")

        # Sync to Neo4j
        if manifests:
            print(f"\n📊 Syncing {len(manifests)} systems to Neo4j...")
            sync.sync_manifests(manifests)
            print("   ✓ Sync complete")
        else:
            print("\n⚠️  No manifests found to sync")
            print("   Set SCAN_PATH or GITHUB_ORG + GITHUB_TOKEN")
            sys.exit(1)


if __name__ == "__main__":
    main()
