import { apiRequest } from "@/lib/api";
import type { DatasetResponse, StoredEvent, TelemetryType } from "@/types";

type TelemetryPayload = Record<string, unknown>;

export function sendTelemetry(
  token: string,
  eventType: TelemetryType,
  payload: TelemetryPayload,
) {
  return apiRequest<StoredEvent>("/telemetry", token, {
    method: "POST",
    body: JSON.stringify({ eventType, payload }),
  });
}

export function getTelemetry(token: string) {
  return apiRequest<StoredEvent[]>("/telemetry", token, {
    method: "GET",
  });
}

export function getDataset(token: string) {
  return apiRequest<DatasetResponse>("/telemetry/dataset", token, {
    method: "GET",
  });
}
