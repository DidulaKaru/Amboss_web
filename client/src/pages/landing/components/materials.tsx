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
}: React.PropsWithChildren<{ onClick?: () => void }>): React.ReactElement {
  const pillClass = `rounded border border-zinc-800 bg-zinc-900/40
                  px-3 py-2 text-center text-xs font-mono text-zinc-300
                  hover:border-zinc-700 hover:text-white hover:bg-zinc-900/80 transition
                  focus:outline-none`;

  if (onClick) {
    return (
      <button onClick={onClick} className={pillClass}>
        {children}
      </button>
    );
  }

  return <div className={pillClass}>{children}</div>;
}

function Materials({
  id = "materials",
  kicker = "Materials",
  title = "Available Materials",
  subtitle = "Engineering filaments and photopolymer resins for functional parts and prototypes.",
  groups = DEFAULT_GROUPS,
  className = "",
  onSelect,
}: MaterialsProps) {
  return (
    <section id={id} className={`py-16 bg-zinc-950 border-t border-zinc-800/80 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider font-mono text-zinc-400">
            {kicker}
          </p>
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Groups */}
        <div className="mt-8 space-y-8">
          {Object.entries(groups).map(([key, list]) => {
            if (!list || list.length === 0) return null;
            const label = LABELS[key] ?? key.replace(/^[a-z]/, (m) => m.toUpperCase());
            return (
              <div key={key}>
                <p className="mb-2.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  {label}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
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
