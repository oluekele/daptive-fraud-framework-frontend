type StoredEvent = {
  id?: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

type Props = {
  events: StoredEvent[];
};

export default function EventTable({ events }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        Recent telemetry
      </h2>

      <div className="mt-4 max-h-80 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-white text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="border-b border-slate-200 py-2">Type</th>
              <th className="border-b border-slate-200 py-2">Payload</th>
              <th className="border-b border-slate-200 py-2">Time</th>
            </tr>
          </thead>

          <tbody>
            {events.slice(0, 18).map((event, index) => (
              <tr
                key={`${event.createdAt}-${index}`}
                className="border-b border-slate-100"
              >
                <td className="py-2 pr-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {event.eventType}
                  </span>
                </td>

                <td className="max-w-[280px] truncate py-2 pr-3 text-slate-600">
                  {JSON.stringify(event.payload)}
                </td>

                <td className="whitespace-nowrap py-2 text-slate-500">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {events.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No events recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}