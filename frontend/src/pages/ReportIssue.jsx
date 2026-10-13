import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client";
import useResource from "../api/useResource";
import Button from "../components/Button";
import { Feedback } from "../components/Feedback";
export default function ReportIssue() {
  const [params] = useSearchParams(),
    equipment = useResource("/equipment");
  const [form, setForm] = useState({
    equipment_id: params.get("equipment") || "",
    issue_description: "",
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api("/maintenance", {
        method: "POST",
        body: { ...form, equipment_id: Number(form.equipment_id) },
      });
      setSuccess("Issue reported. Lab staff will review it.");
      setForm({ ...form, issue_description: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-title">Report an equipment issue</h1>
      <p className="page-subtitle">
        Describe the fault clearly. Stop using equipment that may be unsafe.
      </p>
      <Feedback
        loading={equipment.loading}
        error={error || equipment.error}
        success={success}
      />
      <form className="panel max-w-2xl space-y-5" onSubmit={submit}>
        <label className="block">
          Equipment
          <select
            required
            className="field block w-full mt-2"
            value={form.equipment_id}
            onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
          >
            <option value="">Choose equipment</option>
            {equipment.data
              ?.filter((e) => e.is_active)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.equipment_code} · {e.name}
                </option>
              ))}
          </select>
        </label>
        <label className="block">
          Issue description
          <textarea
            className="field block w-full mt-2"
            required
            maxLength="5000"
            rows="5"
            value={form.issue_description}
            onChange={(e) =>
              setForm({ ...form, issue_description: e.target.value })
            }
          />
        </label>
        <Button loading={busy}>Submit report</Button>
      </form>
      <Link className="mt-5 inline-block text-indigo-600" to="/maintenance">
        View my reports
      </Link>
    </>
  );
}
