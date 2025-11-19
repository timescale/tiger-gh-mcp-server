const IS_ISSUE = /https:\/\/github.com\/[\S]+\/issues\/\d+/;
const IS_PULL_REQUEST = /https:\/\/github.com\/[\S]+\/pull\/\d+/;

export const isPullRequest = (item: { html_url: string }): boolean =>
  IS_PULL_REQUEST.test(item.html_url);

export const isIssue = (item: { html_url: string }): boolean =>
  IS_ISSUE.test(item.html_url);
