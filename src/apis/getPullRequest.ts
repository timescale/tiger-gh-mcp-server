import type { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { type ServerContext, zPullRequestWithComments } from '../types.js';
import {
  getComments,
  getPullRequestComments,
  resolveUsersFromComments,
} from '../util/getComments.js';
import { getCommits } from '../util/getCommits.js';
import { parseGitHubURL } from '../util/parsePullRequestURL.js';

const inputSchema = {
  url: z
    .string()
    .min(1)
    .nullish()
    .describe(
      'Optional. The GitHub pull request URL to fetch. Provide either url, or both pullNumber and repository.',
    ),
  pullNumber: z
    .number()
    .min(0)
    .nullish()
    .describe(
      'Optional. The pull request number to fetch. Required if url is not provided.',
    ),
  repository: z
    .string()
    .min(1)
    .nullish()
    .describe(
      'Optional. The repository name when using pullNumber. Required if url is not provided.',
    ),
  includeCommits: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false)
    .describe(
      'Optional. If true, includes all commits for the pull request. Defaults to false.',
    ),
  includeComments: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false)
    .describe(
      'Optional. If true, includes comments on the pull request. Defaults to false.',
    ),
  includeReviewComments: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false)
    .describe(
      'Optional. If true, includes all review comments for the pull request. Defaults to false.',
    ),
} as const;

const outputSchema = {
  result: zPullRequestWithComments,
} as const;

export const getPullRequestFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ octokit, org, userStore }) => ({
  name: 'get_pull_request',
  method: 'get',
  route: '/pr',
  config: {
    title: 'Get Pull Request details',
    description:
      'Fetches a specific pull request by URL or pull number and repo.',
    inputSchema,
    outputSchema,
  },
  fn: async ({
    url,
    pullNumber: passedPullNumber,
    repository: passedRepository,
    includeCommits,
    includeComments,
    includeReviewComments,
  }): Promise<InferSchema<typeof outputSchema>> => {
    let repository: string;
    let pullNumber: number;
    let owner = org;

    if (url) {
      ({ repository, number: pullNumber, owner } = parseGitHubURL(url));
    } else if (passedPullNumber && passedRepository) {
      repository = passedRepository;
      pullNumber = passedPullNumber;
    } else {
      throw new Error('Must provide either url or both pullNumber and repo');
    }

    try {
      const pr = await octokit.rest.pulls.get({
        owner,
        repo: repository,
        pull_number: pullNumber,
      });

      const user = await userStore.find((x) => x.id === pr.data.user.id);

      const reviewComments = includeReviewComments
        ? await getPullRequestComments({
            octokit,
            owner,
            repository,
            pullNumber,
            userStore,
          })
        : null;

      const comments = includeComments
        ? await getComments({
            octokit,
            owner,
            repository,
            issueNumber: pullNumber,
            userStore,
          })
        : null;

      const { userMap } =
        comments || reviewComments
          ? await resolveUsersFromComments(
              [
                ...(comments ? comments : []),
                ...(reviewComments ? reviewComments : []),
              ],
              userStore,
            )
          : { userMap: undefined };

      const result = {
        author: pr.data.user?.login || 'unknown',
        closedAt: pr.data.closed_at,
        createdAt: pr.data.created_at,
        description: pr.data.body || null,
        draft: pr.data.draft || false,
        mergedAt: pr.data.merged_at,
        number: pr.data.number,
        repository: `${org}/${repository}`,
        state: pr.data.state,
        title: pr.data.title,
        updatedAt: pr.data.updated_at,
        user,
        url: pr.data.html_url,
        ...(includeCommits
          ? { commits: await getCommits(octokit, org, repository, pullNumber) }
          : {}),
        ...(reviewComments ? { reviewComments } : {}),
        ...(comments ? { comments } : {}),
        ...(userMap
          ? {
              involvedUsers: Array.from(userMap.values()),
            }
          : {}),
      };

      return { result };
    } catch (error) {
      throw new Error(
        `Failed to fetch PR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
