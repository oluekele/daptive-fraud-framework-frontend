import { FeatureSet } from "@/types/telemetry";


const FeaturePanel = ({ features }: { features: FeatureSet[] }) => {
  const latest = features[0] ?? null;
  const rows = latest
    ? [
      ["Dwell", latest.avgDwellTime, "ms"],
      ["Flight", latest.avgFlightTime, "ms"],
      ["Mouse speed", latest.avgMouseSpeed, "px/s"],
      ["Scroll rate", latest.avgScrollRate, "px/s"],
      ["Typing", latest.typingSpeed, "keys/min"],
    ]
    : [];

  function formatMetric(value: number | null) {
    if (value === null || !Number.isFinite(value)) {
      return "--";
    }

    return value >= 100 ? value.toFixed(0) : value.toFixed(1);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        Feature extraction
      </h2>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value, unit]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">{label}</span>
            <span className="text-sm font-semibold text-slate-950">
              {formatMetric(value as number | null)} {unit}
            </span>
          </div>
        ))}
        {!latest ? (
          <p className="py-6 text-sm text-slate-500">
            Generate features after recording telemetry.
          </p>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Stored feature rows: {features.length}
      </p>
    </div>
  );
}

export default FeaturePanel