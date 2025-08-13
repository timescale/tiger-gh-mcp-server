import { Octokit } from '@octokit/rest';
import { z } from 'zod';

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

export interface ServerContext extends Record<string, unknown> {
  octokit: Octokit;
  org: string;
}
