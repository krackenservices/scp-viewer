# SCP Viewer

Interactive web dashboard for visualizing and exploring SCP architecture graphs.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Viewer    │────▶│     API     │────▶│   Neo4j     │
│   :3000     │     │   :4000     │     │   :7474     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               ▲
                                        ┌─────────────┐
                                        │   Scanner   │
                                        └─────────────┘
```

## Quick Start (Docker)

```bash
# Start all services
docker-compose up -d

# Run scanner to populate data
mkdir -p data
cp -r /path/to/repos/with/scp-yaml data/
docker-compose --profile scan up scanner
```

**Viewer:** http://localhost:3000  
**API Docs:** http://localhost:4000/docs  
**Neo4j Browser:** http://localhost:7474

## Development

```bash
# Start just Neo4j
docker-compose up -d neo4j

# Run API locally
cd packages/api && npm install && npm run dev

# Run Viewer locally
cd packages/viewer && npm install && npm run dev

# Run scanner locally
cd packages/scanner && uv sync
SCAN_PATH=/path/to/repos uv run scan
```

## Packages

| Package | Description |
|---------|-------------|
| [viewer](./packages/viewer) | React + Cytoscape.js graph visualization |
| [api](./packages/api) | Express + OpenAPI REST API |
| [scanner](./packages/scanner) | Python scanner (uses scp-constructor) |
