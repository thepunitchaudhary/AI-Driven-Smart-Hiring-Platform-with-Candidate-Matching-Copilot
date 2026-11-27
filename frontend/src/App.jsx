import { useState, useEffect } from "react";
import {
  LayoutDashboard, UploadCloud, Users, Search, FileText, Percent, CheckCheck,
  Sparkles, Briefcase, BarChart3, Settings, LogOut, UserCheck, Target, Menu,
  ChevronRight, X, Layers,
} from "lucide-react";
import { getCandidates, getStats, deleteCandidate } from "./api";
import LoginPage from "./LoginPage";
import UploadPage from "./UploadPage";
import CandidateTable from "./CandidateTable";
import ApprovalsPage from "./ApprovalsPage";
import JobsPage from "./JobsPage";
import MatchingPage from "./MatchingPage";
import CandidateJobs from "./CandidateJobs";
import ResetPassword from "./ResetPassword";
import { Toaster, toast } from "./components/toast";
import {
  Avatar, Button, Card, EmptyState, Gauge, SignalStrip, Skeleton, SkeletonBars,
  SkeletonRows, StudioHead,
} from "./components/ui";

const ALL_NAV = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  upload: { label: "Resume Upload", icon: UploadCloud },
  candidates: { label: "Candidates", icon: Users },
  jobs: { label: "Job Postings", icon: Briefcase },
  analytics: { label: "Analytics", icon: BarChart3 },
  settings: { label: "Settings", icon: Settings },
  approvals: { label: "User Approvals", icon: UserCheck },
  matching: { label: "Matching", icon: Target },
  openjobs: { label: "Open Jobs", icon: Briefcase },
};

const ROLE_PAGES = {
  hr: ["dashboard", "upload", "candidates", "jobs", "matching", "analytics", "settings"],
  candidate: ["upload", "openjobs"],
  admin: ["approvals", "dashboard", "jobs", "matching", "upload", "candidates"],
};

const NAV_GROUPS = {
  hr: [
    { label: "Workspace", ids: ["dashboard", "candidates", "jobs", "matching"] },
    { label: "Intake", ids: ["upload"] },
    { label: "Insights", ids: ["analytics", "settings"] },
  ],
  admin: [
    { label: "Workspace", ids: ["dashboard", "candidates", "jobs", "matching"] },
    { label: "Intake", ids: ["upload"] },
    { label: "Administration", ids: ["approvals"] },
  ],
  candidate: [{ label: "My Portal", ids: ["upload", "openjobs"] }],
};

const ROLE_NAMES = { hr: "HR Manager", candidate: "Candidate", admin: "Admin" };

const TITLES = {
  dashboard: ["Dashboard", "Overview of your resume parsing activity"],
  upload: ["Resume Parsing & Candidate Profiling", "Upload and process resumes to create structured candidate profiles"],
  candidates: ["Candidates", "Search and manage all parsed candidate profiles"],
  jobs: ["Job Postings", "Post jobs, send them for approval and track applicants"],
  analytics: ["Analytics", "Hiring analytics will be added in a later milestone"],
  settings: ["Settings", "Application settings"],
  approvals: ["User Approvals", "Approve or reject new account requests"],
  matching: ["Matching & Skill Analysis", "Candidate-job matching and skill-gap analysis"],
  openjobs: ["Open Jobs", "Jobs you can apply for"],
};

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    return null;
  }
}

function StatCards({ stats, loading }) {
  const completeShare = stats.total ? Math.round((stats.complete_profiles / stats.total) * 100) : 0;
  return (
    <SignalStrip
      loading={loading}
      items={[
        { label: "Resumes processed", value: stats.total, hint: "Profiles in your library", Icon: FileText, tone: "brand" },
        { label: "Profile completeness", value: stats.average_accuracy + "%", hint: "Average fields captured", Icon: Percent, tone: "ai" },
        { label: "Complete profiles", value: stats.complete_profiles, hint: completeShare + "% of your library", Icon: CheckCheck, tone: "success" },
        { label: "Unique skills", value: stats.unique_skills, hint: "Discovered across resumes", Icon: Sparkles, tone: "lime" },
      ]}
    />
  );
}

