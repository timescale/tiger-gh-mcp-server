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
  timestampStart: z.coerce
    .date()
    .nullable()
    .describe(
      `Optional start date for filtering activity. Defaults to ${DEFAULT_SINCE_INTERVAL_IN_DAYS} days ago.`,
    ),
  timestampEnd: z.coerce
    .date()
    .nullable()
    .describe(
      'Optional end date for filtering activity. Defaults to the current time.',
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
  issues: z.array(zIssue).optional(),
  pullRequests: z.array(zPullRequest).optional(),
  usersInvolved: z
    .record(z.string(), zUser)
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
    timestampStart,
    timestampEnd,
    includeAllCommits,
    includeClosed,
    includeIssues,
    includePullRequests,
  }): Promise<InferSchema<typeof outputSchema>> => {
    if (!includeIssues && !includePullRequests)
      throw new Error('Must use includeIssues and/or includePullRequests.');
    const timestampStartToUse = timestampStart || getDefaultSince();
    const timestampEndToUse = timestampEnd || new Date();

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
      `updated:${timestampStartToUse.toISOString()}..${timestampEndToUse.toISOString()}`,
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

    const addInvolvedUser = async (username?: string): Promise<void> => {
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

      if (includePullRequests && isPullRequest(curr)) {
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
      } else if (includeIssues && isIssue(curr)) {
        const assigneeUsername = curr.assignee?.login;
        const authorUsername = curr.user?.login;

        await addInvolvedUser(assigneeUsername);
        await addInvolvedUser(authorUsername);

        for (const assignee of curr.assignees || []) {
          await addInvolvedUser(assignee.login);
        }

        issues.push({
          author: authorUsername || 'unknown',
          assignee: assigneeUsername,
          assignees: curr.assignees ? curr.assignees.map((x) => x.login) : null,
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
      ...(includePullRequests ? { pullRequests } : {}),
      ...(includeIssues ? { issues } : {}),
      usersInvolved,
    };
  },
});
