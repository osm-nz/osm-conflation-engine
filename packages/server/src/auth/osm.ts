import { configure, getUser } from 'osm-api';
import { ForbiddenException } from 'chanfana';
import { USER_AGENT } from '../constants.js';

const MIN_ACCOUNT_AGE_DAYS = 20;
const MIN_CHANGESETS = 20;

export async function verifyOsmUser(
  authHeader: string,
  strict?: 'DISABLE_STRICT_MODE',
) {
  configure({
    authHeader,
    userAgent: USER_AGENT,
  });
  const user = await getUser('me').catch((ex) => {
    throw new ForbiddenException(`${ex}`);
  });

  if (user.blocks.received.active) {
    throw new ForbiddenException('Your account has been blocked');
  }

  if (/(https?:\/\/|www\.)/i.test(user.display_name)) {
    throw new ForbiddenException(
      'To avoid misleading people, your OSM username is not allowed.',
    );
  }

  const isImporter = user.roles.includes('importer');

  if (strict !== 'DISABLE_STRICT_MODE') {
    // additional strict checks for write operations
    if (user.changesets.count < MIN_CHANGESETS && !isImporter) {
      throw new ForbiddenException(
        `To prevent abuse, you need at least ${MIN_CHANGESETS} OSM changesets before you can use this app`,
      );
    }

    if (
      Date.now() - +user.account_created <
        1000 * 60 * 60 * 24 * MIN_ACCOUNT_AGE_DAYS &&
      !isImporter
    ) {
      throw new ForbiddenException(
        `To prevent abuse, you cannot use this app because your OSM account was created less than ${
          MIN_ACCOUNT_AGE_DAYS
        } days ago.`,
      );
    }
  }

  return user;
}
