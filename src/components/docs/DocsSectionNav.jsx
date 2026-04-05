const numberLabel = (index) => String(index + 1).padStart(2, "0");

export default function DocsSectionNav({
  sections,
  activeSection,
  onNavigate,
  variant = "sidebar",
  className = "",
}) {
  if (variant === "pills") {
    return (
      <div className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
        {sections.map((section) => {
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onNavigate(section.id)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "border-[#4f6158] bg-[#4f6158] text-white shadow-[0_16px_30px_-24px_rgba(79,97,88,.75)]"
                  : "border-[#dce5df] bg-white/90 text-[#4f6158] hover:bg-[#f7faf8]"
              }`}
            >
              {section.shortTitle || section.title}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      {sections.map((section, index) => {
        const active = activeSection === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onNavigate(section.id)}
            className={`group block w-full rounded-[1.2rem] border px-3 py-3 text-left transition ${
              active
                ? "border-[#bfd0c5] bg-[#f4faf6] shadow-[0_18px_35px_-32px_rgba(79,97,88,.55)]"
                : "border-[#e6dfd3] bg-white/85 hover:border-[#cfdcd3] hover:bg-[#f7faf8]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  active ? "bg-[#4f6158] text-white" : "bg-[#e9efe9] text-[#4f6158]"
                }`}
              >
                {numberLabel(index)}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#46564c]">{section.title}</p>
                <p className="mt-1 text-xs text-[#758077]">{section.desc}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
