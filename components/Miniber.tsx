type Props = {
  label: string;
  value: number;
};

export default function MiniBar({ label, value }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="mt-2 h-20 rounded-md bg-slate-100 p-2">
        <div
          className="mt-auto rounded bg-blue-500"
          style={{ height: `${value}%` }}
        />
      </div>
    </div>
  );
}