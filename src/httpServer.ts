#!/usr/bin/env node
import { Octokit } from '@octokit/rest';

import { ServerContext } from './types.js';
import { apiFactories } from './apis/index.js';
import { httpServerFactory } from './shared/boilerplate/src/httpServer.js';
import { serverInfo } from './serverInfo.js';

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
const context: ServerContext = { octokit, org };

httpServerFactory({
  ...serverInfo,
  context,
  apiFactories,
});
