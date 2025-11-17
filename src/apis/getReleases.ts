import { ApiFactory } from '@tigerdata/mcp-boilerplate';
import { z } from 'zod';
import { Release, ServerContext, zRelease } from '../types.js';
import { getDefaultSince } from '../util/date.js';

const DEFAULT_LIMIT = 10;
const GH_MAX_RELEASES_PER_PAGE = 100;

const inputSchema = {
  repositories: z
    .array(z.string())
    .min(1)
    .describe(
      'Array of repository names (format: owner/repo or just repo if within org) to fetch releases for.',
    ),
  limit: z
    .number()
    .int()
    .positive()
    .max(500)
    .nullable()
    .describe(
      `Maximum number of releases to return per repository. Defaults to ${DEFAULT_LIMIT}, max 500.`,
    ),
  includeAssets: z
    .boolean()
    .describe(
      'Whether or not to include assets such as published artifact metadata. Defaults to false.',
    ),
  includeDraft: z
    .boolean()
    .describe('Whether to include draft releases. Defaults to false.'),
  includePrerelease: z
    .boolean()
    .describe('Whether to include prerelease versions. Defaults to false.'),
  since: z.coerce
    .date()
    .nullable()
    .describe('Fetch releases since this date. Defaults to 1 week ago.'),
} as const;

const outputSchema = {
  results: z.array(zRelease),
} as const;

export const getReleasesFactory: ApiFactory<
  ServerContext,
  typeof inputSchema,
  typeof outputSchema,
  z.infer<(typeof outputSchema)['results']>
> = ({ octokit, org }) => ({
  name: 'get_releases',
  method: 'get',
  route: '/releases',
  config: {
    title: 'Get Releases for Repositories',
    description:
      'Fetches recent releases for specified GitHub repositories. Returns release information including assets, publication dates, and author details.',
    inputSchema,
    outputSchema,
  },
  fn: async ({
    repositories,
    limit,
    includeAssets,
    includeDraft = false,
    includePrerelease = false,
    since,
  }) => {
    const allReleases = [];

    const limitToUse = limit || DEFAULT_LIMIT;
    const sinceToUse = since || getDefaultSince();

    for (const repo of repositories) {
      try {
        const [owner, repoName] = repo.includes('/')
          ? repo.split('/', 2)
          : [org, repo];

        const releases = await octokit.paginate(
          octokit.rest.repos.listReleases,
          {
            owner,
            repo: repoName,
            per_page: GH_MAX_RELEASES_PER_PAGE,
            page: limitToUse < GH_MAX_RELEASES_PER_PAGE ? 1 : undefined,
          },
        );

        const filteredReleases = releases.reduce<Release[]>((acc, curr) => {
          if (
            (!curr.draft || includeDraft) &&
            (!curr.prerelease || includePrerelease) &&
            (!curr.published_at || new Date(curr.published_at) > sinceToUse)
          ) {
            const release = {
              repository: `${owner}/${repoName}`,
              tagName: curr.tag_name,
              name: curr.name,
              body: curr.body || null,
              url: curr.html_url,
              publishedAt: curr.published_at,
              createdAt: curr.created_at,
              author: curr.author?.login || null,
              prerelease: curr.prerelease,
              draft: curr.draft,
              assets: includeAssets
                ? curr.assets.map((asset) => ({
                    name: asset.name,
                    downloadUrl: asset.browser_download_url,
                    size: asset.size,
                    downloadCount: asset.download_count,
                  }))
                : undefined,
            };

            acc.push(release);
          }

          return acc;
        }, []);

        filteredReleases.sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateB - dateA;
        });

        const limitedReleases = filteredReleases.slice(0, limitToUse);

        allReleases.push(...limitedReleases);
      } catch (error) {
        // Log error but continue with other repositories
        console.warn(`Failed to fetch releases for ${repo}:`, error);
      }
    }

    // Sort by published date (most recent first)
    allReleases.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    return {
      results: allReleases,
    };
  },
  pickResult: (r) => r.results,
});
