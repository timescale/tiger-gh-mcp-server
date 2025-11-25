import { ApiFactory, InferSchema, log } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import {
  Issue,
  PullRequest,
  ServerContext,
  User,
  zIssue,
  zPullRequest,
  zUser,
} from '../types.js';
import {
  DEFAULT_SINCE_INTERVAL_IN_DAYS,
  getDefaultSince,
} from '../util/date.js';
import { getCommits } from '../util/getCommits.js';
import { isIssue, isPullRequest } from '../util/entityTypes.js';
import { extractOwnerAndRepo, getRepositoryName } from '../util/string.js';
import { getUser } from '../util/getUser.js';

const inputSchema = {
  username: z
    .string()
    .nullable()
    .describe(
      'Limit the search to this particular GitHub username. If specified, will only return PRs and/or issues that involve specified username. Uses GitHub\'s "involves:" search which includes issues/PRs the user created, commented on, or was mentioned in.',
    ),
  repository: z
    .string()
    .nullable()
    .describe(
      'The repository to limit search to (format: owner/repo or just repo-name if within the configured org). If specified, will only return PRs and/or issues that are within specified repository.',
    ),
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
  usersInvolved: z
    .record(z.string(), zUser)
    .nullish()
    .describe(
      'Map of user IDs to user objects for all users mentioned in issues and PRs',
    ),
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
    username,
    repository,
    since,
    includeAllCommits,
    includeClosed,
    includeIssues,
    includePullRequests,
  }): Promise<InferSchema<typeof outputSchema>> => {
    if (!includeIssues && !includePullRequests)
      return { issues: null, pullRequests: null, usersInvolved: null };
    const sinceToUse = since || getDefaultSince();

    const repoFilter = repository
      ? `repo:${extractOwnerAndRepo(repository, org).ownerAndRepo}`
      : null;

    const usernameFilter = username ? `involves:${username}` : null;

    const query = [
      includeIssues && includePullRequests
        ? null
        : includeIssues
          ? 'is:issue'
          : 'is:pr',
      repoFilter,
      usernameFilter,
      !repoFilter && org ? `org:${org}` : null,
      includeClosed ? null : 'is:open',
      `updated:>=${sinceToUse.toISOString()}`,
    ]
      .filter((x) => !!x)
      .join(' ');

    const rawPRsAndIssues = await octokit.paginate(
      octokit.rest.search.issuesAndPullRequests,
      {
        q: query,
        sort: 'updated',
        order: 'desc',
      },
    );

    const usersInvolved: Record<string, User> = {};
    const issues: Issue[] = [];
    const pullRequests: PullRequest[] = [];

    const addInvolvedUser = async (username?: string) => {
      if (!!username && !usersInvolved[username]) {
        const user = await getUser({
          octokit,
          username,
          userStore,
        });

        if (user) {
          usersInvolved[username] = user;
        }
      }
    };

    for (const curr of rawPRsAndIssues) {
      const [owner, repo] = curr.repository_url.split('/').slice(-2);

      if (isPullRequest(curr)) {
        const currentUsername = curr.user?.login;
        await addInvolvedUser(currentUsername);

        pullRequests.push({
          author: currentUsername || 'unknown',
          closedAt: curr.closed_at,
          createdAt: curr.created_at,
          description: curr.body || null,
          draft: curr.draft || false,
          mergedAt: curr.pull_request?.merged_at || null,
          number: curr.number,
          repository: getRepositoryName(curr.repository_url),
          state: curr.state,
          title: curr.title,
          updatedAt: curr.updated_at,
          url: curr.html_url,
          commits:
            includeAllCommits && curr.user?.login === username
              ? await getCommits(octokit, owner, repo, curr.number)
              : undefined,
        });
      } else if (isIssue(curr)) {
        const assigneeUsername = curr.assignee?.login;
        const authorUsername = curr.user?.login;

        await addInvolvedUser(assigneeUsername);
        await addInvolvedUser(authorUsername);

        issues.push({
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
          repository: getRepositoryName(curr.repository_url),
          state: curr.state,
          title: curr.title,
          updatedAt: curr.updated_at,
          url: curr.html_url,
        });
      } else {
        log.warn('Could not classify item returned in issuesAndPullRequests', {
          item: curr,
        });
      }
    }

    return {
      pullRequests: includePullRequests ? pullRequests : null,
      issues: includeIssues ? issues : null,
      usersInvolved,
    };
  },
});
