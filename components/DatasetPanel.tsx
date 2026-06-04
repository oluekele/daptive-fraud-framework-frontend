export default function DatasetPanel({
  dataset,
}: {
  dataset: unknown;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        Dataset output
      </h2>

      <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {dataset
          ? JSON.stringify(dataset, null, 2)
          : "No dataset loaded"}
      </pre>
    </div>
  );
}