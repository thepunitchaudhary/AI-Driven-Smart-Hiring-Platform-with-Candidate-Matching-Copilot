import { useState, useRef, useEffect } from "react";
import {
  UploadCloud, FileText, CheckCircle2, XCircle, Loader2, Upload, Type, ClipboardList,
  Users, Activity, Sparkles, ShieldCheck, Lightbulb,
} from "lucide-react";
import { uploadResume, getMyProfile } from "./api";
import { toast } from "./components/toast";
import CandidateTable from "./CandidateTable";
import TypeResume from "./TypeResume";
import ResumeForm from "./ResumeForm";
import {
  Card, CardHead, EmptyState, ProgressBar, ScoreRing, Segmented, Skeleton,
} from "./components/ui";

function formatSize(bytes) {
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}

function ago(time) {
  const minutes = Math.floor((Date.now() - time) / 60000);
  if (minutes < 1) return "just now";
  return minutes + " min ago";
}

function profileScore(profile) {
  if (!profile) return 0;
  const checks = [
    profile.name,
    profile.email,
    profile.phone,
    (profile.education || []).length,
    profile.experience,
    (profile.skills || []).length,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

const MODES = [
  { id: "file", label: "Upload file", icon: UploadCloud },
  { id: "form", label: "Fill form", icon: ClipboardList },
  { id: "type", label: "Paste text", icon: Type },
];

const TIPS = [
  { Icon: ShieldCheck, text: "Text-based PDF or DOCX parses best. Scanned images may need the form or text mode." },
  { Icon: FileText, text: "Keep one resume per file so the extracted details stay clean." },
  { Icon: Sparkles, text: "Include skills, education and experience sections to raise the completeness score." },
];

function ParsedSkeleton() {
  return (
    <div className="info-grid two" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="info-item" key={i}>
          <Skeleton className="sk-line" style={{ width: 64 }} />
          <Skeleton className="sk-line" style={{ width: 110 + (i % 3) * 26, marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}

function UploadPage({ role, stats, candidates, onChange, onDelete }) {
  const [queue, setQueue] = useState([]);
  const [last, setLast] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState("file");
  const [mine, setMine] = useState(null);
  const inputRef = useRef(null);

  function updateItem(id, patch) {
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleFiles(fileList) {
    const selected = [...fileList];
    if (selected.length === 0) return;

    const files = selected.filter((f) => /\.(pdf|docx)$/i.test(f.name));
    if (files.length < selected.length) {
      toast("Only PDF and DOCX files can be parsed. Other files were skipped.", "warn");
    }
    if (files.length === 0) return;

    const items = files.map((file, i) => ({
      id: Date.now() + i, file, status: "queued", error: "",
    }));
    setQueue((q) => [...items, ...q.filter((item) => item.status === "parsing" || item.status === "queued")]);

    for (const item of items) {
      updateItem(item.id, { status: "parsing" });
      try {
        const data = await uploadResume(item.file);
        updateItem(item.id, { status: "done" });
        setLast(data);
        toast(item.file.name + " parsed \u2014 " + data.extraction_accuracy + "% of fields found.", "success");
      } catch (err) {
        updateItem(item.id, { status: "failed", error: err.message });
        toast(err.message || "Could not parse " + item.file.name + ".", "danger");
      }
      onChange();
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  useEffect(() => {
    if (role === "candidate") getMyProfile().then(setMine).catch(() => {});
  }, [last]);

  const finished = queue.filter((i) => i.status === "done" || i.status === "failed").length;
  const isCandidate = role === "candidate";
  const busy = queue.length > 0 && finished < queue.length;
  const batchProgress = queue.length ? Math.round((finished / queue.length) * 100) : 0;
  const profile = last ? last.profile : (isCandidate ? mine : (candidates[0] || null));
  const completeness = last ? last.extraction_accuracy : (isCandidate ? profileScore(profile) : stats.average_accuracy);
  const warning = last && last.warning ? last.warning : "";

  return (
    <>
      <div className="grid-2">
        <Card>
          <CardHead
            title="Add a resume"
            sub="Upload a file, fill the form, or paste resume text."
            Icon={UploadCloud}
          />
          <Segmented items={MODES} value={mode} onChange={setMode} ariaLabel="Resume input method" />

          {warning && <div className="alert" style={{ marginTop: 16 }}>{warning}</div>}

          {mode === "form" && <ResumeForm onParsed={(data) => { setLast(data); onChange(); }} />}
          {mode === "type" && (
            <div style={{ marginTop: 16 }}>
              <TypeResume onParsed={(data) => { setLast(data); onChange(); }} />
            </div>
          )}

          {mode === "file" && (
            <>
              <div
                className={"dropzone" + (dragging ? " active" : "")}
                style={{ marginTop: 16 }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current.click()}
              >
                <span className="dropzone-icon"><UploadCloud size={26} /></span>
                <p>Drag and drop resumes here, or click to browse</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
                >
                  <Upload size={15} /> Choose files
                </button>
                <small>Supports PDF and DOCX · multiple files allowed</small>
                <input
                  ref={inputRef} type="file" accept=".pdf,.docx" multiple hidden
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                />
              </div>

              <div className="upload-tips">
                <p className="upload-tips-title"><Lightbulb size={14} /> Tips for the best parse</p>
                <ul>
                  {TIPS.map((tip) => (
                    <li key={tip.text}><tip.Icon size={13} />{tip.text}</li>
                  ))}
                </ul>
              </div>

              {queue.length > 0 && (
                <div className="file-list">
                  <div className="file-list-head">
                    <span>This batch</span>
                    {finished === queue.length && (
                      <button
                        type="button"
                        className="link"
                        onClick={() => setQueue((q) => q.filter((i) => i.status === "queued" || i.status === "parsing"))}
                      >
                        Clear finished
                      </button>
                    )}
                  </div>
                  {queue.slice(0, 5).map((item) => (
                    <div className="file-row" key={item.id}>
                      <span className="file-icon"><FileText size={17} /></span>
                      <div className="file-info">
                        <strong>{item.file.name}</strong>
                        <small>
                          {item.status === "failed"
                            ? item.error
                            : item.status === "parsing"
                              ? "Reading the resume\u2026"
                              : item.status === "done"
                                ? "Parsed \u00b7 " + formatSize(item.file.size)
                                : "Queued \u00b7 " + formatSize(item.file.size) + " \u00b7 " + ago(item.id)}
                        </small>
                        <span className={"file-progress " + item.status} aria-hidden="true"><i /></span>
                      </div>
                      {item.status === "parsing" && <Loader2 size={18} className="spin blue" />}
                      {item.status === "done" && <CheckCircle2 size={18} className="green-text" />}
                      {item.status === "failed" && <XCircle size={18} className="red-text" />}
                      {item.status === "queued" && <span className="badge neutral">Queued</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <CardHead title="Processing overview" sub="Track parsing and profile completeness." Icon={Activity} />

          <div className="upload-status">
            <div className="progress-block">
              <div className="progress-head">
                <span>{busy ? "Parsing files" : "Current batch"}</span>
                <strong>{batchProgress}%</strong>
              </div>
              <ProgressBar value={batchProgress} tone={batchProgress === 100 ? "success" : "brand"} />
              <p className="muted-text" style={{ marginTop: 6 }}>
                {queue.length ? finished + " of " + queue.length + " files parsed" : "No files in this batch"}
              </p>
            </div>

            <div className="completeness-panel">
              <ScoreRing score={completeness || 0} size={92} label={isCandidate ? "Profile" : "Average"} />
              <div className="completeness-text">
                <strong>Profile completeness</strong>
                <p>
                  {isCandidate
                    ? "Based on the fields found in your latest resume."
                    : "Average across your candidate library."}
                </p>
              </div>
            </div>
          </div>

          {!isCandidate && (
            <div className="mini-stats">
              <div><strong>{stats.total}</strong><small>Resumes Processed</small></div>
              <div><strong>{stats.average_accuracy}%</strong><small>Fields Found</small></div>
              <div><strong>{stats.complete_profiles}</strong><small>Complete Profiles</small></div>
            </div>
          )}

          <CardHead
            title="Extracted information"
            sub={busy ? "Copilot is reading the latest resume\u2026" : profile ? "Review the details found in the resume." : undefined}
            Icon={FileText}
            actions={profile && !busy ? <span className="badge brand">Parsed</span> : null}
          />

          {busy && !last ? (
            <ParsedSkeleton />
          ) : !profile ? (
            <EmptyState
              Icon={FileText}
              title="Nothing parsed yet"
              text="Upload a resume to see the extracted name, contact details, education and skills."
            />
          ) : (
            <div className="info-grid two">
              <div className="info-item"><span className="info-label">Name</span><span className={"info-value" + (profile.name ? "" : " is-empty")}>{profile.name || "Not found"}</span></div>
              <div className="info-item"><span className="info-label">Email</span><span className={"info-value" + (profile.email ? "" : " is-empty")}>{profile.email || "Not found"}</span></div>
              <div className="info-item"><span className="info-label">Phone</span><span className={"info-value" + (profile.phone ? "" : " is-empty")}>{profile.phone || "Not found"}</span></div>
              <div className="info-item"><span className="info-label">Experience</span><span className={"info-value" + (profile.experience ? "" : " is-empty")}>{profile.experience || "Not found"}</span></div>
              <div className="info-item"><span className="info-label">Location</span><span className={"info-value" + (profile.location ? "" : " is-empty")}>{profile.location || "Not found"}</span></div>
              <div className="info-item"><span className="info-label">Education</span><span className={"info-value" + ((profile.education || []).length ? "" : " is-empty")}>{(profile.education || []).join(", ") || "Not found"}</span></div>
              <div className="info-item wide">
                <span className="info-label">Skills</span>
                <span className={"info-value" + ((profile.skills || []).length ? "" : " is-empty")}>
                  {(profile.skills || []).length === 0
                    ? "Not found"
                    : profile.skills.map((s) => <span className="chip" key={s}>{s}</span>)}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {!isCandidate && (
        <Card>
          <CardHead title="Recently processed candidates" sub="The five most recent profiles in your library." Icon={Users} />
          <CandidateTable variant="compact" rows={candidates.slice(0, 5)} onDelete={onDelete} />
        </Card>
      )}
    </>
  );
}

export default UploadPage;
