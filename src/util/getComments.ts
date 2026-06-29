import type { Octokit } from '@octokit/rest';
import type { Cache } from '@tigerdata/mcp-boilerplate';
import type { IssueComment, PullRequestComment, User } from '../types.js';

export async function resolveUsersFromComments<
  T extends { userId?: number | null },
>(
  rawComments: T[],
  userStore: Cache<User>,
): Promise<{ userMap: Map<number, User>; allUsers: User[] | undefined }> {
  const userMap = new Map<number, User>();
  const allUsers = await userStore?.get();

  for (const comment of rawComments) {
    const userId = comment.userId;
    if (userId && !userMap.has(userId) && allUsers?.length) {
      const user = allUsers.find((user) => user.id === userId);
      if (user) {
        userMap.set(userId, user);
      }
    }
  }

  return { userMap, allUsers };
}

export async function getComments({
  octokit,
  owner,
  repository,
  issueNumber,
}: {
  octokit: Octokit;
  owner: string;
  repository: string;
  issueNumber: number;
  userStore: Cache<User>;
}): Promise<IssueComment[]> {
  const rawComments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo: repository,
    issue_number: issueNumber,
    per_page: 100,
  });

  const comments = rawComments.map((comment) => ({
    url: comment.url,
    id: comment.id,
    body: comment.body,
    userId: comment.user?.id,
    createdAt: comment.created_at,
  }));

  return comments;
}

export async function getPullRequestComments({
  octokit,
  owner,
  repository,
  pullNumber,
}: {
  octokit: Octokit;
  owner: string;
  repository: string;
  pullNumber: number;
  userStore: Cache<User>;
}): Promise<PullRequestComment[]> {
  const rawComments = await octokit.paginate(
    octokit.rest.pulls.listReviewComments,
    {
      owner,
      repo: repository,
      pull_number: pullNumber,
      per_page: 100,
    },
  );

  const comments = rawComments.map((comment) => ({
    url: comment.url,
    id: comment.id,
    inReplyToCommentId: comment.in_reply_to_id,
    body: comment.body,
    userId: comment.user?.id,
    createdAt: comment.created_at,
  }));

  return comments;
}
