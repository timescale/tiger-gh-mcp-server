import { z } from 'zod';
import { ServerContext, zUser } from '../types.js';
import { ApiFactory } from '../shared/boilerplate/src/types.js';

const inputSchema = {
  id: z.number().optional().describe('The numeric ID of the user'),
  username: z.string().optional().describe('The username (login) of the user'),
} as const;

const outputSchema = {
  user: zUser.nullable(),
} as const;

export const getUserFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema,
  z.infer<(typeof outputSchema)['user']>
> = ({ usersStore }) => ({
  name: 'getUser',
  method: 'get',
  route: '/user',
  config: {
    title: 'Get user',
    description:
      'Retrieves a single user by ID or username from the configured GitHub organization',
    inputSchema,
    outputSchema,
  },
  fn: async ({ id, username }) => {
    if (!id && !username) {
      throw new Error('Either id or username must be provided');
    }

    const users = await usersStore.get();
    const user =
      users.find(
        (user) =>
          (username
            ? user.username.toLowerCase() === username?.toLowerCase()
            : true) && (id ? user.id === id : true),
      ) ?? null;

    return {
      user,
    };
  },
  pickResult: (r) => r.user,
});
