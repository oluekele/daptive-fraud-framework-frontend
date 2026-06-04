// type RiskScore = {
//   id: string;
//   sessionId: string;
//   score: number;
//   level: string;
//   createdAt: string;
// };

import { RiskScore } from "@/types/telemetry";

export default function RiskBadge({
  risk,
}: {
  risk: RiskScore | null;
}) {
  const level = risk?.level ?? "none";

  const color =
    level === "critical"
      ? "bg-red-100 text-red-700"
      : level === "high"
        ? "bg-rose-100 text-rose-700"
        : level === "medium"
          ? "bg-amber-100 text-amber-700"
          : level === "low"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-600";

  return (
    <div className="mt-3 rounded-md bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">
          Latest level
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}
        >
          {level}
        </span>
      </div>

      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {risk ? Math.round(risk.score) : "--"}
      </p>
    </div>
  );
}