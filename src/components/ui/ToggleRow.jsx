import { memo } from "react";

function ToggleRow({ label, on, toggle }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center justify-between rounded-2xl border border-sage/20 bg-[#fffaf2] px-4 py-3 text-left"
    >
      <span className="text-sm font-semibold text-clay">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${on ? "bg-sage/70" : "bg-sage/25"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default memo(ToggleRow);
