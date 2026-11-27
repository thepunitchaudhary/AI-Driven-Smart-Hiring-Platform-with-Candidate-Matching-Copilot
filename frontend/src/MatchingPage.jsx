import { useState, useEffect } from "react";
import {
  Award, ClipboardCheck, Search, Target, TrendingUp, Users,
} from "lucide-react";
import { getJobs, getMatches, getSkillGap, setApplicationStatus } from "./api";
import { toast } from "./components/toast";
import {
  Avatar, Badge, EmptyState, Gauge, SignalStrip, SkeletonRows, StudioHead,
} from "./components/ui";

function barClass(percent) {
  if (percent >= 100) return "full";
  if (percent >= 66) return "mid";
  return "low";
}

function MatchingPage({ initialJobId }) {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(initialJobId || "");
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [gap, setGap] = useState(null);
  const [engine, setEngine] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("score");
  const [loading, setLoading] = useState(true);
  const [gapLoading, setGapLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    getJobs("approved").then((list) => {
      setJobs(list);
      if (!jobId && list.length > 0) setJobId(list[0].job_id);
    }).catch((err) => setError(err.message)).finally(() => setJobsLoading(false));
  }, []);

  async function loadMatches() {
    if (!jobId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await getMatches(jobId);
      setMatches(data.matches);
      setEngine(data.engine);
      setSelected((current) => (data.matches.some((m) => m.candidate_id === current) ? current : (data.matches[0] ? data.matches[0].candidate_id : null)));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMatches(); }, [jobId]);

  useEffect(() => {
    if (!jobId || !selected) { setGap(null); setGapLoading(false); return undefined; }
    let active = true;
    setGap(null);
    setGapLoading(true);
    getSkillGap(jobId, selected)
      .then((data) => { if (active) setGap(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setGapLoading(false); });
    return () => { active = false; };
  }, [jobId, selected]);

  async function changeStatus(e, applicationId, status) {
    e.stopPropagation();
    try {
      await setApplicationStatus(applicationId, status);
      toast(status === "shortlisted" ? "Candidate shortlisted." : "Candidate rejected.", "success");
      loadMatches();
    } catch (err) {
      setError(err.message);
      toast(err.message, "danger");
    }
  }

  const q = query.trim().toLowerCase();
  const visible = matches
    .filter((m) => {
      if (!q) return true;
      return (m.name || "").toLowerCase().includes(q) || (m.skills || []).join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => (sort === "name" ? (a.name || "").localeCompare(b.name || "") : b.score - a.score));

  const scores = matches.map((m) => Number(m.score) || 0);
  const best = scores.length ? Math.max(...scores) : 0;
  const average = scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0;
  const applied = matches.filter((m) => m.application_id).length;
  const selectedMatch = matches.find((m) => m.candidate_id === selected) || null;

  return (
    <>
      <StudioHead
        kicker="AI matching"
        title="Match Studio"
        sub="Rank every candidate against a live requisition, inspect the skill gap, and move the strongest profiles into the pipeline."
        actions={(
          <label className="studio-role">
            <span>Requisition</span>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              disabled={jobsLoading || jobs.length === 0}
              aria-label="Select job position"
            >
              {jobs.length === 0 && <option value="">{jobsLoading ? "Loading roles…" : "No approved roles"}</option>}
              {jobs.map((j) => <option key={j.job_id} value={j.job_id}>{j.title}{j.city ? " — " + j.city : ""}</option>)}
            </select>
          </label>
        )}
      />

      {error && <div className="alert" role="alert">{error}</div>}

      {jobsLoading ? (
        <div className="ed-loading"><SkeletonRows rows={5} /></div>
      ) : jobs.length === 0 ? (
        <section className="studio-empty">
          <EmptyState
            Icon={Target}
            title="No approved jobs yet"
            text="Post a job and ask the admin to approve it. Once approved, ranked candidate matches will appear here."
          />
        </section>
      ) : (
        <>
          <SignalStrip
            loading={loading && matches.length === 0}
            items={[
              { label: "Ranked candidates", value: matches.length, Icon: Users, tone: "brand" },
              { label: "Best match", value: best + "%", Icon: Award, tone: "success" },
              { label: "Average match", value: average + "%", Icon: TrendingUp, tone: "ai" },
              { label: "In pipeline", value: applied, Icon: ClipboardCheck, tone: "lime" },
            ]}
          />

          <div className="studio">
            <aside className="studio-rail">
              <div className="studio-rail-head">
                <div>
                  <span className="ed-kicker">Ranked shortlist</span>
                  <h2 className="ed-h3">{matches.length} candidates</h2>
                </div>
                {engine ? <span className="studio-engine">Engine · {engine}</span> : null}
              </div>

              <div className="studio-tools">
                <div className="search">
                  <Search size={15} />
                  <input
                    placeholder="Search name or skill"
                    aria-label="Search matches"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select className="studio-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort matches">
                  <option value="score">Best match</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <div className="studio-list">
                {loading && matches.length === 0 ? (
                  <SkeletonRows rows={4} />
                ) : visible.length === 0 ? (
                  <EmptyState
                    Icon={Search}
                    title={matches.length === 0 ? "No candidates yet" : "No matches for this search"}
                    text={matches.length === 0 ? "Upload resumes to populate the matching engine." : "Try a different name or skill."}
                  />
                ) : (
                  visible.map((m, index) => (
                    <div
                      key={m.candidate_id}
                      className={selected === m.candidate_id ? "studio-item active" : "studio-item"}
                      onClick={() => setSelected(m.candidate_id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) setSelected(m.candidate_id); }}
                    >
                      <span className="studio-rank">{String(index + 1).padStart(2, "0")}</span>
                      <div className="studio-item-body">
                        <div className="studio-item-top">
                          <strong>{m.name || "Unknown"}</strong>
                          <span className="studio-score">{Math.round(Number(m.score) || 0)}%</span>
                        </div>
                        <div className="studio-item-skills">
                          {(m.skills || []).slice(0, 4).map((s) => <span className="chip" key={s}>{s}</span>)}
                        </div>
                        <div className="studio-item-bar"><i style={{ width: Math.max(0, Math.min(100, Number(m.score) || 0)) + "%" }} /></div>
                        {m.application_id && (
                          <div className="studio-item-actions">
                            <Badge tone={m.application_status === "shortlisted" ? "success" : m.application_status === "rejected" ? "danger" : "warn"}>
                              Applied · {m.application_status}
                            </Badge>
                            <button type="button" className="studio-act" onClick={(e) => changeStatus(e, m.application_id, "shortlisted")}>
                              Shortlist
                            </button>
                            <button type="button" className="studio-act danger" onClick={(e) => changeStatus(e, m.application_id, "rejected")}>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>

            <section className="studio-stage">
              {gapLoading ? (
                <SkeletonRows rows={5} />
              ) : !gap ? (
                <EmptyState
                  Icon={TrendingUp}
                  title="Select a candidate"
                  text="Pick a candidate from the ranked list to see how their skills compare with the role."
                />
              ) : (
                <>
                  <header className="studio-stage-head">
                    <div className="studio-stage-id">
                      <Avatar name={gap.candidate} size={56} />
                      <div>
                        <span className="ed-kicker">Selected candidate</span>
                        <h2 className="ed-h2">{gap.candidate}</h2>
                        <p>{selectedMatch ? (selectedMatch.skills || []).slice(0, 4).join(" · ") || "Candidate profile" : "Selected candidate"}</p>
                      </div>
                    </div>
                    <Gauge value={gap.score} size={124} label="Match" />
                  </header>

                  <div className="studio-reco">
                    <Badge tone={gap.score >= 65 ? "success" : gap.score >= 50 ? "warn" : "danger"}>{gap.recommendation}</Badge>
                    <p>{gap.summary}</p>
                  </div>

                  <div className="studio-gap">
                    <div className="studio-gap-head">
                      <span className="ed-kicker">Skill comparison</span>
                      <span>Required vs. preferred</span>
                    </div>
                    {gap.skills.map((s) => (
                      <div className="studio-gap-row" key={s.skill + s.type}>
                        <div className="studio-gap-top">
                          <span>{s.skill}</span>
                          <span>
                            <em className={s.type === "Required" ? "tag-required" : "tag-preferred"}>{s.type}</em>
                            <b>{s.level}</b>
                          </span>
                        </div>
                        <div className="studio-gap-track">
                          <i className={barClass(s.percent)} style={{ width: s.percent + "%" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {gap.recommended_courses?.length > 0 && (
                    <div className="studio-courses">
                      <span className="ed-kicker">Recommended next</span>
                      <ol>
                        {gap.recommended_courses.map((course, index) => (
                          <li key={course}>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            {course}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <small className="studio-note">Skill levels are estimated from the resume.</small>
                </>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}

export default MatchingPage;
