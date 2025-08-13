import { z } from 'zod';
import { ApiFactory } from '../shared/boilerplate/src/types.js';
import { ServerContext, zPullRequest } from '../types.js';
import { parsePullRequestURL } from '../util/parsePullRequestURL.js';
import { getCommits } from '../util/getCommits.js';

const inputSchema = {
  url: z.string().nullable().describe('The GitHub pull request URL to fetch.'),
  pullRequestNumber: z
    .number()
    .nullable()
    .describe('The pull request number to fetch.'),
  repository: z
    .string()
    .nullable()
    .describe('The repository name when using pullNumber.'),
  includeCommits: z
    .boolean()
    .nullable()
    .describe('If true, includes all commits for the pull request.'),
} as const;

const outputSchema = {
  result: zPullRequest,
} as const;

export const getPRFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ octokit, org }) => ({
  name: 'getPR',
  method: 'get',
  route: '/pr',
  config: {
    title: 'Get Pull Request',
    description:
      'Fetches a specific pull request by URL or pull number and repo.',
    inputSchema,
    outputSchema,
  },
  fn: async ({
    url,
    pullRequestNumber: passedPullRequestNumber,
    repository: passedRepository,
    includeCommits,
  }) => {
    let repository: string;
    let pullNumber: number;

    if (url) {
      const {
        repository: parsedRepository,
        pullRequestNumber: parsedPullRequestNumber,
      } = parsePullRequestURL(url);
      repository = parsedRepository;
      pullNumber = parsedPullRequestNumber;
    } else if (passedPullRequestNumber && passedRepository) {
      repository = passedRepository;
      pullNumber = passedPullRequestNumber;
    } else {
      throw new Error('Must provide either url or both pullNumber and repo');
    }

    try {
      const pr = await octokit.rest.pulls.get({
        owner: org,
        repo: repository,
        pull_number: pullNumber,
      });

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
        url: pr.data.html_url,
        commits: includeCommits
          ? await getCommits(octokit, org, repository, pullNumber)
          : undefined,
      };

      return { result };
    } catch (error) {
      throw new Error(
        `Failed to fetch PR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
