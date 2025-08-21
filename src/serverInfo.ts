import { Octokit } from '@octokit/rest';
import { ServerContext, User } from './types.js';
import { throttling } from '@octokit/plugin-throttling';
import { log } from './shared/boilerplate/src/logger.js';
import { Store } from './util/store.js';
import { getUsers } from './util/getUsers.js';

export const serverInfo = {
  name: 'tiger-gh',
  version: '1.0.0',
} as const;

const MAX_SECONDARY_RETRY_TIMEOUT_IN_SECONDS = process.env
  .MAX_SECONDARY_RETRY_TIMEOUT_IN_SECONDS
  ? parseInt(process.env.MAX_SECONDARY_RETRY_TIMEOUT_IN_SECONDS)
  : 5;

const org = process.env.GITHUB_ORG;
if (!org) {
  throw new Error('GITHUB_ORG environment variable is required.');
}

if (!process.env.GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN environment variable is required.');
}

const ThrottledOktokit = Octokit.plugin(throttling);
const NUMBER_OF_RETRIES = process.env.GITHUB_REQUEST_RETRIES
  ? parseInt(process.env.GITHUB_REQUEST_RETRIES)
  : 2;

const octokit = new ThrottledOktokit({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfterSeconds, options, _, retryCount) => {
      log.warn(
        `Request quota exhausted for request ${options.method} ${options.url} (retryCount=${retryCount}), waiting ${retryAfterSeconds} seconds`,
      );

      if (options.request.retryCount <= NUMBER_OF_RETRIES) {
        log.info(`Retrying after ${retryAfterSeconds} seconds`);
        return true;
      }

      log.warn(`Request failed after ${NUMBER_OF_RETRIES} retries`);
    },
    onSecondaryRateLimit: (retryAfterSeconds, { url, method }) => {
      const shouldRetry =
        retryAfterSeconds <= MAX_SECONDARY_RETRY_TIMEOUT_IN_SECONDS;

      log.warn('SecondaryRateLimit occurred for request', {
        method,
        url,
        retryAfterSeconds,
        shouldRetry,
      });

      return shouldRetry;
    },
  },
});

const userStore = new Store<User>({
  fetch: () => getUsers(octokit, org),
});

userStore.get().catch((e) => log.error('Failed to fetch users on init', e));

export const context: ServerContext = { octokit, org, userStore };
