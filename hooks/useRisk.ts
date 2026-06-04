"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

export function useRisk(auth: { accessToken: string } | null) {
  const [current, setCurrent] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);

  const calculate = async () => {
    if (!auth) return;

    const res = await apiRequest<any>("/risk/calculate", auth.accessToken, {
      method: "POST",
      body: JSON.stringify({}),
    });

    setCurrent(res);
    setScores((prev) => [res, ...prev]);
  };

  const refresh = async () => {
    if (!auth) return;

    const res = await apiRequest<any[]>("/risk", auth.accessToken);
    setScores(res);
    setCurrent(res[0] ?? null);
  };

  return { current, scores, calculate, refresh };
}