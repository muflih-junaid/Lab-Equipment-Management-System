import { Link } from "react-router-dom";
import { useAuth } from "../auth/context";
import useResource from "../api/useResource";
import { Feedback, StatusBadge } from "../components/Feedback";
export default function Dashboard() {
  const { user } = useAuth();
  const admin = user.role === "admin";
  const { data, loading, error, reload } = useResource(
    admin ? "/dashboard/stats" : "/borrow-requests/me",
  );
  const stats = admin
    ? Object.entries(data || {}).filter(([key]) => key !== "recent_activity")
    : [
        [
          "Pending requests",
          data?.filter((r) => r.status === "PENDING").length || 0,
        ],
        [
          "Currently borrowed",
          data?.filter((r) =>
            ["BORROWED", "RETURN_REQUESTED"].includes(r.status),
          ).length || 0,
        ],
        ["Overdue", data?.filter((r) => r.is_overdue).length || 0],
      ];
  return (
    <>
      <h1 className="page-title">
        {admin ? "Lab overview" : `Welcome, ${user.name.split(" ")[0]}`}
      </h1>
      <p className="page-subtitle">
        {admin
          ? "Inventory, borrowing and maintenance at a glance."
          : "Find equipment and keep track of your lab work."}
      </p>
      <Feedback loading={loading} error={error} />
      {error && <button onClick={reload}>Retry</button>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <div className="panel" key={label}>
            <p className="text-sm capitalize text-slate-500">
              {label.replaceAll("_", " ")}
            </p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="panel mt-6">
        <h2 className="font-semibold">
          {admin ? "Recent borrowing activity" : "Ready for your next project?"}
        </h2>
        {admin ? (
          data?.recent_activity.map((r) => (
            <div
              key={r.id}
              className="flex justify-between border-b py-3 text-sm"
            >
              <span>
                #{r.id} · {r.equipment_name}
              </span>
              <StatusBadge status={r.status} />
            </div>
          ))
        ) : (
          <Link className="mt-3 inline-block text-indigo-600" to="/equipment">
            Browse available equipment →
          </Link>
        )}
      </div>
      {admin && (
        <p className="mt-4 text-xs text-slate-500">
          Available and borrowed statistics count units. Total and maintenance
          equipment count catalogue entries.
        </p>
      )}
    </>
  );
}
