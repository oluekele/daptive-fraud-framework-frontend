"use client";

import { useState } from "react";
import type { SessionSummary } from "@/types/telemetry";

export function useSession() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [session, setSession] = useState<SessionSummary | null>(null);

  function startSession(session: SessionSummary) {
    setSession(session);
    setIsCapturing(true);
    setStatus("Session active");
  }

  function endSession() {
    setIsCapturing(false);
    setStatus("Session ended");
  }

  function toggleCapture() {
    setIsCapturing((v) => !v);
  }

  return {
    session,
    isCapturing,
    status,
    setStatus,
    startSession,
    endSession,
    toggleCapture,
  };
}