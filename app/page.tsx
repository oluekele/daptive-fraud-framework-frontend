
"use client";

import { FormEvent, MouseEvent, TouchEvent, useEffect, useMemo, useRef, useState } from "react";
import Metric from "@/components/Metric";
import RiskBadge from "@/components/RiskBadge";
import RiskPanel from "@/components/RiskPanel";
import FeaturePanel from "@/components/FeaturePanel";
import MlPredictionPanel from "@/components/MlPredictionPanel";
import SessionHistoryPanel from "@/components/SessionHistoryPanel";
import EventTable from "@/components/EventTable";
import { API_URL, eventStyles } from "@/lib/constants";
import { login, register } from "@/services/auth.service";
import {
  calculateRisk,
  exportTrainingCsv,
  generateFeatures,
  getFeatures,
  getRiskScores,
  getTrainingSummary,
  predictSession,
} from "@/services/risk.service";
import {
  getDataset,
  getTelemetry,
  sendTelemetry,
} from "@/services/telemetry.service";
import type {
  AuthMode,
  AuthResponse,
  DatasetResponse,
  FeatureSet,
  RiskScore,
  SessionSummary,
  StoredEvent,
  TelemetryType,
  TrainingRecord,
} from "@/types";

type FeatureSummary = {
  duration: string;
  mouseMoves: string;
  mouseClicks: string;
  keyboardEvents: string;
  avgMouseSpeed: string;
  maxMouseSpeed: string;
  scrollEvents: string;
  avgScrollSpeed: string;
  idleTime: string;
  keystrokesPerSecond: string;
  riskLabel: string;
};

