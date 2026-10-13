import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/context";
import useResource from "../api/useResource";
import { Feedback, EmptyState, StatusBadge } from "../components/Feedback";
export default function Equipment() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    available: false,
  });
  const categories = useResource("/categories");
  const query = new URLSearchParams({
    ...filters,
    available: String(filters.available),
  });
  const { data, loading, error, reload } = useResource(`/equipment?${query}`);
  function change(e) {
    setFilters({
      ...filters,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  }
  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="page-title">Equipment catalogue</h1>
        {user.role === "admin" && (
          <Link className="action" to="/admin/equipment/new">
            Add equipment
          </Link>
        )}
      </div>
      <p className="page-subtitle">
        Search the lab inventory and check availability.
      </p>
      <div className="panel mb-6 flex flex-wrap gap-3">
        <input
          className="field flex-1"
          aria-label="Search equipment"
          name="search"
          placeholder="Search by name or code"
          value={filters.search}
          onChange={change}
        />
        <select
          className="field"
          aria-label="Category"
          name="category"
          value={filters.category}
          onChange={change}
        >
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="field"
          aria-label="Status"
          name="status"
          value={filters.status}
          onChange={change}
        >
          <option value="">All statuses</option>
          {[
            "AVAILABLE",
            "UNDER_MAINTENANCE",
            ...(user.role === "admin" ? ["ARCHIVED"] : []),
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="available"
            checked={filters.available}
            onChange={change}
          />
          Available only
        </label>
      </div>
      <Feedback loading={loading} error={error || categories.error} />
      {error && <button onClick={reload}>Retry</button>}
      {data?.length === 0 && (
        <EmptyState>No equipment matches these filters.</EmptyState>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((e) => (
          <article className="panel" key={e.id}>
            <div className="mb-4 flex justify-between gap-2">
              <span className="text-xs text-slate-500">{e.equipment_code}</span>
              <StatusBadge status={e.status} />
            </div>
            <h2 className="font-semibold text-lg">{e.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {e.category_name} · {e.location}
            </p>
            <p className="my-4 text-sm">
              {e.available_quantity} of {e.total_quantity} units available
            </p>
            <Link
              className="text-sm font-medium text-indigo-600"
              to={`/equipment/${e.id}`}
            >
              View details →
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
