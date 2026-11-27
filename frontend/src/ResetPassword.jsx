import { useState } from "react";
import {
  Lock, Eye, EyeOff, Loader2, CheckCircle2, KeyRound, Sparkles, ShieldCheck, ArrowLeft,
} from "lucide-react";
import { resetPassword } from "./api";
import { Button } from "./components/ui";

function ResetPassword({ token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is invalid or incomplete. Please request a new one.");
      return;
    }
    if (password.length < 6) {
      setError("Use at least 6 characters for your new password");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot connect to the backend. Check that uvicorn is running on port 8000." : err.message);
    }
    setLoading(false);
  }

  return (
    <div className="login-page reset-page">
      <section className="login-hero">
        <div className="brand light">
          <span className="logo"><Sparkles size={19} /></span>
          <div className="brand-text">
            <strong>Recruitment Copilot</strong>
            <small>AI hiring workspace</small>
          </div>
        </div>

        <div className="hero-body">
          <span className="hero-eyebrow"><KeyRound size={12} /> Secure account recovery</span>
          <h1>{done ? "Your password is updated" : "Choose a new password"}</h1>
          <p>
            {done
              ? "Sign in with your new password to get back to your workspace."
              : "Reset links are single-use and expire after 30 minutes. Pick something you have not used before."}
          </p>
          <div className="hero-badges">
            <span><ShieldCheck size={13} /> Single-use reset link</span>
            <span><Lock size={13} /> Private workspace</span>
          </div>
        </div>

        <p className="hero-foot"><ShieldCheck size={14} /> Need a fresh link? Request one from the sign-in page.</p>
      </section>

      <section className="login-side">
        <main className="login-card">
          {done ? (
            <>
              <h2>Password changed</h2>
              <p className="sub">Your password was changed. You can sign in with the new password now.</p>
              <div className="notice" role="status">
                <CheckCircle2 size={16} className="green-text" />
                <span>Your new password is active.</span>
              </div>
              <Button className="wide-btn" Icon={ArrowLeft} onClick={onDone}>Back to sign in</Button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2>Set a new password</h2>
              <p className="sub">Use at least 6 characters.</p>

              <label>New password
                <span className="field">
                  <Lock size={16} className="lead" />
                  <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters" autoComplete="new-password" minLength={6} required />
                  <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
              <label>Confirm new password
                <span className="field">
                  <Lock size={16} className="lead" />
                  <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Type it again" autoComplete="new-password" minLength={6} required />
                </span>
              </label>

              {error && <div className="alert" role="alert">{error}</div>}

              <Button
                type="submit"
                className="wide-btn"
                disabled={loading}
                Icon={loading ? Loader2 : KeyRound}
                iconClassName={loading ? "spin" : ""}
              >
                {loading ? "Please wait..." : "Change password"}
              </Button>

              <div className="login-links">
                <button type="button" className="link" onClick={onDone}>Back to sign in</button>
              </div>
            </form>
          )}

          <div className="login-trust">
            <span><ShieldCheck size={13} /> Single-use link</span>
            <span><Lock size={13} /> Private workspace</span>
          </div>
          <p className="login-foot">Recruitment Copilot · AI hiring workspace</p>
        </main>
      </section>
    </div>
  );
}

export default ResetPassword;
