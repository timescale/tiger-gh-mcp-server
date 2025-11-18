import { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext, zUser } from '../types.js';

const inputSchema = {} as const;

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
  fn: async (): Promise<InferSchema<typeof outputSchema>> => {
    const users = await userStore.get();

    return {
      results: users,
    };
  },
  pickResult: (r) => r.results,
});
