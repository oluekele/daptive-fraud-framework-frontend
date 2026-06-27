import { TelemetryType } from "@/types/telemetry";

export const API_URL =
  // "https://daptive-fraud-framework-backend.onrender.com";
"http://localhost:4000";

export const eventStyles: Record<TelemetryType, string> = {
  keydown: "bg-emerald-500",
  keyup: "bg-teal-500",
  mouse_move: "bg-blue-500",
  mouse_click: "bg-rose-500",
  scroll: "bg-amber-500",
  touch_move: "bg-violet-500",
  idle_activity: "bg-gray-500",
};
