import { Octokit } from '@octokit/rest';
import { PullRequestComment, User } from '../types.js';
import { Store } from './store.js';

export async function getPullRequestComments({
  octokit,
  owner,
  repository,
  pullNumber,
  userStore,
}: {
  octokit: Octokit;
  owner: string;
  repository: string;
  pullNumber: number;
  userStore: Store<User>;
}): Promise<{ comments: PullRequestComment[]; involvedUsers: User[] }> {
  const rawComments = await octokit.paginate(
    octokit.rest.pulls.listReviewComments,
    {
      owner,
      repo: repository,
      pull_number: pullNumber,
      per_page: 100,
    },
  );

  const userMap = new Map<number, User>();
  const allUsers = await userStore?.get();

  const comments = rawComments.map((comment) => {
    const userId = comment.user.id;
    if (!userMap.has(userId) && allUsers?.length) {
      const user = allUsers.find((user) => user.id === userId);

      if (user) {
        userMap.set(userId, user);
      }
    }
    return {
      url: comment.url,
      id: comment.id,
      inReplyToCommentId: comment.in_reply_to_id,
      body: comment.body,
      userId: comment.user?.id,
      createdAt: comment.created_at,
    };
  });

  return { comments, involvedUsers: Array.from(userMap.values()) };
}