const DEFAULT_FEATURE_SUMMARY: FeatureSummary = {
  duration: "--",
  mouseMoves: "--",
  mouseClicks: "--",
  keyboardEvents: "--",
  avgMouseSpeed: "--",
  maxMouseSpeed: "--",
  scrollEvents: "--",
  avgScrollSpeed: "--",
  idleTime: "--",
  keystrokesPerSecond: "--",
  riskLabel: "--",
};

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("analyst@example.com");
  const [password, setPassword] = useState("StrongPassword123!");
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([]);
  const [features, setFeatures] = useState<FeatureSet[]>([]);
  const [trainingRecord, setTrainingRecord] = useState<TrainingRecord | null>(null);
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [riskResult, setRiskResult] = useState<RiskScore | null>(null);
  const [mlPrediction, setMlPrediction] = useState<import("@/types/ml-prediction").MlPrediction | null>(null);
  const [status, setStatus] = useState("Ready to connect to the API.");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inFlightRef = useRef<Partial<Record<TelemetryType, boolean>>>({});
  const isCapturingRef = useRef(isCapturing);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  const bufferedMoveRef = useRef<{
    mouse: { x: number; y: number; width: number; height: number; timestamp: number } | null;
    touch: { x: number; y: number; width: number; height: number; timestamp: number } | null;
    scroll: { scrollTop: number; scrollHeight: number; timestamp: number } | null;
  }>({ mouse: null, touch: null, scroll: null });
  const rafSendRef = useRef<number | null>(null);

  // Idle detection / session duration for backend training features
  const lastActivityRef = useRef<number>(Date.now());
  const idleIntervalRef = useRef<number | null>(null);
  const lastScrollRef = useRef<{ scrollTop: number; timestamp: number; scrollHeight: number } | null>(null);
  const lastMouseMoveRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);



  const markActivity = () => {
    lastActivityRef.current = Date.now();
  };


  useEffect(() => {
    if (!auth || !isCapturing) return;

    markActivity();

    const onAnyActivity = () => {
      if (!isCapturingRef.current) return;
      lastActivityRef.current = Date.now();
    };


    const onMouseMove = () => onAnyActivity();
    const onKeyDown = () => onAnyActivity();
    const onScroll = () => onAnyActivity();
    const onTouchStart = () => onAnyActivity();

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });

    const sendIdleEvent = () => {
      if (!isCapturingRef.current) return;

      const idleTimeMs = Date.now() - lastActivityRef.current;
      if (idleTimeMs <= 10_000) return;

      void sendAuthenticatedTelemetry("idle_activity", {
        durationMs: idleTimeMs,
        durationSeconds: idleTimeMs / 1000,
        thresholdMs: 10_000,
      });

      // prevent spamming idle events every tick: reset so we wait for next inactivity window
      lastActivityRef.current = Date.now();
    };

    idleIntervalRef.current = window.setInterval(sendIdleEvent, 5_000);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);

      if (idleIntervalRef.current !== null) {
        window.clearInterval(idleIntervalRef.current);
        idleIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, isCapturing]);


  const metrics = useMemo(() => {
    const keyboardEvents = events.filter((event) =>
      ["keydown", "keyup"].includes(event.eventType),
    ).length;

    const mouseEvents = events.filter((event) =>
      ["mouse_move", "mouse_click"].includes(event.eventType),
    ).length;

    const scrollEvents = events.filter((event) => event.eventType === "scroll").length;
    const touchEvents = events.filter((event) => event.eventType === "touch_move").length;
    const idleEvents = events.filter(
      (event) => event.eventType === "idle_activity",
    ).length;

    return {
      totalEvents: events.length,
      keyboardEvents,
      mouseEvents,
      scrollEvents,
      touchEvents,
      idleEvents,
    };
  }, [events]);

  const featureSummary = useMemo(() => {
    if (trainingRecord) {
      return {
        duration: formatMetric(trainingRecord.duration_seconds, "s"),
        mouseMoves: String(trainingRecord.mouse_moves),
        mouseClicks: String(trainingRecord.mouse_clicks),
        keyboardEvents: String(trainingRecord.keyboard_events),
        avgMouseSpeed: formatMetric(trainingRecord.avg_mouse_speed, "px/s"),
        maxMouseSpeed: formatMetric(trainingRecord.max_mouse_speed, "px/s"),
        scrollEvents: String(trainingRecord.scroll_events),
        avgScrollSpeed: formatMetric(trainingRecord.avg_scroll_speed, "px/s"),
        idleTime: formatMetric(trainingRecord.idle_time_seconds, "s"),
        keystrokesPerSecond: formatMetric(trainingRecord.keystrokes_per_second, "keys/s"),
        riskLabel: trainingRecord.risk_label,
      };
    }

    return DEFAULT_FEATURE_SUMMARY;
  }, [trainingRecord]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(authMode === "login" ? "Logging in..." : "Registering...");

    try {
      if (authMode === "register") {
        await register(email, password);
        setStatus("Registration complete. Creating session...");
      }

      const nextAuth = await login(email, password);
      setAuth(nextAuth);
      setEvents([]);
      setDataset(null);
      setSessionHistory([]);
      setFeatures([]);
      setTrainingRecord(null);
      setRiskScores([]);
      setRiskResult(null);
      setIsCapturing(true);
      setStatus(`Session ${nextAuth.sessionId} is active.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sendAuthenticatedTelemetry(
    eventType: TelemetryType,
    payload: Record<string, unknown>,
  ) {
    if (!auth || !isCapturing) return;
    if (inFlightRef.current[eventType]) return;

    inFlightRef.current[eventType] = true;
    try {
      const optimisticEvent: StoredEvent = {
        eventType,
        payload,
        createdAt: new Date().toISOString(),
      };

      setEvents((current) => [optimisticEvent, ...current].slice(0, 120));

      const stored = await sendTelemetry(auth.accessToken, eventType, payload);
      setEvents((current) => [stored, ...current.slice(1)].slice(0, 120));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Telemetry storage failed.");
    } finally {
      inFlightRef.current[eventType] = false;
    }
  }

  function enqueueBufferedTelemetry() {
    if (!auth || !isCapturing) return;
    if (rafSendRef.current != null) return;

    rafSendRef.current = window.requestAnimationFrame(() => {
      rafSendRef.current = null;

      if (bufferedMoveRef.current.mouse && !inFlightRef.current.mouse_move) {
        const payload = bufferedMoveRef.current.mouse;
        bufferedMoveRef.current.mouse = null;
        void sendAuthenticatedTelemetry("mouse_move", payload);
      }

      if (bufferedMoveRef.current.touch && !inFlightRef.current.touch_move) {
        const payload = bufferedMoveRef.current.touch;
        bufferedMoveRef.current.touch = null;
        void sendAuthenticatedTelemetry("touch_move", payload);
      }

      if (bufferedMoveRef.current.scroll && !inFlightRef.current.scroll) {
        const payload = bufferedMoveRef.current.scroll;
        bufferedMoveRef.current.scroll = null;
        void sendAuthenticatedTelemetry("scroll", payload);
      }
    });
  }

  function captureMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    bufferedMoveRef.current.mouse = {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      timestamp: Date.now(),
    };

    enqueueBufferedTelemetry();
  }

  function captureMouseClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    void sendAuthenticatedTelemetry("mouse_click", {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
      button: event.button,
      timestamp: Date.now(),
    });
  }

  function captureTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;

    const rect = event.currentTarget.getBoundingClientRect();
    bufferedMoveRef.current.touch = {
      x: Math.round(touch.clientX - rect.left),
      y: Math.round(touch.clientY - rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      timestamp: Date.now(),
    };

    enqueueBufferedTelemetry();
  }

  async function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!auth || !isCapturing) return;
    await sendAuthenticatedTelemetry("keydown", {
      key: event.key,
      code: event.code,
      timestamp: Date.now(),
    });
  }

  async function handleKeyUp(event: React.KeyboardEvent<HTMLElement>) {
    if (!auth || !isCapturing) return;
    await sendAuthenticatedTelemetry("keyup", {
      key: event.key,
      code: event.code,
      timestamp: Date.now(),
    });
  }

  async function fetchTelemetryDataset() {
    if (!auth) return;

    bufferedMoveRef.current.mouse = null;
    bufferedMoveRef.current.touch = null;
    bufferedMoveRef.current.scroll = null;

    setStatus("Generating session dataset...");
    try {
      const nextDataset = await getDataset(auth.accessToken);
      setDataset(nextDataset as DatasetResponse);
      setStatus("Dataset generated from stored telemetry.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Dataset generation failed.");
    }
  }

  async function refreshTelemetry() {
    if (!auth) return;

    setStatus("Retrieving telemetry for the active session...");
    try {
      const storedEvents = await getTelemetry(auth.accessToken);
      setEvents(storedEvents.slice().reverse());
      setStatus("Stored telemetry loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Telemetry retrieval failed.");
    }
  }

  async function refreshTrainingSummary() {
    if (!auth) return;

    try {
      const record = await getTrainingSummary(auth.accessToken);
      setTrainingRecord(record);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Training summary failed.");
    }
  }

  async function generateAndLoadFeatures() {
    if (!auth) return;

    setStatus("Generating behavioral features...");
    try {
      const featureSet = await generateFeatures(auth.accessToken);
      setFeatures((current) => [featureSet, ...current]);
      await refreshTrainingSummary();
      setStatus("Features generated and stored.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Feature generation failed.");
    }
  }

  async function refreshFeatures() {
    if (!auth) return;

    setStatus("Retrieving stored features...");
    try {
      const storedFeatures = await getFeatures(auth.accessToken);
      setFeatures(storedFeatures);
      await refreshTrainingSummary();
      setStatus("Stored features loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Feature retrieval failed.");
    }
  }

  async function calculateAndLoadRisk() {
    if (!auth) return;

    setStatus("Calculating session risk...");
    try {
      const score = await calculateRisk(auth.accessToken);
      setRiskResult(score);
      setRiskScores((current) => [score, ...current]);
      await refreshTrainingSummary();
      if (score.features) {
        setFeatures((current) => [score.features as FeatureSet, ...current]);
      }
      setStatus(`Risk calculated: ${score.level} (${Math.round(score.score)}).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Risk calculation failed.");
    }
  }

  async function refreshRiskScores() {
    if (!auth) return;

    setStatus("Retrieving risk history...");
    try {
      const scores = await getRiskScores(auth.accessToken);
      setRiskScores(scores);
      setRiskResult(scores[0] ?? null);
      await refreshTrainingSummary();
      setStatus("Risk scores loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Risk retrieval failed.");
    }
  }

  async function downloadTrainingCsv() {
    if (!auth) return;

    setStatus("Preparing CSV export...");
    try {
      const csv = await exportTrainingCsv(auth.accessToken);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "training-data.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Training CSV downloaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "CSV export failed.");
    }
  }

  async function runPrediction() {
    if (!auth) return;

    setStatus("Running prediction...");
    try {
      const prediction = await predictSession(auth.accessToken, auth.sessionId);
      // Expected ML response shape from backend:
      // { sessionId, mlPrediction, confidence, probabilities, score, level, predictionId }
      console.log("predict response:", prediction);
      setMlPrediction(prediction as import("@/types/ml-prediction").MlPrediction);
      setStatus(`ML prediction ready: ${prediction.level} (${Number(prediction.confidence) * 100}%).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Prediction failed.");
    }
  }

  console.log('predict: ', status)

  async function refreshSessionHistory() {
    if (!auth) return;

    setStatus("Retrieving session history...");
    try {
      const response = await fetch(`${API_URL}/sessions/history`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? "Request failed.");
      }

      setSessionHistory(body as SessionSummary[]);
      setStatus("Session history loaded.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Session history failed.");
    }
  }

  async function endSession() {
    if (!auth) return;

    setStatus("Ending active session...");
    try {
      await fetch(`${API_URL}/sessions/current/end`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      setIsCapturing(false);
      bufferedMoveRef.current.mouse = null;
      bufferedMoveRef.current.touch = null;
      bufferedMoveRef.current.scroll = null;
      setStatus("Session ended. Login again to create a new active session.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ending session failed.");
    }
  }

  return (
    <main
      className="min-h-screen bg-[#f7f8fb] text-slate-950"
      onKeyDown={(event) => void handleKeyDown(event)}
      onKeyUp={(event) => void handleKeyUp(event)}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
              Adaptive Fraud Framework
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Behaviour telemetry console
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-5">
            <Metric label="Events" value={metrics.totalEvents} />
            <Metric label="Keyboard" value={metrics.keyboardEvents} />
            <Metric label="Mouse" value={metrics.mouseEvents} />
            <Metric label="Scroll" value={metrics.scrollEvents} />
            <Metric label="Idle" value={metrics.idleEvents} />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <AuthCard
              auth={auth}
              authMode={authMode}
              setAuthMode={setAuthMode}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={submitAuth}
              onLogout={async () => {
                if (!auth) return;

                setStatus("Logging out...");
                try {
                  await fetch(`${API_URL}/auth/logout`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${auth.accessToken}`,
                      "Content-Type": "application/json",
                    },
                  });
                } catch (error) {
                  // Even if the backend logout fails, clear local state so UI returns to logged-out mode.
                }

                await endSession();
                setAuth(null);
                setEvents([]);
                setDataset(null);
                setSessionHistory([]);
                setFeatures([]);
                setRiskScores([]);
                setRiskResult(null);
                setAuthMode("login");
                setStatus("Logged out. Please login to start a new session.");
              }}
              isSubmitting={isSubmitting}
            />

            <SessionCard
              auth={auth}
              isCapturing={isCapturing}
              setIsCapturing={setIsCapturing}
              onFetchDataset={fetchTelemetryDataset}
              onRefreshTelemetry={refreshTelemetry}
              onRefreshHistory={refreshSessionHistory}
              onEndSession={endSession}
            />

            <RiskEngineCard
              auth={auth}
              riskResult={riskResult}
              onGenerateFeatures={generateAndLoadFeatures}
              onCalculateRisk={calculateAndLoadRisk}
              onRefreshFeatures={refreshFeatures}
              onRefreshRisk={refreshRiskScores}
              onExportCsv={downloadTrainingCsv}
              onPredict={runPrediction}
            />

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">ML training summary</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(featureSummary).map(([label, value]) => (
                  <div key={label} className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">API status</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{status}</p>
              <p className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                API target: {API_URL}
              </p>
            </div>
          </aside>

          <section className="space-y-6">
            <BehaviourFlow
              auth={auth}
              isCapturing={isCapturing}
              metrics={metrics}
              events={events}
              captureMouseMove={captureMouseMove}
              captureMouseClick={captureMouseClick}
              captureTouchMove={captureTouchMove}
              onScroll={(scrollTop, scrollHeight) => {
                bufferedMoveRef.current.scroll = {
                  scrollTop,
                  scrollHeight,
                  timestamp: Date.now(),
                };
                enqueueBufferedTelemetry();
              }}
            />

            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <EventTable events={events} />
              <DatasetPanel dataset={dataset} />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-950">Prediction flow</h2>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <p>1. Login creates a session record.</p>
                  <p>2. Frontend captures keyboard, mouse, scroll, and idle telemetry.</p>
                  <p>3. Backend stores telemetry, features, predictions, and risk scores.</p>
                  <p>4. Adaptive decisioning uses LOW, MEDIUM, and HIGH risk levels.</p>
                </div>
              </div>

              <RiskPanel scores={riskScores} />
              <SessionHistoryPanel sessions={sessionHistory} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">Latest risk</h2>
              <RiskBadge risk={riskResult} />
            </div>

            <MlPredictionPanel prediction={mlPrediction} />
          </section>
        </section>
      </div>
    </main>
  );
}