function HeroBand({ user, stats, role, go, loading }) {
  const first = (user.name || "there").split(" ")[0];
  return (
    <section className="ed-hero">
      <div className="ed-hero-aurora" aria-hidden="true" />
      <div className="ed-hero-body">
        <span className="ed-kicker"><Sparkles size={12} /> Copilot workspace</span>
        <h1 className="ed-hero-title">Welcome back,<br /><em>{first}.</em></h1>
        <p className="ed-hero-sub">
          {loading
            ? "Loading your workspace\u2026"
            : stats.total
              ? <>Your library holds <b>{stats.total}</b> parsed profiles with <b>{stats.average_accuracy}%</b> average completeness. Keep the pipeline moving.</>
              : "Start by uploading your first resumes \u2014 Copilot turns them into structured, searchable candidate profiles."}
        </p>
        <div className="ed-hero-actions">
          <Button size="sm" Icon={UploadCloud} onClick={() => go("upload")}>Upload resumes</Button>
          <Button size="sm" variant="secondary" Icon={Briefcase} onClick={() => go("jobs")}>Post a job</Button>
          <Button size="sm" variant="ghost" Icon={Target} onClick={() => go("matching")}>Review matches</Button>
          {role === "admin" && (
            <Button size="sm" variant="ghost" Icon={UserCheck} onClick={() => go("approvals")}>Approve accounts</Button>
          )}
        </div>
        <div className="ed-hero-foot">
          <span><b>{loading ? "\u2014" : stats.total}</b>Profiles</span>
          <span><b>{loading ? "\u2014" : stats.complete_profiles}</b>Complete</span>
          <span><b>{loading ? "\u2014" : stats.unique_skills}</b>Skills indexed</span>
        </div>
      </div>
      <aside className="ed-hero-aside">
        {loading ? <Skeleton className="sk-donut" /> : <Gauge value={stats.average_accuracy || 0} size={176} label="Complete" />}
        <span className="ed-hero-caption">Average profile completeness</span>
      </aside>
    </section>
  );
}

