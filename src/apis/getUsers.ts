import { z } from 'zod';
import { ApiFactory } from '../types.js';

const inputSchema = {} as const;

const outputSchema = {
  results: z.array(
    z.object({
      id: z.number(),
      username: z
        .string()
        .describe(
          'This is the GitHub "login" field, which is the official handle of the user.',
        ),
      fullName: z.string().nullable().describe('The full name of the user.'),
    }),
  ),
} as const;

export const getUsersFactory: ApiFactory<
  typeof inputSchema,
  typeof outputSchema
> = ({ octokit, org }) => ({
  name: 'getUsers',
  config: {
    title: 'Get users',
    description:
      'Retrieves all users within the configured GitHub organization',
    inputSchema,
    outputSchema,
  },
  fn: async () => {
    if (!org) {
      throw new Error('GITHUB_ORG environment variable is required.');
    }

    const users = await octokit.paginate(octokit.rest.orgs.listMembers, {
      org: org,
      per_page: 100,
    });

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
          console.error(
            `Error fetching details for user ${user.login}:`,
            error,
          );
          return {
            id: user.id,
            username: user.login,
            fullName: null,
          };
        }
      }),
    );

    return {
      results: userList,
    };
  },
});
