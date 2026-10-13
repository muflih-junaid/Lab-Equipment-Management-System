import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import Button from "../components/Button";
import { api } from "../api/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name.trim()) errors.name = "Full name is required";
  if (!email.trim()) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email.trim()))
    errors.email = "Enter a valid email address";
  if (new TextEncoder().encode(password).length > 72)
    errors.password = "Password must not exceed 72 bytes";
  if (password.length < 8)
    errors.password = "Password must be at least 8 characters";
  if (confirmPassword !== password)
    errors.confirmPassword = "Passwords do not match";
  return errors;
}

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(""); // Added success state
  const [apiError, setApiError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setApiError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const found = validate(form);
    setErrors(found);

    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        },
      });
      setSuccessMessage("Account created. You can now sign in.");
      navigate("/login", { state: { registered: true } });
    } catch (error) {
      setApiError(error.message || "Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Register as a student to borrow lab equipment"
    >
      {/* Success Popup / Banner */}
      {successMessage && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center text-sm font-medium text-emerald-400 animate-fade-in">
          {successMessage}
        </div>
      )}

      {/* API Error Banner */}
      {apiError && (
        <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-sm font-medium text-rose-400">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <TextField
          dark
          id="name"
          name="name"
          maxLength={100}
          label="Full name"
          placeholder="Jane Doe"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <TextField
          dark
          id="email"
          name="email"
          maxLength={255}
          type="email"
          label="Email"
          placeholder="you@university.edu"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextField
          dark
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <TextField
          dark
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <Button loading={loading} type="submit" className="mt-2 w-full py-3">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/70">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-indigo-300 hover:text-indigo-200"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Register;
