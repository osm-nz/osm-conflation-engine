/**
 * Given the OIDC 'operator' string, returns the base URL where the CI
 * saved the static assets.
 */
export function getStaticFilesUrl(operator: string) {
  if (operator.startsWith('https://github.com/')) {
    const [org, repo] = operator.split('/').slice(3);
    if (!org || !repo) return undefined;
    return `https://${org}.github.io/${repo}/`;
  }

  return undefined;
}
