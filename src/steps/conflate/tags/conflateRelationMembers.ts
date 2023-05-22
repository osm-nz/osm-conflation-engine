import { OsmRelation } from "osm-api";

export type Members = OsmRelation["members"];

/**
 * Conflates the members of the OsmRelation, returns a diff of members
 * to add/edit/remove
 *
 * Currently does not consider duplicate members, or the order of members.
 */
export function conflateRelationMembers(
  actualMembers: Members,
  expectedMembers: Members,
  options?: { removeAllOtherNodes?: boolean }
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

  if (options?.removeAllOtherNodes) {
    // remove all other nodes from the relation (but not ways or relations)
    for (const actual of actualMembers) {
      const isExpected = expectedMembers.find(
        (m) => m.type === actual.type && m.ref === actual.ref
      );
      if (actual.type === "node" && !isExpected) {
        diff.push({ ...actual, role: "🗑️" });
      }
    }
  }

  return diff;
}
