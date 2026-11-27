import { useState, useEffect } from "react";
import { Check, X, ShieldCheck, Clock, CheckCircle2, XCircle, Users } from "lucide-react";
import { getUsers, approveUser, rejectUser } from "./api";
import { toast } from "./components/toast";
import {
  Avatar, Badge, Button, Card, CardHead, EmptyState, MetricStrip, Segmented, SkeletonRows,
} from "./components/ui";

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const PORTALS = { hr: "HR Manager", candidate: "Candidate" };

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
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setUsers(await getUsers(status));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCounts() {
    try {
      const [pending, approved, rejected] = await Promise.all([
        getUsers("pending"), getUsers("approved"), getUsers("rejected"),
      ]);
      setCounts({ pending: pending.length, approved: approved.length, rejected: rejected.length });
    } catch (err) {
    }
  }

  useEffect(() => { load(); }, [status]);
  useEffect(() => { loadCounts(); }, []);

  async function act(user, approve) {
    if (!approve && !window.confirm("Reject " + user.name + "'s account request?")) return;
    setBusyId(user.user_id);
    setMessage("");
    try {
      const data = approve ? await approveUser(user.user_id) : await rejectUser(user.user_id);
      const note = (approve ? "Approved " : "Rejected ") + user.name + ". " + emailText(data.email);
      setMessage(note);
      toast(note, "success");
      await load();
      loadCounts();
    } catch (err) {
      setError(err.message);
      toast(err.message, "danger");
    }
    setBusyId(null);
  }

  const statusTone = (value) => (value === "approved" ? "success" : value === "pending" ? "warn" : "danger");
  const total = counts.pending + counts.approved + counts.rejected;

  return (
    <Card>
      <CardHead
        title="Account requests"
        sub="Approve or reject new HR and candidate sign-ups."
        Icon={ShieldCheck}
        actions={(
          <Segmented
            items={TABS.map((t) => ({ ...t, count: counts[t.id] }))}
            value={status}
            onChange={setStatus}
            ariaLabel="Filter users by status"
          />
        )}
      />

      <MetricStrip
        items={[
          { label: "Total accounts", value: total, Icon: Users, tone: "brand" },
          { label: "Awaiting review", value: counts.pending, Icon: Clock, tone: "warn" },
          { label: "Approved", value: counts.approved, Icon: CheckCircle2, tone: "success" },
          { label: "Rejected", value: counts.rejected, Icon: XCircle, tone: "danger" },
        ]}
      />

      {message && <div className="notice">{message}</div>}
      {error && <div className="alert">{error}</div>}

      {loading && users.length === 0 ? (
        <SkeletonRows rows={5} />
      ) : users.length === 0 ? (
        <EmptyState
          Icon={ShieldCheck}
          title={"No " + status + " users"}
          text={status === "pending"
            ? "New sign-ups will appear here for review."
            : "Nothing to show in this view yet."}
        />
      ) : (
        <div className="table-wrap table-cards">
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" className="col-email">Email</th>
                <th scope="col">Portal</th>
                <th scope="col" className="col-date">Signed up</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td className="cell-main">
                    <span className="person">
                      <Avatar name={u.name} size={32} />
                      {u.name}
                    </span>
                  </td>
                  <td className="col-email">{u.email}</td>
                  <td data-label="Portal"><span className="badge neutral">{PORTALS[u.role] || u.role}</span></td>
                  <td className="muted-text col-date">{formatDate(u.created_at)}</td>
                  <td data-label="Status"><Badge tone={statusTone(u.status)}>{u.status}</Badge></td>
                  <td className="actions cell-actions">
                    {u.status !== "approved" && (
                      <Button
                        size="sm"
                        variant="success"
                        Icon={Check}
                        disabled={busyId === u.user_id}
                        onClick={() => act(u, true)}
                      >
                        Approve
                      </Button>
                    )}
                    {u.status === "pending" && (
                      <Button
                        size="sm"
                        variant="danger"
                        Icon={X}
                        disabled={busyId === u.user_id}
                        onClick={() => act(u, false)}
                      >
                        Reject
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default ApprovalsPage;
