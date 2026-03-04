import { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext, zIssueWithComments } from '../types.js';
import { getComments } from '../util/getComments.js';
import { parseGitHubURL } from '../util/parsePullRequestURL.js';

const inputSchema = {
  url: z.string().min(1).nullable().describe('The GitHub issue URL to fetch.'),
  issueNumber: z
    .number()
    .min(0)
    .nullable()
    .describe('The issue number to fetch.'),
  repository: z
    .string()
    .min(1)
    .nullable()
    .describe('The repository name when using issueNumber.'),
  includeComments: z
    .boolean()
    .describe('If true, includes all comments for the issue.'),
} as const;

const outputSchema = {
  result: zIssueWithComments,
} as const;

export const getIssueFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ octokit, org, userStore }) => ({
  name: 'get_issue',
  method: 'get',
  route: '/issue',
  config: {
    title: 'Get Issue details',
    description: 'Fetches a specific issue by URL or issue number and repo.',
    inputSchema,
    outputSchema,
  },
  fn: async ({
    url,
    issueNumber: passedIssueNumber,
    repository: passedRepository,
    includeComments,
  }): Promise<InferSchema<typeof outputSchema>> => {
    let repository: string;
    let issueNumber: number;
    let owner = org;

    if (url) {
      ({ owner, repository, number: issueNumber } = parseGitHubURL(url));
    } else if (passedIssueNumber && passedRepository) {
      repository = passedRepository;
      issueNumber = passedIssueNumber;
    } else {
      throw new Error('Must provide either url or both issueNumber and repo');
    }

    try {
      const issue = await octokit.rest.issues.get({
        owner,
        repo: repository,
        issue_number: issueNumber,
      });

      const result = {
        author: issue.data.user?.login || 'unknown',
        closedAt: issue.data.closed_at,
        createdAt: issue.data.created_at,
        description: issue.data.body || null,
        number: issue.data.number,
        repository: `${org}/${repository}`,
        state: issue.data.state,
        title: issue.data.title,
        updatedAt: issue.data.updated_at,
        url: issue.data.html_url,
        assignee: issue.data.assignee?.login ?? null,
        assignees: issue.data.assignees?.map((a) => a.login) ?? [],
        ...(includeComments
          ? await getComments({
              octokit,
              owner,
              repository,
              issueNumber,
              userStore,
            })
          : {}),
      };

      return { result };
    } catch (error) {
      throw new Error(
        `Failed to fetch issue: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
