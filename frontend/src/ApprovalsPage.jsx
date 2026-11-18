import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { getUsers, approveUser, rejectUser } from "./api";

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const PORTALS = { recruiter: "Recruiter", hr: "HR Manager", candidate: "Candidate" };

function emailText(result) {
  if (result === "sent") return "An email was sent to the user.";
  if (result === "not configured") return "Email is not set up yet, so no email was sent.";
  return "The email could not be sent (" + result + ").";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function ApprovalsPage() {
  const [status, setStatus] = useState("pending");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setUsers(await getUsers(status));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [status]);

  async function act(user, approve) {
    setBusyId(user.user_id);
    setMessage("");
    try {
      const data = approve ? await approveUser(user.user_id) : await rejectUser(user.user_id);
      const action = approve ? "Approved " : "Rejected ";
      setMessage(action + user.name + ". " + emailText(data.email));
      await load();
    } catch (err) {
      setError(err.message);
    }
    setBusyId(null);
  }

  return (
    <section className="card">
      <div className="mode-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={status === t.id ? "tab-btn active" : "tab-btn"} onClick={() => setStatus(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className="notice">{message}</div>}
      {error && <div className="alert">{error}</div>}

      {users.length === 0 ? (
        <p className="empty">No {status} users.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Portal</th>
                <th>Signed up</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{PORTALS[u.role] || u.role}</td>
                  <td>{formatDate(u.created_at)}</td>
                  <td><span className={u.status === "approved" ? "badge green" : u.status === "pending" ? "badge amber" : "badge red"}>{u.status}</span></td>
                  <td className="actions">
                    {u.status !== "approved" && (
                      <button className="btn-small green" disabled={busyId === u.user_id} onClick={() => act(u, true)}>
                        <Check size={14} /> Approve
                      </button>
                    )}
                    {u.status === "pending" && (
                      <button className="btn-small red" disabled={busyId === u.user_id} onClick={() => act(u, false)}>
                        <X size={14} /> Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ApprovalsPage;
