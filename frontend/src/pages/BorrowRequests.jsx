import { useState } from "react";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import useResource from "../api/useResource";
import Button from "../components/Button";
import { Feedback, EmptyState, StatusBadge } from "../components/Feedback";
export default function BorrowRequests({ mode = "all" }) {
  const { user } = useAuth(),
    admin = user.role === "admin";
  const { data, loading, error, reload } = useResource(
    admin ? "/borrow-requests" : "/borrow-requests/me",
  );
  const [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(""),
    [success, setSuccess] = useState("");
  const rows = (data || []).filter((r) =>
    mode === "overdue"
      ? r.is_overdue
      : mode === "borrowed"
        ? ["BORROWED", "RETURN_REQUESTED"].includes(r.status)
        : true,
  );
  function actionsFor(request) {
    if (!admin) {
      if (["PENDING", "APPROVED"].includes(request.status)) return ["cancel"];
      if (request.status === "BORROWED") return ["return"];
      return [];
    }
    switch (request.status) {
      case "PENDING":
        return ["approve", "reject"];
      case "APPROVED":
        return ["borrow", "cancel"];
      case "BORROWED":
      case "RETURN_REQUESTED":
        return ["return"];
      default:
        return [];
    }
  }
  function actionLabel(name) {
    if (name === "borrow") return "Check out";
    if (name === "return") return admin ? "Confirm return" : "Request return";
    return name[0].toUpperCase() + name.slice(1);
  }
  async function action(r, name) {
    if (!window.confirm(`${actionLabel(name)} for request #${r.id}?`)) return;
    setBusy(true);
    setActionError("");
    setSuccess("");
    try {
      const result = await api(`/borrow-requests/${r.id}/${name}`, {
        method: "PATCH",
      });
      setSuccess(result.message);
      reload();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-title">
        {mode === "overdue"
          ? "Overdue equipment"
          : mode === "borrowed"
            ? "Borrowed equipment"
            : admin
              ? "Borrow requests"
              : "My borrow requests"}
      </h1>
      <p className="page-subtitle">
        Approval reserves stock. An administrator records checkout and verifies
        returns at the lab. Request a return here, then bring the equipment to
        lab staff.
      </p>
      <Feedback
        loading={loading}
        error={error || actionError}
        success={success}
      />
      {error && <button onClick={reload}>Retry</button>}
      {!loading && !rows.length ? (
        <EmptyState />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request</th>
                {admin && <th>Student</th>}
                <th>Equipment</th>
                <th>Qty</th>
                <th>Due date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  {admin && <td>{r.user_name}</td>}
                  <td>{r.equipment_name}</td>
                  <td>{r.quantity}</td>
                  <td>{r.expected_return_date}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge status={r.status} />
                      {Boolean(r.is_overdue) && (
                        <StatusBadge status="OVERDUE" />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {actionsFor(r).map((name) => (
                        <Button
                          key={name}
                          loading={busy}
                          variant="secondary"
                          onClick={() => action(r, name)}
                        >
                          {actionLabel(name)}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
