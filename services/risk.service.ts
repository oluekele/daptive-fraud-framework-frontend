import { apiRequest, apiRequestText } from "@/lib/api";
import type { RiskScore, FeatureSet, TrainingRecord } from "@/types/telemetry";

/**
 * Generate features from current session telemetry
 */
export function generateFeatures(token: string) {
  return apiRequest<FeatureSet>(
    "/features/generate",
    token,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

/**
 * Get stored feature sets
 */
export function getFeatures(token: string) {
  return apiRequest<FeatureSet[]>(
    "/features",
    token,
    {
      method: "GET",
    }
  );
}

/**
 * Get the flattened ML-ready training summary for the active session
 */
export function getTrainingSummary(token: string) {
  return apiRequest<TrainingRecord>(
    "/features/training-summary",
    token,
    {
      method: "GET",
    }
  );
}

/**
 * Get flattened ML-ready training summaries for all sessions
 */
export function getTrainingSummaries(token: string) {
  return apiRequest<TrainingRecord[]>(
    "/features/training-summary/all",
    token,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

/**
 * Calculate current session risk score
 */
export function calculateRisk(token: string) {
  return apiRequest<RiskScore>(
    "/risk/calculate",
    token,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

/**
 * Get historical risk scores
 */
export function getRiskScores(token: string) {
  return apiRequest<RiskScore[]>(
    "/risk",
    token,
    {
      method: "GET",
    }
  );
}

/**
 * Export training data as CSV for external modeling workflows
 */
export function exportTrainingCsv(token: string, onlyLabeled = false) {
  return apiRequestText(
    `/features/export/csv?onlyLabeled=${onlyLabeled}`,
    token,
    {
      method: "GET",
    }
  );
}

/**
 * Run a prediction for the current session through the backend risk pipeline
 */
export function predictSession(token: string) {
  // Backend expects POST /predict/ml and uses the active session from JWT.
  // No request body is required.
  return apiRequest<Record<string, unknown>>(
    "/predict/ml",
    token,
    {
      method: "POST",
    }
  );
}


