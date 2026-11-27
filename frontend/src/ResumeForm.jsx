import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { saveManualResume } from "./api";
import { toast } from "./components/toast";
import { Button, Field } from "./components/ui";

const EMPTY = {
  name: "", email: "", phone: "", city: "", experience_years: "",
  degree: "", college: "", year: "", skills: "", projects: "", certifications: "",
};

function ResumeForm({ onParsed }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await saveManualResume({ ...form, experience_years: Number(form.experience_years || 0) });
      toast("Profile saved. Copilot extracted the details from the form.", "success");
      onParsed(data);
    } catch (err) {
      setError(err.message);
      toast(err.message, "danger");
    }
    setLoading(false);
  }

  return (
    <form className="resume-form" onSubmit={handleSave} style={{ marginTop: 16 }}>
      <div className="form-grid">
        <p className="form-section">Contact details</p>
        <Field label="Full name *"><input value={form.name} onChange={set("name")} placeholder="Riya Sharma" autoComplete="name" required /></Field>
        <Field label="Email *"><input type="email" value={form.email} onChange={set("email")} placeholder="riya@example.com" autoComplete="email" required /></Field>
        <Field label="Phone"><input value={form.phone} onChange={set("phone")} placeholder="9876543210" autoComplete="tel" /></Field>
        <Field label="City"><input value={form.city} onChange={set("city")} placeholder="Pune, Maharashtra" autoComplete="address-level2" /></Field>

        <p className="form-section">Experience & education</p>
        <Field label="Total experience (years)"><input type="number" min="0" max="60" step="0.5" value={form.experience_years} onChange={set("experience_years")} placeholder="2" /></Field>
        <Field label="Passing year"><input value={form.year} onChange={set("year")} placeholder="2022" /></Field>
        <Field label="Degree">
          <input list="degrees" value={form.degree} onChange={set("degree")} placeholder="B.Tech" />
          <datalist id="degrees">
            {["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc", "M.Sc", "B.Com", "MBA", "PhD", "Diploma"].map((d) => <option key={d} value={d} />)}
          </datalist>
        </Field>
        <Field label="College / University"><input value={form.college} onChange={set("college")} placeholder="Anna University" /></Field>

        <p className="form-section">Skills & highlights</p>
        <Field label="Skills (separate with commas)" wide>
          <textarea rows={2} value={form.skills} onChange={set("skills")} placeholder="Python, SQL, Machine Learning, Docker" />
        </Field>
        <Field label="Projects (one per line)">
          <textarea rows={3} value={form.projects} onChange={set("projects")} placeholder="Resume Screening System" />
        </Field>
        <Field label="Certifications (one per line)">
          <textarea rows={3} value={form.certifications} onChange={set("certifications")} placeholder="Google IT Support Certificate" />
        </Field>
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="form-actions">
        <Button Icon={loading ? Loader2 : Save} iconClassName={loading ? "spin" : ""} disabled={loading}>
          {loading ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

export default ResumeForm;
