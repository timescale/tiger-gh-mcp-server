import { getRecentCommitsFactory } from './getRecentCommits.js';
import { getUsersFactory } from './getUsers.js';
import { getPullRequestFactory } from './getPullRequest.js';
import { searchRepoCode } from './searchRepoCode.js';
import { findRepos } from './findRepos.js';
import { getReleasesFactory } from './getReleases.js';
import { getIssuesAndPRsInvolvingUserFactory } from './getIssuesAndPRsInvolvingUser.js';

export const apiFactories = [
  findRepos,
  getIssuesAndPRsInvolvingUserFactory,
  getRecentCommitsFactory,
  getUsersFactory,
  getPullRequestFactory,
  searchRepoCode,
  getReleasesFactory,
] as const;
