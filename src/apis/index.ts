import { getRecentPRsInvolvingUserFactory } from './getRecentPRsInvolvingUser.js';
import { getRecentCommitsFactory } from './getRecentCommits.js';
import { getUsersFactory } from './getUsers.js';
import { getPRFactory } from './getPR.js';

export const apiFactories = [
  getRecentPRsInvolvingUserFactory,
  getRecentCommitsFactory,
  getUsersFactory,
  getPRFactory,
] as const;
