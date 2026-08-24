import { useEffect, useState } from "react";
import {
  EMPTY_PENDING_COUNTS,
  getCachedPendingRequestCounts,
  subscribePendingRequestCounts,
  type PendingRequestCounts,
} from "../store/requests";

export function usePendingRequestCounts(enabled = true) {
  const [counts, setCounts] = useState<PendingRequestCounts>(getCachedPendingRequestCounts);

  useEffect(() => {
    if (!enabled) {
      setCounts(EMPTY_PENDING_COUNTS);
      return;
    }
    return subscribePendingRequestCounts(setCounts);
  }, [enabled]);

  return counts;
}
