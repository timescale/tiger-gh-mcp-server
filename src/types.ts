import { Octokit } from '@octokit/rest';
import { z } from 'zod';

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
  commits: z
    .array(
      z.object({
        author: z.string().nullable(),
        date: z.string().nullable(),
        message: z.string(),
        sha: z.string(),
        url: z.string().url(),
      }),
    )
    .optional(),
});

export interface ServerContext extends Record<string, unknown> {
  octokit: Octokit;
  org: string;
}
