// src/components/afl/teams/TeamDashboardTiles.tsx

import React from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Gauge,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                HELPER FUNCS                                */
/* -------------------------------------------------------------------------- */

const avg = (arr: number[]): number =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const lastN = (arr: number[], n: number) => arr.slice(-n);

/* -------------------------------------------------------------------------- */
/*                             PRESENTATION HELPERS                            */
/* -------------------------------------------------------------------------- */

type TileProps = {
  label: string;
  caption: string;
  value: string;
  team: AFLTeam;
  icon: React.ReactNode;
};

function GoldIconPlate({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-yellow-500/60 bg-gradient-to-b from-yellow-500/25 via-yellow-500/10 to-black/95 shadow-[0_0_22px_rgba(250,204,21,0.65)] transition-transform duration-300 group-hover:scale-105">
      {/* Inner dark glass layer */}
      <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-black/80 via-black/60 to-black/90 opacity-90" />
      <div className="relative text-yellow-100 drop-shadow-[0_0_8px_rgba(250,204,21,0.85)]">
        {children}
      </div>
    </div>
  );
}

function TeamIdentityBar({ team }: { team: AFLTeam }) {
  return (
    <div className="mt-4 flex items-center justify-between rounded-full border border-yellow-500/25 bg-gradient-to-r from-black/70 via-black/40 to-black/70 px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: team.colours.primary,
            boxShadow: `0 0 14px ${team.colours.primary}`,
          }}
        />
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-100">
          {team.name}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
        {team.code}
      </span>
    </div>
  );
}

function Tile({ label, caption, value, team, icon }: TileProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-black/95 via-neutral-950 to-black px-5 py-4 shadow-[0_0_46px_rgba(0,0,0,0.95)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_70px_rgba(250,204,21,0.5)]"
      style={{
        // subtle inner gold filament
        boxShadow:
          "0 0 0 1px rgba(250,204,21,0.12), 0 0 46px rgba(0,0,0,0.95)",
      }}
    >
      {/* Team tint overlay (very soft, increases slightly on hover) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.11]"
        style={{
          background: `radial-gradient(circle at top left, ${team.colours.primary}, transparent 60%)`,
        }}
      />

      {/* Gold corner glow accents */}
      <div className="pointer-events-none absolute -top-16 -right-20 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.16),transparent_65%)] opacity-60" />
      <div className="pointer-events-none absolute -bottom-16 -left-24 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.12),transparent_65%)] opacity-50" />

      {/* Content */}
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-yellow-300/80">
              {label}
            </div>
            <div className="mt-1 text-[11px] text-neutral-400">{caption}</div>
          </div>
          <GoldIconPlate>{icon}</GoldIconPlate>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-3xl font-semibold tracking-tight text-yellow-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.85)] group-hover:text-yellow-50">
              {value}
            </span>
            <span className="mt-1 h-px w-10 bg-gradient-to-r from-yellow-500/60 via-yellow-300/40 to-transparent group-hover:w-16 transition-all duration-300" />
          </div>
        </div>

        <TeamIdentityBar team={team} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               REACT COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function TeamDashboardTiles() {
  // Attack & defence use precomputed ratings
  const bestAttack = [...MOCK_TEAMS].sort(
    (a, b) => b.attackRating - a.attackRating
  )[0];

  const bestDefence = [...MOCK_TEAMS].sort(
    (a, b) => b.defenceRating - a.defenceRating
  )[0];

  // Clearance dominance: average of clearanceDom array
  const bestClearance = [...MOCK_TEAMS].sort(
    (a, b) => avg(b.clearanceDom) - avg(a.clearanceDom)
  )[0];

  // Consistency: highest consistencyIndex
  const mostConsistent = [...MOCK_TEAMS].sort(
    (a, b) => b.consistencyIndex - a.consistencyIndex
  )[0];

  // Fixture difficulty: highest fixtureDifficulty.score => toughest; we want easiest (lower)
  const easiestFixtures = [...MOCK_TEAMS].sort(
    (a, b) => a.fixtureDifficulty.score - b.fixtureDifficulty.score
  )[0];

  // Recent form: last 6 margins
  const bestMomentum = [...MOCK_TEAMS].sort(
    (a, b) => avg(lastN(b.margins, 6)) - avg(lastN(a.margins, 6))
  )[0];

  return (
    <section className="mt-10 rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-950/95 via-black/96 to-black px-5 py-6 shadow-[0_0_70px_rgba(0,0,0,0.9)]">
      {/* Section header */}
      <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/25 via-yellow-500/10 to-transparent px-3 py-1 shadow-[0_0_24px_rgba(250,204,21,0.45)]">
            <span className="relative flex h-1.5 w-5 items-center overflow-hidden rounded-full bg-yellow-400/90">
              <span className="animate-pulse absolute inset-0 bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-400" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-yellow-50">
              Team Dashboard
            </span>
          </div>

          <h3 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
            Snapshot of league-wide team performance
          </h3>
          <p className="mt-2 max-w-2xl text-xs text-neutral-400">
            Rolling form, attack and defence ratings, clearance dominance and
            upcoming fixture difficulty – distilled into six premium, gold-tinted
            tiles.
          </p>

          {/* Gold beam underline */}
          <div className="mt-3 h-px w-32 bg-gradient-to-r from-yellow-500/70 via-yellow-300/50 to-transparent" />
        </div>
      </div>

      {/* Tiles grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Tile 1 — Recent form / momentum */}
        <Tile
          label="Recent Form"
          caption="Last 6 rounds scoring margin trend"
          value={avg(lastN(bestMomentum.margins, 6)).toFixed(1)}
          team={bestMomentum}
          icon={<TrendingUp className="h-4 w-4" />}
        />

        {/* Tile 2 — Attack rating */}
        <Tile
          label="Attack Rating"
          caption="0–100 offensive quality index"
          value={bestAttack.attackRating.toString()}
          team={bestAttack}
          icon={<Activity className="h-4 w-4" />}
        />

        {/* Tile 3 — Defence rating */}
        <Tile
          label="Defence Rating"
          caption="0–100 defensive solidity index"
          value={bestDefence.defenceRating.toString()}
          team={bestDefence}
          icon={<ShieldCheck className="h-4 w-4" />}
        />

        {/* Tile 4 — Clearance dominance */}
        <Tile
          label="Clearance Dominance"
          caption="Average clearance win % this season"
          value={`${avg(bestClearance.clearanceDom).toFixed(1)}%`}
          team={bestClearance}
          icon={<ArrowRight className="h-4 w-4" />}
        />

        {/* Tile 5 — Consistency index */}
        <Tile
          label="Consistency Index"
          caption="Lower volatility, tighter performance band"
          value={mostConsistent.consistencyIndex.toString()}
          team={mostConsistent}
          icon={<Gauge className="h-4 w-4" />}
        />

        {/* Tile 6 — Fixture difficulty */}
        <Tile
          label="Next Fixture Difficulty"
          caption="Next 3 opponents difficulty score (lower is easier)"
          value={easiestFixtures.fixtureDifficulty.score.toString()}
          team={easiestFixtures}
          icon={<ArrowRight className="h-4 w-4" />}
        />
      </div>
    </section>
  );
}
