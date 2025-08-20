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

export interface ServerContext extends Record<string, unknown> {
  octokit: Octokit;
  org: string;
  usersStore: Store<User[]>;
}
