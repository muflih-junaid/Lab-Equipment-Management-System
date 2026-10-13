import { useEffect, useState } from "react";
import { api } from "../api/client";
import { AuthContext } from "./context";
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const logout = () => {
      sessionStorage.removeItem("lab_token");
      setUser(null);
    };
    window.addEventListener("lab:logout", logout);
    if (sessionStorage.getItem("lab_token"))
      api("/auth/me")
        .then((value) => {
          if (active) setUser(value);
        })
        .catch((e) => {
          if (active && sessionStorage.getItem("lab_token"))
            setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    else
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.removeEventListener("lab:logout", logout);
    };
  }, [retry]);
  async function login(form) {
    const data = await api("/auth/login", { method: "POST", body: form });
    sessionStorage.setItem("lab_token", data.token);
    setUser(data.user);
    return data.user;
  }
  function logout() {
    sessionStorage.removeItem("lab_token");
    setUser(null);
  }
  if (loading)
    return (
      <p className="p-8" role="status">
        Loading your session…
      </p>
    );
  if (error)
    return (
      <div className="p-8" role="alert">
        {error}
        <button
          className="ml-4 underline"
          onClick={() => {
            setError("");
            setLoading(true);
            setRetry(retry + 1);
          }}
        >
          Retry
        </button>
        <button
          className="ml-4 underline"
          onClick={() => {
            logout();
            setError("");
          }}
        >
          Sign out
        </button>
      </div>
    );
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
