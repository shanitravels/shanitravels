export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-7 w-40 rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
