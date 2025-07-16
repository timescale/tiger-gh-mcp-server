import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { Octokit } from '@octokit/rest';

import 'dotenv/config';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const org = process.env.GITHUB_ORG;

export const createServer = () => {
  const server = new McpServer(
    {
      name: 'tiger-gh',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.registerTool(
    'getRecentPRsInvolvingUser',
    {
      title: 'Get Recent PRs for User',
      description:
        'Fetches recent pull requests for a specific user in the configured GitHub organization.',
      inputSchema: {
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
      },
    },
    async ({ username, since }) => {
      try {
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

        const pullRequests = rawPRs.map((pr) => ({
          author: pr.user?.login || 'unknown',
          closedAt: pr.closed_at,
          createdAt: pr.created_at,
          description: pr.body,
          draft: pr.draft || false,
          mergedAt: pr.pull_request?.merged_at || null,
          number: pr.number,
          repository: pr.repository_url.split('/').slice(-2).join('/'),
          state: pr.state,
          title: pr.title,
          updatedAt: pr.updated_at,
          url: pr.html_url,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pullRequests),
            },
          ],
        };
      } catch (error) {
        console.error('Error fetching pull requests:', error);
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching pull requests for user ${username}.`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  return { server };
};
