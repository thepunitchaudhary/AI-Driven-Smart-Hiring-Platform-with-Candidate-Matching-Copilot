import { useState } from "react";
import { Trash2, X } from "lucide-react";

function listText(items) {
  if (!items || items.length === 0) return "-";
  return items.join(", ");
}

function CandidateTable({ rows, onDelete }) {
  const [selected, setSelected] = useState(null);

  if (rows.length === 0) {
    return <p className="empty">No candidates yet. Upload a resume to get started.</p>;
  }

  return (
    <>
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
              <tr key={c.candidate_id} className="clickable" onClick={() => setSelected(c)}>
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
                    <button className="icon-btn" title="Delete"
                      onClick={(e) => { e.stopPropagation(); onDelete(c.candidate_id); }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>{selected.name || "Unknown"}</h2>
                <small>Candidate profile | {selected.accuracy}% of fields found</small>
              </div>
              <button className="icon-btn" title="Close" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="info-grid">
              <p><b>Email:</b> {selected.email || "-"}</p>
              <p><b>Phone:</b> {selected.phone || "-"}</p>
              <p><b>Location:</b> {selected.location || "-"}</p>
              <p><b>Experience:</b> {selected.experience || "-"}</p>
              <p className="wide"><b>Education:</b> {listText(selected.education)}</p>
              <p className="wide">
                <b>Skills:</b><br />
                {selected.skills.length === 0 && "-"}
                {selected.skills.map((s) => <span className="chip" key={s}>{s}</span>)}
              </p>
              <p className="wide"><b>Projects:</b> {listText(selected.projects)}</p>
              <p className="wide"><b>Certifications:</b> {listText(selected.certifications)}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CandidateTable;
