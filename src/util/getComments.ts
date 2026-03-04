import { Octokit } from '@octokit/rest';
import { IssueComment, PullRequestComment, User } from '../types.js';
import { Store } from './store.js';

export async function resolveUsersFromComments<
  T extends { userId?: number | null },
>(
  rawComments: T[],
  userStore: Store<User>,
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
  userStore: Store<User>;
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
  userStore: Store<User>;
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
