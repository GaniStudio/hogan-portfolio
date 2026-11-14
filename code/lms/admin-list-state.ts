import type { AdminSubmissionFilter } from "./admin-filter";

export type AdminSubmissionListScope = { day: string; filter: AdminSubmissionFilter };
export type AdminSubmissionRefreshReason = "initial" | "scope" | "manual" | "background";
export type AdminSubmissionListState<Row> = {
  requestId: number;
  loading: boolean;
  reason: AdminSubmissionRefreshReason;
  error: string;
  snapshot: { rows: Row[]; scope: AdminSubmissionListScope; completedAt?: string } | null;
};
export type AdminSubmissionListAction<Row> =
  | { type: "start"; requestId: number; reason?: AdminSubmissionRefreshReason }
  | { type: "success"; requestId: number; rows: Row[]; scope: AdminSubmissionListScope; completedAt?: string }
  | { type: "unauthorized"; requestId: number }
  | { type: "failure"; requestId: number; message: string };

export function initialAdminSubmissionListState<Row>(): AdminSubmissionListState<Row> {
  return { requestId: 0, loading: true, reason: "initial", error: "", snapshot: null };
}

/** A failed or superseded read must never become a successful empty queue. */
export function reduceAdminSubmissionList<Row>(state: AdminSubmissionListState<Row>, action: AdminSubmissionListAction<Row>): AdminSubmissionListState<Row> {
  if (action.type === "start") return { ...state, requestId: action.requestId, loading: true,
    reason: state.loading && state.reason !== "background" ? state.reason : action.reason ?? "manual", error: "" };
  if (action.requestId !== state.requestId) return state;
  if (action.type === "unauthorized") return { ...state, loading: false, error: "인증을 확인해 주세요.", snapshot: null };
  if (action.type === "failure") return { ...state, loading: false, error: action.message };
  return { ...state, loading: false, error: "", snapshot: { rows: action.rows, scope: action.scope, completedAt: action.completedAt } };
}

/** One read per scope. Events during a read invalidate that response and coalesce into one follow-up. */
export function createAdminSubmissionReader(read: (reason: AdminSubmissionRefreshReason, context: {
  controller: AbortController; isCurrent: () => boolean;
}) => Promise<void>) {
  let disposed = false;
  let generation = 0;
  let followUp = false;
  let active: Promise<void> | null = null;
  let controller: AbortController | null = null;
  return {
    request(reason: AdminSubmissionRefreshReason): Promise<void> {
      if (disposed) return Promise.resolve();
      if (active) {
        // Manual clicks join the in-flight read; actual background invalidations need a fresh read.
        if (reason === "background") { generation += 1; followUp = true; }
        return active;
      }
      active = (async () => {
        do {
          followUp = false;
          const startedGeneration = generation;
          controller = new AbortController();
          await read(reason, { controller, isCurrent: () => !disposed && startedGeneration === generation });
          reason = "background";
        } while (!disposed && followUp);
      })().finally(() => { active = null; controller = null; });
      return active;
    },
    dispose() { disposed = true; generation += 1; followUp = false; controller?.abort(); },
  };
}

export const ADMIN_SUBMISSION_PAGE_SIZE = 50;
export function adminSubmissionPage<Row>(rows: readonly Row[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / ADMIN_SUBMISSION_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1));
  const start = (page - 1) * ADMIN_SUBMISSION_PAGE_SIZE;
  return { page, totalPages, start: rows.length ? start + 1 : 0, end: Math.min(start + ADMIN_SUBMISSION_PAGE_SIZE, rows.length), rows: rows.slice(start, start + ADMIN_SUBMISSION_PAGE_SIZE) };
}