function TopSkills({ candidates, loading }) {
  const counts = {};
  candidates.forEach((c) => (c.skills || []).forEach((k) => { counts[k] = (counts[k] || 0) + 1; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = top.length ? top[0][1] : 1;
  return (
    <section className="ed-panel ed-panel-skills">
      <header className="ed-panel-head">
        <span className="ed-kicker">Skill index</span>
        <h2 className="ed-h3">Most in demand</h2>
        <p className="ed-panel-sub">The capabilities appearing most across your library.</p>
      </header>
      {loading ? (
        <SkeletonBars rows={5} />
      ) : top.length === 0 ? (
        <EmptyState Icon={Sparkles} title="No skills yet" text="Skills appear here once resumes are parsed." />
      ) : (
        <div className="skill-index">
          {top.map(([name, n], index) => (
            <div className="skill-row" key={name}>
              <span className="skill-rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="skill-name" title={name}>{name}</span>
              <span className="skill-track"><i style={{ width: (n / max) * 100 + "%" }} /></span>
              <b className="skill-count">{n}</b>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Quality({ candidates, loading }) {
  const total = candidates.length;
  const complete = candidates.filter((c) => c.accuracy === 100).length;
  const mostly = candidates.filter((c) => c.accuracy >= 67 && c.accuracy < 100).length;
  const low = candidates.filter((c) => c.accuracy < 67).length;

  const a = total ? (complete / total) * 100 : 0;
  const b = total ? ((complete + mostly) / total) * 100 : 0;
  const gradient = total
    ? "conic-gradient(var(--success) 0 " + a + "%, var(--warn) " + a + "% " + b + "%, var(--danger) " + b + "% 100%)"
    : "conic-gradient(var(--line) 0 100%)";

  const groups = [
    { label: "Complete", color: "var(--success)", n: complete },
    { label: "Mostly complete", color: "var(--warn)", n: mostly },
    { label: "Needs review", color: "var(--danger)", n: low },
  ];

  return (
    <section className="ed-panel ed-panel-quality">
      <header className="ed-panel-head">
        <span className="ed-kicker">Record health</span>
        <h2 className="ed-h3">Profile quality</h2>
      </header>
      {loading ? (
        <div className="ed-quality">
          <Skeleton className="sk-donut" />
          <div className="legend-list"><SkeletonBars rows={3} /></div>
        </div>
      ) : total === 0 ? (
        <EmptyState Icon={CheckCheck} title="No profiles yet" text="Quality insights appear after your first upload." />
      ) : (
        <div className="ed-quality">
          <div className="donut" style={{ background: gradient }}>
            <div className="donut-hole">
              <strong>{Math.round(a)}%</strong>
              <small>Complete</small>
            </div>
          </div>
          <div className="legend-list">
            {groups.map((g) => (
              <div className="legend" key={g.label}>
                <i style={{ background: g.color }} />
                {g.label}
                <b>{g.n}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Coverage({ candidates, loading }) {
  const total = candidates.length;
  const fields = [
    { label: "Contact details", count: candidates.filter((c) => c.email || c.phone).length },
    { label: "Skills", count: candidates.filter((c) => (c.skills || []).length > 0).length },
    { label: "Education", count: candidates.filter((c) => (c.education || []).length > 0).length },
    { label: "Experience", count: candidates.filter((c) => Boolean(c.experience)).length },
    { label: "Projects", count: candidates.filter((c) => (c.projects || []).length > 0).length },
    { label: "Certifications", count: candidates.filter((c) => (c.certifications || []).length > 0).length },
  ];

  return (
    <section className="ed-panel ed-panel-coverage">
      <header className="ed-panel-head">
        <span className="ed-kicker">Data coverage</span>
        <h2 className="ed-h3">Fields captured</h2>
        <p className="ed-panel-sub">How often each resume field is extracted.</p>
      </header>
      {loading ? (
        <SkeletonBars rows={6} />
      ) : total === 0 ? (
        <EmptyState Icon={Layers} title="No fields yet" text="Coverage shows which resume fields are being captured." />
      ) : (
        <div className="cov-list">
          {fields.map((field) => {
            const percent = Math.round((field.count / total) * 100);
            return (
              <div className="cov-item" key={field.label}>
                <div className="cov-top">
                  <span>{field.label}</span>
                  <b>{percent}%<em>{field.count}/{total}</em></b>
                </div>
                <div className="cov-track"><i style={{ width: percent + "%" }} /></div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function App() {
  const [user, setUser] = useState(readUser());
  const [page, setPage] = useState(() => {
    const saved = readUser();
    return saved ? (ROLE_PAGES[saved.role] || ROLE_PAGES.candidate)[0] : "upload";
  });
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({ total: 0, average_accuracy: 0, complete_profiles: 0, unique_skills: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [matchJob, setMatchJob] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetToken, setResetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("reset") || params.get("token") || params.get("reset_token");
  });

  function handleLogin(token, loggedUser) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(loggedUser));
    setUser(loggedUser);
    setPage(ROLE_PAGES[loggedUser.role][0]);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCandidates([]);
    setMenuOpen(false);
  }

  async function load() {
    if (!user || !["hr", "admin"].includes(user.role)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([getCandidates(), getStats()]);
      setCandidates(list);
      setStats(summary);
      setError("");
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
      } else {
        setError("Cannot connect to the backend. Make sure uvicorn is running on port 8000.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this candidate?")) return;
    try {
      await deleteCandidate(id);
      toast("Candidate deleted.", "success");
      load();
    } catch (err) {
      toast(err.message || "Could not delete this candidate.", "danger");
    }
  }

  useEffect(() => { load(); }, [user]);

  function go(next) {
    setPage(next);
    setMenuOpen(false);
  }

  if (resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onDone={() => {
          window.history.replaceState({}, "", window.location.pathname);
          setResetToken(null);
        }}
      />
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const pages = ROLE_PAGES[user.role] || ROLE_PAGES.candidate;
  const current = pages.includes(page) ? page : pages[0];
  const staff = ["hr", "admin"].includes(user.role);
  const canDelete = staff;
  const groups = (NAV_GROUPS[user.role] || NAV_GROUPS.candidate)
    .map((group) => ({ ...group, ids: group.ids.filter((id) => pages.includes(id)) }))
    .filter((group) => group.ids.length > 0);
  const title = user.role === "candidate" && current === "upload"
    ? ["Upload Your Resume", "Upload your resume to create your candidate profile"]
    : TITLES[current];
  const ownsHeader = ["dashboard", "candidates", "jobs", "matching", "openjobs"].includes(current);

  const filtered = candidates.filter((c) => {
    const text = ((c.name || "") + " " + (c.email || "") + " " + (c.skills || []).join(" ")).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="app-shell">
      <aside className={"sidebar" + (menuOpen ? " open" : "")}>
        <div className="side-aurora" aria-hidden="true" />
        <div className="brand">
          <span className="logo"><Sparkles size={19} /></span>
          <div className="brand-text">
            <strong>Recruitment Copilot</strong>
            <small><i className="live-dot" />AI hiring workspace</small>
          </div>
          <button type="button" className="icon-btn sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.ids.map((id) => {
                const Item = ALL_NAV[id];
                const Icon = Item.icon;
                const label = user.role === "candidate" && id === "upload" ? "My Resume" : Item.label;
                return (
                  <button
                    key={id}
                    type="button"
                    className={current === id ? "nav-item active" : "nav-item"}
                    onClick={() => go(id)}
                    aria-current={current === id ? "page" : undefined}
                    title={label}
                  >
                    <Icon size={18} />
                    <span className="nav-text">{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="side-edition">Obsidian edition</span>
          <div className="user-card">
            <Avatar name={user.name} size={34} />
            <div className="user-meta">
              <strong className="user-name">{user.name}</strong>
              <span className="user-role">{ROLE_NAMES[user.role]}</span>
            </div>
            <button type="button" className="icon-btn danger" title="Log out" aria-label="Log out" onClick={handleLogout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {menuOpen ? <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" /> : null}

      <div className="app-main">
        <header className={"topbar" + (staff ? " topbar-staff" : "")}>
          <button type="button" className="icon-btn menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open navigation">
            <Menu size={19} />
          </button>
          <div className="crumbs">
            <span>Recruitment Copilot</span>
            <ChevronRight size={13} />
            <b>{title[0]}</b>
          </div>
          <div className="topbar-actions">
            {staff && (
              <div className="search topbar-search">
                <Search size={15} />
                <input
                  placeholder="Search candidates"
                  aria-label="Search candidates by name, email or skill"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); go("candidates"); }}
                />
              </div>
            )}
            {staff && current !== "upload" && (
              <Button size="sm" Icon={UploadCloud} onClick={() => go("upload")}>Upload resumes</Button>
            )}
          </div>
        </header>

        <main className="page" key={current}>
          {!ownsHeader && (
            <header className="page-head">
              <div>
                <h1>{title[0]}</h1>
                <p>{title[1]}</p>
              </div>
            </header>
          )}

          {error && <div className="alert" role="alert">{error}</div>}

          {current === "dashboard" && (
            <>
              <HeroBand user={user} stats={stats} role={user.role} go={go} loading={loading} />
              <StatCards stats={stats} loading={loading} />
              <div className="ed-bento">
                <TopSkills candidates={candidates} loading={loading} />
                <Quality candidates={candidates} loading={loading} />
                <Coverage candidates={candidates} loading={loading} />
              </div>
              <section className="ed-section">
                <div className="ed-section-head">
                  <div>
                    <span className="ed-kicker">Latest intake</span>
                    <h2 className="ed-h2">Recent talent</h2>
                  </div>
                  {candidates.length > 8 && (
                    <Button variant="secondary" size="sm" onClick={() => go("candidates")}>View all candidates</Button>
                  )}
                </div>
                {loading && candidates.length === 0
                  ? <SkeletonRows rows={5} />
                  : <CandidateTable variant="compact" rows={candidates.slice(0, 8)} onDelete={canDelete ? handleDelete : null} />}
              </section>
            </>
          )}

          {current === "upload" && (
            <UploadPage role={user.role} stats={stats} candidates={candidates} onChange={load}
              onDelete={canDelete ? handleDelete : null} />
          )}

          {["analytics", "settings"].includes(current) && (
            <Card>
              <EmptyState
                Icon={current === "analytics" ? BarChart3 : Settings}
                title="Coming in the next milestone"
                text={current === "analytics"
                  ? "Hiring funnel, time-to-hire and source analytics will appear here."
                  : "Workspace preferences, notifications and team access will appear here."}
              />
            </Card>
          )}

          {current === "approvals" && <ApprovalsPage />}

          {current === "jobs" && (
            <JobsPage role={user.role} userId={user.user_id}
              onViewMatches={(id) => { setMatchJob(id); go("matching"); }} />
          )}

          {current === "matching" && <MatchingPage key={matchJob} initialJobId={matchJob} />}

          {current === "openjobs" && <CandidateJobs goToResume={() => go("upload")} />}

          {current === "candidates" && (
            <>
              <StudioHead
                kicker="Talent library"
                title="Candidates"
                sub={search
                  ? "Filtered by \u201c" + search + "\u201d \u00b7 " + filtered.length + " of " + candidates.length + " profiles"
                  : candidates.length + " structured profiles, ready to review and compare."}
                actions={(
                  <div className="ed-search">
                    <Search size={15} />
                    <input
                      placeholder="Search by name, email or skill"
                      aria-label="Search candidates"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                )}
              />
              {loading && candidates.length === 0
                ? <SkeletonRows rows={6} />
                : <CandidateTable variant="gallery" rows={filtered} onDelete={canDelete ? handleDelete : null} />}
            </>
          )}
        </main>
      </div>

      <Toaster />
    </div>
  );
}

export default App;
