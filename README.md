# Tiger GitHub MCP Server

A wrapper around the GitHub API to provide some focused tools to LLMs via the [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## Development

Cloning and running the server locally.

```bash
git clone git@github.com:timescale/tiger-gh-mcp-server.git
```

### Building

This project uses [bun](https://bun.sh/) as its runtime and package manager. A
wrapper script (`./bun`) is included that downloads a pinned version of bun on
first use, so you don't need to install it globally.

Run `./bun install` to install dependencies. Use `./bun run watch http` to run
the server in HTTP mode and reload on changes.

You will need a GitHub token with the correct scopes. Here is a direct link to [create such a new token](https://github.com/settings/tokens/new?scopes=repo,read:org,read:user,user:email&description=tiger-gh-mcp-server).

Create a `.env` file based on the `.env.sample` file.

```bash
cp .env.sample .env
```

Then update the `GITHUB_TOKEN` value in `.env`.

### VS Code Debugging

The project includes a VS Code debug profile called "Debug Github MCP" that
launches the server in HTTP mode with full debugging support, running the
TypeScript source directly via bun.

To use it:

- Open the project in VS Code
- Go to the Debug panel (Ctrl/Cmd + Shift + D)
- Select "Debug Github MCP" from the dropdown
- Press F5 or click the play button

Breakpoints will work properly in TypeScript source files thanks to source map support.

### Testing

The MCP Inspector is a very handy to exercise the MCP server from a web-based UI.

```bash
./bun run inspector
```

| Field          | Value            |
| -------------- | ---------------- |
| Transport Type | `STDIO`          |
| Command        | `./bun`          |
| Arguments      | `src/index.ts`   |

#### Testing in Claude Desktop

Create/edit the file `~/Library/Application Support/Claude/claude_desktop_config.json` to add an entry like the following, making sure to use the absolute path to your local `tiger-gh-mcp-server` project, and use a valid GitHub token.

```json
{
  "mcpServers": {
    "tiger-gh": {
      "command": "/absolute/path/to/tiger-gh-mcp-server/bun",
      "args": [
        "/absolute/path/to/tiger-gh-mcp-server/src/index.ts",
        "stdio"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_whatever",
        "GITHUB_ORG": "timescale"
      }
    }
  }
}
```
