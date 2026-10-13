import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import useResource from "../api/useResource";
import Button from "../components/Button";
import { Feedback, StatusBadge } from "../components/Feedback";
export default function EquipmentDetails() {
  const { id } = useParams(),
    { user } = useAuth();
  const { data: e, loading, error, reload } = useResource(`/equipment/${id}`);
  const [form, setForm] = useState({ quantity: 1, expected_return_date: "" });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [actionError, setActionError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      await api("/borrow-requests", {
        method: "POST",
        body: {
          ...form,
          quantity: Number(form.quantity),
          equipment_id: Number(id),
        },
      });
      setMessage(
        "Request submitted. Stock is reserved when an administrator approves it.",
      );
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function status(value) {
    if (
      !window.confirm(
        `Set this equipment to ${value.replaceAll("_", " ").toLowerCase()}?`,
      )
    )
      return;
    setBusy(true);
    setActionError("");
    try {
      await api(`/equipment/${id}/status`, {
        method: "PATCH",
        body: { status: value },
      });
      reload();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="text-sm text-indigo-600" to="/equipment">
        ← Equipment
      </Link>
      <Feedback
        loading={loading}
        error={error || actionError}
        success={message}
      />
      {e && (
        <>
          <div className="panel mt-5">
            <StatusBadge status={e.status} />
            <h1 className="page-title mt-4">{e.name}</h1>
            <p className="text-slate-500">
              {e.equipment_code} · {e.category_name}
            </p>
            <p className="my-5 whitespace-pre-wrap">
              {e.description || "No description provided."}
            </p>
            <p>Location: {e.location}</p>
            <p className="mt-2">
              Available stock: {e.available_quantity} / {e.total_quantity}
            </p>
          </div>
          {user.role === "admin" ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="action" to={`/admin/equipment/${id}/edit`}>
                Edit equipment
              </Link>
              {["AVAILABLE", "UNDER_MAINTENANCE", "ARCHIVED"]
                .filter((s) => s !== e.status)
                .map((s) => (
                  <Button
                    loading={busy}
                    key={s}
                    variant="secondary"
                    onClick={() => status(s)}
                  >
                    {s === "ARCHIVED"
                      ? "Archive"
                      : s === "AVAILABLE"
                        ? "Restore availability"
                        : "Start maintenance"}
                  </Button>
                ))}
            </div>
          ) : (
            <div className="panel mt-5">
              <h2 className="font-semibold">Request to borrow</h2>
              {e.status === "AVAILABLE" && e.available_quantity > 0 ? (
                <form
                  onSubmit={submit}
                  className="mt-4 flex flex-wrap items-end gap-4"
                >
                  <label>
                    Quantity
                    <input
                      className="field block mt-1"
                      type="number"
                      min="1"
                      max={e.available_quantity}
                      required
                      value={form.quantity}
                      onChange={(event) =>
                        setForm({ ...form, quantity: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Expected return date
                    <input
                      className="field block mt-1"
                      type="date"
                      required
                      min={new Date().toISOString().slice(0, 10)}
                      value={form.expected_return_date}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          expected_return_date: event.target.value,
                        })
                      }
                    />
                  </label>
                  <Button loading={busy} type="submit">
                    Submit request
                  </Button>
                </form>
              ) : (
                <p className="mt-3 text-slate-500">
                  This equipment is not available for borrowing.
                </p>
              )}
              <Link
                className="mt-5 inline-block text-sm text-indigo-600"
                to={`/report?equipment=${id}`}
              >
                Report an issue
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
