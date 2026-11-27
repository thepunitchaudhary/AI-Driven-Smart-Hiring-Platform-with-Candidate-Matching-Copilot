import { useState } from "react";
import {
  Briefcase, User, UserCog, LogIn, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ShieldCheck, Target, KeyRound,
} from "lucide-react";
import { login, register, forgotPassword } from "./api";
import { Button } from "./components/ui";

const PORTALS = [
  { id: "hr", label: "HR Manager", icon: Briefcase, text: "Upload resumes, review candidates and manage job postings" },
  { id: "candidate", label: "Candidate", icon: User, text: "Upload your resume and build your candidate profile" },
  { id: "admin", label: "Admin", icon: UserCog, text: "Approve accounts and job posts, and manage candidates" },
];

const STEPS = [
  ["Upload a resume", "PDF or DOCX, one or many at a time. You can also type the details in."],
  ["Review what was found", "Name, contact details, skills, education and experience."],
  ["Search your candidates", "Find people by name, email or skill."],
];

function LoginPage({ onLogin }) {
  const [role, setRole] = useState("hr");
  const [signup, setSignup] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const portal = PORTALS.find((p) => p.id === role);

  function reset() {
    setError("");
    setNotice("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      if (forgot) {
        const data = await forgotPassword(email);
        setNotice(data?.message || "If that email is registered, a password reset link has been sent. It works for 30 minutes.");
      } else if (signup) {
        const data = await register(name, email, password, role);
        setNotice(data.message);
        setSignup(false);
        setPassword("");
      } else {
        const data = await login(email, password, role);
        onLogin(data.token, data.user);
      }
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot connect to the backend. Check that uvicorn is running on port 8000." : err.message);
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="brand light">
          <span className="logo"><Sparkles size={19} /></span>
          <div className="brand-text">
            <strong>Recruitment Copilot</strong>
            <small>AI hiring workspace</small>
          </div>
        </div>

        <div className="hero-body">
          <span className="hero-eyebrow"><Sparkles size={12} /> AI candidate matching copilot</span>
          <h1>Turn resumes into searchable candidate profiles</h1>
          <p>The platform reads each resume and pulls out the details hiring teams look for, so nobody has to retype them.</p>
          <div className="hero-badges">
            <span><Target size={13} /> Ranked candidate matches</span>
            <span><ShieldCheck size={13} /> Admin-approved workspace</span>
          </div>
          <ol className="steps">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span>{i + 1}</span>
                <div><strong>{title}</strong><small>{text}</small></div>
              </li>
            ))}
          </ol>
        </div>

        <p className="hero-foot"><ShieldCheck size={14} /> New accounts are approved by an admin before first sign-in.</p>
      </section>

      <section className="login-side">
        <main className="login-card">
          <h2>{forgot ? "Reset your password" : signup ? "Create your account" : "Welcome back"}</h2>
          <p className="sub">{forgot ? "Enter your email and we will send you a link to choose a new password." : signup ? "Pick your portal and an admin will review the request." : "Choose your portal to continue"}</p>

          {!forgot && (
            <>
              <div className="portal-tabs" role="group" aria-label="Portal">
                {PORTALS.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    aria-pressed={role === p.id}
                    className={role === p.id ? "portal active" : "portal"}
                    onClick={() => { setRole(p.id); reset(); setSignup(false); }}
                  >
                    <p.icon size={19} />
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="portal-text">{portal.text}</p>
            </>
          )}

          <form onSubmit={handleSubmit}>
            {signup && (
              <label>Full name
                <span className="field">
                  <User size={16} className="lead" />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />
                </span>
              </label>
            )}
            <label>Email
              <span className="field">
                <Mail size={16} className="lead" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required />
              </span>
            </label>
            {!forgot && (
              <>
                <label>Password
                  <span className="field">
                    <Lock size={16} className="lead" />
                    <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters" autoComplete={signup ? "new-password" : "current-password"} required />
                    <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </label>
                {!signup && (
                  <div className="forgot-row">
                    <button type="button" className="link" onClick={() => { setForgot(true); setSignup(false); reset(); }}>
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}

            {signup && <p className="hint">Use a real email address. We will email you when your account is approved.</p>}
            {notice && <div className="notice" role="status">{notice}</div>}
            {error && <div className="alert" role="alert">{error}</div>}

            <Button
              type="submit"
              className="wide-btn"
              disabled={loading}
              Icon={loading ? Loader2 : forgot ? KeyRound : LogIn}
              iconClassName={loading ? "spin" : ""}
            >
              {loading ? "Please wait..." : forgot ? "Send reset link" : signup ? "Create " + portal.label + " account" : "Sign in as " + portal.label}
            </Button>
          </form>

          {forgot ? (
            <div className="login-links">
              <button type="button" className="link" onClick={() => { setForgot(false); reset(); }}>
                Back to sign in
              </button>
            </div>
          ) : role !== "admin" && (
            <div className="login-links">
              <button type="button" className="link" onClick={() => { setSignup(!signup); reset(); }}>
                {signup ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </div>
          )}

          <div className="login-trust">
            <span><ShieldCheck size={13} /> Admin-approved accounts</span>
            <span><Lock size={13} /> Private workspace</span>
          </div>
          <p className="login-foot">Recruitment Copilot · AI hiring workspace</p>
        </main>
      </section>
    </div>
  );
}

export default LoginPage;
