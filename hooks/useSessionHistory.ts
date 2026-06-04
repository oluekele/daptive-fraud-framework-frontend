"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

export function useSessionHistory(auth: { accessToken: string } | null) {
  const [data, setData] = useState<any[]>([]);

  const refresh = async () => {
    if (!auth) return;

    const res = await apiRequest<any[]>("/sessions/history", auth.accessToken, {
      method: "GET",
    });

    setData(res);
  };

  return { data, refresh };
}