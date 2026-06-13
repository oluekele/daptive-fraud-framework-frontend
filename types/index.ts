export type AuthMode = "login" | "register";

export type TelemetryType =
  | "keydown"
  | "keyup"
  | "mouse_move"
  | "mouse_click"
  | "scroll"
  | "touch_move"
  | "idle_activity";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type DecisionType = "allow" | "otp" | "block";

export type StoredEvent = {
  id?: string;
  sessionId?: string;
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
    idleEvents?: number;
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
  avgMouseAcceleration?: number | null;
  clickFrequency?: number | null;
  avgScrollRate: number | null;
  idleTime?: number | null;
  typingSpeed: number | null;
  createdAt: string;
};

export type TrainingRecord = {
  session_id: string;
  duration_seconds: number | null;
  mouse_moves: number;
  mouse_clicks: number;
  scroll_events: number;
  keyboard_events: number;
  avg_mouse_speed: number | null;
  max_mouse_speed: number | null;
  avg_scroll_speed: number | null;
  scroll_direction_changes: number;
  idle_time_seconds: number;
  keystrokes_per_second: number | null;
  mouse_distance: number;
  click_rate: number | null;
  event_rate: number | null;
  risk_label: "legitimate" | "suspicious" | "unknown";
};

export type Prediction = {
  id: string;
  sessionId: string;
  featureId?: string | null;
  modelName: string;
  fraudProbability: number;
  anomalyScore?: number | null;
  reasons?: Record<string, unknown> | null;
  createdAt: string;
};

export type RiskScore = {
  id: string;
  sessionId: string;
  score: number;
  level: RiskLevel | string;
  createdAt: string;
  predictionId?: string | null;
  prediction?: Prediction;
  features?: FeatureSet;
};

export type DecisionLog = {
  id: string;
  sessionId: string;
  predictionId?: string | null;
  riskScoreId?: string | null;
  decision: DecisionType | string;
  reason?: string | null;
  createdAt: string;
};

export type FeatureExtractionStats = {
  dwellTime: string;
  flightTime: string;
  typingSpeed: string;
  mouseVelocity: string;
  mouseAcceleration: string;
  clickFrequency: string;
  scrollRate: string;
  idleTime: string;
};
