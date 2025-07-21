import { z } from 'zod';
import { ApiFactory } from '../types.js';

const inputSchema = {
  username: z
    .string()
    .describe('The GitHub username to fetch pull requests for.'),
  since: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .describe(
      'Fetch PRs updated since this date (YYYY-MM-DD). Defaults to 7 days ago.',
    ),
  includeAllCommits: z
    .boolean()
    .optional()
    .describe(
      'If true, includes all commits for each pull request in the results.',
    ),
} as const;

const outputSchema = {
  results: z.array(
    z.object({
      author: z.string(),
      closedAt: z.string().nullable(),
      createdAt: z.string(),
      description: z.string().nullable(),
      draft: z.boolean(),
      mergedAt: z.string().nullable(),
      number: z.number(),
      repository: z.string(),
      state: z.string(),
      title: z.string(),
      updatedAt: z.string(),
      url: z.string().url(),
      commits: z.array(
        z.object({
          author: z.string().nullable(),
          date: z.string().nullable(),
          message: z.string(),
          sha: z.string(),
          url: z.string().url(),
        }),
      ).optional(),
    }),
  ),
} as const;

export const getRecentPRsInvolvingUserFactory: ApiFactory<
  typeof inputSchema,
  typeof outputSchema,
  z.infer<(typeof outputSchema)['results']>
> = ({ octokit, org }) => ({
  name: 'getRecentPRsInvolvingUser',
  method: 'get',
  route: '/recent-prs-involving-user',
  config: {
    title: 'Get Recent PRs for User',
    description:
      'Fetches recent pull requests for a specific user in the configured GitHub organization.',
    inputSchema,
    outputSchema,
  },
  fn: async ({ username, since, includeAllCommits }) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const updatedSince = since || oneWeekAgo.toISOString().split('T')[0];

    const rawPRs = await octokit.paginate(
      octokit.rest.search.issuesAndPullRequests,
      {
        advanced_search: 'true',
        q: `is:pr involves:${username}${org ? ` org:${org}` : ''} updated:>=${updatedSince}`,
        sort: 'updated',
        order: 'desc',
      },
    );

    const getCommits = async (owner: string, repo: string, pullNumber: number) => {
      try {
        const commits = await octokit.rest.pulls.listCommits({
          owner,
          repo,
          pull_number: pullNumber,
        });

        return commits.data.map((commit) => ({
          author: commit.author?.login || null,
          date: commit.commit.author?.date || null,
          message: commit.commit.message,
          sha: commit.sha,
          url: commit.html_url,
        }));
      } catch (error) {
        console.error(`Error fetching commits for PR #${pullNumber}:`, error);
        return [];
      }
    };

    const results = await Promise.all(
      rawPRs.map(async (pr) => {
        const [owner, repo] = pr.repository_url.split('/').slice(-2);
        return {
          author: pr.user?.login || 'unknown',
          closedAt: pr.closed_at,
          createdAt: pr.created_at,
          description: pr.body || null,
          draft: pr.draft || false,
          mergedAt: pr.pull_request?.merged_at || null,
          number: pr.number,
          repository: pr.repository_url.split('/').slice(-2).join('/'),
          state: pr.state,
          title: pr.title,
          updatedAt: pr.updated_at,
          url: pr.html_url,
          commits: includeAllCommits && (pr.user?.login === username) ? await getCommits(owner, repo, pr.number) : undefined,
        };
      }),
    );

    return { results };
  },
  pickResult: (r) => r.results,
});
