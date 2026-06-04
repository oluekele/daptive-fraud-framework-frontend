"use client";

import { useMemo, useState } from "react";

export function useTelemetry(auth: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const metrics = useMemo(() => {
    const keyboard = events.filter((e) =>
      ["keydown", "keyup"].includes(e.eventType),
    ).length;

    const mouse = events.filter((e) =>
      ["mouse_move", "mouse_click"].includes(e.eventType),
    ).length;

    const scroll = events.filter((e) => e.eventType === "scroll").length;

    return {
      totalEvents: events.length,
      keyboardEvents: keyboard,
      mouseEvents: mouse,
      scrollEvents: scroll,
    };
  }, [events]);

  const push = async (eventType: string, payload: any) => {
    const event = {
      eventType,
      payload,
      createdAt: new Date().toISOString(),
    };

    setEvents((prev) => [event, ...prev].slice(0, 120));
  };

  const toggleCapture = () => setIsCapturing((v) => !v);

  const captureMouseMove = () => { };
  const captureMouseClick = () => { };
  const captureTouchMove = () => { };
  const captureScroll = () => { };

  return {
    events,
    setEvents,
    metrics,
    isCapturing,
    toggleCapture,
    push,
    captureMouseMove,
    captureMouseClick,
    captureTouchMove,
    captureScroll,
  };
}