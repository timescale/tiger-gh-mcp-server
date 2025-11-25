import { Octokit } from '@octokit/rest';
import { log } from '@tigerdata/mcp-boilerplate';
import { User } from '../types.js';
import { Store } from './store.js';

const getUser = async ({
  octokit,
  username,
  userStore,
}: {
  octokit: Octokit;
  username: string;
  userStore?: Store<User>;
}): Promise<User | null> => {
  log.info('Fetching member by username', { username });

  try {
    const userInStore = await userStore?.find((x) => x.username === username);
    if (userInStore) {
      return userInStore;
    }

    const userDetails = await octokit.rest.users.getByUsername({
      username,
    });

    if (!userDetails) {
      log.info(
        `Could not find GitHub member associated with username ${username}`,
      );

      return null;
    }
    return {
      email: userDetails.data.email || null,
      id: userDetails.data.id,
      username,
      fullName: userDetails.data.name || null,
    };
  } catch (error) {
    log.error(`Error fetching details for user ${username}:`, error as Error);
    return null;
  }
};

export { getUser };
