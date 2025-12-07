// src/components/afl/teams/TeamDashboardTiles.tsx

import React from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";
import { Activity, ShieldCheck, TrendingUp, ArrowRight, Gauge } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                HELPER FUNCS                                */
/* -------------------------------------------------------------------------- */

const avg = (arr: number[]): number =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const lastN = (arr: number[], n: number) => arr.slice(-n);

/* -------------------------------------------------------------------------- */
/*                               REACT COMPONENT                               */
/* -------------------------------------------------------------------------- */

type TileProps = {
  label: string;
  caption: string;
  value: string;
  team: AFLTeam;
  icon: React.ReactNode;
};

function Tile({ label, caption, value, team, icon }: TileProps) {
  return (
    <div className="rounded-3xl border border-neutral-800/90 bg-gradient-to-b from-black/96 via-neutral-950 to-black px-5 py-4 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            {label}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">{caption}</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700/80 bg-black/80 text-yellow-200">
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-yellow-200">{value}</span>
        </div>
        <div className="text-right text-[11px] text-neutral-400">
          <div
            className="mb-1 inline-flex items-center gap-2 rounded-full px-2 py-1 text-[10px]"
            style={{
              background:
                "linear-gradient(90deg, rgba(250,204,21,0.18), transparent)",
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: team.colours.primary,
                boxShadow: `0 0 10px ${team.colours.primary}`,
              }}
            />
            <span className="uppercase tracking-[0.16em] text-neutral-100">
              {team.name}
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {team.code}
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <section className="mt-10 rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-950/95 via-black/96 to-black px-5 py-6 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
      {/* Section header */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
              Team Dashboard
            </span>
          </div>

          <h3 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
            Snapshot of league-wide team performance
          </h3>
          <p className="mt-2 max-w-2xl text-xs text-neutral-400">
            Rolling form, attack and defence ratings, clearance dominance and
            upcoming fixture difficulty – all rolled into six curated tiles.
          </p>
        </div>
      </div>

      {/* Tiles grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Tile 1 — Recent form / momentum */}
        <Tile
          label="Recent Form"
          caption="Last 6 rounds scoring margin trend"
          value={`${avg(lastN(bestMomentum.margins, 6)).toFixed(1)}`}
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
