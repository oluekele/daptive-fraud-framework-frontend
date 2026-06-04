import { SessionSummary } from '@/types/telemetry';
import React from 'react'

const SessionHistoryPanel = ({ sessions }: { sessions: SessionSummary[] }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Session history</h2>
      <div className="mt-4 max-h-56 space-y-3 overflow-auto">
        {sessions.slice(0, 8).map((session) => (
          <div key={session.id} className="rounded-md bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-950">
                {session.id}
              </p>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${session.endedAt
                  ? "bg-slate-200 text-slate-600"
                  : "bg-emerald-100 text-emerald-700"
                  }`}
              >
                {session.endedAt ? "Ended" : "Active"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {new Date(session.startedAt).toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Telemetry: {session._count?.telemetry ?? 0} / Risk:{" "}
              {session._count?.riskScores ?? 0}
            </p>
          </div>
        ))}
        {sessions.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">
            Load history after logging in.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default SessionHistoryPanel