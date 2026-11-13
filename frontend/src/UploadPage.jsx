import { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, XCircle, Loader2, Upload } from "lucide-react";
import { uploadResume } from "./api";
import CandidateTable from "./CandidateTable";

function formatSize(bytes) {
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}

function ago(time) {
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 1) return "just now";
  return minutes + " min ago";
}

function UploadPage({ role, stats, candidates, onChange, onDelete }) {
  const [queue, setQueue] = useState([]);
  const [last, setLast] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function updateItem(id, patch) {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleFiles(fileList) {
    const files = [...fileList].filter((f) => /\.(pdf|docx)$/i.test(f.name));
    if (files.length === 0) return;
    const items = files.map((file, i) => ({
      id: Date.now() + i, file, status: "queued", error: "",
    }));
    setQueue((q) => [...items, ...q]);

    for (const item of items) {
      updateItem(item.id, { status: "parsing" });
      try {
        const data = await uploadResume(item.file);
        updateItem(item.id, { status: "done" });
        setLast(data);
      } catch (err) {
        updateItem(item.id, { status: "failed", error: err.message });
      }
      onChange();
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const finished = queue.filter((i) => i.status === "done" || i.status === "failed").length;
  const isCandidate = role === "candidate";
  const busy = queue.length > 0 && finished < queue.length;
  const progress = busy ? Math.round((finished / queue.length) * 100) : isCandidate ? (last ? last.extraction_accuracy : 0) : stats.average_accuracy;
  const profile = last ? last.profile : null;

  return (
    <>
      <div className="grid-2">
        <section className="card">
          <h2><UploadCloud size={18} /> Upload Resume</h2>
          <div
            className={dragging ? "dropzone active" : "dropzone"}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current.click()}
          >
            <UploadCloud size={36} />
            <p>Drag and drop resumes or click to browse</p>
            <button className="btn" onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>
              <Upload size={16} /> Upload Files
            </button>
            <small>Supported formats: PDF, DOCX</small>
            <input
              ref={inputRef} type="file" accept=".pdf,.docx" multiple hidden
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            />
          </div>

          <div className="file-list">
            {queue.slice(0, 5).map((item) => (
              <div className="file-row" key={item.id}>
                <span className="file-icon"><FileText size={18} /></span>
                <div className="file-info">
                  <strong>{item.file.name}</strong>
                  <small>{item.status === "failed" ? item.error : "Uploaded " + ago(item.id) + " \u2022 " + formatSize(item.file.size)}</small>
                </div>
                {item.status === "parsing" && <Loader2 size={18} className="spin blue" />}
                {item.status === "done" && <CheckCircle2 size={18} className="green-text" />}
                {item.status === "failed" && <XCircle size={18} className="red-text" />}
                {item.status === "queued" && <small>Queued</small>}
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Parsing Progress</h2>
          <div className="progress-head">
            <span>Extraction Progress</span><strong>{progress}%</strong>
          </div>
          <div className="progress"><div style={{ width: progress + "%" }} /></div>

          {!isCandidate && (
          <div className="mini-stats">
            <div><strong>{stats.total}</strong><small>Resumes Processed</small></div>
            <div><strong>{stats.average_accuracy}%</strong><small>Fields Found</small></div>
            <div><strong>{stats.complete_profiles}</strong><small>Profiles Created</small></div>
          </div>
          )}

          <h3>Extracted Information</h3>
          {!profile && <p className="empty">Upload a resume to see the extracted details.</p>}
          {profile && (
            <div className="info-grid">
              <p><b>Name:</b> {profile.name || "-"}</p>
              <p><b>Email:</b> {profile.email || "-"}</p>
              <p><b>Phone:</b> {profile.phone || "-"}</p>
              <p><b>Experience:</b> {profile.experience || "-"}</p>
              <p><b>Education:</b> {profile.education.join(", ") || "-"}</p>
              <p><b>Location:</b> {profile.location || "-"}</p>
              <p className="wide">
                <b>Skills:</b><br />
                {profile.skills.length === 0 && "-"}
                {profile.skills.map((s) => <span className="chip" key={s}>{s}</span>)}
              </p>
            </div>
          )}
        </section>
      </div>

      {!isCandidate && (
      <section className="card">
        <h2>Recently Processed Candidates</h2>
        <CandidateTable rows={candidates.slice(0, 5)} onDelete={onDelete} />
      </section>
      )}
    </>
  );
}

export default UploadPage;
