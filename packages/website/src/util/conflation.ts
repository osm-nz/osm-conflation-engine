export interface Operator {
  /** could be others in the future */
  provider: 'github.com';
  /** organisation or username */
  org: string;
  repo: string;
  /** unique ID to identify the CI job/run */
  runId: string;
  /** the human who triggered the operation */
  triggerer: string;
}

export function parseOperator(operator: string): Operator | undefined {
  if (operator.startsWith('https://github.com')) {
    const parts = operator.split('/');
    const provider = parts[2]! as 'github.com';
    const org = parts[3]!;
    const repo = parts[4]!;
    const runAndUser = parts[7]!.split('#');
    const runId = runAndUser[0]!;
    const triggerer = runAndUser[1]!;
    return {
      provider,
      org,
      repo,
      runId,
      triggerer,
    };
  }

  return undefined;
}

export function getBaseUrl(operator: Operator) {
  if (operator.provider === 'github.com') {
    return `https://${operator.org}.github.io/${operator.repo}`;
  }

  throw new Error('Invalid provider');
}
