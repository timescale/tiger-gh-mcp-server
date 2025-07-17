import { getRecentPRsInvolvingUserFactory } from './getRecentPRsInvolvingUser.js';
import { getRecentCommitsFactory } from './getRecentCommits.js';
import { getUsersFactory } from './getUsers.js';

export const apiFactories = [
  getRecentPRsInvolvingUserFactory,
  getRecentCommitsFactory,
  getUsersFactory,
] as const;
