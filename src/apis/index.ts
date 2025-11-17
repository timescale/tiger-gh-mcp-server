import { getRecentPRsInvolvingUserFactory } from './getRecentPRsInvolvingUser.js';
import { getRecentCommitsFactory } from './getRecentCommits.js';
import { getUsersFactory } from './getUsers.js';
import { getPullRequestFactory } from './getPullRequest.js';
import { searchRepoCode } from './searchRepoCode.js';
import { findRepos } from './findRepos.js';
import { getReleasesFactory } from './getReleases.js';

export const apiFactories = [
  findRepos,
  getRecentPRsInvolvingUserFactory,
  getRecentCommitsFactory,
  getUsersFactory,
  getPullRequestFactory,
  searchRepoCode,
  getReleasesFactory,
] as const;
