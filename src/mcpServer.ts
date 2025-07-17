import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getRecentPRsInvolvingUserFactory } from './apis/getRecentPRsInvolvingUser.js';
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

  [getRecentPRsInvolvingUserFactory].forEach((factory) => {
    const tool = factory(context);
    // Omit the outputSchema for now, since clients might not support it yet
    const { outputSchema, ...configWithoutOutput } = tool.config;
    server.registerTool(tool.name, configWithoutOutput, async (args) => {
      try {
        const result = await tool.fn(args);
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

  server.registerTool(
    'getUsers',
    {
      title: 'Get users',
      description: 'Retrieves all users within the configured GitHub organization',
      inputSchema: {},
    },
    async () => {
      try {
        if (!org) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: GITHUB_ORG environment variable is required.',
              },
            ],
            isError: true,
          };
        }

        const users = await octokit.paginate(
          octokit.rest.orgs.listMembers,
          {
            org: org,
            per_page: 100,
          },
        );

        const userList = await Promise.all(
          users.map(async (user) => {
            try {
              const userDetails = await octokit.rest.users.getByUsername({
                username: user.login,
              });
              return {
                id: user.id,
                username: user.login,
                fullName: userDetails.data.name || null,
              };
            } catch (error) {
              console.error(`Error fetching details for user ${user.login}:`, error);
              return {
                id: user.id,
                username: user.login,
                fullName: null,
              };
            }
          }),
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(userList),
            },
          ],
        };
      } catch (error) {
        console.error('Error fetching users:', error);
        return {
          content: [
            {
              type: 'text',
              text: 'Error fetching users from the organization.',
            },
          ],
          isError: true,
        };
      }
    },
  );

  return { server };
};
