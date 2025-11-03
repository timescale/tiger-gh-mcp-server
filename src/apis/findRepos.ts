import { ApiFactory } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext } from '../types.js';

const inputSchema = {
  searchTerm: z
    .string()
    .min(1)
    .describe('The term to search for matching repositories.'),
} as const;

const outputSchema = {
  results: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      url: z.string().url(),
    }),
  ),
} as const;

export const findRepos: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ octokit, org }) => ({
  name: 'find_repos',
  method: 'get',
  route: '/search/repos',
  config: {
    title: 'Find Repositories',
    description: `
Searches for matching repositories in the GitHub organization.

When referring to a result, always provide a link to the \`url\` field so the user can easily access the full context on GitHub.
`.trim(),
    inputSchema,
    outputSchema,
  },
  fn: async ({ searchTerm }) => {
    const response = await octokit.search.repos({
      q: `org:${org} ${searchTerm}`,
    });

    return {
      results: response.data.items.map((item) => ({
        name: `${org}/${item.name}`,
        description: item.description || '',
        url: item.html_url,
      })),
    };
  },
});
