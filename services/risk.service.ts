import { apiRequest } from "@/lib/api";
import type { RiskScore, FeatureSet } from "@/types/telemetry";

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