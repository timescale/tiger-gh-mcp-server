# Tiger GitHub MCP Server

A wrapper around the GitHub API to provide some focused tools to LLMs via the [Model Context Protocol](https://modelcontextprotocol.io/introduction).

## Development

Cloning and running the server locally.

```bash
git clone --recurse-submodules git@github.com:timescale/tiger-gh-mcp-server.git
```

### Submodules

This project uses git submodules to include the mcp boilerplate code. If you cloned the repo without the `--recurse-submodules` flag, run the following command to initialize and update the submodules:

```bash
git submodule update --init --recursive
```

You may also need to run this command if you pull changes that update a submodule. You can simplify this process by changing you git configuration to automatically update submodules when you pull:

```bash
git config --global submodule.recurse true
```

### Building

Run `npm i` to install dependencies and build the project. Use `npm run watch` to rebuild on changes.

You will need a GitHub token with the correct scopes. Here is a direct link to [create such a new token](https://github.com/settings/tokens/new?scopes=repo,read:org,read:user,user:email&description=tiger-gh-mcp-server).

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

## Deployment

We use a Helm chart to deploy to Kubernetes. See the `chart/` directory for details.

### Secrets

Run the following to create a sealed secret for the GitHub credentials. Be sure to fill in the correct values.

```bash
kubectl -n savannah-system create secret generic tiger-gh-mcp-server-github \
  --dry-run=client \
  --from-literal=token="ghp_abc123" \
  -o yaml | kubeseal -o yaml

kubectl -n savannah-system create secret generic tiger-gh-mcp-server-logfire \
  --dry-run=client \
  --from-literal=token="pylf_v1_us_" \
  -o yaml | kubeseal -o yaml
```

Update `./chart/values/dev.yaml` with the output.
