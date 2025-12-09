"use client";

import { useState } from "react";
import { MOCK_TEAMS } from "@/components/afl/teams/mockTeams";

type Lens = "momentum" | "fantasy" | "disposals" | "goals";

export default function TeamFormGrid() {
  const [lens, setLens] = useState<Lens>("momentum");
  const [openTeam, setOpenTeam] = useState<number | null>(null);

  // --- SCORING LOGIC FOR PERFORMANCE GROUPING ---
  const getScore = (team: any) => {
    const last5 = team.margins.slice(-5);
    return last5.reduce((a: number, b: number) => a + b, 0);
  };

  const sorted = [...MOCK_TEAMS].sort((a, b) => getScore(b) - getScore(a));

  const hotTeams = sorted.slice(0, 3);
  const stableTeams = sorted.slice(3, 6);
  const coldTeams = sorted.slice(6, 9);

  const toggleTeam = (id: number) => {
    setOpenTeam((prev) => (prev === id ? null : id));
  };

  return (
    <section className="w-full px-4 md:px-8 py-10">
      {/* HEADER PILL */}
      <div className="inline-flex items-center px-4 py-1.5 mb-6 rounded-full bg-[#1b1b1b] border border-yellow-500/20 shadow-[0_0_22px_rgba(255,200,0,0.28)]">
        <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2" />
        <span className="text-yellow-300 tracking-wide text-sm font-medium">
          TEAM FORM GRID
        </span>
      </div>

      {/* TITLE + DESCRIPTION */}
      <h2 className="text-2xl md:text-3xl font-semibold mb-3">
        Hot, stable and cold clubs by performance lens
      </h2>

      <p className="text-gray-300 text-sm md:text-base max-w-2xl mb-8">
        Switch between momentum, fantasy, disposals and goals to see how each
        club is trending. Tap a pill on mobile or hover on desktop to reveal a
        deeper analytics panel.
      </p>

      {/* LENS SWITCHER */}
      <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-full px-2 py-2 w-full max-w-xl mb-10">
        {["momentum", "fantasy", "disposals", "goals"].map((key) => (
          <button
            key={key}
            onClick={() => setLens(key as Lens)}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all
              ${
                lens === key
                  ? "bg-yellow-500/20 shadow-[0_0_12px_rgba(255,200,0,0.3)] text-yellow-300"
                  : "text-gray-400 hover:text-white"
              }
            `}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* ====== GRID WRAPPER (Mobile = 1 col, Desktop = 3 col) ====== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* HOT COLUMN */}
        <ColumnBlock
          title="HOT TEAMS"
          icon="🔥"
          tint="yellow"
          teams={hotTeams}
          openTeam={openTeam}
          toggleTeam={toggleTeam}
        />

        {/* STABLE COLUMN */}
        <ColumnBlock
          title="STABLE TEAMS"
          icon="🟢"
          tint="green"
          teams={stableTeams}
          openTeam={openTeam}
          toggleTeam={toggleTeam}
        />

        {/* COLD COLUMN */}
        <ColumnBlock
          title="COLD TEAMS"
          icon="❄️"
          tint="blue"
          teams={coldTeams}
          openTeam={openTeam}
          toggleTeam={toggleTeam}
        />
      </div>
    </section>
  );
}

/* ===========================================================
   COLUMN BLOCK
=========================================================== */
function ColumnBlock({
  title,
  icon,
  tint,
  teams,
  openTeam,
  toggleTeam,
}: any) {
  const tintColor =
    tint === "yellow"
      ? "yellow"
      : tint === "green"
      ? "lime"
      : "sky";

  return (
    <div>
      {/* Category Header */}
      <h3
        className={`flex items-center gap-2 text-${tintColor}-400 font-semibold tracking-wide text-sm mb-4`}
      >
        <span className="text-lg">{icon}</span>
        {title}
      </h3>

      {/* Team Pills */}
      <div className="space-y-4">
        {teams.map((team: any) => (
          <TeamPill
            key={team.id}
            team={team}
            openTeam={openTeam}
            toggleTeam={toggleTeam}
            tint={tint}
          />
        ))}
      </div>
    </div>
  );
}

/* ===========================================================
   TEAM PILL COMPONENT
=========================================================== */
function TeamPill({ team, openTeam, toggleTeam, tint }: any) {
  const isOpen = openTeam === team.id;

  const tintColor =
    tint === "yellow"
      ? {
          bar: "bg-yellow-400",
          glow: "shadow-[0_0_18px_rgba(255,200,0,0.35)]",
          badge: "bg-yellow-400/20 border-yellow-500/40 text-yellow-300",
        }
      : tint === "green"
      ? {
          bar: "bg-lime-400",
          glow: "shadow-[0_0_18px_rgba(140,255,120,0.35)]",
          badge: "bg-lime-400/20 border-lime-500/40 text-lime-300",
        }
      : {
          bar: "bg-sky-400",
          glow: "shadow-[0_0_18px_rgba(110,180,255,0.35)]",
          badge: "bg-sky-400/20 border-sky-500/40 text-sky-300",
        };

  const momentumVal =
    team.margins.slice(-5).reduce((a: number, b: number) => a + b, 0) || 0;

  return (
    <div>
      {/* MAIN PILL */}
      <button
        onClick={() => toggleTeam(team.id)}
        className={`w-full rounded-2xl bg-black/40 border border-white/5 p-4 text-left relative transition-all hover:bg-black/50 ${tintColor.glow}`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-medium">{team.name}</span>

          {/* Badge */}
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${tintColor.badge}`}
          >
            {momentumVal > 0 ? `+${momentumVal.toFixed(1)}` : momentumVal.toFixed(1)}
          </span>
        </div>

        {/* MICRO BAR */}
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full ${tintColor.bar}`}
            style={{ width: `${Math.min(Math.abs(momentumVal), 50) * 2}%` }}
          />
        </div>

        {/* Subtext */}
        <p className="text-[11px] tracking-widest text-gray-400 uppercase">
          Momentum • Last 5
        </p>

        {/* Expand Arrow */}
        <div className="absolute right-4 top-4 text-gray-300 opacity-60">
          {openTeam === team.id ? "▾" : "▸"}
        </div>
      </button>

      {/* EXPANDED PANEL */}
      {isOpen && (
        <div className="mt-3 rounded-2xl bg-black/40 border border-white/5 p-5 animate-fadeIn shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
          {/* Analytics Grid */}
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <Stat label="Attack Δ" value={team.attackRating} />
            <Stat label="Defence Δ" value={team.defenceRating} />

            <Stat label="Clearance %" value={`${team.clearanceDom.slice(-1)[0]}%`} />
            <Stat label="Consistency" value={team.consistencyIndex} />

            <Stat label="Fixture Diff" value={team.fixtureDifficulty.score} />
            <Stat
              label="Opponents"
              value={team.fixtureDifficulty.opponents.join(", ")}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================================================
   SMALL STAT CELL
=========================================================== */
function Stat({ label, value }: any) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-gray-400">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}