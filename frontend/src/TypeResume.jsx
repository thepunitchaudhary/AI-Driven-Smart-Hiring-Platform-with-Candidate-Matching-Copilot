import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { parseText } from "./api";

const SAMPLE = `Name: Riya Sharma
Email: riya@example.com
Phone: 9876543210
Location: Pune, Maharashtra

Education
B.Tech in Computer Science, Anna University, 2018 - 2022

Skills
Python, SQL, Machine Learning, Docker

Experience
Data Analyst, Acme Corp, Jan 2022 - Jan 2024

Projects
Resume Screening System

Certifications
Google IT Support Certificate`;

function TypeResume({ onParsed }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleParse() {
    setError("");
    setLoading(true);
    try {
      const data = await parseText(text);
      onParsed(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div>
      <textarea
        className="type-box"
        rows={12}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Type or paste your resume details here, for example:\n\n" + SAMPLE}
      />
      {error && <div className="alert">{error}</div>}
      <div className="type-actions">
        <button className="btn" onClick={handleParse} disabled={loading || text.trim() === ""}>
          {loading ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />} Parse details
        </button>
        <button className="link" type="button" onClick={() => setText(SAMPLE)}>Use sample text</button>
      </div>
    </div>
  );
}

export default TypeResume;
