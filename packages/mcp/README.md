# SCP MCP Server

Model Context Protocol server that exposes SCP architecture data to LLMs.

## Architecture

This package follows **API-first** design — all data is fetched from the SCP Viewer API, not directly from the database.

```
LLM ──MCP──► mcp server ──HTTP──► API ──Neo4j──► Graph
```

## Tools

| Tool | Description |
|------|-------------|
| `list_systems` | List systems with optional tier/domain/team filters |
| `get_system` | Get detailed system info by URN |
| `get_dependencies` | What a system depends on |
| `get_dependents` | What depends on a system |
| `blast_radius` | Calculate blast radius graph |
| `get_graph` | Get complete SCP graph |
| `get_teams` | List teams and owned systems |

## Usage

### With Claude Desktop

Add to your Claude Desktop config (`~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "scp": {
      "command": "node",
      "args": ["/path/to/scp-viewer/packages/mcp/src/index.js"],
      "env": {
        "SCP_API_URL": "http://localhost:4000"
      }
    }
  }
}
```

### Standalone

```bash
# Ensure API is running
cd ../api && npm start

# Run MCP server
SCP_API_URL=http://localhost:4000 npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SCP_API_URL` | `http://localhost:4000` | SCP Viewer API URL |
