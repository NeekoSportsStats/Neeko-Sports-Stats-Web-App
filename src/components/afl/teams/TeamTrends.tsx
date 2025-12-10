// UPDATED — TeamTrends.tsx
// Sparkline removed — replaced with HeatlineStrip (C2 Tooltip Version)

import React, { useMemo, useState } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { TrendingUp, Shield, Activity, MoveVertical } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                               Heatline Strip                               */
/* -------------------------------------------------------------------------- */

function HeatlineStrip({
  values,
  accent,
  label,
}: {
  values: number[];
  accent: string;
  label: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <div
      className="
        relative h-[54px] w-full rounded-xl overflow-hidden 
        bg-gradient-to-b from-neutral-700/40 via-neutral-900/80 to-black
        border border-slate-400/20 shadow-[0_6px_16px_rgba(0,0,0,0.55)]
        flex items-end justify-between px-[6px]
      "
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${accent}26, transparent 70%)`,
        }}
      />

      {/* Bars */}
      {values.map((v, i) => {
        const norm = (v - min) / range;
        const h = 10 + norm * 34; // Keep elegant, never too tall

        const isHover = hoverIndex === i;

        return (
          <div
            key={i}
            className="relative flex-1 flex items-end justify-center"
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div
              className="w-[3px] rounded-full transition-all duration-150"
              style={{
                height: `${h}px`,
                background: accent,
                opacity: isHover ? 0.95 : 0.75,
                boxShadow: isHover
                  ? `0 0 8px ${accent}, 0 0 16px ${accent}aa`
                  : `0 0 4px ${accent}55`,
                scale: isHover ? "1.25" : "1",
              }}
            />

            {/* Tooltip */}
            {isHover && (
              <div
                className="
                  absolute bottom-full mb-1 px-2 py-1 rounded-md text-[10px] 
                  bg-black/90 backdrop-blur-sm border border-white/10 text-neutral-200
                  whitespace-nowrap pointer-events-none z-20
                "
                style={{ transform: "translateY(-4px)" }}
              >
                <div className="uppercase text-[8px] tracking-wider text-neutral-400">
                  Round {i + 1}
                </div>
                <div className="font-semibold">{v.toFixed(1)}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Metric summary (UNCHANGED)                         */
/* -------------------------------------------------------------------------- */

type TrendDirection = "up" | "down" | "flat";

type MetricSummary = {
  current: number;
  deltaPct: number | null;
  direction: TrendDirection;
  isGood: boolean | null;
};

function average(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeMetricSummary(
  values: number[],
  goodDirection: "up" | "down"
): MetricSummary {
  if (!values.length) {
    return { current: 0, deltaPct: null, direction: "flat", isGood: null };
  }

  if (values.length < 10) {
    const current = average(values);
    return { current, deltaPct: null, direction: "flat", isGood: null };
  }

  const last5 = values.slice(-5);
  const prev5 = values.slice(-10, -5);

  const lastAvg = average(last5);
  const prevAvg = average(prev5);

  if (prevAvg === 0) {
    return { current: lastAvg, deltaPct: null, direction: "flat", isGood: null };
  }

  let deltaPct = ((lastAvg - prevAvg) / prevAvg) * 100;

  // Clamp volatility
  if (deltaPct > 15) deltaPct = 15;
  if (deltaPct < -15) deltaPct = -15;

  let direction: TrendDirection = "flat";
  if (deltaPct > 0.1) direction = "up";
  else if (deltaPct < -0.1) direction = "down";

  const isGood =
    goodDirection === "up" ? deltaPct >= 0 : deltaPct <= 0;

  return { current: lastAvg, deltaPct, direction, isGood };
}

function formatNumber(value: number, isPercentMetric: boolean): string {
  if (isPercentMetric) return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

/* -------------------------------------------------------------------------- */
/*                         Trend block (patched)                              */
/* -------------------------------------------------------------------------- */

type TrendSeries = {
  label: string;
  values: number[];
  goodDirection: "up" | "down";
};

function TrendBlock({
  title,
  icon,
  description,
  accent,
  series,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  accent: string;
  series: TrendSeries[];
}) {
  return (
    <div
      className="group relative rounded-3xl border border-neutral-800/70 
      bg-gradient-to-b from-neutral-900/85 via-black to-black/95 
      p-4 md:p-5 shadow-[0_18px_48px_rgba(0,0,0,0.85)]"
      style={{
        boxShadow:
          "0 18px 48px rgba(0,0,0,0.85), 0 0 22px rgba(15,23,42,0.6)",
      }}
    >
      {/* Halo */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[26px] 
        opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle_at_top, ${accent}14, transparent 60%)`,
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-[1.5px] rounded-full"
            style={{
              background: `linear-gradient(to bottom, ${accent}, transparent)`,
              boxShadow: `0 0 8px ${accent}44`,
            }}
          />
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-base font-semibold text-neutral-50 md:text-lg">
              {title}
            </h3>
          </div>
        </div>

        <p className="mt-1 max-w-xl text-[11px] text-neutral-300 leading-snug md:text-xs">
          {description}
        </p>

        <div className="mt-4 border-t border-neutral-800/70 pt-4" />

        {/* Metric grid */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
          {series.map((s, index) => {
            const summary = computeMetricSummary(s.values, s.goodDirection);
            const isPercent = s.label.includes("%");
            const isTrendLabel = s.label.toLowerCase() === "trend";

            let deltaLabel = "– 0.0%";
            let deltaClass = "text-neutral-400";
            let arrow = "";

            if (summary.deltaPct !== null) {
              const absPct = Math.abs(summary.deltaPct);
              const formattedPct = `${absPct.toFixed(1)}%`;

              if (absPct < 0.1) {
                deltaLabel = "– 0.0%";
                deltaClass = "text-neutral-400";
              } else {
                const isUp = summary.direction === "up";
                const isGood = summary.isGood ?? false;
                arrow = isUp ? "▲" : "▼";
                deltaLabel = `${arrow} ${formattedPct}`;
                deltaClass = isGood ? "text-emerald-400" : "text-rose-400";
              }
            }

            const valueLabel = formatNumber(summary.current, isPercent);

            return (
              <div
                key={s.label}
                className={
                  index % 2 === 1
                    ? "space-y-2 md:border-l md:border-neutral-900/70 md:pl-4"
                    : "space-y-2 md:pr-4"
                }
              >
                {/* Label + numbers */}
                <div className="flex items-baseline justify-between gap-3">
                  <div
                    className={`text-[9px] md:text-[10px] uppercase tracking-[0.16em] ${
                      isTrendLabel ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    {isTrendLabel && (
                      <span
                        className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                        style={{
                          background: accent,
                          boxShadow: `0 0 8px ${accent}a0`,
                        }}
                      />
                    )}
                    {s.label}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums whitespace-nowrap md:text-xs">
                    <span className="font-semibold text-neutral-100">
                      {valueLabel}
                    </span>
                    <span className={deltaClass} style={{ opacity: 0.85 }}>
                      {deltaLabel}
                    </span>
                  </div>
                </div>

                {/* New Heatline Strip */}
                <div className="mt-1 h-[54px] rounded-xl overflow-hidden">
                  <HeatlineStrip
                    values={s.values}
                    accent={accent}
                    label={s.label}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            TeamTrends section                              */
/* -------------------------------------------------------------------------- */

export default function TeamTrends() {
  const rounds = 23;

  /* identical data logic untouched… */

  // (you keep all your existing useMemo data generation here)
  // ...
  
  // I am omitting repeated data logic for brevity (unchanged).

  return (
    <section className="mt-10">
      {/* (UI unchanged) */}
    </section>
  );
}
