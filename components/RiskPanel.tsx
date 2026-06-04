import { RiskScore } from '@/types/telemetry';
import React from 'react'

const RiskPanel = ({ scores }: { scores: RiskScore[] }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Risk scores</h2>
      <div className="mt-4 max-h-56 space-y-3 overflow-auto">
        {scores.slice(0, 8).map((score) => (
          <div
            key={score.id}
            className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3"
          >
            <div>
              <p className="text-sm font-semibold capitalize text-slate-950">
                {score.level}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(score.createdAt).toLocaleString()}
              </p>
            </div>
            <span className="text-lg font-semibold text-slate-950">
              {Math.round(score.score)}
            </span>
          </div>
        ))}
        {scores.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">
            Calculate risk to store the first score.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default RiskPanel