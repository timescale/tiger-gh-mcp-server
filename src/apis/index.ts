import { getCommitsFactory } from './getCommits.js';
import { getUsersFactory } from './getUsers.js';
import { getPullRequestFactory } from './getPullRequest.js';
import { getIssueFactory } from './getIssue.js';
import { searchRepoCode } from './searchRepoCode.js';
import { findRepos } from './findRepos.js';
import { getReleasesFactory } from './getReleases.js';
import { searchIssuesAndPRsFactory } from './searchIssuesAndPRs.js';

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
