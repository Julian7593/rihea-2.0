import { motion } from "framer-motion";

const DOT_VARIANTS = {
  static: {
    scale: 1,
    opacity: 1,
    y: 0,
  },
  idle: {
    scale: [0.88, 1.12, 0.88],
    opacity: [0.86, 1, 0.86],
    y: 0,
    transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" },
  },
  listening: {
    scale: [1, 1.24, 1],
    opacity: [0.92, 1, 0.92],
    y: 0,
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
  },
  speaking: {
    scale: 1,
    opacity: 1,
    y: [0, -5, 1.5, -2, 0],
    transition: { duration: 0.72, repeat: Infinity, ease: "easeOut" },
  },
};

const ARC_VARIANTS = {
  static: {
    pathLength: 1,
    opacity: 1,
  },
  idle: {
    pathLength: [0.94, 1, 0.94],
    opacity: [0.9, 1, 0.9],
    transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" },
  },
  listening: {
    pathLength: [0.9, 1, 0.9],
    opacity: 1,
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
  },
  speaking: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

function BreathingHalo({ aiState = "idle", compact = false }) {
  const box = compact ? "h-8 w-8" : "h-10 w-10";
  return (
    <span className={`relative inline-flex items-center justify-center ${box}`}>
      <svg viewBox="0 0 40 40" className="h-full w-full">
        <motion.path
          d="M 9.5 22 A 10.5 10.5 0 0 0 30.5 22"
          fill="none"
          stroke="#9CB0A3"
          strokeWidth="3"
          strokeLinecap="round"
          variants={ARC_VARIANTS}
          animate={aiState}
        />
        <motion.circle cx="20" cy="16.2" r="4.1" fill="#E6AAC4" variants={DOT_VARIANTS} animate={aiState} />
      </svg>
    </span>
  );
}

export default function BrandLogo({
  compact = false,
  className = "",
  showSubtitle = !compact,
  animated = true,
  aiState = "idle",
  onClick,
}) {
  const currentState = animated ? aiState : "static";
  const titleClass = compact ? "text-[1.6rem]" : "text-[2.35rem]";
  const subtitleClass = compact ? "text-[0.82rem]" : "text-[1rem]";
  const sloganClass = compact ? "text-[7px]" : "text-[8px]";

  return (
    <div
      className={`inline-flex w-fit select-none items-center gap-2.5 ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      aria-label="Rihea 妊安 logo"
    >
      <BreathingHalo aiState={currentState} compact={compact} />

      <span className="flex flex-col leading-none">
        {showSubtitle && (
          <span
            className={`mb-0.5 whitespace-nowrap font-bold uppercase tracking-[0.24em] text-sage/90 ${sloganClass}`}
            style={{ fontFamily: "\"Quicksand\", \"Nunito\", sans-serif" }}
          >
            WE CARE , JUST FOR U.
          </span>
        )}
        <span className="flex items-end gap-1.5">
          <span
            className={`font-extrabold tracking-tight text-clay ${titleClass}`}
            style={{ color: "#6E7F75", fontFamily: "\"Quicksand\", \"Nunito\", sans-serif" }}
          >
            Rihea
          </span>
          <span className={`pb-[0.14rem] font-semibold tracking-[0.06em] text-clay/90 ${subtitleClass}`}>妊安</span>
        </span>
      </span>
    </div>
  );
}
