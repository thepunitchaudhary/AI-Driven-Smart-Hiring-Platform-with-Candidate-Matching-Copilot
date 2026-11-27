import { useState, useEffect } from "react";
import {
  ArrowUpRight, Briefcase, Check, CheckCircle2, Clock, Loader2, Plus, Send,
  Sparkles, Trash2, Users, X,
} from "lucide-react";
import { analyzeJd, createJob, getJobs, approveJob, rejectJob, deleteJob } from "./api";
import { toast } from "./components/toast";
import {
  Badge, Button, Drawer, EmptyState, Field, Segmented, SkeletonRows, StudioHead,
} from "./components/ui";

const EMPTY = { title: "", department: "", city: "", job_type: "Full-time", experience_years: "", education: "", required: "", preferred: "", description: "" };
const FILTERS = ["all", "pending", "approved", "rejected"];

function toLevel(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("phd") || t.includes("ph.d")) return "PhD";
  if (/master|m\.tech|mtech|mca|mba|m\.sc|msc/.test(t)) return "Master";
  if (/bachelor|b\.tech|btech|bca|b\.sc|bsc|b\.e|b\.com/.test(t)) return "Bachelor";
  if (t.includes("diploma")) return "Diploma";
  return "";
}

function splitSkills(text) {
  return text.split(",").map((s) => s.trim()).filter(Boolean);
}

function statusTone(status) {
  return status === "approved" ? "success" : status === "pending" ? "warn" : "danger";
}

