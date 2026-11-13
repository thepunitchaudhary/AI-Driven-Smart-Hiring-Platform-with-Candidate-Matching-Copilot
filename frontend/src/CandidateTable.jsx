import { Trash2 } from "lucide-react";

function CandidateTable({ rows, onDelete }) {
  if (rows.length === 0) {
    return <p className="empty">No candidates yet. Upload a resume to get started.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Candidate Name</th>
            <th>Email</th>
            <th>Experience</th>
            <th>Key Skills</th>
            <th>Status</th>
            {onDelete && <th></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.candidate_id}>
              <td>{c.name || "Unknown"}</td>
              <td>{c.email || "-"}</td>
              <td>{c.experience || "-"}</td>
              <td>
                {c.skills.slice(0, 3).map((s) => (
                  <span className="chip" key={s}>{s}</span>
                ))}
                {c.skills.length > 3 && <span className="chip muted">+{c.skills.length - 3}</span>}
              </td>
              <td><span className="badge green">Processed</span></td>
              {onDelete && (
                <td>
                  <button className="icon-btn" title="Delete" onClick={() => onDelete(c.candidate_id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CandidateTable;
