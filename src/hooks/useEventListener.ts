import { useEffect, useRef, useState } from "react";
import { CONTRACT_ID, getLatestLedgerSequence, getRpcServer } from "../lib/contract";

type UseEventListenerArgs = {
  enabled?: boolean;
  onVoteEvent: () => Promise<void> | void;
};

export function useEventListener({
  enabled = true,
  onVoteEvent,
}: UseEventListenerArgs) {
  const [isLive, setIsLive] = useState(false);
  const lastLedgerRef = useRef<number>(0);
  const seenEventIds = useRef<Set<string>>(new Set());
  const callbackRef = useRef(onVoteEvent);

  useEffect(() => {
    callbackRef.current = onVoteEvent;
  }, [onVoteEvent]);

  useEffect(() => {
    if (!enabled || !CONTRACT_ID) {
      setIsLive(false);
      return;
    }

    let intervalId = 0;
    let cancelled = false;

    async function poll() {
      try {
        const server = getRpcServer();
        const response: any = await server.getEvents({
          startLedger: lastLedgerRef.current,
          filters: [
            {
              type: "contract",
              contractIds: [CONTRACT_ID],
            },
          ],
        });

        const events = response?.events ?? [];
        const freshEvents = events.filter((event: any) => {
          const id = String(event?.id ?? `${event?.ledger}-${event?.pagingToken ?? ""}`);
          if (seenEventIds.current.has(id)) {
            return false;
          }

          seenEventIds.current.add(id);
          return true;
        });

        if (events.length > 0) {
          const lastEvent = events[events.length - 1];
          lastLedgerRef.current = Number(lastEvent?.ledger ?? lastLedgerRef.current) + 1;
        } else if (response?.latestLedger) {
          lastLedgerRef.current = Number(response.latestLedger);
        }

        if (freshEvents.length > 0) {
          await callbackRef.current();
        }

        if (!cancelled) {
          setIsLive(true);
        }
      } catch {
        if (!cancelled) {
          setIsLive(false);
        }
      }
    }

    void (async () => {
      lastLedgerRef.current = await getLatestLedgerSequence();
      await poll();
      intervalId = window.setInterval(() => {
        void poll();
      }, 5000);
    })();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled]);

  return {
    isLive,
  };
}
