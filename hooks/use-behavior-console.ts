"use client";

import { useState, useMemo, useRef, FormEvent, MouseEvent, TouchEvent, useEffect, useCallback } from "react";

export type AuthMode = "login" | "register";
export type TelemetryType = "keydown" | "keyup" | "mouse_move" | "mouse_click" | "scroll" | "touch_move" | "idle";

export type StoredEvent = {
  id?: string;
  eventType: TelemetryType;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  sessionId: string;
  user: { id: string; email: string };
};

export type DatasetResponse = {
  sessionId: string;
  generatedAt: string;
  summary: {
    totalEvents: number;
    keyboardEvents: number;
    mouseEvents: number;
    scrollEvents: number;
    touchEvents: number;
  };
  events: StoredEvent[];
};

export type SessionSummary = {
  id: string;
  userId?: string;
  startedAt: string;
  endedAt?: string | null;
  _count?: { telemetry: number; riskScores: number; predictions: number };
};

export type FeatureSet = {
  id: string;
  sessionId: string;
  avgDwellTime: number | null;
  avgFlightTime: number | null;
  avgMouseSpeed: number | null;
  avgScrollRate: number | null;
  typingSpeed: number | null;
  createdAt: string;
};

export type RiskScore = {
  id: string;
  sessionId: string;
  score: number;
  level: string;
  createdAt: string;
  features?: FeatureSet;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds of inactivity

export function useBehaviorConsole() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("analyst@example.com");
  const [password, setPassword] = useState("StrongPassword123!");
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([]);
  const [features, setFeatures] = useState<FeatureSet[]>([]);
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [riskResult, setRiskResult] = useState<RiskScore | null>(null);
  const [status, setStatus] = useState("Ready to connect to the API.");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // For auth form submission

  // Refs for managing in-flight requests, buffered movements, and animation frames
  const lastActivityTimeRef = useRef(Date.now());
  const inFlightRef = useRef<Partial<Record<TelemetryType, boolean>>>({});
  const bufferedMoveRef = useRef<{
    mouse: { x: number; y: number; width: number; height: number; timestamp: number } | null;
    scroll: { scrollTop: number; scrollHeight: number; timestamp: number } | null;
  }>({ mouse: null, scroll: null });
  const rafSendRef = useRef<number | null>(null);

  // Ref for idle timer
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Memoized metrics calculation based on captured events.
   */
  const metrics = useMemo(() => {
    const keyboardEvents = events.filter((e) => ["keydown", "keyup"].includes(e.eventType)).length;
    const mouseEvents = events.filter((e) => ["mouse_move", "mouse_click"].includes(e.eventType)).length;
    const scrollEvents = events.filter((e) => e.eventType === "scroll").length;
    const touchEvents = events.filter((e) => e.eventType === "touch_move").length;
    const idleEvents = events.filter((e) => e.eventType === "idle").length;
    return { totalEvents: events.length, keyboardEvents, mouseEvents, scrollEvents, touchEvents, idleEvents };
  }, [events]);

  /** Generic API request helper. */
  async function request<T>(path: string, options: RequestInit & { authorized?: boolean } = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (options.authorized && auth?.accessToken) headers.set("Authorization", `Bearer ${auth.accessToken}`);
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.message ?? "Request failed.");
    return body as T;
  }

  /**
   * Handles user authentication (login or registration).
   */
  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(`${authMode === "login" ? "Logging in" : "Registering"}...`);
    try {
      if (authMode === "register") {
        await request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
      }
      const login = await request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      bufferedMoveRef.current = { mouse: null, scroll: null };
      setAuth(login);
      setEvents([]);
      setIsCapturing(true); // Start capturing telemetry after successful login
      resetIdleTimer(); // Start idle detection
      setStatus(`Session ${login.sessionId} is active.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Sends a telemetry event to the backend.
   * Prevents duplicate in-flight requests for the same event type.
   */
  async function sendTelemetry(eventType: TelemetryType, payload: Record<string, unknown>) {
    if (!auth || !isCapturing || inFlightRef.current[eventType]) return;
    inFlightRef.current[eventType] = true;
    try {
      const optimisticEvent: StoredEvent = { eventType, payload, createdAt: new Date().toISOString() };
      setEvents((current) => [optimisticEvent, ...current].slice(0, 120));
      const stored = await request<StoredEvent>("/telemetry", {
        method: "POST",
        authorized: true,
        body: JSON.stringify({ eventType, payload }),
      });
      setEvents((current) => [stored, ...current.slice(1)].slice(0, 120));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Telemetry failed.");
    } finally {
      inFlightRef.current[eventType] = false;
    }
    lastActivityTimeRef.current = Date.now(); // Reset activity time on any telemetry event
    resetIdleTimer();
  }

  /**
   * Resets the idle timer. If no activity is detected within IDLE_TIMEOUT_MS,
   * an 'idle' telemetry event is sent.
   */
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (isCapturing && auth) {
      idleTimerRef.current = setTimeout(() => {
        const idleDuration = Date.now() - lastActivityTimeRef.current;
        void sendTelemetry("idle", { duration: idleDuration });
        lastActivityTimeRef.current = Date.now(); // Reset after sending idle event
        resetIdleTimer(); // Restart the timer
      }, IDLE_TIMEOUT_MS);
    }
  }, [isCapturing, auth, sendTelemetry]);

  // Effect to manage idle timer based on capturing state and authentication
  useEffect(() => {
    if (isCapturing && auth) {
      resetIdleTimer();
    } else if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
  }, [isCapturing, auth, resetIdleTimer]);

  /**
   * Enqueues buffered mouse move and scroll events to be sent
   * on the next animation frame to optimize performance.
   */
  function enqueueBufferedTelemetry() {
    if (!auth || !isCapturing || rafSendRef.current != null) return;
    rafSendRef.current = window.requestAnimationFrame(() => {
      rafSendRef.current = null;
      if (bufferedMoveRef.current.mouse && !inFlightRef.current.mouse_move) {
        const payload = bufferedMoveRef.current.mouse;
        bufferedMoveRef.current.mouse = null;
        void sendTelemetry("mouse_move", payload);
      }
      if (bufferedMoveRef.current.scroll && !inFlightRef.current.scroll) {
        const payload = bufferedMoveRef.current.scroll;
        bufferedMoveRef.current.scroll = null;
        void sendTelemetry("scroll", payload);
      }
    });
  }

  /**
   * Handlers for capturing various user interactions.
   * These update buffered movements or send telemetry directly.
   */
  const handlers = {
    captureMouseMove: (event: MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      bufferedMoveRef.current.mouse = {
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        timestamp: Date.now(),
      };
      enqueueBufferedTelemetry();
      lastActivityTimeRef.current = Date.now();
    },
    captureMouseClick: (event: MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      void sendTelemetry("mouse_click", {
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top),
        button: event.button,
        timestamp: Date.now(),
      });
      lastActivityTimeRef.current = Date.now();
    },
    captureTouchMove: (event: TouchEvent<HTMLDivElement>) => {
      const touch = event.touches[0];
      if (!touch) return;
      const rect = event.currentTarget.getBoundingClientRect();
      void sendTelemetry("touch_move", {
        x: Math.round(touch.clientX - rect.left),
        y: Math.round(touch.clientY - rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        timestamp: Date.now(),
      });
      lastActivityTimeRef.current = Date.now();
    },
    captureScroll: (event: React.UIEvent<HTMLDivElement>) => {
      bufferedMoveRef.current.scroll = {
        scrollTop: event.currentTarget.scrollTop,
        scrollHeight: event.currentTarget.scrollHeight,
        timestamp: Date.now(),
      };
      enqueueBufferedTelemetry();
      lastActivityTimeRef.current = Date.now();
    },
    captureKeyboardEvent: (eventType: "keydown" | "keyup", payload: Record<string, unknown>) => {
      void sendTelemetry(eventType, payload);
      lastActivityTimeRef.current = Date.now();
    },
  };

  /**
   * Collection of asynchronous actions that interact with the backend API.
   * These functions update the component's state based on API responses.
   */
  const actions = {
    /** Fetches and sets the telemetry dataset for the current session. */
    fetchDataset: async () => {
      if (!auth) return;
      setStatus("Generating session dataset...");
      try {
        const res = await request<DatasetResponse>("/telemetry/dataset", { authorized: true });
        setDataset(res);
        setStatus("Dataset generated.");
      } catch (e) { setStatus(e instanceof Error ? e.message : "Failed"); }
    },
    refreshTelemetry: async () => {
      /** Refreshes the list of stored telemetry events. */
      if (!auth) return;
      try {
        const res = await request<StoredEvent[]>("/telemetry", { authorized: true });
        setEvents(res.reverse());
        setStatus("Telemetry loaded.");
      } catch (e) { setStatus("Retrieval failed."); }
    },
    generateFeatures: async () => {
      /** Triggers the backend to generate features from telemetry data. */
      if (!auth) return;
      try {
        const res = await request<FeatureSet>("/features/generate", { method: "POST", authorized: true, body: "{}" });
        setFeatures(prev => [res, ...prev]);
        setStatus("Features generated.");
      } catch (e) { setStatus("Feature gen failed."); }
    },
    calculateRisk: async () => {
      /** Triggers the backend to calculate a risk score based on current features. */
      if (!auth) return;
      try {
        const res = await request<RiskScore>("/risk/calculate", { method: "POST", authorized: true, body: "{}" });
        setRiskResult(res);
        setRiskScores(prev => [res, ...prev]);
        if (res.features) setFeatures(prev => [res.features!, ...prev]);
        setStatus(`Risk calculated: ${res.level}`);
      } catch (e) { setStatus("Risk calculation failed."); }
    },
    refreshFeatures: async () => {
      /** Refreshes the list of generated feature sets. */
      if (!auth) return;
      try {
        const res = await request<FeatureSet[]>("/features", { authorized: true });
        setFeatures(res);
      } catch (e) { setStatus("Feature refresh failed."); }
    },
    refreshRiskScores: async () => {
      /** Refreshes the history of risk scores. */
      if (!auth) return;
      try {
        const res = await request<RiskScore[]>("/risk", { authorized: true });
        setRiskScores(res);
        setRiskResult(res[0] ?? null);
      } catch (e) { setStatus("Risk refresh failed."); }
    },
    refreshSessionHistory: async () => {
      /** Refreshes the history of user sessions. */
      if (!auth) return;
      try {
        const res = await request<SessionSummary[]>("/sessions/history", { authorized: true });
        setSessionHistory(res);
      } catch (e) { setStatus("History failed."); }
    },
    endSession: async () => {
      /** Ends the current user session on the backend. */
      if (!auth) return;
      try {
        await request("/sessions/current/end", { method: "PATCH", authorized: true });
        setIsCapturing(false);
        setStatus("Session ended.");
      } catch (e) { setStatus("End session failed."); }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, []);

  return {
    state: {
      authMode,
      email,
      password,
      auth,
      events,
      dataset,
      sessionHistory,
      features,
      riskScores,
      riskResult,
      status,
      isCapturing,
      isSubmitting,
      metrics
    },
    setters: {
      setAuthMode,
      setEmail,
      setPassword,
      setIsCapturing
    },
    handlers: {
      ...handlers,
      submitAuth,
      sendTelemetry, // Expose sendTelemetry for direct use if needed (e.g., keydown/keyup)
    },
    actions
  };
}