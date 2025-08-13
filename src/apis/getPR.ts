import { z } from 'zod';
import { ApiFactory } from '../shared/boilerplate/src/types.js';
import { ServerContext, zPullRequest } from '../types.js';

const inputSchema = {
  url: z.string().url().describe('The GitHub pull request URL to fetch.'),
} as const;

const outputSchema = {
  result: zPullRequest,
} as const;

export const getPRFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ octokit }) => ({
  name: 'getPR',
  method: 'get',
  route: '/pr',
  config: {
    title: 'Get Pull Request',
    description: 'Fetches a specific pull request by URL.',
    inputSchema,
    outputSchema,
  },
  fn: async ({ url }) => {
    const urlParts = new URL(url);
    const pathParts = urlParts.pathname.split('/');

    if (pathParts.length < 5 || pathParts[3] !== 'pull') {
      throw new Error('Invalid GitHub PR URL format');
    }

    const owner = pathParts[1];
    const repo = pathParts[2];
    const pullNumber = parseInt(pathParts[4], 10);

    if (isNaN(pullNumber)) {
      throw new Error('Invalid pull request number in URL');
    }

    try {
      const pr = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });

      const getCommits = async () => {
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

      const result = {
        author: pr.data.user?.login || 'unknown',
        closedAt: pr.data.closed_at,
        createdAt: pr.data.created_at,
        description: pr.data.body || null,
        draft: pr.data.draft || false,
        mergedAt: pr.data.merged_at,
        number: pr.data.number,
        repository: `${owner}/${repo}`,
        state: pr.data.state,
        title: pr.data.title,
        updatedAt: pr.data.updated_at,
        url: pr.data.html_url,
        commits: await getCommits(),
      };

      return { result };
    } catch (error) {
      throw new Error(
        `Failed to fetch PR: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
