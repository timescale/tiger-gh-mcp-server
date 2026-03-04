export type GitHubURLType = 'pull' | 'issues';

export interface ParsedGitHubURL {
  owner: string;
  number: number;
  repository: string;
  type: GitHubURLType;
}

export function parseGitHubURL(url: string): ParsedGitHubURL {
  const regex = /github\.com\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)/;
  const match = url.match(regex);

  if (!match) {
    throw new Error('Invalid GitHub URL format');
  }

  return {
    owner: match[1],
    repository: match[2],
    type: match[3] as GitHubURLType,
    number: parseInt(match[4], 10),
  };
}
