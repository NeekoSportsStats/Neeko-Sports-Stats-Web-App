import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth";
import PlayerInsightsOverlay from "./PlayerInsightsOverlay";
import MasterTableDesktop from "./MasterTableDesktop";
import MasterTableMobile from "./MasterTableMobile";
import { STAT_CONFIG } from "./playerStatConfig";

/* -------------------------------------------------------------------------- */
/* TYPES (re-exported)                                                         */
/* -------------------------------------------------------------------------- */

export type StatLens = "Fantasy" | "Disposals" | "Goals";

export type PlayerRow = {
  id: number;
  rank: number;
  name: string;
  team: string;
  role: string;
  roundsFantasy: number[];
  roundsDisposals: number[];
  roundsGoals: number[];
};

/* -------------------------------------------------------------------------- */
/* ROUND LABELS                                                               */
/* -------------------------------------------------------------------------- */

export const ROUND_LABELS = [
  "OR","R1","R2","R3","R4","R5","R6","R7","R8","R9",
  "R10","R11","R12","R13","R14","R15","R16","R17","R18","R19",
  "R20","R21","R22","R23",
];

/* -------------------------------------------------------------------------- */
/* MOCK DATA (UNCHANGED)                                                      */
/* -------------------------------------------------------------------------- */

function buildMockPlayers(): PlayerRow[] {
  const list: PlayerRow[] = [];

  for (let i = 1; i <= 60; i++) {
    const baseFantasy = 70 + Math.round(Math.random() * 35);
    const baseDisposals = 18 + Math.round(Math.random() * 10);
    const baseGoals = Math.random() < 0.5 ? 1 : 0;

    const f: number[] = [];
    const d: number[] = [];
    const g: number[] = [];

    for (let r = 0; r < ROUND_LABELS.length; r++) {
      f.push(Math.max(35, baseFantasy + Math.round((Math.random() - 0.5) * 30)));
      d.push(Math.max(6, baseDisposals + Math.round((Math.random() - 0.5) * 10)));
      g.push(
        Math.max(
          0,
          baseGoals +
            (Math.random() < 0.18 ? 2 : 0) +
            (Math.random() < 0.06 ? 3 : 0)
        )
      );
    }

    list.push({
      id: i,
      rank: i,
      name: `Player ${i}`,
      team: ["CARL","ESS","COLL","RICH","GEEL","NMFC"][i % 6],
      role: ["MID","RUC","FWD","DEF"][i % 4],
      roundsFantasy: f,
      roundsDisposals: d,
      roundsGoals: g,
    });
  }

  return list;
}

const MOCK_PLAYERS = buildMockPlayers();

/* -------------------------------------------------------------------------- */
/* MAIN ORCHESTRATOR                                                          */
/* -------------------------------------------------------------------------- */

export default function MasterTable() {
  const { isPremium } = useAuth();

  const [selectedStat, setSelectedStat] = useState<StatLens>("Fantasy");
  const [compactMode, setCompactMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const players = useMemo(() => MOCK_PLAYERS, []);
  const statCfg = STAT_CONFIG[selectedStat];

  const filteredPlayers = useMemo(() => {
    if (!isPremium) return players;
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) =>
      `${p.name} ${p.team} ${p.role}`.toLowerCase().includes(q)
    );
  }, [players, isPremium, query]);

  return (
    <>
      {/* DESKTOP */}
      <div className="hidden md:block">
        <MasterTableDesktop
          players={filteredPlayers}
          statCfg={statCfg}
          selectedStat={selectedStat}
          setSelectedStat={setSelectedStat}
          compactMode={compactMode}
          setCompactMode={setCompactMode}
          isPremium={isPremium}
          query={query}
          setQuery={setQuery}
          onSelectPlayer={setSelectedPlayer}
        />
      </div>

      {/* MOBILE */}
      <div className="md:hidden">
        <MasterTableMobile
          players={filteredPlayers}
          statCfg={statCfg}
          selectedStat={selectedStat}
          setSelectedStat={setSelectedStat}
          compactMode={compactMode}
          setCompactMode={setCompactMode}
          isPremium={isPremium}
          query={query}
          setQuery={setQuery}
          onSelectPlayer={setSelectedPlayer}
        />
      </div>

      {/* INSIGHTS OVERLAY */}
      {mounted &&
        selectedPlayer &&
        createPortal(
          <PlayerInsightsOverlay
            player={selectedPlayer}
            selectedStat={selectedStat}
            onClose={() => setSelectedPlayer(null)}
            onLensChange={setSelectedStat}
          />,
          document.body
        )}
    </>
  );
}