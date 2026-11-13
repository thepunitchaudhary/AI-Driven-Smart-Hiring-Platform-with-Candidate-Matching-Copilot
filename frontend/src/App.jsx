import { useState, useEffect } from "react";
import { LayoutDashboard, FileUp, Users, Search, FileText, Percent, CheckCheck, Sparkles, Briefcase, BarChart3, Settings, LogOut } from "lucide-react";
import { getCandidates, getStats, deleteCandidate } from "./api";
import LoginPage from "./LoginPage";
import UploadPage from "./UploadPage";
import CandidateTable from "./CandidateTable";

const ALL_NAV = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  upload: { label: "Resume Upload", icon: FileUp },
  candidates: { label: "Candidates", icon: Users },
  jobs: { label: "Job Postings", icon: Briefcase },
  analytics: { label: "Analytics", icon: BarChart3 },
  settings: { label: "Settings", icon: Settings },
};

const ROLE_PAGES = {
  recruiter: ["dashboard", "upload", "candidates", "jobs", "settings"],
  hr: ["dashboard", "candidates", "analytics", "settings"],
  candidate: ["upload"],
};

const ROLE_NAMES = { recruiter: "Recruiter", hr: "HR Manager", candidate: "Candidate" };

const TITLES = {
  dashboard: ["Dashboard", "Overview of your resume parsing activity"],
  upload: ["Resume Parsing & Candidate Profiling", "Upload and process resumes to create structured candidate profiles"],
  candidates: ["Candidates", "Search and manage all parsed candidate profiles"],
  jobs: ["Job Postings", "Job description analysis will be added in a later milestone"],
  analytics: ["Analytics", "Hiring analytics will be added in a later milestone"],
  settings: ["Settings", "Application settings"],
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

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(readUser());
  const [page, setPage] = useState("upload");
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
    if (!user || user.role === "candidate") return;
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
  const canDelete = user.role === "recruiter";
  const title = user.role === "candidate"
    ? ["Upload Your Resume", "Upload your resume to create your candidate profile"]
    : TITLES[page];

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
              <button key={id} className={page === id ? "nav-item active" : "nav-item"} onClick={() => setPage(id)}>
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
        <header className="page-head">
          <div>
            <h1>{title[0]}</h1>
            <p>{title[1]}</p>
          </div>
          <span className="pill">Milestone 1</span>
        </header>

        {error && <div className="alert">{error}</div>}

        {page === "dashboard" && (
          <>
            <StatCards stats={stats} />
            <section className="card">
              <h2>Recent Candidates</h2>
              <CandidateTable rows={candidates.slice(0, 8)} onDelete={canDelete ? handleDelete : null} />
            </section>
          </>
        )}

        {page === "upload" && (
          <UploadPage role={user.role} stats={stats} candidates={candidates} onChange={load}
            onDelete={canDelete ? handleDelete : null} />
        )}

        {["jobs", "analytics", "settings"].includes(page) && (
          <section className="card">
            <p className="empty">This section will be built in a later milestone.</p>
          </section>
        )}

        {page === "candidates" && (
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
