import { normalizeAdminSubmissionReviewStatus } from "./admin-filter";

export type ReviewNavigationAnchor = { currentId: string; before: string[]; after: string[] };

/** Capture IDs before a status update removes or reorders the current row. */
export function captureReviewNavigationAnchor(rows: readonly { submissionId: string }[], currentId: string): ReviewNavigationAnchor | null {
  const index = rows.findIndex(row => row.submissionId === currentId);
  return index < 0 ? null : { currentId, before: rows.slice(0, index).map(row => row.submissionId), after: rows.slice(index + 1).map(row => row.submissionId) };
}

/** Use the unfiltered scope for position, the visible IDs for eligibility, and wrap once. */
export function nextUnreviewedStudent<T extends { submissionId: string; studentId: string; reviewStatus: unknown }>(rows: T[], currentId: string, studentId: string, options?: { visibleIds?: ReadonlySet<string>; anchor?: ReviewNavigationAnchor | null }) {
  const index = rows.findIndex((row) => row.submissionId === currentId);
  const anchor = options?.anchor?.currentId === currentId ? options.anchor : null;
  if (index < 0 && !anchor) return null;
  let ordered: T[];
  if (anchor) {
    const byId = new Map(rows.map(row => [row.submissionId, row]));
    const known = new Set([currentId, ...anchor.before, ...anchor.after]);
    // New rows above the current position must not displace the saved next candidate.
    const firstAfter = rows.findIndex(row => anchor.after.includes(row.submissionId));
    const lastBefore = rows.findLastIndex(row => anchor.before.includes(row.submissionId));
    const boundary = index >= 0 ? index + 1 : firstAfter >= 0 ? firstAfter : lastBefore >= 0 ? lastBefore + 1 : -1;
    const existing = (ids: string[]) => ids.flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
    const added = (part: T[]) => part.filter(row => !known.has(row.submissionId));
    ordered = [...existing(anchor.after), ...(boundary < 0 ? [] : added(rows.slice(boundary))),
      ...existing(anchor.before), ...(boundary < 0 ? [] : added(rows.slice(0, boundary)))];
  } else ordered = [...rows.slice(index + 1), ...rows.slice(0, index)];
  return ordered.find(row => row.submissionId !== currentId && row.studentId !== studentId
    && (!options?.visibleIds || options.visibleIds.has(row.submissionId))
    && normalizeAdminSubmissionReviewStatus(row.reviewStatus) === "submitted") ?? null;
}

/** IDs, not display names, scope the selected student's submissions. */
export function matchesSelectedStudent(studentId: string, selectedStudentId: string) {
  return !selectedStudentId || studentId === selectedStudentId;
}
