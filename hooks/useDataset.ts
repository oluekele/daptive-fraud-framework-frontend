"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

export function useDataset(auth: { accessToken: string } | null) {
  const [data, setData] = useState<any>(null);

  const fetch = async () => {
    if (!auth) return;

    const res = await apiRequest<any>("/telemetry/dataset", auth.accessToken);
    setData(res);
  };

  return { data, fetch };
}