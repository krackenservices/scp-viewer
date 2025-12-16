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
make up

# Run scanner to populate data
mkdir -p data
cp -r /path/to/repos/with/scp-yaml data/
make scan
```

**Viewer:** http://localhost:3000  
**API Docs:** http://localhost:4000/docs  
**Neo4j Browser:** http://localhost:7474

## Development

```bash
# Install dependencies
make setup

# Start just Neo4j
docker compose up -d neo4j

# Run API and Viewer locally
make dev
```

## Makefile Commands

Run `make help` to see all available commands.

## Packages

| Package | Description |
|---------|-------------|
| [viewer](./packages/viewer) | React + Cytoscape.js graph visualization |
| [api](./packages/api) | Express + OpenAPI REST API |
| [scanner](./packages/scanner) | Python scanner (uses scp-constructor) |

## SCP Graph

![SCP Graph](scp.mmd)

