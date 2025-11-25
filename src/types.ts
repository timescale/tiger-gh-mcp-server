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

export const zUser = z.object({
  email: z
    .string()
    .nullish()
    .describe('The email account that is associated with the GitHub user.'),
  id: z.number(),
  username: z
    .string()
    .describe(
      'This is the GitHub "login" field, which is the official handle of the user.',
    ),
  fullName: z.string().nullish().describe('The full name of the user.'),
});

export type User = z.infer<typeof zUser>;

const zPullRequestAndIssueCommonFields = z.object({
  author: z.string(),
  closedAt: z.string().nullable(),
  createdAt: z.string(),
  description: z.string().nullable(), // maps to body
  number: z.number(),
  repository: z.string(),
  state: z.string(),
  title: z.string(),
  updatedAt: z.string(),
  url: z.string().url(), // maps to html_url
});

export const zPullRequest = zPullRequestAndIssueCommonFields.extend({
  commits: z.array(zCommit).optional(),
  draft: z.boolean(),
  mergedAt: z.string().nullable(),
});

export type PullRequest = z.infer<typeof zPullRequest>;

export const zIssue = zPullRequestAndIssueCommonFields.extend({
  assignee: z
    .string()
    .nullish()
    .describe('The GitHub username for the assignee'),
  assignees: z.array(z.string()).nullish(),
});

export type Issue = z.infer<typeof zIssue>;

export const zPullRequestComment = z.object({
  url: z.string().url().describe('URL for the pull request review comment'),
  id: z.number().describe('The ID of the pull request review comment.'),
  inReplyToCommentId: z
    .number()
    .optional()
    .describe('The ID of the comment that this comment is a reply to.'),
  body: z.string().describe('The text of the comment.'),
  userId: z
    .number()
    .optional()
    .describe('The ID of the user who created the comment.'),
  createdAt: z.string().describe('The creation date of the comment.'),
});

export type PullRequestComment = z.infer<typeof zPullRequestComment>;

export const zPullRequestWithComments = zPullRequest.extend({
  comments: z
    .array(zPullRequestComment)
    .optional()
    .describe('Pull request review comments'),
  involvedUsers: z
    .array(zUser)
    .optional()
    .describe(
      'A list of user metadata for each user involved with conversations.',
    ),
});

export type PullRequestWithComments = z.infer<typeof zPullRequestWithComments>;

export const zRelease = z.object({
  repository: z.string(),
  tagName: z.string(),
  name: z.string().nullable(),
  body: z.string().nullable(),
  url: z.string().url(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  author: z.string().nullable(),
  prerelease: z.boolean(),
  draft: z.boolean(),
  assets: z
    .array(
      z.object({
        name: z.string(),
        downloadUrl: z.string().url(),
        size: z.number(),
        downloadCount: z.number(),
      }),
    )
    .optional(),
});

export type Release = z.infer<typeof zRelease>;

export interface ServerContext extends Record<string, unknown> {
  octokit: Octokit;
  org: string;
  userStore: Store<User>;
}
