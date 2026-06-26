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

  const [, owner, repository, type, number] = match ?? [];
  if (!owner || !repository || !type || !number) {
    throw new Error('Invalid GitHub URL format');
  }

  return {
    owner,
    repository,
    type: type as GitHubURLType,
    number: parseInt(number, 10),
  };
}
