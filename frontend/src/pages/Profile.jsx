import { useAuth } from "../auth/context";
export default function Profile() {
  const { user } = useAuth();
  return (
    <>
      <h1 className="page-title">My profile</h1>
      <p className="page-subtitle">Your university lab account.</p>
      <dl className="panel max-w-xl space-y-4">
        {[
          ["Name", user.name],
          ["Email", user.email],
          ["Role", user.role],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="mt-1 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
