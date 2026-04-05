export default function DocsSectionHeader({ icon: Icon, title, desc, tone = "bg-[#eef3ef] text-[#4f6158]" }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-2xl font-bold text-[#46564c]">{title}</h2>
        <p className="mt-1 text-sm text-[#6c7770]">{desc}</p>
      </div>
    </div>
  );
}
