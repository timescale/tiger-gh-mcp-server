import { Octokit } from '@octokit/rest';
import { log } from '@tigerdata/mcp-boilerplate';
import { User } from '../types.js';

const getUsers = async (octokit: Octokit, org: string): Promise<User[]> => {
  log.info('Fetching members within organization', { org });
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
        log.error(
          `Error fetching details for user ${user.login}:`,
          error as Error,
        );
        return {
          email: null,
          id: user.id,
          username: user.login,
          fullName: null,
        };
      }
    }),
  );

  log.info('Fetched users', { org, usersCount: userList.length });
  return userList;
};

export { getUsers };
