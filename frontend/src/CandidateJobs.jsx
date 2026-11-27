import { useState, useEffect } from "react";
import {
  Award, Briefcase, CheckCircle2, ClipboardList, MapPin, Sparkles, Target,
  UploadCloud,
} from "lucide-react";
import { getOpenJobs, applyToJob, getMyApplications } from "./api";
import { toast } from "./components/toast";
import {
  Badge, Button, Drawer, EmptyState, Gauge, Segmented, SkeletonRows, SignalStrip,
} from "./components/ui";

function JobInfo({ label, value }) {
  return (
    <div className="info-item">
      <span className="info-label">{label}</span>
      <span className={"info-value" + (value ? "" : " is-empty")}>{value || "Not specified"}</span>
    </div>
  );
}

function CandidateJobs({ goToResume }) {
  const [tab, setTab] = useState("open");
  const [data, setData] = useState({ has_profile: true, jobs: [] });
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [jobs, apps] = await Promise.all([getOpenJobs(), getMyApplications()]);
      setData(jobs);
      setApplications(apps);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApply(job) {
    setError("");
    setMessage("");
    try {
      const result = await applyToJob(job.job_id);
      const note = "Applied for " + job.title + ". Your match score is " + result.match_score + "%.";
      setMessage(note);
      toast(note, "success");
      setDetail(null);
      load();
    } catch (err) {
      setError(err.message);
      toast(err.message, "danger");
    }
  }

  const scores = data.jobs
    .map((j) => j.my_score)
    .filter((score) => typeof score === "number");
  const bestScore = scores.length ? Math.max(...scores) : null;
  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;

  return (
    <>
      <section className="opp-hero">
        <div className="opp-hero-glow" aria-hidden="true" />
        <div className="opp-hero-body">
          <span className="ed-kicker"><Sparkles size={12} /> Candidate portal</span>
          <h1 className="opp-hero-title">
            {data.has_profile ? <>Your next role<br /><em>starts here.</em></> : <>Build your profile,<br /><em>unlock matches.</em></>}
          </h1>
          <p>
            {data.has_profile
              ? "Open roles are ranked by how well your skills match. Apply in one click and track every application."
              : "Add your resume once — Copilot structures it and shows how well you match each open role."}
          </p>
          <div className="opp-hero-actions">
            <Button size="sm" Icon={UploadCloud} onClick={goToResume}>
              {data.has_profile ? "Update resume" : "Add your resume"}
            </Button>
            <Button size="sm" variant="secondary" Icon={ClipboardList} onClick={() => setTab("applications")}>
              My applications
            </Button>
          </div>
        </div>
        <aside className="opp-hero-aside">
          {bestScore !== null ? (
            <>
              <Gauge value={bestScore} size={150} label="Best match" tone="lime" />
              <span>Across {data.jobs.length} open roles</span>
            </>
          ) : (
            <div className="opp-hero-note">
              <Target size={22} />
              <strong>Match score locked</strong>
              <span>Add a resume to see how you rank against every open role.</span>
            </div>
          )}
        </aside>
      </section>

      <SignalStrip
        loading={loading}
        items={[
          { label: "Open roles", value: data.jobs.length, Icon: Briefcase, tone: "brand" },
          { label: "Applications", value: applications.length, Icon: ClipboardList, tone: "ai" },
          { label: "Shortlisted", value: shortlisted, Icon: Award, tone: "success" },
          { label: "Best match", value: bestScore === null ? "—" : bestScore + "%", Icon: Target, tone: "lime" },
        ]}
      />

      <div className="opp-switch">
        <Segmented
          items={[
            { id: "open", label: "Open roles", count: data.jobs.length },
            { id: "applications", label: "My applications", count: applications.length },
          ]}
          value={tab}
          onChange={setTab}
          ariaLabel="Candidate job views"
        />
        <span className="opp-switch-note">Ranked by skill match · updated live</span>
      </div>

      {!data.has_profile && (
        <div className="alert">
          <span>
            Add your resume first so we can show how well you match each job and let you apply.{" "}
            <button className="link" onClick={goToResume}>Go to My Resume</button>
          </span>
        </div>
      )}
      {message && <div className="notice">{message}</div>}
      {error && <div className="alert" role="alert">{error}</div>}

      {tab === "open" && (loading ? (
        <div className="ed-loading"><SkeletonRows rows={3} /></div>
      ) : data.jobs.length === 0 ? (
        <section className="studio-empty">
          <EmptyState
            Icon={Briefcase}
            title="No open jobs right now"
            text="Approved roles will appear here. Please check again later."
          />
        </section>
      ) : (
        <div className="opp-stream">
          {data.jobs.map((j, index) => (
            <article className={"opp-card" + (j.applied ? " is-applied" : "")} key={j.job_id}>
              <div className="opp-card-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="opp-card-main">
                <div className="opp-card-top">
                  <div>
                    <button type="button" className="opp-title" onClick={() => setDetail(j)}>{j.title}</button>
                    <p className="opp-meta">
                      {j.department && <span>{j.department}</span>}
                      <span>{j.job_type}</span>
                      {j.city && <span><MapPin size={11} /> {j.city}</span>}
                    </p>
                  </div>
                  {typeof j.my_score === "number" && (
                    <div className="opp-score">
                      <b>{j.my_score}</b>
                      <span>% match</span>
                    </div>
                  )}
                </div>

                <p className="opp-desc">{j.description || ""}</p>

                <div className="opp-skills">
                  {j.required_skills.map((s) => <span className="chip" key={s}>{s}</span>)}
                </div>

                {j.missing_required && j.missing_required.length > 0 && (
                  <p className="opp-missing">Gap to close · {j.missing_required.join(", ")}</p>
                )}

                <div className="opp-foot">
                  <span>
                    {j.experience_years > 0 ? j.experience_years + "+ years" : "Fresher friendly"}
                    {j.education ? " · " + j.education : ""}
                  </span>
                  {j.applied ? (
                    <Badge tone="success"><CheckCircle2 size={12} /> Applied</Badge>
                  ) : (
                    <Button size="sm" onClick={() => handleApply(j)} disabled={!data.has_profile}>Apply now</Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ))}

      {tab === "applications" && (loading ? (
        <div className="ed-loading"><SkeletonRows rows={4} /></div>
      ) : applications.length === 0 ? (
        <section className="studio-empty">
          <EmptyState
            Icon={ClipboardList}
            title="No applications yet"
            text="Browse open jobs and apply. Your match score and status will be tracked here."
          />
        </section>
      ) : (
        <div className="app-stream">
          {applications.map((a, index) => (
            <article className="app-row" key={a.application_id}>
              <span className="app-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="app-main">
                <div className="app-top">
                  <h3>{a.job_title}</h3>
                  <Badge tone={a.status === "shortlisted" ? "success" : a.status === "rejected" ? "danger" : "warn"}>
                    {a.status}
                  </Badge>
                </div>
                <p className="app-meta">
                  {[a.city || "Location open", a.created_at ? new Date(a.created_at).toLocaleDateString() : "Date pending"].join(" · ")}
                </p>
              </div>
              <div className="app-score">
                <b>{a.match_score}%</b>
                <span>match</span>
              </div>
            </article>
          ))}
        </div>
      ))}

      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? detail.title : ""}
        subtitle={detail ? [detail.department, detail.city, detail.job_type].filter(Boolean).join(" · ") : ""}
        width={560}
        footer={detail ? (
          detail.applied ? (
            <Badge tone="success"><CheckCircle2 size={12} /> Applied</Badge>
          ) : (
            <Button onClick={() => handleApply(detail)} disabled={!data.has_profile}>Apply now</Button>
          )
        ) : null}
      >
        {detail && (
          <>
            <div className="detail-meta">
              {typeof detail.my_score === "number" && <Badge tone="brand">{detail.my_score}% match</Badge>}
              <Badge neutral>{detail.job_type}</Badge>
              {detail.city && <Badge neutral><MapPin size={12} /> {detail.city}</Badge>}
            </div>

            <p className="detail-desc">{detail.description || "No description was provided for this role."}</p>

            <p className="drawer-section-title">Required skills</p>
            <div>{detail.required_skills.map((s) => <span className="chip" key={s}>{s}</span>)}</div>

            {detail.missing_required && detail.missing_required.length > 0 && (
              <>
                <p className="drawer-section-title">Skills to build</p>
                <div>{detail.missing_required.map((s) => <span className="chip muted" key={s}>{s}</span>)}</div>
              </>
            )}

            <p className="drawer-section-title">Role details</p>
            <div className="info-grid two">
              <JobInfo label="Experience" value={detail.experience_years > 0 ? detail.experience_years + "+ years" : "Fresher friendly"} />
              <JobInfo label="Education" value={detail.education || "Any"} />
              <JobInfo label="Department" value={detail.department} />
              <JobInfo label="Job type" value={detail.job_type} />
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}

export default CandidateJobs;
