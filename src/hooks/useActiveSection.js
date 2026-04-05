import { useEffect, useState } from "react";

export default function useActiveSection(sectionIds = [], options = {}) {
  const { rootMargin = "-18% 0px -58% 0px", threshold = [0.15, 0.35, 0.6, 0.85] } = options;
  const [activeId, setActiveId] = useState(sectionIds[0] || "");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const ids = sectionIds.filter(Boolean);
    if (!ids.length) return undefined;

    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!elements.length) return undefined;

    const visibleRatios = new Map();
    let frameId = 0;

    const syncActiveSection = () => {
      frameId = 0;
      const ranked = Array.from(visibleRatios.entries()).sort((a, b) => b[1] - a[1]);

      if (ranked.length) {
        setActiveId(ranked[0][0]);
        return;
      }

      const nearest = elements
        .map((element) => ({
          id: element.id,
          offset: Math.abs(element.getBoundingClientRect().top - 140),
        }))
        .sort((a, b) => a.offset - b.offset)[0];

      if (nearest?.id) {
        setActiveId(nearest.id);
      }
    };

    const queueSync = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(syncActiveSection);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleRatios.set(entry.target.id, entry.intersectionRatio || 0.01);
          } else {
            visibleRatios.delete(entry.target.id);
          }
        });
        queueSync();
      },
      { rootMargin, threshold }
    );

    elements.forEach((element) => observer.observe(element));

    if (window.location.hash) {
      const hashId = window.location.hash.replace("#", "");
      if (ids.includes(hashId)) {
        setActiveId(hashId);
      }
    } else {
      queueSync();
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      observer.disconnect();
    };
  }, [rootMargin, sectionIds, threshold]);

  return activeId;
}
