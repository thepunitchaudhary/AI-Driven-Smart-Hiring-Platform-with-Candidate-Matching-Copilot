import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function UploadResume({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileChange(e) {
    setFile(e.target.files[0]);
    setResult(null);
    setError("");
  }

  async function handleUpload() {
    if (file === null) {
      setError("Please select a PDF or DOCX file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL + "/api/upload_resume", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setResult(data);
        onUploaded();
      } else {
        setError(data.detail);
      }
    } catch (err) {
      setError("Cannot connect to backend");
    }

    setLoading(false);
  }

  return (
    <div className="card">
      <h2>Upload Resume</h2>
      <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Parsing..." : "Upload and Parse"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <h3>Extracted Information</h3>
          <p>Extraction Accuracy: {result.extraction_accuracy}%</p>
          <p>Name: {result.profile.name}</p>
          <p>Email: {result.profile.email}</p>
          <p>Phone: {result.profile.phone}</p>
          <p>Location: {result.profile.location}</p>
          <p>Experience: {result.profile.experience}</p>
          <p>Education: {result.profile.education.join(", ")}</p>
          <p>Projects: {result.profile.projects.join(", ")}</p>
          <p>Certifications: {result.profile.certifications.join(", ")}</p>
          <p>
            Skills:{" "}
            {result.profile.skills.map((skill) => (
              <span className="skill" key={skill}>
                {skill}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

export default UploadResume;
