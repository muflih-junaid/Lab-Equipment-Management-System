import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Added useNavigate
import AuthLayout from "../components/AuthLayout";
import TextField from "../components/TextField";
import Button from "../components/Button";
import { useAuth } from "../auth/context";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid Email Address";
  }

  if (!password) {
    errors.password = "Password is required";
  }

  return errors;
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(
    location.state?.registered ? "Account created. Please sign in." : "",
  );
  const [apiError, setApiError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: undefined,
    });
    setApiError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const found = validate(form);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const user = await login({
        email: form.email.trim(),
        password: form.password,
      });
      setSuccessMessage("Login successful!");
      navigate(user.role === "admin" ? "/admin" : "/dashboard", {
        replace: true,
      });
    } catch (error) {
      setApiError(error.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage and borrow lab equipment"
    >
      {/* Success Popup / Banner */}
      {successMessage && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center text-sm font-medium text-emerald-400">
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
          id="email"
          name="email"
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
          placeholder="••••••••"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Button loading={loading} type="submit" className="mt-2 w-full py-3">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/70">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-indigo-300 hover:text-indigo-200"
        >
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
