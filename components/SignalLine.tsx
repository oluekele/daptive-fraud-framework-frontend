type StoredEvent = {
  eventType: string;
};

export default function SignalLine({
  events,
}: {
  events: StoredEvent[];
}) {
  const points = events.slice(0, 24).reverse();

  const path = points
    .map((event, index) => {
      const x =
        (index / Math.max(points.length - 1, 1)) * 100;

      const y =
        78 -
        (["keydown", "keyup"].includes(event.eventType)
          ? 28
          : event.eventType === "mouse_click"
            ? 48
            : event.eventType === "scroll"
              ? 18
              : 36);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 80" className="mt-4 h-32 w-full">
      <path
        d={path || "M 0 60 L 100 60"}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
      />

      <path
        d={path || "M 0 60 L 100 60"}
        fill="none"
        stroke="#e11d48"
        strokeDasharray="4 4"
        strokeWidth="1.5"
        transform="translate(0 10)"
      />
    </svg>
  );
}