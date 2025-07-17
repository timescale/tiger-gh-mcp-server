import { getRecentPRsInvolvingUserFactory } from './getRecentPRsInvolvingUser.js';

import { getUsersFactory } from './getUsers.js';

export const apiFactories = [
  getRecentPRsInvolvingUserFactory,
  getUsersFactory,
] as const;
