// TEAM FORM GRID — HOT / STABLE / COLD (FINAL PATCHED VERSION)
// Fixes:
// - Removes invalid `momentum5` field
// - Computes momentum from actual AFLTeam model (margins)
// - Sparkline centered
// - Bottom bar + footer labels
// - Premium spacing, glow, full width sparkline

import React from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";
import { Flame, Snowflake, Gauge } from "lucide-react";

type Variant = "hot" | "stable" | "cold";

/* ============================================================================
   UTIL — compute momentum5 from margins
============================================================================ */

function computeMomentum5(team: AFLTeam): number {
  if (!team.margins || team.margins.length < 5) return 0;
  const last5 = team.margins.slice(-5);
  const sum = last5.reduce((a, b) => a + b, 0);
  return sum / last5.length;
}

/* ============================================================================
   Sparkline — FULL WIDTH
============================================================================ */

function SoftZigZagSparkline({ variant }: { variant: Variant }) {
  const color =
    variant === "hot"
      ? "text-red-300"
      : variant === "stable"
      ? "text-lime-300"
      : "text-sky-300";

  return (
    <svg
      viewBox="0 0 100 24"
      className={`w-full h-7 opacity-95 drop-shadow-[0_0_6px_currentColor] ${color}`}
    >
      <path
        d="M0 16 L14 8 L28 13 L42 6 L56 12 L70 9 L84 15 L100 10"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================================
   TeamFormCard — Sparkline center + bottom controls
============================================================================ */

function TeamFormCard({
  name,
  variant,
  momentum,
}: {
  name: string;
  variant: Variant;
  momentum: number;
}) {
  const colorBar =
    variant === "hot"
      ? "bg-red-400"
      : variant === "stable"
      ? "bg-lime-400"
      : "bg-sky-400";

  const colorBorder =
    variant === "hot"
      ? "border-red-500/40"
      : variant === "stable"
      ? "border-lime-500/40"
      : "border-sky-500/40";

  const colorGlow =
    variant === "hot"
      ? "shadow-[0_0_16px_rgba(255,60,60,0.35)]"
      : variant === "stable"
      ? "shadow-[0_0_16px_rgba(60,255,60,0.32)]"
      : "shadow-[0_0_18px_rgba(60,160,255,0.32)]";

  return (
    <div
      className={`
        rounded-2xl border ${colorBorder} bg-black/60 
        p-4 backdrop-blur-[1px] ${colorGlow}
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-white">{name}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Momentum · Last 5
          </p>
        </div>

        <div
          className={`
            text-[12px] px-2.5 py-1 rounded-full font-semibold
            ${variant === "hot" ? "bg-red-900/40 text-red-200" : ""}
            ${variant === "stable" ? "bg-green-900/40 text-lime-200" : ""}
            ${variant === "cold" ? "bg-sky-900/40 text-sky-200" : ""}
          `}
        >
          {momentum > 0 ? "+" : ""}
          {momentum.toFixed(1)}
        </div>
      </div>

      {/* Center Sparkline */}
      <div className="flex-1 flex items-center justify-center mt-4 mb-4">
        <div className="w-full">
          <SoftZigZagSparkline variant={variant} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-neutral-700/60 overflow-hidden">
        <div
          className={`h-full ${colorBar}`}
          style={{ width: `${Math.min(Math.abs(momentum) * 5, 100)}%` }}
        />
      </div>

      {/* Bottom Labels */}
      <div className="mt-3 flex justify-between text-[11px] text-neutral-400">
        <span>Fantasy Edge</span>
        <span>Analytics ↗</span>
      </div>
    </div>
  );
}

/* ============================================================================
   Section Header Pill
============================================================================ */

function SectionPill() {
  return (
    <div
      className="
        inline-flex items-center gap-2 rounded-full
        border border-yellow-400/60
        bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent
        px-3.5 py-1.5 shadow-[0_0_16px_rgba(250,204,21,0.35)]
      "
    >
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-yellow-100">
        Team Form Grid
      </span>
    </div>
  );
}

/* ============================================================================
   Main Component
============================================================================ */

export default function TeamFormGrid() {
  const teams = MOCK_TEAMS;

  // Compute momentum dynamically
  const enriched = teams.map((t) => ({
    ...t,
    momentum5: computeMomentum5(t),
  }));

  const hot = [...enriched].sort((a, b) => b.momentum5 - a.momentum5).slice(0, 6);
  const cold = [...enriched].sort((a, b) => a.momentum5 - b.momentum5).slice(0, 6);
  const stable = [...enriched]
    .sort((a, b) => Math.abs(a.momentum5) - Math.abs(b.momentum5))
    .slice(0, 6);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <SectionPill />

      <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
        Hot, stable and cold clubs by performance lens
      </h2>

      <p className="mt-2 max-w-xl text-sm text-neutral-300">
        Switch between lenses. Tap cards for deeper analytics.
      </p>

      {/* Hot */}
      <div className="mt-10">
        <div className="flex items-center gap-2 text-red-300">
          <Flame className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[0.22em]">
            Hot Teams
          </span>
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hot.map((t) => (
            <TeamFormCard
              key={t.id}
              name={t.name}
              momentum={t.momentum5}
              variant="hot"
            />
          ))}
        </div>
      </div>

      {/* Stable */}
      <div className="mt-14">
        <div className="flex items-center gap-2 text-lime-300">
          <Gauge className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[0.22em]">
            Stable Teams
          </span>
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stable.map((t) => (
            <TeamFormCard
              key={t.id}
              name={t.name}
              momentum={t.momentum5}
              variant="stable"
            />
          ))}
        </div>
      </div>

      {/* Cold */}
      <div className="mt-14">
        <div className="flex items-center gap-2 text-sky-300">
          <Snowflake className="h-4 w-4" />
          <span className="text-[11px] uppercase tracking-[0.22em]">
            Cold Teams
          </span>
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cold.map((t) => (
            <TeamFormCard
              key={t.id}
              name={t.name}
              momentum={t.momentum5}
              variant="cold"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
