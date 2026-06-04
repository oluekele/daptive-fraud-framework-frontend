"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

export function useFeatures(auth: { accessToken: string } | null) {
  const [data, setData] = useState<any[]>([]);

  const generate = async () => {
    if (!auth) return;

    const res = await apiRequest<any>("/features/generate", auth.accessToken, {
      method: "POST",
      body: JSON.stringify({}),
    });

    setData((prev) => [res, ...prev]);
  };

  const refresh = async () => {
    if (!auth) return;

    const res = await apiRequest<any[]>("/features", auth.accessToken);
    setData(res);
  };

  return { data, generate, refresh };
}