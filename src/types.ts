import { Octokit } from '@octokit/rest';
import { z } from 'zod';
import { Store } from './util/store.js';

export const zCommit = z.object({
  author: z.string().nullable(),
  date: z.string().nullable(),
  message: z.string(),
  sha: z.string(),
  url: z.string().url(),
});

export type Commit = z.infer<typeof zCommit>;

export const zPullRequest = z.object({
  author: z.string(),
  closedAt: z.string().nullable(),
  createdAt: z.string(),
  description: z.string().nullable(),
  draft: z.boolean(),
  mergedAt: z.string().nullable(),
  number: z.number(),
  repository: z.string(),
  state: z.string(),
  title: z.string(),
  updatedAt: z.string(),
  url: z.string().url(),
  commits: z.array(zCommit).optional(),
});

export const zUser = z.object({
  email: z
    .string()
    .nullable()
    .describe('The email account that is associated with the GitHub user.'),
  id: z.number(),
  username: z
    .string()
    .describe(
      'This is the GitHub "login" field, which is the official handle of the user.',
    ),
  fullName: z.string().nullable().describe('The full name of the user.'),
});

export type User = z.infer<typeof zUser>;

export const zPullRequestComment = z.object({
  url: z.string().url().describe('URL for the pull request review comment'),
  id: z.number().describe('The ID of the pull request review comment.'),
  inReployToCommentId: z
    .number()
    .optional()
    .describe('The ID of the comment that this comment is a reply to.'),
  body: z.string().describe('The text of the comment.'),
  createdAt: z.string().describe('The creation date of the comment.'),
});

export type PullRequestComment = z.infer<typeof zPullRequestComment>;

export const zPullRequestWithComments = zPullRequest.extend({
  comments: z
    .array(zPullRequestComment)
    .optional()
    .describe('Pull request review comments'),
});

export type PullRequestWithComments = z.infer<typeof zPullRequestWithComments>;

export interface ServerContext extends Record<string, unknown> {
  octokit: Octokit;
  org: string;
  usersStore: Store<User[]>;
}
