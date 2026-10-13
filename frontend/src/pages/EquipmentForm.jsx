import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import useResource from "../api/useResource";
import Button from "../components/Button";
import { Feedback } from "../components/Feedback";
export default function EquipmentForm() {
  const { id } = useParams(),
    navigate = useNavigate(),
    categories = useResource("/categories");
  const [form, setForm] = useState({
    equipment_code: "",
    name: "",
    description: "",
    category_id: "",
    total_quantity: 1,
    location: "",
  });
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(Boolean(id)),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    if (id)
      api(`/equipment/${id}`)
        .then((e) => {
          if (active) setForm(e);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
    };
  }, [id]);
  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api(id ? `/equipment/${id}` : "/equipment", {
        method: id ? "PUT" : "POST",
        body: {
          ...form,
          category_id: Number(form.category_id),
          total_quantity: Number(form.total_quantity),
        },
      });
      navigate(`/equipment/${id || result.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-title">{id ? "Edit" : "Add"} equipment</h1>
      <p className="page-subtitle">
        Available quantity is calculated from total stock and active
        reservations.
      </p>
      <Feedback loading={loading} error={error || categories.error} />
      {!loading && (
        <form
          className="panel grid max-w-3xl gap-5 md:grid-cols-2"
          onSubmit={submit}
        >
          {[
            ["equipment_code", "Equipment code", 50],
            ["name", "Name", 150],
            ["location", "Location", 100],
          ].map(([name, label, max]) => (
            <label key={name}>
              {label}
              <input
                className="field mt-1 block w-full"
                name={name}
                maxLength={max}
                required
                value={form[name]}
                onChange={change}
              />
            </label>
          ))}
          <label>
            Category
            <select
              className="field mt-1 block w-full"
              name="category_id"
              required
              value={form.category_id}
              onChange={change}
            >
              <option value="">Choose a category</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Total quantity
            <input
              className="field mt-1 block w-full"
              type="number"
              min="0"
              required
              name="total_quantity"
              value={form.total_quantity}
              onChange={change}
            />
          </label>
          <label className="md:col-span-2">
            Description
            <textarea
              className="field mt-1 block w-full"
              rows="4"
              maxLength="5000"
              name="description"
              value={form.description || ""}
              onChange={change}
            />
          </label>
          <div className="flex gap-3">
            <Button loading={busy} type="submit">
              Save equipment
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/equipment")}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
