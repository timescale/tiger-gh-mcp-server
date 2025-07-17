import { z } from 'zod';
import { ApiFactory } from '../types.js';

const inputSchema = {
  username: z.string().describe('The GitHub username to fetch commits for.'),
  since: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .describe(
      'Fetch commits since this date (YYYY-MM-DD). Defaults to 7 days ago.',
    ),
} as const;

const outputSchema = {
  results: z.array(
    z.object({
      author: z.string().nullable(),
      date: z.string().nullable(),
      message: z.string(),
      repository: z.string(),
      sha: z.string(),
      url: z.string().url(),
    }),
  ),
} as const;

export const getRecentCommitsFactory: ApiFactory<
  typeof inputSchema,
  typeof outputSchema,
  z.infer<(typeof outputSchema)['results']>
> = ({ octokit, org }) => ({
  name: 'getRecentCommits',
  method: 'get',
  route: '/recent-commits',
  config: {
    title: 'Get Recent Commits for User',
    description:
      'Fetches recent commits for a specific user in the configured GitHub organization.',
    inputSchema,
    outputSchema,
  },
  fn: async ({ username, since }) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const sinceDate = since || oneWeekAgo.toISOString().split('T')[0];

    const rawCommits = await octokit.paginate(octokit.rest.search.commits, {
      q: `author:${username}${org ? ` org:${org}` : ''} author-date:>=${sinceDate}`,
      sort: 'author-date',
      order: 'desc',
    });

    return {
      results: rawCommits.map((commit) => ({
        author: commit.author?.login || null,
        date: commit.commit.author?.date || null,
        message: commit.commit.message,
        repository: commit.repository.full_name,
        sha: commit.sha,
        url: commit.html_url,
      })),
    };
  },
  pickResult: (r) => r.results,
});
