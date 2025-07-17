import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import factories from './apis/index.js';
import { ServerContext } from './types.js';

export const createServer = (context: ServerContext) => {
  const server = new McpServer(
    {
      name: 'tiger-gh',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  factories.forEach((factory) => {
    const tool = factory(context);
    // Omit the outputSchema for now, since clients might not support it yet
    const { outputSchema, ...configWithoutOutput } = tool.config;
    server.registerTool(tool.name, configWithoutOutput, async (args) => {
      try {
        const result = await tool.fn(args as any);
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      } catch (error) {
        console.error('Error invoking tool:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${(error as Error).message || 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  });

  return { server };
};
