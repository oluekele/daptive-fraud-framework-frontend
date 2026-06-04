import { apiRequest } from "@/lib/api";

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  sessionId: string;
  user: {
    id: string;
    email: string;
  };
};

export async function login(email: string, password: string) {
  return apiRequest<AuthResponse>(
    "/auth/login",
    undefined,
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function register(email: string, password: string) {
  return apiRequest<{ id: string; email: string }>(
    "/auth/register",
    undefined,
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
}