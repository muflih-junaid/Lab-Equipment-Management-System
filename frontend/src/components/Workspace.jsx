import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/context";
export default function Workspace() {
  const { user, logout } = useAuth();
  const admin = user.role === "admin";
  const links = admin
    ? [
        ["/admin", "Overview"],
        ["/equipment", "Equipment"],
        ["/admin/requests", "Borrow requests"],
        ["/admin/borrowed", "Borrowed equipment"],
        ["/admin/overdue", "Overdue"],
        ["/admin/maintenance", "Maintenance"],
        ["/admin/users", "Users"],
      ]
    : [
        ["/dashboard", "Overview"],
        ["/equipment", "Equipment"],
        ["/requests", "My requests"],
        ["/borrowed", "My borrowed equipment"],
        ["/report", "Report an issue"],
        ["/maintenance", "My reports"],
      ];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-slate-950 text-slate-300 p-6 lg:sticky lg:top-0 lg:h-screen">
        <div className="text-xs uppercase tracking-widest text-indigo-400">
          University laboratory
        </div>
        <div className="mt-2 mb-8 text-xl font-bold text-white">
          Lab Equipment
        </div>
        <nav
          className="flex flex-wrap gap-2 lg:flex-col"
          aria-label="Main navigation"
        >
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${isActive ? "bg-indigo-600 text-white" : "hover:bg-slate-800"}`
              }
            >
              {label}
            </NavLink>
          ))}
          <NavLink
            className="rounded-lg px-3 py-2 text-sm hover:bg-slate-800"
            to="/profile"
          >
            Profile
          </NavLink>
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex justify-between items-center border-b bg-white px-6 py-4">
          <span className="text-sm">
            {user.name}{" "}
            <span className="text-slate-400">
              · {admin ? "Administrator" : "Student"}
            </span>
          </span>
          <button onClick={logout} className="text-sm text-indigo-600">
            Sign out
          </button>
        </header>
        <main className="mx-auto max-w-7xl p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
