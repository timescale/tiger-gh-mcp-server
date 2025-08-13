import { Octokit } from '@octokit/rest';

export interface CommitInfo {
  author: string | null;
  date: string | null;
  message: string;
  sha: string;
  url: string;
}

export async function getCommits(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<CommitInfo[]> {
  try {
    const commits = await octokit.rest.pulls.listCommits({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return commits.data.map((commit) => ({
      author: commit.author?.login || null,
      date: commit.commit.author?.date || null,
      message: commit.commit.message,
      sha: commit.sha,
      url: commit.html_url,
    }));
  } catch (error) {
    console.error(`Error fetching commits for PR #${pullNumber}:`, error);
    return [];
  }
}
