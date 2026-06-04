type Metrics = {
  totalEvents: number;
  keyboardEvents: number;
  mouseEvents: number;
  scrollEvents: number;
  touchEvents: number;
};

export default function ChartPanel({
  metrics,
}: {
  metrics: Metrics;
}) {
  const bars = [
    ["Keyboard", metrics.keyboardEvents, "bg-emerald-500"],
    ["Mouse", metrics.mouseEvents, "bg-blue-500"],
    ["Scroll", metrics.scrollEvents, "bg-amber-500"],
    ["Touch", metrics.touchEvents, "bg-violet-500"],
  ] as const;

  const max = Math.max(...bars.map(([, value]) => value), 1);

  return (
    <div className="rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">
        Overview
      </h3>

      <div className="mt-5 flex h-48 items-end gap-4 border-b border-l border-slate-200 px-3">
        {bars.map(([label, value, color]) => (
          <div
            key={label}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div
              className={`w-full max-w-12 rounded-t ${color}`}
              style={{
                height: `${Math.max((value / max) * 150, 8)}px`,
              }}
            />

            <span className="text-xs text-slate-500">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}