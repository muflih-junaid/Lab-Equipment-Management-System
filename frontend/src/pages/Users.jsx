import useResource from "../api/useResource";
import { Feedback, EmptyState } from "../components/Feedback";
export default function Users() {
  const { data, loading, error, reload } = useResource("/users");
  return (
    <>
      <h1 className="page-title">Users</h1>
      <p className="page-subtitle">
        Registered students and lab administrators.
      </p>
      <Feedback loading={loading} error={error} />
      {error && <button onClick={reload}>Retry</button>}
      {data?.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
