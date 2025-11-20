import { ApiFactory, InferSchema, log } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import {
  Issue,
  PullRequest,
  ServerContext,
  zIssue,
  zPullRequest,
} from '../types.js';
import {
  DEFAULT_SINCE_INTERVAL_IN_DAYS,
  getDefaultSince,
} from '../util/date.js';
import { getCommits } from '../util/getCommits.js';
import { isIssue, isPullRequest } from '../util/entityTypes.js';

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
      'If true, includes all commits for each pull request in the results. Defaults to false. Use sparingly as this significantly increases token use.',
    ),
  includeClosed: z
    .boolean()
    .describe('If true, will return PRs and/or issues that have been closed.'),
  includeIssues: z
    .boolean()
    .describe('If true, includes relevant issues for the user.'),
  includePullRequests: z
    .boolean()
    .describe('If true, includes relevant pull requests for the user.'),
} as const;

const outputSchema = {
  issues: z.array(zIssue).nullable(),
  pullRequests: z.array(zPullRequest).nullable(),
} as const;

export const getIssuesAndPRsInvolvingUserFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ octokit, org, userStore }) => ({
  name: 'get_issues_and_prs_involving_user',
  method: 'get',
  route: '/issues-and-prs-involving-user',
  config: {
    title: 'Get Recent Issues and/or PRs for User',
    description:
      'Fetches recent pull requests and/or issues for a specific user in the configured GitHub organization.',
    inputSchema,
    outputSchema,
  },
  fn: async ({
    username,
    since,
    includeAllCommits,
    includeIssues,
    includePullRequests,
  }): Promise<InferSchema<typeof outputSchema>> => {
    if (!includeIssues && !includePullRequests)
      return { issues: null, pullRequests: null };
    const sinceToUse = since || getDefaultSince();

    const isClause =
      includeIssues && includePullRequests
        ? null
        : includeIssues
          ? 'is:issue'
          : 'is:pr';

    const rawPRsAndIssues = await octokit.paginate(
      octokit.rest.search.issuesAndPullRequests,
      {
        advanced_search: 'true',
        q: `${isClause ? `${isClause} ` : ''}involves:${username}${org ? ` org:${org}` : ''} updated:>=${sinceToUse.toISOString()}`,
        sort: 'updated',
        order: 'desc',
      },
    );
    const user = await userStore.find(
      (x) => x.username.toLowerCase() === username.toLowerCase(),
    );

    const result = rawPRsAndIssues.reduce<{
      issues: Issue[];
      pullRequestPromises: Promise<PullRequest>[];
    }>(
      (acc, curr) => {
        const [owner, repo] = curr.repository_url.split('/').slice(-2);

        if (isPullRequest(curr)) {
          const getPullRequest = async (): Promise<PullRequest> => {
            return {
              author: curr.user?.login || 'unknown',
              closedAt: curr.closed_at,
              createdAt: curr.created_at,
              description: curr.body || null,
              draft: curr.draft || false,
              mergedAt: curr.pull_request?.merged_at || null,
              number: curr.number,
              repository: curr.repository_url.split('/').slice(-2).join('/'),
              state: curr.state,
              title: curr.title,
              updatedAt: curr.updated_at,
              url: curr.html_url,
              user,
              commits:
                includeAllCommits && curr.user?.login === username
                  ? await getCommits(octokit, owner, repo, curr.number)
                  : undefined,
            };
          };
          acc.pullRequestPromises.push(getPullRequest());
        } else if (isIssue(curr)) {
          acc.issues.push({
            assignee: curr.assignee
              ? { id: curr.assignee.id, username: curr.assignee.login }
              : null,
            assignees: curr.assignees
              ? curr.assignees.map((x) => ({ id: x.id, username: x.login }))
              : null,
            closedAt: curr.closed_at,
            createdAt: curr.created_at,
            description: curr.body || null,
            number: curr.number,
            repository: curr.repository_url.split('/').slice(-2).join('/'),
            state: curr.state,
            title: curr.title,
            updatedAt: curr.updated_at,
            url: curr.html_url,
            user,
          });
        } else {
          log.warn(
            'Could not classify item returned in issuesAndPullRequests',
            { item: curr },
          );
        }

        return acc;
      },
      {
        issues: [],
        pullRequestPromises: [],
      },
    );

    const pullRequests = await Promise.all(result.pullRequestPromises);

    return {
      pullRequests: includePullRequests ? pullRequests : null,
      issues: includeIssues ? result.issues : null,
    };
  },
});
