export type AuthMode = "login" | "register";

export type TelemetryType =
  | "keydown"
  | "keyup"
  | "mouse_move"
  | "mouse_click"
  | "scroll"
  | "touch_move"
  | "idle_activity";


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
  user: {
    id: string;
    email: string;
  };
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
  userAgent?: string | null;
  ipAddress?: string | null;
  startedAt: string;
  endedAt?: string | null;
  _count?: {
    telemetry: number;
    riskScores: number;
    predictions: number;
  };
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
  level: "low" | "medium" | "high" | "critical" | string;
  createdAt: string;
  features?: FeatureSet;
};

