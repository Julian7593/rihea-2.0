import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export default function DocsBackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleScroll = () => {
      setVisible(window.scrollY > 520);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="返回顶部"
      className={`fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-[#d9e1db] bg-white/92 px-4 py-3 text-sm font-semibold text-[#4f6158] shadow-[0_20px_50px_-28px_rgba(79,97,88,.48)] backdrop-blur transition lg:right-8 ${
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp className="h-4 w-4" />
      返回顶部
    </button>
  );
}
