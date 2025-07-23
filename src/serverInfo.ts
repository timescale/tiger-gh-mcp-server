import { Octokit } from '@octokit/rest';
import { ServerContext } from './types.js';

export const serverInfo = {
  name: 'tiger-gh',
  version: '1.0.0',
} as const;

const org = process.env.GITHUB_ORG;
if (!org) {
  throw new Error('GITHUB_ORG environment variable is required.');
}

if (!process.env.GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN environment variable is required.');
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export const context: ServerContext = { octokit, org };
