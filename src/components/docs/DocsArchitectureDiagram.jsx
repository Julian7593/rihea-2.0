const toneMap = {
  graphite: {
    shell: "border-[#d8ddd9] bg-[linear-gradient(180deg,#ffffff,#f5f7f6)]",
    pill: "bg-[#49544e] text-white",
    node: "border-[#e3e7e4] bg-[#fbfcfb] text-[#516059]",
    glow: "from-[#eff2f0] via-[#f8fbf9] to-white",
  },
  plum: {
    shell: "border-[#ddd5e4] bg-[linear-gradient(180deg,#f8f4fb,#f1ebf6)]",
    pill: "bg-[#7d667f] text-white",
    node: "border-[#e7dff0] bg-white/85 text-[#66596d]",
    glow: "from-[#f1e8f6] via-[#faf6fd] to-white",
  },
  lake: {
    shell: "border-[#d7e3ea] bg-[linear-gradient(180deg,#f4f9fc,#eef5f8)]",
    pill: "bg-[#648290] text-white",
    node: "border-[#dfeaf0] bg-white/88 text-[#5a6f79]",
    glow: "from-[#e7f1f6] via-[#f7fbfd] to-white",
  },
  olive: {
    shell: "border-[#d9e0d3] bg-[linear-gradient(180deg,#f7faef,#f1f6ea)]",
    pill: "bg-[#7c8a5e] text-white",
    node: "border-[#e3ead8] bg-white/88 text-[#667153]",
    glow: "from-[#eef3df] via-[#fbfdf5] to-white",
  },
  ember: {
    shell: "border-[#ecd7ce] bg-[linear-gradient(180deg,#fff5f1,#fcece6)]",
    pill: "bg-[#a7674c] text-white",
    node: "border-[#f0ddd4] bg-white/86 text-[#8a624e]",
    glow: "from-[#f7e1d7] via-[#fff7f3] to-white",
  },
};

export default function DocsArchitectureDiagram({ architecture }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.08fr,.92fr]">
      <div className="relative rounded-[2rem] border border-[#e7e0d4] bg-[linear-gradient(180deg,rgba(255,255,255,.93),rgba(248,243,236,.94))] p-4 sm:p-5">
        <div className="absolute left-[1.7rem] top-10 bottom-10 hidden w-px bg-[linear-gradient(180deg,rgba(186,196,190,0),rgba(139,154,145,.85),rgba(186,196,190,0))] lg:block" />

        <div className="space-y-4">
          {architecture.layers.map((layer, index) => {
            const tone = toneMap[layer.tone] || toneMap.graphite;
            const edge = architecture.edges[index];
            return (
              <div key={layer.id} className="relative">
                <div className={`relative overflow-hidden rounded-[1.8rem] border p-5 ${tone.shell}`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${tone.glow} opacity-75`} />
                  <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="lg:max-w-[55%]">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${tone.pill}`}>
                          {layer.level}
                        </span>
                        <p className="text-base font-bold text-[#46564c]">{layer.title}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#667168]">{layer.summary}</p>
                    </div>

                    <div className="grid gap-2 lg:w-[42%]">
                      {layer.nodes.map((node) => (
                        <div key={node} className={`rounded-[1.1rem] border px-3 py-2 text-sm font-medium ${tone.node}`}>
                          {node}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {edge && (
                  <div className="mx-auto flex w-fit items-center gap-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#849087]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#91a198]" />
                    {edge.label}
                    <span className="h-5 w-px bg-[#c9d2cc]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {architecture.callouts.map((item, index) => (
          <div
            key={item.title}
            className={`rounded-[1.8rem] border p-5 ${
              index === 1
                ? "border-[#ecd6cb] bg-[linear-gradient(180deg,#fff7f4,#fff0ea)]"
                : "border-[#e7e0d4] bg-[#fffdf9]"
            }`}
          >
            <p className="text-sm font-bold text-[#46564c]">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-[#667168]">{item.desc}</p>
            <div className="mt-4 space-y-2">
              {item.items.map((entry) => (
                <div key={entry} className="flex items-start gap-3">
                  <span
                    className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                      index === 1 ? "bg-[#c8896a]" : "bg-[#91a198]"
                    }`}
                  />
                  <p className="text-sm leading-6 text-[#667168]">{entry}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-[1.8rem] border border-[#e7e0d4] bg-[linear-gradient(180deg,#fffdf9,#f9f5ee)] p-5">
          <p className="text-sm font-bold text-[#46564c]">关键原则</p>
          <div className="mt-4 space-y-3">
            {architecture.principles.map((item) => (
              <div key={item} className="rounded-[1.2rem] border border-[#ebe4d8] bg-white px-4 py-3">
                <p className="text-sm leading-6 text-[#667168]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
