'use client'

import { apiRequest } from "@/lib/api";
import { AuthResponse } from "@/types/telemetry";
import { useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [status, setStatus] = useState("");

  const login = async (email: string, password: string) => {
    const res = await apiRequest<AuthResponse>("/auth/login", undefined, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setUser(res);
  };

  const endSession = async () => {
    if (!user) return;

    await apiRequest("/sessions/current/end", user.accessToken, {
      method: "PATCH",
    });

    setUser(null);
  };

  return {
    user,
    status,
    login,
    endSession,
  };
}