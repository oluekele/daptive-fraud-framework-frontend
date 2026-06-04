"use client";

import { useMemo } from "react";
import type { StoredEvent } from "@/types/telemetry";

export function useDashboardMetrics(events: StoredEvent[]) {
  return useMemo(() => {
    const keyboardEvents = events.filter(e =>
      ["keydown", "keyup"].includes(e.eventType)
    ).length;

    const mouseEvents = events.filter(e =>
      ["mouse_move", "mouse_click"].includes(e.eventType)
    ).length;

    const scrollEvents = events.filter(e => e.eventType === "scroll").length;

    const touchEvents = events.filter(e => e.eventType === "touch_move").length;

    return {
      totalEvents: events.length,
      keyboardEvents,
      mouseEvents,
      scrollEvents,
      touchEvents,
    };
  }, [events]);
}