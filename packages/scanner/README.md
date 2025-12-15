# SCP Viewer Scanner

Syncs SCP manifests from local directories or GitHub organizations to Neo4j.

## Usage

```bash
# Install dependencies
uv sync

# Scan local directory
SCAN_PATH=/path/to/repos uv run scan

# Scan GitHub organization
GITHUB_ORG=myorg GITHUB_TOKEN=ghp_xxx uv run scan

# Both
SCAN_PATH=./repos GITHUB_ORG=myorg GITHUB_TOKEN=ghp_xxx uv run scan
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEO4J_URI` | Neo4j connection URI | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `scpviewer` |
| `SCAN_PATH` | Local directory to scan | - |
| `GITHUB_ORG` | GitHub organization to scan | - |
| `GITHUB_TOKEN` | GitHub token for API access | - |
