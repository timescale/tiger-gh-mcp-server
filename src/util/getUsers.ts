import { Octokit } from '@octokit/rest';
import { log } from '@tigerdata/mcp-boilerplate';
import { User } from '../types.js';
import { getUser } from './getUser.js';

const getUsers = async (octokit: Octokit, org: string): Promise<User[]> => {
  log.info('Fetching members within organization', { org });
  const users = await octokit.paginate(octokit.rest.orgs.listMembers, {
    org: org,
    per_page: 100,
  });

  const userList = await Promise.all(
    users.map(async (user) => getUser({ octokit, username: user.login })),
  );

  log.info('Fetched users', { org, usersCount: userList.length });
  return userList.filter((x) => !!x);
};

export { getUsers };
