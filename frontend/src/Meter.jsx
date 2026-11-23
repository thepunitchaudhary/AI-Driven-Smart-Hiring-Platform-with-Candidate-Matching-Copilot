// Six segments = the six fields the parser looks for (name, email, phone, education, experience, skills).
function Meter({ value, label = true }) {
  const filled = Math.round((value / 100) * 6);
  return (
    <span className="meter" title={value + "% of fields found"}>
      <span className="segs">{[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className={i < filled ? "on" : ""} />)}</span>
      {label && <b>{value}%</b>}
    </span>
  );
}

export default Meter;
