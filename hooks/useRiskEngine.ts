"use client";

import { useState } from "react";
import type { RiskScore, FeatureSet } from "@/types/telemetry";
import * as riskService from "@/services/risk.service";

export function useRiskEngine(token: string | null) {
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [riskHistory, setRiskHistory] = useState<RiskScore[]>([]);
  const [features, setFeatures] = useState<FeatureSet[]>([]);

  async function generate() {
    if (!token) return;

    const feature = await riskService.generateFeatures(token);
    setFeatures((prev) => [feature, ...prev]);
    return feature;
  }

  async function calculate() {
    if (!token) return;

    const score = await riskService.calculateRisk(token);
    setRisk(score);
    setRiskHistory((prev) => [score, ...prev]);
    return score;
  }

  async function loadRiskHistory() {
    if (!token) return;

    const data = await riskService.getRiskScores(token);
    setRiskHistory(data);
    setRisk(data[0] ?? null);
  }

  async function loadFeatures() {
    if (!token) return;

    const data = await riskService.getFeatures(token);
    setFeatures(data);
  }

  return {
    risk,
    riskHistory,
    features,
    generate,
    calculate,
    loadRiskHistory,
    loadFeatures,
  };
}