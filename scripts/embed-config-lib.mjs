// Pure, filesystem-free helpers for the embed WC-projectId injection. Kept in a standalone module so
// BOTH the postbuild script (inject-embed-config.mjs) and the unit test import the same source of
// truth. See inject-embed-config.mjs for the why.

export const PLACEHOLDER = "__XCHTIP_WC_PROJECT_ID__";

/** Replace every occurrence of the projectId placeholder in `source` with a non-empty `projectId`. */
export function substituteProjectId(source, projectId) {
  if (!projectId || typeof projectId !== "string" || !projectId.trim()) return source;
  return source.split(PLACEHOLDER).join(projectId.trim());
}
