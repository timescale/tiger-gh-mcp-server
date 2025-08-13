export interface ParsedPRInfo {
  repository: string;
  pullNumber: number;
}

export function parsePullRequestURL(url: string): ParsedPRInfo {
  const prRegex = /github\.com\/[^\/]+\/([^\/]+)\/pull\/(\d+)/;
  const match = url.match(prRegex);

  if (!match) {
    throw new Error('Invalid GitHub PR URL format');
  }

  return { repository: match[1], pullNumber: parseInt(match[2], 10) };
}
