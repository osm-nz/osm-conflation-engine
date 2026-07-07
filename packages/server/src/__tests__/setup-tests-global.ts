import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { TestProject } from 'vitest/node';

// this is an invalid mock token from github's documentation page:
// https://docs.github.com/en/actions/concepts/security/openid-connect
const MOCK_OIDC_TOKEN =
  'Bearer ey.eyJqdGkiOiJleGFtcGxlLWlkIiwic3ViIjoicmVwbzpvY3RvLW9yZy9vY3RvLXJlcG86ZW52aXJvbm1lbnQ6cHJvZCIsImVudmlyb25tZW50IjoicHJvZCIsImF1ZCI6Imh0dHBzOi8vZ2l0aHViLmNvbS9vY3RvLW9yZyIsInJlZiI6InJlZnMvaGVhZHMvbWFpbiIsInNoYSI6ImV4YW1wbGUtc2hhIiwicmVwb3NpdG9yeSI6Im9jdG8tb3JnL29jdG8tcmVwbyIsInJlcG9zaXRvcnlfb3duZXIiOiJvY3RvLW9yZyIsImFjdG9yX2lkIjoiMTIiLCJyZXBvc2l0b3J5X3Zpc2liaWxpdHkiOiJwcml2YXRlIiwicmVwb3NpdG9yeV9pZCI6Ijc0IiwicmVwb3NpdG9yeV9vd25lcl9pZCI6IjY1IiwicnVuX2lkIjoiZXhhbXBsZS1ydW4taWQiLCJydW5fbnVtYmVyIjoiMTAiLCJydW5fYXR0ZW1wdCI6IjIiLCJydW5uZXJfZW52aXJvbm1lbnQiOiJnaXRodWItaG9zdGVkIiwiYWN0b3IiOiJvY3RvY2F0Iiwid29ya2Zsb3ciOiJleGFtcGxlLXdvcmtmbG93IiwiaGVhZF9yZWYiOiIiLCJiYXNlX3JlZiI6IiIsImV2ZW50X25hbWUiOiJ3b3JrZmxvd19kaXNwYXRjaCIsInJlcG9fcHJvcGVydHlfd29ya3NwYWNlX2lkIjoid3MtYWJjMTIzIiwicmVmX3R5cGUiOiJicmFuY2giLCJqb2Jfd29ya2Zsb3dfcmVmIjoib2N0by1vcmcvb2N0by1hdXRvbWF0aW9uLy5naXRodWIvd29ya2Zsb3dzL29pZGMueW1sQHJlZnMvaGVhZHMvbWFpbiIsImlzcyI6Imh0dHBzOi8vdG9rZW4uYWN0aW9ucy5naXRodWJ1c2VyY29udGVudC5jb20iLCJuYmYiOjE2MzI0OTI5NjcsImV4cCI6MTYzMjQ5Mzg2NywiaWF0IjoxNjMyNDkzNTY3fQ.ey';

declare module 'vitest' {
  export interface ProvidedContext {
    migrations: string;
    MOCK_OIDC_TOKEN: string;
  }
}

/**
 * the unit tests run in an isolated worker, so they can't
 * access the file system. Therefore, we need to read the
 * file here, and pass it through to the worker via inject()
 */
export default async function setup(project: TestProject) {
  const migrationFolder = join(__dirname, '../../migrations');
  const files = await fs.readdir(migrationFolder);
  const migrationFileName = files.find((f) => f.endsWith('.sql'))!;
  const migrations = await fs.readFile(
    join(migrationFolder, migrationFileName),
    'utf8',
  );
  project.provide('migrations', migrations);
  project.provide('MOCK_OIDC_TOKEN', MOCK_OIDC_TOKEN);
}
