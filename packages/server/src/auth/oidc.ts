import { ForbiddenException, UnauthorizedException } from 'chanfana';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GH_DOMAIN = 'https://token.actions.githubusercontent.com';
const AUDIENCE = 'osm-conflation-engine';

const JWKS = createRemoteJWKSet(new URL(`${GH_DOMAIN}/.well-known/jwks`));

export interface OIDCPayload {
  actor: string;
  actor_id: `${number}`;
  aud: string;
  base_ref: '';
  check_run_id: `${number}`;
  event_name: 'push';
  exp: number;
  head_ref: '';
  iat: number;
  iss: 'https://token.actions.githubusercontent.com';
  job_workflow_ref: string;
  job_workflow_sha: string;
  jti: string;
  nbf: number;
  ref: string;
  ref_protected: `${boolean}`;
  ref_type: 'branch';
  repository: string;
  repository_id: `${number}`;
  repository_owner: string;
  repository_owner_id: `${number}`;
  repository_visibility: 'public' | 'private';
  run_attempt: `${number}`;
  run_id: `${number}`;
  run_number: `${number}`;
  runner_environment: 'github-hosted';
  sha: string;
  sub: string;
  workflow: string;
  workflow_ref: string;
  workflow_sha: string;
}

/**
 * As long as the JWKS is valid, we allow access to any GitHub
 * respository. The goal is not authentication, it's just to
 * prove who the operator was.
 *
 * This approach could be changed in the future.
 */
export async function verifyOIDC(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: GH_DOMAIN,
    audience: AUDIENCE,
  }).catch((ex) => {
    throw new UnauthorizedException(`${ex}`);
  });

  const ghPayload = <OIDCPayload>(<never>payload);

  if (ghPayload.repository_visibility !== 'public') {
    throw new ForbiddenException(
      `For transparency, the GitHub repository ${ghPayload.repository} must be public, not ${ghPayload.repository_visibility}.`,
    );
  }

  if (ghPayload.ref_protected !== 'true') {
    throw new ForbiddenException(
      `This API call is only allowed from a protected branch, but “${ghPayload.ref}” is not protected.`,
    );
  }
  return ghPayload;
}

export function createOIDCAuthor(jwt: OIDCPayload) {
  // currently only support github
  return `https://github.com/${jwt.repository}/actions/runs/${jwt.run_id}#${jwt.actor}`;
}
