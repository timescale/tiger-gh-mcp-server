import { Octokit } from '@octokit/rest';

export interface ServerContext extends Record<string, unknown> {
  octokit: Octokit;
  org: string;
}
