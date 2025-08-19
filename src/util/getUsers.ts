import { Octokit } from '@octokit/rest';
import { User } from '../types.js';
import { log } from '../shared/boilerplate/src/logger.js';

const getUsers = async (octokit: Octokit, org: string): Promise<User[]> => {
  const users = await octokit.paginate(octokit.rest.orgs.listMembers, {
    org: org,
    per_page: 100,
  });

  const userList = await Promise.all(
    users.map(async (user) => {
      try {
        const userDetails = await octokit.rest.users.getByUsername({
          username: user.login,
        });
        return {
          email: userDetails.data.email || null,
          id: user.id,
          username: user.login,
          fullName: userDetails.data.name || null,
        };
      } catch (error) {
        console.error(`Error fetching details for user ${user.login}:`, error);
        return {
          email: null,
          id: user.id,
          username: user.login,
          fullName: null,
        };
      }
    }),
  );

  log.info(`Fetched ${userList.length} users`);
  return userList;
};

export { getUsers };
