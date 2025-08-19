import { z } from 'zod';
import { ServerContext, zUser } from '../types.js';
import { ApiFactory } from '../shared/boilerplate/src/types.js';

const inputSchema = {} as const;

const outputSchema = {
  results: z.array(zUser),
} as const;

export const getUsersFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema,
  z.infer<(typeof outputSchema)['results']>
> = ({ octokit, org }) => ({
  name: 'getUsers',
  method: 'get',
  route: '/users',
  config: {
    title: 'Get users',
    description:
      'Retrieves all users within the configured GitHub organization',
    inputSchema,
    outputSchema,
  },
  fn: async () => {
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
            email: userDetails.data.email || null,
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
            email: null,
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
  pickResult: (r) => r.results,
});
