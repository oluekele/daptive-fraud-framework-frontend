import React from "react";

type MlPrediction = {
  sessionId: string;
  mlPrediction: string;
  confidence: number;
  probabilities: {
    legitimate: number;
    suspicious: number;
  };
  score: number;
  level: string;
  predictionId: string;
};

export default function MlPredictionPanel({
  prediction,
}: {
  prediction: MlPrediction | null;
}) {
  if (!prediction) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Latest ML prediction</h2>
        <p className="mt-2 text-sm text-slate-600">
          Run prediction to display results.
        </p>
      </div>
    );
  }

  const level = (prediction.level ?? "").toLowerCase();
  const badgeClass =
    level === "critical"
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : level === "high"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : level === "medium"
          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
          : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Latest ML prediction
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Session: {prediction.sessionId}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}
        >
          {prediction.level}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Prediction
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {prediction.mlPrediction}
          </p>
        </div>

        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Confidence
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {(prediction.confidence * 100).toFixed(1)}%
          </p>
        </div>

        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Score
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {prediction.score.toFixed(1)}
          </p>
        </div>

        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Prediction ID
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-950">
            {prediction.predictionId}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Class probabilities
        </p>

        <div className="mt-2 space-y-2">
          <ProbabilityBar
            label="Legitimate"
            value={prediction.probabilities.legitimate ?? 0}
            color="bg-emerald-500"
          />
          <ProbabilityBar
            label="Suspicious"
            value={prediction.probabilities.suspicious ?? 0}
            color="bg-rose-500"
          />
        </div>
      </div>
    </div>
  );
}

function ProbabilityBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold text-slate-950">{pct.toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-2 w-full rounded bg-slate-200">
        <div
          className={`h-2 rounded ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

