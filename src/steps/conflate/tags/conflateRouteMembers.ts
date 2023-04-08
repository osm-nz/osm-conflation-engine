import { OsmRelation } from "osm-api";

export type Members = OsmRelation["members"];

/**
 * Conflates the members of the OsmRelation, returns a diff of members
 * to add/edit/remove
 *
 * Currently does not consider duplicate members, or the order of members.
 */
export function conflateRouteMembers(
  actualMembers: Members,
  expectedMembers: Members
): Members {
  const diff: Members = [];
  for (const expected of expectedMembers) {
    const actual = actualMembers.find(
      (m) => m.type === expected.type && m.ref === expected.ref
    );
    if (actual) {
      // node is already in the relation
      if (actual.role === expected.role) {
        // it's perfect, nothing to do
      } else {
        diff.push(expected); // need to fix the role
      }
    } else {
      // node is not in the relation, so add it
      diff.push(expected);
    }
  }

  return diff;
}
