import { getRecentCommitsFactory } from './getRecentCommits.js';
import { getUsersFactory } from './getUsers.js';
import { getPullRequestFactory } from './getPullRequest.js';
import { searchRepoCode } from './searchRepoCode.js';
import { findRepos } from './findRepos.js';
import { getReleasesFactory } from './getReleases.js';
import { getIssuesAndPRsFactory } from './getIssuesAndPRsFactory.js';

export const apiFactories = [
  findRepos,
  getIssuesAndPRsFactory,
  getRecentCommitsFactory,
  getUsersFactory,
  getPullRequestFactory,
  searchRepoCode,
  getReleasesFactory,
] as const;
