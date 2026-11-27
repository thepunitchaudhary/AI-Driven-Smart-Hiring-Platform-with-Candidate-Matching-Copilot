function Meter({ value = 0, label = true }) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const filled = Math.round((safe / 100) * 6);
  const tone = safe >= 80 ? "high" : safe >= 50 ? "mid" : "low";
  return (
    <span className={"meter " + tone} title={safe + "% of fields found"} role="img" aria-label={safe + "% of fields found"}>
      <span className="segs" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className={i < filled ? "on" : ""} />)}
      </span>
      {label && <b>{safe}%</b>}
    </span>
  );
}

export default Meter;
