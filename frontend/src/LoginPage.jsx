import { useState } from "react";
import { Briefcase, ShieldCheck, User, LogIn, FileText, Users, BarChart3 } from "lucide-react";
import { login, register } from "./api";

const PORTALS = [
  { id: "recruiter", label: "Recruiter", icon: Briefcase, text: "Upload resumes, review candidates and manage job postings", email: "recruiter@demo.com" },
  { id: "hr", label: "HR Manager", icon: ShieldCheck, text: "View hiring analytics, approve candidates and get reports", email: "hr@demo.com" },
  { id: "candidate", label: "Candidate", icon: User, text: "Upload your resume and build your candidate profile", email: "candidate@demo.com" },
];

function LoginPage({ onLogin }) {
  const [role, setRole] = useState("recruiter");
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const portal = PORTALS.find((p) => p.id === role);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = signup
        ? await register(name, email, password, role)
        : await login(email, password, role);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot connect to the backend" : err.message);
    }
    setLoading(false);
  }

  function fillDemo() {
    setSignup(false);
    setEmail(portal.email);
    setPassword("demo123");
  }

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="brand light"><span className="logo">RC</span> Recruitment Copilot</div>
        <h1>AI-Driven Smart Hiring Platform</h1>
        <p>Automate resume screening, candidate matching and interviews with AI.</p>
        <ul>
          <li><FileText size={18} /> Resume parsing for PDF and DOCX</li>
          <li><Users size={18} /> Structured candidate profiles</li>
          <li><BarChart3 size={18} /> Recruitment analytics dashboard</li>
        </ul>
      </div>

      <div className="login-side">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>{signup ? "Create account" : "Welcome back"}</h2>
          <p className="sub">Choose your portal to continue</p>

          <div className="portal-tabs">
            {PORTALS.map((p) => (
              <button type="button" key={p.id}
                className={role === p.id ? "portal active" : "portal"}
                onClick={() => { setRole(p.id); setError(""); }}>
                <p.icon size={20} />
                {p.label}
              </button>
            ))}
          </div>
          <p className="portal-text">{portal.text}</p>

          {signup && (
            <label>Full name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </label>
          )}
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
          </label>

          {error && <div className="alert">{error}</div>}

          <button className="btn wide-btn" disabled={loading}>
            <LogIn size={16} /> {loading ? "Please wait..." : signup ? "Create " + portal.label + " account" : "Sign in as " + portal.label}
          </button>

          <div className="login-links">
            <button type="button" className="link" onClick={() => { setSignup(!signup); setError(""); }}>
              {signup ? "Already have an account? Sign in" : "New here? Create account"}
            </button>
            <button type="button" className="link" onClick={fillDemo}>Use demo account</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
