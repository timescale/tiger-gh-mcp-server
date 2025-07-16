# Tiger GitHub MCP Server

A wrapper around the GitHub API to provide some focused tools to LLMs via the [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## Development

Run `npm i` to install dependencies and build the project.

### Testing

The MCP Inspector is very handy.

```bash
npx @modelcontextprotocol/inspector
```

| Field          | Value           |
| -------------- | --------------- |
| Transport Type | `STDIO`         |
| Command        | `node`          |
| Arguments      | `dist/index.js` |
