import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

enum ToolName {
  ADD = 'add',
}

export const createServer = () => {
  const server = new McpServer(
    {
      name: 'tiger-gh-status',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.registerTool(
    ToolName.ADD,
    {
      title: 'Addition tool',
      description: 'Adds two numbers together',
      inputSchema: {
        a: z.number().describe('First number'),
        b: z.number().describe('Second number'),
      },
    },
    async ({ a, b }) => {
      return {
        content: [
          {
            type: 'text',
            text: `${a + b}.`,
          },
        ],
      };
    },
  );

  return { server };
};