function AuthCard({
  auth,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  onLogout,
  isSubmitting,
}: {
  auth: AuthResponse | null;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onLogout: () => Promise<void> | void;
  isSubmitting: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {auth ? (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Signed in</h2>
              <p className="mt-1 text-sm text-slate-600">{auth.user.email}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Active session
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={isSubmitting}
            className="h-11 w-full rounded-md bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Working..." : "Logout"}
          </button>
        </>
      ) : (
        <>
          <div className="mb-4 flex rounded-md bg-slate-100 p-1">
            {(["login", "register"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAuthMode(mode)}
                className={`h-10 flex-1 rounded-md text-sm font-semibold transition ${authMode === mode ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}
                `}
              >
                {mode === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-blue-500 transition focus:ring-2"
                type="email"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-blue-500 transition focus:ring-2"
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting
                ? "Working..."
                : authMode === "login"
                  ? "Create session"
                  : "Register and login"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function SessionCard({
  auth,
  isCapturing,
  setIsCapturing,
  onFetchDataset,
  onRefreshTelemetry,
  onRefreshHistory,
  onEndSession,
}: {
  auth: AuthResponse | null;
  isCapturing: boolean;
  setIsCapturing: (value: boolean | ((current: boolean) => boolean)) => void;
  onFetchDataset: () => void;
  onRefreshTelemetry: () => void;
  onRefreshHistory: () => void;
  onEndSession: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Session</h2>
          <p className="mt-1 text-sm text-slate-600">
            {auth ? auth.user.email : "No active session"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${isCapturing
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-600"
            }`}
        >
          {isCapturing ? "Live" : "Idle"}
        </span>
      </div>

      <p className="mt-3 break-all rounded-md bg-slate-50 p-3 text-xs text-slate-600">
        {auth?.sessionId ?? "Login creates the session id used by telemetry."}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIsCapturing((current) => !current)}
          disabled={!auth}
          className="h-10 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isCapturing ? "Pause" : "Record"}
        </button>
        <button
          type="button"
          onClick={onFetchDataset}
          disabled={!auth}
          className="h-10 rounded-md bg-slate-950 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Dataset
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRefreshTelemetry}
          disabled={!auth}
          className="h-10 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Telemetry
        </button>
        <button
          type="button"
          onClick={onRefreshHistory}
          disabled={!auth}
          className="h-10 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          History
        </button>
      </div>

      <button
        type="button"
        onClick={onEndSession}
        disabled={!auth}
        className="mt-2 h-10 w-full rounded-md bg-rose-700 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        End session
      </button>
    </div>
  );
}

function RiskEngineCard({
  auth,
  riskResult,
  onGenerateFeatures,
  onCalculateRisk,
  onRefreshFeatures,
  onRefreshRisk,
  onExportCsv,
  onPredict,
}: {
  auth: AuthResponse | null;
  riskResult: RiskScore | null;
  onGenerateFeatures: () => void;
  onCalculateRisk: () => void;
  onRefreshFeatures: () => void;
  onRefreshRisk: () => void;
  onExportCsv: () => void;
  onPredict: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Risk engine</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onGenerateFeatures}
          disabled={!auth}
          className="h-10 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Features
        </button>
        <button
          type="button"
          onClick={onCalculateRisk}
          disabled={!auth}
          className="h-10 rounded-md bg-slate-950 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Risk
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onRefreshFeatures}
          disabled={!auth}
          className="h-10 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Get features
        </button>
        <button
          type="button"
          onClick={onRefreshRisk}
          disabled={!auth}
          className="h-10 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Get risk
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onExportCsv}
          disabled={!auth}
          className="h-10 rounded-md border border-slate-300 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={onPredict}
          disabled={!auth}
          className="h-10 rounded-md bg-blue-700 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Predict
        </button>
      </div>
      <RiskBadge risk={riskResult} />
    </div>
  );
}

function BehaviourFlow({
  auth,
  isCapturing,
  metrics,
  events,
  captureMouseMove,
  captureMouseClick,
  captureTouchMove,
  onScroll,
}: {
  auth: AuthResponse | null;
  isCapturing: boolean;
  metrics: {
    totalEvents: number;
    keyboardEvents: number;
    mouseEvents: number;
    scrollEvents: number;
    touchEvents: number;
    idleEvents: number;
  };
  events: StoredEvent[];
  captureMouseMove: (event: MouseEvent<HTMLDivElement>) => void;
  captureMouseClick: (event: MouseEvent<HTMLDivElement>) => void;
  captureTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  onScroll: (scrollTop: number, scrollHeight: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Behaviour flow</h2>
          <p className="text-sm text-slate-600">
            Move, click, scroll, or type inside the panel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(eventStyles).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {type.replace("_", " ")}
            </span>
          ))}
        </div>
      </div>

      <div
        tabIndex={0}
        onMouseMove={captureMouseMove}
        onMouseDown={captureMouseClick}
        onTouchMove={captureTouchMove}
        onScroll={(event) => {
          onScroll(event.currentTarget.scrollTop, event.currentTarget.scrollHeight);
        }}



        className="relative h-[430px] overflow-auto bg-[radial-gradient(circle_at_1px_1px,#cbd5e1_1px,transparent_0)] bg-[length:22px_22px] outline-none"

      >
        <div className="min-h-[760px] p-5">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="h-36 rounded-md border border-slate-200 bg-slate-50 p-5">
                <div className="h-4 w-32 rounded bg-blue-700" />
                <div className="mt-5 h-3 w-3/4 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-2/3 rounded bg-slate-200" />
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="h-12 rounded-md bg-emerald-100" />
                  <div className="h-12 rounded-md bg-blue-100" />
                  <div className="h-12 rounded-md bg-amber-100" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <MiniBar label="Dwell" value={78} />
                <MiniBar label="Flight" value={52} />
                <MiniBar label="Mouse" value={88} />
              </div>
            </div>

            <div className="rounded-lg bg-blue-700 p-5 text-white shadow-sm">
              <p className="text-sm font-medium text-blue-100">Total recordings</p>
              <p className="mt-3 text-4xl font-semibold tracking-normal">
                {metrics.totalEvents}
              </p>
              <p className="mt-2 text-sm text-blue-100">
                Session events stored and mirrored locally
              </p>
              <p className="mt-6 text-sm text-blue-100">
                Session status: {auth ? (isCapturing ? "capturing" : "paused") : "not authenticated"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ChartPanel metrics={metrics} />
            <Heatmap events={events} />
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-950">Continuous signal</h3>
            <SignalLine events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2 flex h-20 items-end rounded-md bg-slate-100 p-2">
        <div className="mt-auto w-full rounded bg-blue-500" style={{ height: `${value}%` }} />
      </div>
    </div>
  );
}

function ChartPanel({ metrics }: { metrics: { keyboardEvents: number; mouseEvents: number; scrollEvents: number; touchEvents: number } }) {
  const bars = [
    ["Keyboard", metrics.keyboardEvents, "bg-emerald-500"],
    ["Mouse", metrics.mouseEvents, "bg-blue-500"],
    ["Scroll", metrics.scrollEvents, "bg-amber-500"],
    ["Touch", metrics.touchEvents, "bg-violet-500"],
  ] as const;
  const max = Math.max(...bars.map(([, value]) => value), 1);

  return (
    <div className="rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">Overview</h3>
      <div className="mt-5 flex h-48 items-end gap-4 border-b border-l border-slate-200 px-3">
        {bars.map(([label, value, color]) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`w-full max-w-12 rounded-t ${color}`}
              style={{ height: `${Math.max((value / max) * 150, 8)}px` }}
            />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Heatmap({ events }: { events: StoredEvent[] }) {
  const points = events
    .filter((event) => ["mouse_move", "mouse_click", "touch_move"].includes(event.eventType))
    .slice(0, 36);

  return (
    <div className="relative min-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">Movement heatmap</h3>
      <div className="relative mt-5 h-48 rounded-md bg-slate-100">
        {points.map((event, index) => {
          const x = Number(event.payload.x ?? 40);
          const y = Number(event.payload.y ?? 40);
          const width = Number(event.payload.width ?? 600);
          const height = Number(event.payload.height ?? 430);
          const left = Math.min(Math.max((x / width) * 100, 2), 92);
          const top = Math.min(Math.max((y / height) * 100, 2), 86);

          return (
            <span
              key={`${event.createdAt}-${index}`}
              className={`absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm ${event.eventType === "mouse_click" ? "bg-rose-500" : "bg-blue-500"
                } opacity-40`}
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function SignalLine({ events }: { events: StoredEvent[] }) {
  const points = events.slice(0, 24).reverse();
  const path = points
    .map((event, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y =
        78 -
        (["keydown", "keyup"].includes(event.eventType)
          ? 28
          : event.eventType === "mouse_click"
            ? 48
            : event.eventType === "scroll"
              ? 18
              : 36);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 80" className="mt-4 h-32 w-full">
      <path d={path || "M 0 60 L 100 60"} fill="none" stroke="#2563eb" strokeWidth="2" />
      <path
        d={path || "M 0 60 L 100 60"}
        fill="none"
        stroke="#e11d48"
        strokeDasharray="4 4"
        strokeWidth="1.5"
        transform="translate(0 10)"
      />
    </svg>
  );
}

function DatasetPanel({ dataset }: { dataset: DatasetResponse | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Dataset output</h2>
      <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {dataset
          ? JSON.stringify(dataset, null, 2)
          : "Click Dataset after recording events to preview the first generated session dataset."}
      </pre>
    </div>
  );
}

function formatMetric(value: number | null, unit?: string) {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }

  const formatted = value >= 100 ? value.toFixed(0) : value.toFixed(1);
  return unit ? `${formatted} ${unit}` : formatted;
}
