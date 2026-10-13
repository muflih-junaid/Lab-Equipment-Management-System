export function StatusBadge({ status }) {
  const colors = ["AVAILABLE", "RETURNED", "RESOLVED"].includes(status)
    ? "bg-emerald-100 text-emerald-800"
    : ["REJECTED", "OVERDUE", "ARCHIVED"].includes(status)
      ? "bg-rose-100 text-rose-800"
      : "bg-indigo-100 text-indigo-800";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${colors}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
export function Feedback({ loading, error, success }) {
  return (
    <>
      {loading && (
        <p role="status" className="my-4 text-slate-500">
          Loading…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="my-4 rounded-lg bg-rose-50 p-3 text-rose-700"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="my-4 rounded-lg bg-emerald-50 p-3 text-emerald-700"
        >
          {success}
        </p>
      )}
    </>
  );
}
export function EmptyState({ children = "No records to display." }) {
  return (
    <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">
      {children}
    </p>
  );
}
