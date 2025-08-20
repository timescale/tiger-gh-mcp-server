import { getRecentPRsInvolvingUserFactory } from './getRecentPRsInvolvingUser.js';
import { getRecentCommitsFactory } from './getRecentCommits.js';
import { getUsersFactory } from './getUsers.js';
import { getUserFactory } from './getUser.js';
import { getPullRequestFactory } from './getPullRequest.js';

export const apiFactories = [
  getRecentPRsInvolvingUserFactory,
  getRecentCommitsFactory,
  getUsersFactory,
  getUserFactory,
  getPullRequestFactory,
] as const;
