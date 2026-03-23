export default function Card({ children, style, className = "" }) {
  const cardStyle = style?.glass
    ? {
        "--glass-bg": style.card,
        "--glass-line": style.line,
        "--glass-shadow": style.cardShadow,
        "--glass-blur": "14px",
        "--glass-sat": "1.12",
        "--glass-fallback": "rgba(255, 250, 242, 0.92)",
        "--glass-accessible": "rgba(255, 252, 247, 0.98)",
      }
    : {
        background: style?.card,
        border: `1px solid ${style?.line || "rgba(156,176,163,.24)"}`,
        boxShadow: style?.cardShadow,
      };

  return (
    <article
      className={`rounded-[1.9rem] p-4 shadow-soft sm:p-5 ${style?.glass ? "glass-surface glass-tier-mid" : ""} ${className}`}
      style={cardStyle}
    >
      {children}
    </article>
  );
}
