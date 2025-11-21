export const extractOwnerAndRepo = (
  repoAndMaybeOwner: string,
  defaultOwner: string,
): { owner: string; repoName: string; ownerAndRepo: string } => {
  if (repoAndMaybeOwner.includes('/')) {
    const [owner, repoName] = repoAndMaybeOwner.split('/', 2);

    return { owner, repoName, ownerAndRepo: `${owner}/${repoName}` };
  }
  return {
    repoName: repoAndMaybeOwner,
    owner: defaultOwner,
    ownerAndRepo: `${defaultOwner}/${repoAndMaybeOwner}`,
  };
};
