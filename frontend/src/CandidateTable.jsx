import { useState } from "react";
import {
  ArrowUpRight, Briefcase, Mail, MapPin, Phone, Trash2, Users,
} from "lucide-react";
import {
  Avatar, Badge, Drawer, EmptyState, Gauge,
} from "./components/ui";

function listText(items) {
  if (!items || items.length === 0) return "-";
  return items.join(", ");
}

function Profile({ candidate, onClose, onDelete }) {
  const c = candidate;
  const has = (items) => items && items.length > 0;

  return (
    <Drawer
      open={Boolean(c)}
      onClose={onClose}
      title={c ? c.name || "Candidate profile" : "Candidate profile"}
      subtitle="Parsed resume record"
      width={620}
      footer={c && onDelete ? (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => { onDelete(c.candidate_id); onClose(); }}
        >
          <Trash2 size={15} /> Delete candidate
        </button>
      ) : null}
    >
      {c && (
        <>
          <div className="profile-hero">
            <div className="profile-hero-top">
              <Avatar name={c.name} size={70} />
              <div className="profile-id">
                <span className="profile-kicker">Candidate record</span>
                <strong>{c.name || "Unknown candidate"}</strong>
                <span>{c.experience || "Experience not listed"}</span>
              </div>
              <Gauge value={c.accuracy || 0} size={92} label="Complete" />
            </div>
            <div className="profile-contact">
              <span><Mail size={13} /> {c.email || "No email"}</span>
              <span><Phone size={13} /> {c.phone || "No phone"}</span>
              <span><MapPin size={13} /> {c.location || "No location"}</span>
            </div>
          </div>

          <section className="profile-block">
            <span className="profile-kicker">01 — Skills</span>
            <h4>{has(c.skills) ? (c.skills || []).length + " capabilities mapped" : "No skills detected"}</h4>
            {has(c.skills) ? (
              <div>{(c.skills || []).map((s) => <span className="chip" key={s}>{s}</span>)}</div>
            ) : (
              <p className="profile-text is-empty">The parser could not find a skills section on this resume.</p>
            )}
          </section>

          <section className="profile-block">
            <span className="profile-kicker">02 — Education</span>
            <h4>Academic record</h4>
            <p className={"profile-text" + (listText(c.education) === "-" ? " is-empty" : "")}>
              {listText(c.education) === "-" ? "No education details were captured." : listText(c.education)}
            </p>
          </section>

          <section className="profile-block">
            <span className="profile-kicker">03 — Projects</span>
            <h4>Selected work</h4>
            <p className={"profile-text" + (listText(c.projects) === "-" ? " is-empty" : "")}>
              {listText(c.projects) === "-" ? "No projects were captured from this resume." : listText(c.projects)}
            </p>
          </section>

          <section className="profile-block">
            <span className="profile-kicker">04 — Certifications</span>
            <h4>Credentials</h4>
            <p className={"profile-text" + (listText(c.certifications) === "-" ? " is-empty" : "")}>
              {listText(c.certifications) === "-" ? "No certifications on file." : listText(c.certifications)}
            </p>
          </section>
        </>
      )}
    </Drawer>
  );
}

function CandidateTable({ rows, onDelete, variant = "gallery" }) {
  const [selected, setSelected] = useState(null);

  if (rows.length === 0) {
    return (
      <EmptyState
        Icon={Users}
        title="No candidates yet"
        text="Upload a resume to create your first structured candidate profile."
      />
    );
  }

  function open(candidate) {
    setSelected(candidate);
  }

  function keyOpen(event, candidate) {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open(candidate);
    }
  }

  return (
    <>
      {variant === "compact" ? (
        <div className="talent-list">
          {rows.map((c, index) => {
            const skills = c.skills || [];
            return (
              <div
                key={c.candidate_id}
                className="talent-row"
                role="button"
                tabIndex={0}
                onClick={() => open(c)}
                onKeyDown={(e) => keyOpen(e, c)}
              >
                <span className="talent-row-index">{String(index + 1).padStart(2, "0")}</span>
                <Avatar name={c.name} size={38} />
                <span className="talent-row-id">
                  <strong>{c.name || "Unknown candidate"}</strong>
                  <small>{c.experience || c.email || "Profile pending"}</small>
                </span>
                <span className="talent-row-skills">
                  {skills.slice(0, 3).map((s) => <span className="chip" key={s}>{s}</span>)}
                  {skills.length > 3 && <span className="chip muted">+{skills.length - 3}</span>}
                </span>
                <span className="talent-row-track"><i style={{ width: (c.accuracy || 0) + "%" }} /></span>
                <b className="talent-row-score">{c.accuracy || 0}%</b>
                <ArrowUpRight size={15} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="talent-gallery">
          {rows.map((c, index) => {
            const skills = c.skills || [];
            return (
              <article
                key={c.candidate_id}
                className="talent-card"
                role="button"
                tabIndex={0}
                onClick={() => open(c)}
                onKeyDown={(e) => keyOpen(e, c)}
              >
                <div className="talent-card-top">
                  <span className="talent-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="talent-card-tools">
                    {c.experience && <Badge neutral><Briefcase size={11} /> {c.experience}</Badge>}
                    {onDelete && (
                      <button
                        type="button"
                        className="talent-del"
                        title="Delete candidate"
                        aria-label={"Delete " + (c.name || "candidate")}
                        onClick={(e) => { e.stopPropagation(); onDelete(c.candidate_id); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="talent-avatar"><Avatar name={c.name} size={54} /></div>
                <h3 className="talent-name">{c.name || "Unknown candidate"}</h3>
                <p className="talent-role">{c.location || c.email || "Contact pending"}</p>

                <div className="talent-skills">
                  {skills.slice(0, 3).map((s) => <span className="chip" key={s}>{s}</span>)}
                  {skills.length > 3 && <span className="chip muted">+{skills.length - 3}</span>}
                  {skills.length === 0 && <span className="talent-no-skills">No skills captured</span>}
                </div>

                <div className="talent-foot">
                  <span className="talent-meter">
                    <span>Profile</span>
                    <span className="talent-meter-track"><i style={{ width: (c.accuracy || 0) + "%" }} /></span>
                    <b>{c.accuracy || 0}%</b>
                  </span>
                  <span className="talent-open">Profile <ArrowUpRight size={13} /></span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Profile candidate={selected} onClose={() => setSelected(null)} onDelete={onDelete} />
    </>
  );
}

export default CandidateTable;
