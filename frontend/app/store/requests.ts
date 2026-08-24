import { API_BASE_URL } from "./config";
import { getAccessToken } from "./auth";

export type RequestType = "leave";
export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type RequesterRole = "student" | "teacher";

export interface LeaveRequest {
  id: number;
  request_type: RequestType;
  requester_role: RequesterRole;
  requester_name: string;
  requester_email?: string | null;
  class_id?: number | null;
  class_name?: string | null;
  section_id?: number | null;
  section_name?: string | null;
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
  status: RequestStatus;
  review_note?: string | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  can_cancel: boolean;
  can_review: boolean;
  can_delete: boolean;
}

export interface PendingRequestCounts {
  total: number;
  student: number;
  teacher: number;
}

export const EMPTY_PENDING_COUNTS: PendingRequestCounts = { total: 0, student: 0, teacher: 0 };

export const REQUESTS_CHANGED_EVENT = "sms:requests-changed";

type PendingCountListener = (counts: PendingRequestCounts) => void;

let cachedPendingCounts: PendingRequestCounts | null = null;
let cachedPendingToken: string | null = null;
let pendingCountsInflight: Promise<PendingRequestCounts> | null = null;
const pendingCountListeners = new Set<PendingCountListener>();

function emitPendingCounts(counts: PendingRequestCounts) {
  pendingCountListeners.forEach((listener) => listener(counts));
}

export function getCachedPendingRequestCounts() {
  return cachedPendingCounts ?? EMPTY_PENDING_COUNTS;
}

export async function loadPendingRequestCounts(options?: { force?: boolean }) {
  const token = getAccessToken();
  if (!token) {
    cachedPendingCounts = EMPTY_PENDING_COUNTS;
    cachedPendingToken = null;
    pendingCountsInflight = null;
    emitPendingCounts(cachedPendingCounts);
    return cachedPendingCounts;
  }

  if (
    !options?.force &&
    cachedPendingCounts &&
    cachedPendingToken === token &&
    !pendingCountsInflight
  ) {
    return cachedPendingCounts;
  }

  if (pendingCountsInflight) {
    return pendingCountsInflight;
  }

  pendingCountsInflight = fetchPendingRequestCounts(token)
    .then((counts) => {
      cachedPendingCounts = counts;
      cachedPendingToken = token;
      emitPendingCounts(counts);
      return counts;
    })
    .finally(() => {
      pendingCountsInflight = null;
    });

  return pendingCountsInflight;
}

export function subscribePendingRequestCounts(listener: PendingCountListener) {
  pendingCountListeners.add(listener);
  if (cachedPendingCounts) listener(cachedPendingCounts);
  void loadPendingRequestCounts();
  return () => {
    pendingCountListeners.delete(listener);
  };
}

export function notifyRequestsChanged() {
  void loadPendingRequestCounts({ force: true });
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REQUESTS_CHANGED_EVENT));
}

export interface LeaveRequestPayload {
  from_date: string;
  to_date: string;
  reason: string;
}

async function parseError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  if (typeof data.detail === "string") {
    throw new Error(data.detail);
  }
  throw new Error(fallback);
}

export async function fetchMyRequests(token: string): Promise<LeaveRequest[]> {
  const response = await fetch(`${API_BASE_URL}/my-requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to load your requests.");
  }
  return response.json();
}

export async function createMyRequest(
  token: string,
  payload: LeaveRequestPayload,
): Promise<LeaveRequest> {
  const response = await fetch(`${API_BASE_URL}/my-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to submit leave request.");
  }
  const created = await response.json();
  notifyRequestsChanged();
  return created;
}

export async function cancelMyRequest(token: string, requestId: number): Promise<LeaveRequest> {
  const response = await fetch(`${API_BASE_URL}/my-requests/${requestId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to cancel request.");
  }
  const cancelled = await response.json();
  notifyRequestsChanged();
  return cancelled;
}

export async function fetchInboxRequests(
  token: string,
  requesterRole?: RequesterRole,
): Promise<LeaveRequest[]> {
  const search = new URLSearchParams();
  if (requesterRole) search.set("requester_role", requesterRole);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/requests${suffix}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to load requests.");
  }
  return response.json();
}

export async function fetchPendingRequestCounts(token: string): Promise<PendingRequestCounts> {
  const response = await fetch(`${API_BASE_URL}/requests/pending-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to load pending request count.");
  }
  return response.json();
}

export async function reviewRequest(
  token: string,
  requestId: number,
  payload: { status: "approved" | "rejected"; review_note?: string },
): Promise<LeaveRequest> {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to review request.");
  }
  const reviewed = await response.json();
  notifyRequestsChanged();
  return reviewed;
}

export async function deleteInboxRequest(token: string, requestId: number) {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await parseError(response, "Failed to delete request.");
  }
  notifyRequestsChanged();
}
