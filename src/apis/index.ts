import { findRepos } from './findRepos.js';
import { getCommitsFactory } from './getCommits.js';
import { getIssueFactory } from './getIssue.js';
import { getPullRequestFactory } from './getPullRequest.js';
import { getReleasesFactory } from './getReleases.js';
import { getUsersFactory } from './getUsers.js';
import { searchIssuesAndPRsFactory } from './searchIssuesAndPRs.js';
import { searchRepoCode } from './searchRepoCode.js';

export const apiFactories = [
  findRepos,
  searchIssuesAndPRsFactory,
  getCommitsFactory,
  getUsersFactory,
  getPullRequestFactory,
  getIssueFactory,
  searchRepoCode,
  getReleasesFactory,
] as const;
