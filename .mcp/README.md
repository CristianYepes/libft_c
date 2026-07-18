# libft MCP Server v2.0

Development tools for libft + get_next_line, accessible via Claude Code.

## Tools

| Tool | Description |
|------|-------------|
| `function_lookup` | Semantic search across all functions — prototype, category, allocation info, dependencies |
| `dependency_graph` | Call graph traversal: what any function calls and what calls it, with depth control |
| `test_against_libc` | Compile and run a custom test comparing ft_ functions against libc |
| `allocation_map` | Complete "must I free this?" reference for every function in the library |
| `validate_makefile` | Check Makefile against requirements (relink, flags, targets, GNL integration) |
| `test_gnl` | Test get_next_line with custom file content and configurable BUFFER_SIZE |

## Build

```bash
cd .mcp && npm install && npm run build
```

## Configuration

Already configured in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "libft-tools": {
      "command": "node",
      "args": ["/home/cristian/Desktop/libft_c/.mcp/build/index.js"]
    }
  }
}
```
