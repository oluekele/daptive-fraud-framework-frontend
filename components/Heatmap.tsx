import type { StoredEvent } from "@/types/telemetry";

const Heatmap = ({ events }: { events: StoredEvent[] }) => {
  const points = events
    .filter((event) =>
      ["mouse_move", "mouse_click", "touch_move"].includes(event.eventType)
    )
    .slice(0, 36);

  return (
    <div className="relative min-h-64 overflow-hidden rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-950">
        Movement heatmap
      </h3>

      <div className="relative mt-5 h-48 rounded-md bg-slate-100">
        {points.map((event, index) => {
          const x = Number(event.payload.x ?? 40);
          const y = Number(event.payload.y ?? 40);
          const width = Number(event.payload.width ?? 600);
          const height = Number(event.payload.height ?? 430);

          const left = Math.min(Math.max((x / width) * 100, 2), 92);
          const top = Math.min(Math.max((y / height) * 100, 2), 86);

          return (
            <span
              key={`${event.createdAt}-${index}`}
              className={`absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm ${event.eventType === "mouse_click"
                ? "bg-rose-500"
                : "bg-blue-500"
                } opacity-40`}
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Heatmap;