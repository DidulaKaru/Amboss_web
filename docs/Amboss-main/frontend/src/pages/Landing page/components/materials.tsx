// Materials.tsx
import React from "react";

type MaterialsMap = {
  general?: string[];
  engineering?: string[];
  resin?: string[];
  [key: string]: string[] | undefined;
};

type MaterialsProps = {
  id?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  groups?: MaterialsMap;
  className?: string;
  onSelect?: (material: string, groupKey: string) => void;
};

const DEFAULT_GROUPS: MaterialsMap = {
  general: ["PLA", "PLA+", "ABS", "PETG", "TPU"],
  engineering: ["PA12-CF", "PC-CF", "Nylon (PA6/PA12)", "ASA"],
  resin: ["Standard Resin", "Clear Resin", "ABS-Like Resin", "Tough/Impact"],
};

const LABELS: Record<string, string> = {
  general: "General Use",
  engineering: "Engineering Materials",
  resin: "Resin",
};

function Pill({
  children,
  onClick,
}: React.PropsWithChildren<{ onClick?: () => void }>) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`rounded-xl border border-white/10 bg-white/[0.04]
                  px-4 py-3 text-center text-sm text-zinc-200
                  hover:border-red-500/40 hover:bg-white/[0.06] transition
                  focus:outline-none focus:ring-2 focus:ring-red-600/40`}
    >
      {children}
    </Comp>
  ) as any;
}

function Materials({
  id = "materials",
  kicker = "Materials",
  title = "From everyday filaments to engineering-grade resins",
  subtitle = "Choose the right material for strength, heat resistance, flexibility, or surface finish.",
  groups = DEFAULT_GROUPS,
  className = "",
  onSelect,
}: MaterialsProps) {
  return (
    <section id={id} className={`py-16 md:py-20 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-red-500/80">
            {kicker}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
            {title}
          </h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-3xl">
            {subtitle}
          </p>
        </div>

        {/* Groups */}
        <div className="mt-8 space-y-10">
          {Object.entries(groups).map(([key, list]) => {
            if (!list || list.length === 0) return null;
            const label = LABELS[key] ?? key.replace(/^[a-z]/, (m) => m.toUpperCase());
            return (
              <div key={key}>
                <p className="mb-3 inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/10">
                  {label}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {list.map((m) => (
                    <Pill
                      key={`${key}:${m}`}
                      onClick={onSelect ? () => onSelect(m, key) : undefined}
                    >
                      {m}
                    </Pill>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Materials;
