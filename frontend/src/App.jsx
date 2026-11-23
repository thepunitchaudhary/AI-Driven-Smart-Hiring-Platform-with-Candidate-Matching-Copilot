import { useState, useEffect } from "react";
import { LayoutDashboard, FileUp, Users, Search, FileText, Percent, CheckCheck, Sparkles, Briefcase, BarChart3, Settings, LogOut, UserCheck } from "lucide-react";
import { getCandidates, getStats, deleteCandidate } from "./api";
import LoginPage from "./LoginPage";
import UploadPage from "./UploadPage";
import CandidateTable from "./CandidateTable";
import ApprovalsPage from "./ApprovalsPage";

const ALL_NAV = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  upload: { label: "Resume Upload", icon: FileUp },
  candidates: { label: "Candidates", icon: Users },
  jobs: { label: "Job Postings", icon: Briefcase },
  analytics: { label: "Analytics", icon: BarChart3 },
  settings: { label: "Settings", icon: Settings },
  approvals: { label: "User Approvals", icon: UserCheck },
};

const ROLE_PAGES = {
  hr: ["dashboard", "upload", "candidates", "jobs", "analytics", "settings"],
  candidate: ["upload"],
  admin: ["approvals"],
};

const ROLE_NAMES = { hr: "HR Manager", candidate: "Candidate", admin: "Admin" };

const TITLES = {
  dashboard: ["Dashboard", "Overview of your resume parsing activity"],
  upload: ["Resume Parsing & Candidate Profiling", "Upload and process resumes to create structured candidate profiles"],
  candidates: ["Candidates", "Search and manage all parsed candidate profiles"],
  jobs: ["Job Postings", "Job description analysis will be added in a later milestone"],
  analytics: ["Analytics", "Hiring analytics will be added in a later milestone"],
  settings: ["Settings", "Application settings"],
  approvals: ["User Approvals", "Approve or reject new account requests"],
};

function StatCards({ stats }) {
  const cards = [
    { label: "Resumes Processed", value: stats.total, icon: FileText },
    { label: "Fields Found", value: stats.average_accuracy + "%", icon: Percent },
    { label: "Complete Profiles", value: stats.complete_profiles, icon: CheckCheck },
    { label: "Unique Skills Found", value: stats.unique_skills, icon: Sparkles },
  ];
  return (
    <div className="stat-grid">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <span className="stat-icon"><c.icon size={20} /></span>
          <div><small>{c.label}</small><strong>{c.value}</strong></div>
        </div>
      ))}
    </div>
  );
}

function TopSkills({ candidates }) {
  const counts = {};
  candidates.forEach((c) => c.skills.forEach((k) => { counts[k] = (counts[k] || 0) + 1; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = top.length ? top[0][1] : 1;
  return (
    <section className="card">
      <h2>Top skills</h2>
      {top.length === 0 && <p className="empty">Skills appear here once resumes are parsed.</p>}
      {top.map(([name, n]) => (
        <div className="bar-row" key={name}>
          <span>{name}</span>
          <div className="bar"><div style={{ width: (n / max) * 100 + "%" }} /></div>
          <b>{n}</b>
        </div>
      ))}
    </section>
  );
}

function Quality({ candidates }) {
  const groups = [
    { label: "Complete", color: "var(--accent)", n: candidates.filter((c) => c.accuracy === 100).length },
    { label: "Mostly complete", color: "var(--gold)", n: candidates.filter((c) => c.accuracy >= 67 && c.accuracy < 100).length },
    { label: "Needs review", color: "var(--red)", n: candidates.filter((c) => c.accuracy < 67).length },
  ];
  const total = candidates.length || 1;
  return (
    <section className="card">
      <h2>Profile quality</h2>
      <div className="stack">{groups.map((g) => <div key={g.label} style={{ width: (g.n / total) * 100 + "%", background: g.color }} />)}</div>
      {groups.map((g) => (
        <div className="legend" key={g.label}><i style={{ background: g.color }} />{g.label}<b>{g.n}</b></div>
      ))}
    </section>
  );
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(readUser());
  const [page, setPage] = useState(() => {
    const saved = readUser();
    return saved ? ROLE_PAGES[saved.role][0] : "upload";
  });
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({ total: 0, average_accuracy: 0, complete_profiles: 0, unique_skills: 0 });
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
  }

  async function load() {
    if (!user || user.role !== "hr") return;
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
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this candidate?")) return;
    await deleteCandidate(id);
    load();
  }

  useEffect(() => { load(); }, [user]);

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const pages = ROLE_PAGES[user.role];
  const current = pages.includes(page) ? page : pages[0];
  const canDelete = user.role === "hr";
  const title = user.role === "candidate"
    ? ["Upload Your Resume", "Upload your resume to create your candidate profile"]
    : TITLES[current];

  const filtered = candidates.filter((c) => {
    const text = (c.name + " " + c.email + " " + c.skills.join(" ")).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand"><span className="logo">RC</span> Recruitment Copilot</div>
        <nav>
          {pages.map((id) => {
            const Icon = ALL_NAV[id].icon;
            return (
              <button key={id} className={current === id ? "nav-item active" : "nav-item"} onClick={() => setPage(id)}>
                <Icon size={18} /> {user.role === "candidate" && id === "upload" ? "My Resume" : ALL_NAV[id].label}
              </button>
            );
          })}
        </nav>
        <div className="user-box">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{user.name}</strong><small>{ROLE_NAMES[user.role]}</small></div>
          <button className="icon-btn" title="Log out" onClick={handleLogout}><LogOut size={18} /></button>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <div className="crumbs">Recruitment Copilot <span>/</span> <b>{title[0]}</b></div>
          {user.role === "hr" && (
            <div className="search top-search">
              <Search size={16} />
              <input placeholder="Search candidates by name, email or skill" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage("candidates"); }} />
            </div>
          )}
          {user.role === "hr" && current !== "upload" && (
            <button className="btn" onClick={() => setPage("upload")}><FileUp size={16} /> Upload resumes</button>
          )}
        </div>
        <header className="page-head">
          <div>
            <h1>{title[0]}</h1>
            <p>{title[1]}</p>
          </div>
          
        </header>

        {error && <div className="alert">{error}</div>}

        {current === "dashboard" && (
          <>
            <StatCards stats={stats} />
            <div className="grid-2"><TopSkills candidates={candidates} /><Quality candidates={candidates} /></div>
            <section className="card">
              <h2>Recent Candidates</h2>
              <CandidateTable rows={candidates.slice(0, 8)} onDelete={canDelete ? handleDelete : null} />
            </section>
          </>
        )}

        {current === "upload" && (
          <UploadPage role={user.role} stats={stats} candidates={candidates} onChange={load}
            onDelete={canDelete ? handleDelete : null} />
        )}

        {["jobs", "analytics", "settings"].includes(current) && (
          <section className="card">
            <p className="empty">This section will be built in a later milestone.</p>
          </section>
        )}

        {current === "approvals" && <ApprovalsPage />}

        {current === "candidates" && (
          <section className="card">
            <div className="toolbar">
              <h2>All Candidates ({filtered.length})</h2>
              <div className="search">
                <Search size={16} />
                <input placeholder="Search by name, email or skill" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <CandidateTable rows={filtered} onDelete={canDelete ? handleDelete : null} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
