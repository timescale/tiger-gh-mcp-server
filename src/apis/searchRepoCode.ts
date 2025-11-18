import { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext } from '../types.js';

const inputSchema = {
  repository: z
    .string()
    .min(1)
    .describe('The repository to search in, e.g., "owner/repo".'),
  searchTerm: z
    .string()
    .min(1)
    .describe('The term to search for in the repository.'),
} as const;

const outputSchema = {
  repository: z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
  }),
  results: z.array(
    z.object({
      path: z.string(),
      url: z.string().url(),
      snippets: z.array(
        z.object({
          fragment: z.string(),
          indices: z.array(z.tuple([z.number(), z.number()])),
        }),
      ),
    }),
  ),
  total_count: z.number(),
} as const;

export const searchRepoCode: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ octokit, org }) => ({
  name: 'search_repo_code',
  method: 'get',
  route: '/search/code',
  config: {
    title: 'Search Repository Code',
    description: `
Searches for matching code in the given GitHub repository. If you are unsure of the exact repository name, use \`find_repos\` to locate it first.

A result is returned for each matching file, along with snippets showing the matching code fragments with index offsets for the match location in the fragment.

When referring to a result, always provide a link to the \`url\` field so the user can easily access the full context on GitHub.
`.trim(),
    inputSchema,
    outputSchema,
  },
  fn: async ({
    repository: passedRepository,
    searchTerm,
  }): Promise<InferSchema<typeof outputSchema>> => {
    const parts = passedRepository.split('/');
    const owner = parts.at(-2) || org;
    const repo = parts.at(-1);
    if (!repo) {
      throw new Error('Invalid repository format. Use "owner/repo".');
    }

    let repoInfo;
    try {
      repoInfo = await octokit.repos.get({
        owner,
        repo,
      });
    } catch {
      // Rather than return an empty result set, we throw an error if the repository is not found
      // This helps the agent catch problems with using an incorrect repo name
      throw new Error(`Repository ${owner}/${repo} not found.`);
    }

    const response = await octokit.search.code({
      q: `"${searchTerm}" repo:${owner}/${repo}`,
      headers: {
        Accept: 'application/vnd.github.text-match+json',
      },
    });

    return {
      repository: {
        name: `${owner}/${repo}`,
        description:
          repoInfo?.data?.description ||
          response.data.items[0]?.repository.description ||
          '',
        url:
          repoInfo?.data?.html_url ||
          response.data.items[0]?.repository.url ||
          `https://github.com/${owner}/${repo}`,
      },
      results: response.data.items.map((item) => ({
        path: item.path,
        url: item.html_url,
        snippets:
          item.text_matches?.map(({ fragment, matches }) => ({
            fragment: fragment || '',
            indices:
              matches
                ?.filter((m) => m.indices)
                .map((m) => m.indices as [number, number]) || [],
          })) || [],
      })),
      total_count: response.data.total_count,
    };
  },
});
