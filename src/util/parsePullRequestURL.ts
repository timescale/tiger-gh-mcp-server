export interface ParsedPRInfo {
  repoName: string;
  prNumber: number;
}

export function parsePullRequestURL(url: string): ParsedPRInfo {
  const prRegex = /github\.com\/[^\/]+\/([^\/]+)\/pull\/(\d+)/;
  const match = url.match(prRegex);

  if (!match) {
    throw new Error('Invalid GitHub PR URL format');
  }

  const repoName = match[1];
  const prNumber = parseInt(match[2], 10);

  return { repoName, prNumber };
}
