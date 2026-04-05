import { memo } from "react";

function NavButton({ active, onClick, label, Icon, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl py-2 text-center"
      style={active ? { backgroundColor: style.tabBg, color: style.tabText } : { color: "#92A094" }}
    >
      <Icon className="mx-auto h-4 w-4" />
      <span className="mt-1 block text-[11px] font-semibold">{label}</span>
    </button>
  );
}

export default memo(NavButton);
