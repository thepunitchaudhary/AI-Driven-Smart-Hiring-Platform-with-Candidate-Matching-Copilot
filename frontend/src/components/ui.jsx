import { useEffect, useId } from "react";
import { X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
export function Button({ variant = "primary", size = "md", Icon, iconClassName = "", className = "", children, ...rest }) {
  const cls = [
    "btn",
    variant !== "primary" ? "btn-" + variant : "",
    size === "sm" ? "btn-sm" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {Icon ? <Icon size={size === "sm" ? 15 : 16} className={iconClassName} /> : null}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */
export function Card({ className = "", children, ...rest }) {
  return <section className={"card " + className} {...rest}>{children}</section>;
}

export function CardHead({ title, sub, Icon, actions }) {
  return (
    <div className="card-head">
      <div className="card-head-main">
        <h2 className="card-title">
          {Icon ? <Icon size={17} /> : null}
          {title}
        </h2>
        {sub ? <p className="card-sub">{sub}</p> : null}
      </div>
      {actions ? <div className="card-actions">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ Icon, label, value, hint, tone = "brand" }) {
  return (
    <div className="stat-card">
      <span className={"stat-icon " + tone}>{Icon ? <Icon size={20} /> : null}</span>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        {hint ? <span className="stat-hint">{hint}</span> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation / tabs                                                   */
/* ------------------------------------------------------------------ */
export function Segmented({ items, value, onChange, ariaLabel = "Tabs" }) {
  return (
    <div className="segmented" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={"segment" + (active ? " active" : "")}
            onClick={() => onChange(item.id)}
          >
            {Icon ? <Icon size={15} /> : null}
            {item.label}
            {item.count !== undefined ? <span className="segment-count">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badges & chips                                                      */
/* ------------------------------------------------------------------ */
const TONE_MAP = {
  approved: "success",
  shortlisted: "success",
  sent: "success",
  done: "success",
  pending: "warn",
  queued: "neutral",
  rejected: "danger",
  failed: "danger",
  applied: "brand",
};

export function Badge({ tone, children, className = "" }) {
  const resolved = tone || TONE_MAP[String(children).toLowerCase()] || "neutral";
  return <span className={"badge " + resolved + " " + className}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */
export function EmptyState({ Icon, title, text, action }) {
  return (
    <div className="empty-state">
      {Icon ? <span className="empty-icon"><Icon size={22} /></span> : null}
      {title ? <strong className="empty-title">{title}</strong> : null}
      {text ? <p className="empty-text">{text}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Score & progress                                                    */
/* ------------------------------------------------------------------ */
export function ScoreRing({ score = 0, size = 64, label = "Match" }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const tone = value >= 80 ? "high" : value >= 60 ? "mid" : "low";
  return (
    <div
      className={"score-ring " + tone}
      style={{ width: size, height: size, "--p": value }}
      role="img"
      aria-label={value + "% " + label}
    >
      <span className="score-ring-value">{value}%</span>
      <small>{label}</small>
    </div>
  );
}

export function ProgressBar({ value = 0, tone = "brand" }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={"progress tone-" + tone} role="progressbar" aria-valuenow={width} aria-valuemin="0" aria-valuemax="100">
      <div style={{ width: width + "%" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Metrics & skeletons                                                 */
/* ------------------------------------------------------------------ */
export function MetricStrip({ items }) {
  return (
    <div className="metric-strip">
      {items.map((item) => {
        const Icon = item.Icon;
        return (
          <div className="metric" key={item.label}>
            {Icon ? <span className={"metric-icon " + (item.tone || "brand")}><Icon size={16} /></span> : null}
            <div className="metric-body">
              <span className="metric-value">{item.value}</span>
              <span className="metric-label">{item.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Skeleton({ className = "", style }) {
  return <span className={"skeleton " + className} style={style} aria-hidden="true" />;
}

export function SkeletonRows({ rows = 4 }) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <Skeleton className="sk-avatar" />
          <Skeleton className="sk-line" style={{ width: 120 + (i % 3) * 28 }} />
          <Skeleton className="sk-line" style={{ width: 92 }} />
          <Skeleton className="sk-line wide" />
          <Skeleton className="sk-pill" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonBars({ rows = 5 }) {
  return (
    <div className="skeleton-bars" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-bar-row" key={i}>
          <Skeleton className="sk-line" style={{ width: 84 }} />
          <Skeleton className="sk-track" style={{ width: 100 - i * 12 + "%" }} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */
export function tint(name) {
  let h = 0;
  for (const ch of name || "?") h = (h * 31 + ch.charCodeAt(0)) % 360;
  return { background: "hsl(" + h + " 55% 92%)", color: "hsl(" + h + " 45% 30%)" };
}

export function Avatar({ name, size = 36 }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="avatar"
      style={{ ...tint(name), width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer / modal                                                      */
/* ------------------------------------------------------------------ */
export function Drawer({ open, onClose, title, subtitle, children, footer, width }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="drawer"
        style={width ? { maxWidth: width } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <h2 className="drawer-title">{title}</h2>
            {subtitle ? <p className="drawer-sub">{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close panel">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-foot">{footer}</div> : null}
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form field                                                          */
/* ------------------------------------------------------------------ */
export function Field({ label, wide, hint, children }) {
  return (
    <label className={"form-field" + (wide ? " wide" : "")}>
      <span>{label}</span>
      {children}
      {hint ? <small className="field-hint">{hint}</small> : null}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Editorial layer                                                     */
/* ------------------------------------------------------------------ */
export function Gauge({ value = 0, size = 128, stroke = 9, label = "Match", caption, tone = "aurora" }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const stops = tone === "lime" ? ["#d8f26a", "#67e8c4"] : ["#8b5cf6", "#22d3ee"];

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={v + "% " + label}>
        <defs>
          <linearGradient id={"gauge-" + uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="100%" stopColor={stops[1]} />
          </linearGradient>
        </defs>
        <circle className="gauge-track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
        <circle
          className="gauge-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={"url(#gauge-" + uid + ")"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - v / 100)}
          transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"}
        />
      </svg>
      <div className="gauge-center" aria-hidden="true">
        <strong>{v}<em>%</em></strong>
        <span>{label}</span>
        {caption ? <small>{caption}</small> : null}
      </div>
    </div>
  );
}

export function StudioHead({ kicker, title, sub, actions }) {
  return (
    <header className="studio-head">
      <div className="studio-head-main">
        {kicker ? <span className="ed-kicker">{kicker}</span> : null}
        <h1 className="studio-title">{title}</h1>
        {sub ? <p className="studio-sub">{sub}</p> : null}
      </div>
      {actions ? <div className="studio-head-actions">{actions}</div> : null}
    </header>
  );
}

export function SignalStrip({ items, loading = false }) {
  return (
    <div className="signal-strip">
      {items.map((item, index) => {
        const Icon = item.Icon;
        return (
          <div className={"signal" + (item.tone ? " tone-" + item.tone : "")} key={item.label}>
            <span className="signal-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="signal-body">
              {loading ? <Skeleton className="sk-value" /> : <strong className="signal-value">{item.value}</strong>}
              <span className="signal-label">{item.label}</span>
              {item.hint ? <small className="signal-hint">{item.hint}</small> : null}
            </div>
            {Icon ? <span className="signal-icon"><Icon size={17} /></span> : null}
          </div>
        );
      })}
    </div>
  );
}
