import { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext, zUser } from '../types.js';

const inputSchema = {
  username: z
    .string()
    .nullable()
    .describe(
      'Filters by username (GitHub `login` field). This will match on any user whose login/username includes the given username.',
    ),
} as const;

const outputSchema = {
  results: z.array(zUser),
} as const;

export const getUsersFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema,
  z.infer<(typeof outputSchema)['results']>
> = ({ userStore }) => ({
  name: 'get_users',
  method: 'get',
  route: '/users',
  config: {
    title: 'Get users',
    description:
      'Retrieves all users within the configured GitHub organization',
    inputSchema,
    outputSchema,
  },
  fn: async ({ username }): Promise<InferSchema<typeof outputSchema>> => {
    const users = username
      ? await userStore.filter((user) =>
          user.username.toLowerCase().includes(username.toLowerCase()),
        )
      : await userStore.get();

    return {
      results: users || [],
    };
  },
  pickResult: (r) => r.results,
});
