import { ApiFactory, InferSchema } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { ServerContext } from '../types.js';
import {
  DEFAULT_SINCE_INTERVAL_IN_DAYS,
  getDefaultSince,
} from '../util/date.js';

const inputSchema = {
  username: z.string().describe('The GitHub username to fetch commits for.'),
  timestampStart: z.coerce
    .date()
    .nullable()
    .describe(
      `Optional start date for filtering commits. Defaults to ${DEFAULT_SINCE_INTERVAL_IN_DAYS} days ago.`,
    ),
  timestampEnd: z.coerce
    .date()
    .nullable()
    .describe(
      'Optional end date for filtering commits. Defaults to the current time.',
    ),
} as const;

const outputSchema = {
  results: z.array(
    z.object({
      author: z.string().nullable(),
      date: z.string().nullable(),
      message: z.string(),
      repository: z.string(),
      sha: z.string(),
      url: z.string().url(),
    }),
  ),
} as const;

export const getCommitsFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema,
  z.infer<(typeof outputSchema)['results']>
> = ({ octokit, org }) => ({
  name: 'get_recent_commits',
  method: 'get',
  route: '/recent-commits',
  config: {
    title: 'Get Recent Commits for User',
    description:
      'Fetches recent commits for a specific user in the configured GitHub organization.',
    inputSchema,
    outputSchema,
  },
  fn: async ({
    username,
    timestampStart,
    timestampEnd,
  }): Promise<InferSchema<typeof outputSchema>> => {
    const timestampStartToUse = timestampStart || getDefaultSince();
    const timestampEndToUse = timestampEnd || new Date();
    const rawCommits = await octokit.paginate(octokit.rest.search.commits, {
      q: `author:${username}${org ? ` org:${org}` : ''} author-date:${timestampStartToUse.toISOString()}..${timestampEndToUse.toISOString()}`,
      sort: 'author-date',
      order: 'desc',
    });

    return {
      results: rawCommits.map((commit) => ({
        author: commit.author?.login || null,
        date: commit.commit.author?.date || null,
        message: commit.commit.message,
        repository: commit.repository.full_name,
        sha: commit.sha,
        url: commit.html_url,
      })),
    };
  },
  pickResult: (r) => r.results,
});
