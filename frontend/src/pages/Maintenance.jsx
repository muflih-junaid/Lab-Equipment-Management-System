import { useState } from "react";
import { useAuth } from "../auth/context";
import { api } from "../api/client";
import useResource from "../api/useResource";
import Button from "../components/Button";
import { Feedback, EmptyState, StatusBadge } from "../components/Feedback";
export default function Maintenance() {
  const { user } = useAuth(),
    admin = user.role === "admin";
  const { data, loading, error, reload } = useResource(
    admin ? "/maintenance" : "/maintenance/me",
  );
  const [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(""),
    [success, setSuccess] = useState("");
  const [selected, setSelected] = useState(null),
    [resolution, setResolution] = useState("");
  async function update(report, resolve) {
    setBusy(true);
    setActionError("");
    setSuccess("");
    try {
      const result = await api(
        `/maintenance/${report.id}/${resolve ? "resolve" : "status"}`,
        {
          method: "PATCH",
          body: resolve ? { resolution } : { status: "IN_PROGRESS" },
        },
      );
      setSuccess(result.message);
      setSelected(null);
      setResolution("");
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
        {admin ? "Maintenance management" : "My maintenance reports"}
      </h1>
      <p className="page-subtitle">
        Starting maintenance blocks new approvals and checkouts for the whole
        equipment entry.
      </p>
      <Feedback
        loading={loading}
        error={error || actionError}
        success={success}
      />
      {error && <button onClick={reload}>Retry</button>}
      {data?.length === 0 && <EmptyState />}
      <div className="grid gap-4">
        {data?.map((r) => (
          <article key={r.id} className="panel">
            <div className="flex justify-between gap-4">
              <h2 className="font-semibold">
                #{r.id} · {r.equipment_name}
              </h2>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {r.reporter_name} · {r.reported_at}
            </p>
            <p className="my-4 whitespace-pre-wrap">{r.issue_description}</p>
            {r.resolution && (
              <p className="text-sm text-emerald-700">
                Resolution: {r.resolution}
              </p>
            )}
            {admin && r.status !== "RESOLVED" && (
              <div className="flex gap-3">
                {r.status === "OPEN" && (
                  <Button
                    loading={busy}
                    variant="secondary"
                    onClick={() => update(r, false)}
                  >
                    Start maintenance
                  </Button>
                )}
                <Button loading={busy} onClick={() => setSelected(r)}>
                  Resolve report
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolve-title"
        >
          <form
            className="panel w-full max-w-lg"
            onSubmit={(e) => {
              e.preventDefault();
              update(selected, true);
            }}
          >
            <h2 id="resolve-title" className="font-semibold">
              Resolve report #{selected.id}
            </h2>
            <label className="mt-4 block">
              Resolution
              <textarea
                autoFocus
                className="field mt-2 w-full"
                required
                maxLength="5000"
                rows="4"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </label>
            <Feedback error={actionError} />
            <div className="mt-4 flex gap-3">
              <Button loading={busy}>Confirm resolution</Button>
              <Button
                type="button"
                disabled={busy}
                variant="secondary"
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
