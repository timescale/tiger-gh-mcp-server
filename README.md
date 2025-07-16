# Tiger GitHub MCP Server

A wrapper around the GitHub API to provide some focused tools to LLMs via the [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## Development

Run `npm i` to install dependencies and build the project.

You will need a GitHub token with the correct scopes. Here is a direct link to [create a new token](https://github.com/settings/tokens/new?scopes=repo,read:org,read:user,user:email&description=tiger-gh-mcp-server).

Create a `.env` file based on the `.env.sample` file.

```bash
cp .env.sample .env
```

Then update the `GITHUB_TOKEN` value in `.env`.

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

#### Testing in Claude Desktop

Create/edit the file `~/Library/Application Support/Claude/claude_desktop_config.json` to add an entry like the following, making sure to use the absolute path to your local `tiger-gh-mcp-server` project, and use a valid GitHub token.

```json
{
  "mcpServers": {
    "tiger-gh": {
      "command": "node",
      "args": ["/absolute/path/to/tiger-gh-mcp-server/dist/index.js", "stdio"],
      "env": {
        "GITHUB_TOKEN": "ghp_whatever",
        "GITHUB_ORG": "timescale"
      }
    }
  }
}
```
