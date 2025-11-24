export const extractOwnerAndRepo = (
  repoAndMaybeOwner: string,
  defaultOwner: string,
): { owner: string; repoName: string; ownerAndRepo: string } => {
  const [a, b] = repoAndMaybeOwner.split('/', 2);
  const owner = b ? a : defaultOwner;
  const repoName = b || a;
  return {
    owner,
    repoName,
    ownerAndRepo: `${owner}/${repoName}`,
  };
};
