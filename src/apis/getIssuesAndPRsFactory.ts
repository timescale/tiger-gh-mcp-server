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
import { extractOwnerAndRepo } from '../util/repoName.js';

const inputSchema = {
  usernameFilter: z
    .string()
    .describe('The GitHub username to search for. Uses GitHub\'s "involves:" search which includes issues/PRs the user created, commented on, or was mentioned in.'),
  repositoryFilter: z.string().describe('The repository to limit search to (format: owner/repo or just repo-name if within the configured org).'),
  since: z.coerce
    .date()
    .nullable()
    .describe(
      `Limit search to activity that occurred after this date. Defaults to ${DEFAULT_SINCE_INTERVAL_IN_DAYS} days ago.`,
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

export const getIssuesAndPRsFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema
> = ({ octokit, org, userStore }) => ({
  name: 'get_issues_and_prs',
  method: 'get',
  route: '/issues-and-prs',
  config: {
    title: 'Get Recent Issues and/or PRs for organization, repo, or user.',
    description:
      'Fetches recent pull requests and/or issues. By default, will return organization-wide results. Specifying a username or repository will limit the results accordingly.',
    inputSchema,
    outputSchema,
  },
  fn: async ({
    usernameFilter,
    repositoryFilter,
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

    const repoFilter = repositoryFilter
      ? `repo:${extractOwnerAndRepo(repositoryFilter, org).ownerAndRepo}`
      : null;

    const rawPRsAndIssues = await octokit.paginate(
      octokit.rest.search.issuesAndPullRequests,
      {
        advanced_search: 'true',
        q: `${isClause ? `${isClause} ` : ''}${repoFilter ? `${repoFilter} ` : ''}involves:${usernameFilter}${org ? ` org:${org}` : ''} updated:>=${sinceToUse.toISOString()}`,
        sort: 'updated',
        order: 'desc',
      },
    );
    const user = await userStore.find(
      (x) => x.username.toLowerCase() === usernameFilter.toLowerCase(),
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
                includeAllCommits && curr.user?.login === usernameFilter
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
