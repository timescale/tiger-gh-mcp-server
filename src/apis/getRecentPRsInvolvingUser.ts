import { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { Commit, ServerContext, zPullRequest } from '../types.js';
import {
  DEFAULT_SINCE_INTERVAL_IN_DAYS,
  getDefaultSince,
} from '../util/date.js';

const inputSchema = {
  username: z
    .string()
    .describe('The GitHub username to fetch pull requests for.'),
  since: z.coerce
    .date()
    .nullable()
    .describe(
      `Fetch PRs updated since this date. Defaults to ${DEFAULT_SINCE_INTERVAL_IN_DAYS} days ago.`,
    ),
  includeAllCommits: z
    .boolean()
    .describe(
      'If true, includes all commits for each pull request in the results.',
    ),
} as const;

const outputSchema = {
  results: z.array(zPullRequest),
} as const;

export const getRecentPRsInvolvingUserFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema,
  z.infer<(typeof outputSchema)['results']>
> = ({ octokit, org, userStore }) => ({
  name: 'get_recent_prs_involving_user',
  method: 'get',
  route: '/recent-prs-involving-user',
  config: {
    title: 'Get Recent PRs for User',
    description:
      'Fetches recent pull requests for a specific user in the configured GitHub organization.',
    inputSchema,
    outputSchema,
  },
  fn: async ({
    username,
    since,
    includeAllCommits,
  }): Promise<InferSchema<typeof outputSchema>> => {
    const sinceToUse = since || getDefaultSince();
    const rawPRs = await octokit.paginate(
      octokit.rest.search.issuesAndPullRequests,
      {
        advanced_search: 'true',
        q: `is:pr involves:${username}${org ? ` org:${org}` : ''} updated:>=${sinceToUse.toISOString()}`,
        sort: 'updated',
        order: 'desc',
      },
    );
    const user = await userStore.find(
      (x) => x.username.toLowerCase() === username.toLowerCase(),
    );

    const getCommits = async (
      owner: string,
      repo: string,
      pullNumber: number,
    ): Promise<Commit[]> => {
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
          user,
          commits:
            includeAllCommits && pr.user?.login === username
              ? await getCommits(owner, repo, pr.number)
              : undefined,
        };
      }),
    );

    return { results };
  },
  pickResult: (r) => r.results,
});