function statusBadge(status) {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

function JobInfo({ label, value }) {
  return (
    <div className="info-item">
      <span className="info-label">{label}</span>
      <span className={"info-value" + (value ? "" : " is-empty")}>{value || "Not specified"}</span>
    </div>
  );
}

function JobsPage({ role, userId, onViewMatches }) {
  const [form, setForm] = useState(EMPTY);
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [posted, setPosted] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  async function load() {
    setLoading(true);
    try {
      setJobs(await getJobs(""));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAnalyze() {
    setError("");
    setBusy("analyze");
    try {
      const data = await analyzeJd(form.description);
      setForm({
        ...form,
        required: data.required_skills.join(", "),
        preferred: data.preferred_skills.join(", "),
        experience_years: data.experience_years || form.experience_years,
        education: toLevel(data.education) || form.education,
      });
      setMessage("Skills were picked from the description. Check them and edit if needed.");
      toast("Copilot extracted the skills. Review them before posting.", "info");
    } catch (err) {
      setError(err.message);
      toast(err.message, "danger");
    }
    setBusy("");
  }

  async function handlePost(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy("post");
    try {
      await createJob({
        title: form.title, department: form.department, city: form.city, job_type: form.job_type,
        experience_years: Number(form.experience_years || 0), education: form.education,
        required_skills: splitSkills(form.required), preferred_skills: splitSkills(form.preferred),
        description: form.description,
      });
      const done = role === "admin" ? "Job posted and live." : "Job sent to the admin for approval.";
      setPosted(done);
      toast(done, "success");
      setForm(EMPTY);
      setBusy("");
      setOpen(false);
      load();
      return;
    } catch (err) {
      setError(err.message);
      toast(err.message, "danger");
    }
    setBusy("");
  }

  async function run(fn, id, done) {
    setError("");
    try {
      await fn(id);
      toast(done, "success");
      load();
      return true;
    } catch (err) {
      setError(err.message);
      toast(err.message, "danger");
      return false;
    }
  }

  async function handleAction(fn, job, done) {
    const ok = await run(fn, job.job_id, done);
    if (ok) setDetail(null);
  }

  function openForm() {
    setError("");
    setMessage("");
    setPosted("");
    setOpen(true);
  }

  const counts = {
    all: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    approved: jobs.filter((j) => j.status === "approved").length,
    rejected: jobs.filter((j) => j.status === "rejected").length,
  };
  const visibleJobs = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);
  const applicants = jobs.reduce((total, job) => total + (Number(job.applicants) || 0), 0);

  return (
    <>
      <StudioHead
        kicker="Requisitions"
        title="Jobs board"
        sub="Post roles, route them through approval, and open the ranked candidate pipeline for every live requisition."
        actions={(
          <>
            <Segmented
              items={FILTERS.map((f) => ({
                id: f,
                label: f[0].toUpperCase() + f.slice(1),
                count: counts[f],
              }))}
              value={filter}
              onChange={setFilter}
              ariaLabel="Filter jobs by status"
            />
            <Button Icon={Plus} onClick={openForm}>Post a job</Button>
          </>
        )}
      />

      {error && <div className="alert" role="alert">{error}</div>}
      {posted && <div className="notice">{posted}</div>}

      <div className="signal-strip">
        <div className="signal tone-brand">
          <span className="signal-index">01</span>
          <div className="signal-body">
            <strong className="signal-value">{jobs.length}</strong>
            <span className="signal-label">Requisitions</span>
            <small className="signal-hint">All roles in the workspace</small>
          </div>
          <span className="signal-icon"><Briefcase size={17} /></span>
        </div>
        <div className="signal tone-success">
          <span className="signal-index">02</span>
          <div className="signal-body">
            <strong className="signal-value">{counts.approved}</strong>
            <span className="signal-label">Approved</span>
            <small className="signal-hint">Live and open to matches</small>
          </div>
          <span className="signal-icon"><CheckCircle2 size={17} /></span>
        </div>
        <div className="signal tone-warn">
          <span className="signal-index">03</span>
          <div className="signal-body">
            <strong className="signal-value">{counts.pending}</strong>
            <span className="signal-label">Awaiting review</span>
            <small className="signal-hint">Needs an admin decision</small>
          </div>
          <span className="signal-icon"><Clock size={17} /></span>
        </div>
        <div className="signal tone-ai">
          <span className="signal-index">04</span>
          <div className="signal-body">
            <strong className="signal-value">{applicants}</strong>
            <span className="signal-label">Applicants</span>
            <small className="signal-hint">Across every requisition</small>
          </div>
          <span className="signal-icon"><Users size={17} /></span>
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="ed-loading"><SkeletonRows rows={4} /></div>
      ) : visibleJobs.length === 0 ? (
        <section className="studio-empty">
          <EmptyState
            Icon={Briefcase}
            title="No jobs in this view"
            text="Create a role, let Copilot extract the required skills, and track applicants here."
            action={<Button Icon={Plus} onClick={openForm}>Post your first job</Button>}
          />
        </section>
      ) : (
        <div className="job-board">
          {visibleJobs.map((j, index) => (
            <article className={"job-tile status-" + j.status} key={j.job_id}>
              <div className="job-tile-top">
                <span className="job-tile-index">{String(index + 1).padStart(2, "0")}</span>
                {statusBadge(j.status)}
              </div>

              <h3 className="job-tile-title">
                <button type="button" className="job-tile-link" onClick={() => setDetail(j)}>{j.title}</button>
              </h3>
              <p className="job-tile-meta">{[j.department, j.city, j.job_type].filter(Boolean).join(" · ")}</p>

              <div className="job-tile-skills">
                {j.required_skills.slice(0, 4).map((s) => <span className="chip" key={s}>{s}</span>)}
                {j.required_skills.length > 4 && <span className="chip muted">+{j.required_skills.length - 4}</span>}
                {j.required_skills.length === 0 && <span className="talent-no-skills">No required skills listed</span>}
              </div>

              <div className="job-tile-stats">
                <div><strong>{j.applicants}</strong><span>Applicants</span></div>
                <div><strong>{j.required_skills.length}</strong><span>Requirements</span></div>
                <div><strong>{j.posted_by_name ? j.posted_by_name.split(" ")[0] : "—"}</strong><span>Owner</span></div>
              </div>

              <div className="job-tile-actions">
                <button type="button" className="job-tile-view" onClick={() => setDetail(j)}>
                  Open brief <ArrowUpRight size={13} />
                </button>
                {j.status === "approved" && (
                  <Button size="sm" variant="secondary" Icon={Users} onClick={() => onViewMatches(j.job_id)}>
                    Matches
                  </Button>
                )}
                {role === "admin" && j.status !== "approved" && (
                  <Button size="sm" variant="secondary" Icon={Check} onClick={() => run(approveJob, j.job_id, "Job approved.")}>
                    Approve
                  </Button>
                )}
                {role === "admin" && j.status === "pending" && (
                  <Button size="sm" variant="danger" Icon={X} onClick={() => run(rejectJob, j.job_id, "Job rejected.")}>
                    Reject
                  </Button>
                )}
                {(role === "admin" || j.posted_by === userId) && (
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Delete job"
                    aria-label={"Delete " + j.title}
                    onClick={() => window.confirm("Delete this job?") && run(deleteJob, j.job_id, "Job deleted.")}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Post a job"
        subtitle={role === "admin" ? "Jobs posted by an admin go live immediately." : "New jobs are sent to an admin for approval."}
        width={560}
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              form="post-job-form"
              Icon={busy === "post" ? Loader2 : Send}
              iconClassName={busy === "post" ? "spin" : ""}
              disabled={busy !== ""}
            >
              {role === "admin" ? "Post job" : "Send for approval"}
            </Button>
          </>
        )}
      >
        <form id="post-job-form" className="resume-form" onSubmit={handlePost}>
          <div className="form-grid">
            <p className="form-section">Role details</p>
            <Field label="Job title *"><input value={form.title} onChange={set("title")} placeholder="Senior ML Engineer" required /></Field>
            <Field label="Department"><input value={form.department} onChange={set("department")} placeholder="Data Science" /></Field>
            <Field label="City"><input value={form.city} onChange={set("city")} placeholder="Pune" /></Field>
            <Field label="Job type">
              <select value={form.job_type} onChange={set("job_type")}>
                {["Full-time", "Part-time", "Internship", "Contract"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Experience needed (years)"><input type="number" min="0" max="40" value={form.experience_years} onChange={set("experience_years")} placeholder="3" /></Field>
            <Field label="Education needed">
              <select value={form.education} onChange={set("education")}>
                {["", "Diploma", "Bachelor", "Master", "PhD"].map((t) => <option key={t} value={t}>{t || "Any"}</option>)}
              </select>
            </Field>

            <p className="form-section">Job description</p>
            <Field label="Description" wide>
              <textarea rows={6} value={form.description} onChange={set("description")}
                placeholder={"Paste the job description here, then use Copilot to extract skills.\n\nRequirements:\n- 3+ years of experience\n- Python, TensorFlow, SQL\nNice to have:\n- Docker, MLOps"} />
            </Field>
            <div className="form-field wide">
              <div className="ai-callout" style={{ marginBottom: 4 }}>
                <span className="ai-callout-icon"><Sparkles size={17} /></span>
                <div>
                  <strong>Copilot skill extraction</strong>
                  <p>Copilot reads the description and fills in required and preferred skills, experience and education.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={handleAnalyze}
                    disabled={busy !== "" || form.description.trim().length < 20}
                    Icon={busy === "analyze" ? Loader2 : Sparkles}
                    iconClassName={busy === "analyze" ? "spin" : ""}
                  >
                    {busy === "analyze" ? "Analysing..." : "Pick skills from description"}
                  </Button>
                </div>
              </div>
            </div>

            <p className="form-section">Requirements</p>
            <Field label="Required skills * (comma separated)">
              <textarea rows={2} value={form.required} onChange={set("required")} placeholder="Python, TensorFlow, SQL" />
            </Field>
            <Field label="Preferred skills (comma separated)">
              <textarea rows={2} value={form.preferred} onChange={set("preferred")} placeholder="Docker, MLOps" />
            </Field>
          </div>

          {message && <div className="notice">{message}</div>}
          {error && <div className="alert">{error}</div>}
        </form>
      </Drawer>

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? detail.title : ""}
        subtitle={detail ? [detail.department, detail.city, detail.job_type].filter(Boolean).join(" · ") : ""}
        width={560}
        footer={detail ? (
          <>
            {detail.status === "approved" && (
              <Button size="sm" variant="secondary" Icon={Users} onClick={() => { onViewMatches(detail.job_id); setDetail(null); }}>
                Matches
              </Button>
            )}
            {role === "admin" && detail.status !== "approved" && (
              <Button size="sm" variant="success" Icon={Check} onClick={() => handleAction(approveJob, detail, "Job approved.")}>
                Approve
              </Button>
            )}
            {role === "admin" && detail.status === "pending" && (
              <Button size="sm" variant="danger" Icon={X} onClick={() => handleAction(rejectJob, detail, "Job rejected.")}>
                Reject
              </Button>
            )}
            {(role === "admin" || detail.posted_by === userId) && (
              <Button
                size="sm"
                variant="secondary"
                Icon={Trash2}
                onClick={() => { if (window.confirm("Delete this job?")) handleAction(deleteJob, detail, "Job deleted."); }}
              >
                Delete
              </Button>
            )}
          </>
        ) : null}
      >
        {detail && (
          <>
            <div className="detail-meta">
              {statusBadge(detail.status)}
              <Badge neutral><Users size={12} /> {detail.applicants} applicants</Badge>
              <Badge neutral>{detail.job_type}</Badge>
            </div>

            <p className="detail-desc">{detail.description || "No description was provided for this role."}</p>

            <p className="drawer-section-title">Required skills</p>
            <div>
              {detail.required_skills.length === 0
                ? <span className="info-value is-empty">Not specified</span>
                : detail.required_skills.map((s) => <span className="chip" key={s}>{s}</span>)}
            </div>

            <p className="drawer-section-title">Preferred skills</p>
            <div>
              {(detail.preferred_skills || []).length === 0
                ? <span className="info-value is-empty">None specified</span>
                : (detail.preferred_skills || []).map((s) => <span className="chip muted" key={s}>{s}</span>)}
            </div>

            <p className="drawer-section-title">Role details</p>
            <div className="info-grid two">
              <JobInfo label="Posted by" value={detail.posted_by_name} />
              <JobInfo label="Experience" value={detail.experience_years ? detail.experience_years + "+ years" : "Not specified"} />
              <JobInfo label="Education" value={detail.education || "Any"} />
              <JobInfo label="City" value={detail.city} />
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}

export default JobsPage;
