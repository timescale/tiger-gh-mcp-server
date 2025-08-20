import { Octokit } from '@octokit/rest';
import { PullRequestComment } from '../types.js';

export async function getPullRequestComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<PullRequestComment[]> {
  const comments = await octokit.paginate(
    octokit.rest.pulls.listReviewComments,
    {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    },
  );

  return comments.map((comment) => ({
    url: comment.url,
    id: comment.id,
    inReplyToCommentId: comment.in_reply_to_id,
    body: comment.body,
    userId: comment.user?.id,
    createdAt: comment.created_at,
  }));
}
