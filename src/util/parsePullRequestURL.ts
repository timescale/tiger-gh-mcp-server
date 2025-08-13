export interface ParsedPRInfo {
  owner: string;
  pullNumber: number;
  repository: string;
}

export function parsePullRequestURL(url: string): ParsedPRInfo {
  const prRegex = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
  const match = url.match(prRegex);

  if (!match) {
    throw new Error('Invalid GitHub PR URL format');
  }

  return {
    owner: match[1],
    repository: match[2],
    pullNumber: parseInt(match[3], 10),
  };
}
