import { useEffect } from "react";
import { motion } from "framer-motion";

const fallbackStyle = {
  bg: "radial-gradient(circle at 14% 9%, rgba(230,170,196,.22), transparent 32%), radial-gradient(circle at 86% 14%, rgba(156,176,163,.24), transparent 38%), linear-gradient(180deg, #fdfaf4 0%, #f7f2e8 100%)",
  tabText: "#55675D",
  line: "rgba(156,176,163,.32)",
  primaryBg: "#E6AAC4",
  primaryText: "#4E3B45",
};

const FULL_SEQUENCE_MS = 4620;
const REDUCED_SEQUENCE_MS = 1200;

export default function BrandLaunchSplash({ style, motionEnabled = true, onComplete }) {
  const ui = style || fallbackStyle;
  const totalDuration = motionEnabled ? FULL_SEQUENCE_MS : REDUCED_SEQUENCE_MS;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const timer = window.setTimeout(() => onComplete?.(), totalDuration);
    return () => window.clearTimeout(timer);
  }, [onComplete, totalDuration]);

  return (
    <motion.section
      role="status"
      aria-live="polite"
      aria-label="Launching Rihea"
      className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden"
      style={{ background: ui.bg }}
      initial={{ opacity: 1 }}
      animate={motionEnabled ? { opacity: [1, 1, 0] } : { opacity: [1, 0] }}
      transition={
        motionEnabled
          ? { duration: 0.62, delay: 4.0, times: [0, 0.7, 1], ease: "easeOut" }
          : { duration: 0.26, delay: 0.78, ease: "easeOut" }
      }
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(255,255,255,.24), transparent 40%), radial-gradient(circle at 82% 16%, rgba(255,255,255,.14), transparent 36%)",
        }}
      />

      <div className="relative flex items-center px-4">
        <motion.span
          className="pointer-events-none absolute left-1.5 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border"
          style={{ borderColor: ui.line, backgroundColor: "rgba(255,255,255,.2)" }}
          initial={{ scale: 0.42, opacity: 0 }}
          animate={motionEnabled ? { scale: [0.42, 1.35, 1.8], opacity: [0, 0.42, 0] } : { scale: 1, opacity: 0 }}
          transition={motionEnabled ? { duration: 2.2, ease: "easeOut" } : { duration: 0.28 }}
        />

        <motion.span
          className="relative z-20 block h-[1.15rem] w-[1.15rem] rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 22%, #ffffff 0%, ${ui.primaryBg} 46%, #d494b0 100%)`,
            boxShadow: "0 0 0 7px rgba(255,255,255,.22), 0 10px 24px -14px rgba(105, 87, 98, .52)",
          }}
          initial={{ scale: 0.84, x: 0, opacity: 0.92 }}
          animate={
            motionEnabled
              ? {
                  scale: [0.74, 1.16, 0.99, 1],
                  x: [0, 0, -38, -38],
                  opacity: [0.38, 0.86, 1, 1],
                }
              : { scale: 1, x: -38, opacity: 1 }
          }
          transition={motionEnabled ? { duration: 3.0, times: [0, 0.4, 0.76, 1], ease: "easeInOut" } : { duration: 0.38 }}
        />

        <motion.span
          className="h-[2px] rounded-full"
          style={{ backgroundColor: "rgba(85, 103, 93, 0.4)" }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 24, opacity: 0.9 }}
          transition={motionEnabled ? { duration: 0.85, delay: 1.15, ease: "easeOut" } : { duration: 0.28 }}
        />

        <motion.div
          className="ml-3 overflow-hidden"
          initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
          animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
          transition={motionEnabled ? { duration: 1.35, delay: 1.15, ease: [0.22, 1, 0.36, 1] } : { duration: 0.28 }}
        >
          <motion.div
            className="relative flex items-end gap-1.5 whitespace-nowrap leading-none"
            initial={{ x: -12 }}
            animate={{ x: 0 }}
            transition={motionEnabled ? { duration: 1.2, delay: 1.15, ease: "easeOut" } : { duration: 0.28 }}
          >
            <span
              className="font-extrabold tracking-tight text-[2.1rem] text-clay sm:text-[2.3rem]"
              style={{ color: ui.tabText || "#55675D", fontFamily: "\"Quicksand\", \"Nunito\", sans-serif" }}
            >
              Rihea
            </span>
            <span className="pb-[0.16rem] text-lg font-semibold text-clay/88 sm:text-xl">妊安</span>

            <motion.span
              className="pointer-events-none absolute inset-y-0 left-[-22%] w-[26%]"
              style={{ background: "linear-gradient(120deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))" }}
              initial={{ x: "0%" }}
              animate={motionEnabled ? { x: ["0%", "460%"] } : { x: "0%" }}
              transition={motionEnabled ? { duration: 1.08, delay: 3.12, ease: "easeOut" } : { duration: 0.28 }}
            />
          </motion.div>
        </motion.div>

        <motion.span
          className="pointer-events-none absolute -bottom-2 left-[2.3rem] h-[1px]"
          style={{ background: "linear-gradient(90deg, rgba(85,103,93,0), rgba(85,103,93,.34), rgba(85,103,93,0))" }}
          initial={{ width: 0, opacity: 0 }}
          animate={motionEnabled ? { width: [0, 180, 120], opacity: [0, 0.7, 0.35] } : { width: 120, opacity: 0.35 }}
          transition={motionEnabled ? { duration: 1.25, delay: 1.75, ease: "easeOut" } : { duration: 0.28 }}
        />
      </div>
    </motion.section>
  );
}
