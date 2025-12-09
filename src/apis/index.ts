import { getCommitsFactory } from './getCommits.js';
import { getUsersFactory } from './getUsers.js';
import { getPullRequestFactory } from './getPullRequest.js';
import { searchRepoCode } from './searchRepoCode.js';
import { findRepos } from './findRepos.js';
import { getReleasesFactory } from './getReleases.js';
import { getIssuesAndPRsFactory } from './getIssuesAndPRs.js';

export const apiFactories = [
  findRepos,
  getIssuesAndPRsFactory,
  getCommitsFactory,
  getUsersFactory,
  getPullRequestFactory,
  searchRepoCode,
  getReleasesFactory,
] as const;
