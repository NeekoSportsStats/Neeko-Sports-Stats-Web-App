// src/components/afl/teams/TeamDashboardTiles.tsx
import React from "react";
import { MOCK_TEAMS, AFLTeam } from "./mockTeams";

export default function TeamDashboardTiles() {
  const last6 = (arr: number[]) => arr.slice(-6);

  /* ---------------------------------------------- */
  /*          FIX ALL SORTING ARITHMETIC            */
  /* ---------------------------------------------- */

  const bestAttack = [...MOCK_TEAMS].sort(
    (a, b) => b.attackRating - a.attackRating
  )[0];

  const bestDefence = [...MOCK_TEAMS].sort(
    (a, b) => b.defenceRating - a.defenceRating
  )[0];

  // ❌ original: b.clearanceDom - a.clearanceDom (arrays)
  // ✔ fixed: compare average clearanceDom
  const bestClearance = [...MOCK_TEAMS].sort(
    (a, b) =>
      avg(b.clearanceDom) - avg(a.clearanceDom)
  )[0];

  const mostConsistent = [...MOCK_TEAMS].sort(
    (a, b) => b.consistencyIndex - a.consistencyIndex
  )[0];

  // ❌ original: fixtureDifficulty[0] + fixtureDifficulty[1]...
  // fixtureDifficulty is object, not array
  // ✔ fixed:
  const easiestFixtures = [...MOCK_TEAMS].sort(
    (a, b) => b.fixtureDifficulty.score - a.fixtureDifficulty.score
  )[0];

  return (
    <section className="mt-10">
      {/* Section header */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          Team Dashboard
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Attack */}
        <Tile title="Attack Rating" value={`${bestAttack.attackRating}`} label={bestAttack.name} />

        {/* Defence */}
        <Tile title="Defence Rating" value={`${bestDefence.defenceRating}`} label={bestDefence.name} />

        {/* Clearance */}
        <Tile title="Clearance Dominance" value={`${avg(bestClearance.clearanceDom).toFixed(1)}%`} label={bestClearance.name} />

        {/* Consistency */}
        <Tile title="Consistency Index" value={`${mostConsistent.consistencyIndex}`} label={mostConsistent.name} />

        {/* Fixture difficulty */}
        <Tile
          title="Next Fixture Difficulty"
          value={`${easiestFixtures.fixtureDifficulty.score}`}
          label={easiestFixtures.name}
        />
      </div>
    </section>
  );
}

/* ---------------------------------------------- */
/*                 Tile UI Component              */
/* ---------------------------------------------- */

function Tile({ title, value, label }: any) {
  return (
    <div className="rounded-2xl border border-neutral-800/70 bg-black/90 p-5">
      <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-yellow-200">{value}</div>
      <div className="text-[12px] text-neutral-500">{label}</div>
    </div>
  );
}

function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
