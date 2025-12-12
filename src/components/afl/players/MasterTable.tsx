// src/components/afl/players/MasterTable.tsx

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import PlayerInsightsOverlay from "./PlayerInsightsOverlay";
import { STAT_CONFIG } from "./playerStatConfig";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
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
  "OR","R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11",
  "R12","R13","R14","R15","R16","R17","R18","R19","R20","R21","R22","R23",
];

/* -------------------------------------------------------------------------- */
/* MOCK DATA                                                                  */
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
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getRounds(player: PlayerRow, lens: StatLens) {
  if (lens === "Fantasy") return player.roundsFantasy;
  if (lens === "Disposals") return player.roundsDisposals;
  return player.roundsGoals;
}

function computeSummary(player: PlayerRow, lens: StatLens) {
  const v = getRounds(player, lens);
  const min = Math.min(...v);
  const max = Math.max(...v);
  const total = v.reduce((a, b) => a + b, 0);
  const games = v.length;
  const avg = total / games;
  return { min, max, total, games, avg };
}

function computeHitRates(player: PlayerRow, lens: StatLens) {
  const v = getRounds(player, lens);
  const games = v.length || 1;
  return STAT_CONFIG[lens].thresholds.map(
    (t) => Math.round((v.filter((x) => x >= t).length / games) * 100)
  );
}

function hitFill(pct: number) {
  if (pct < 10) return "bg-red-600";
  if (pct < 30) return "bg-orange-500";
  if (pct < 50) return "bg-yellow-400";
  if (pct < 70) return "bg-lime-400";
  return "bg-green-500";
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function MasterTable() {
  const { isPremium } = useAuth();

  const [selectedStat, setSelectedStat] = useState<StatLens>("Fantasy");
  const [compactMode, setCompactMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const players = useMemo(() => MOCK_PLAYERS, []);
  const statCfg = STAT_CONFIG[selectedStat];

  return (
    <>
      {/* ================= DESKTOP ONLY ================= */}
      <div className="mt-8 hidden md:block">
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/90 shadow-xl">
          <div className="relative max-h-[640px] overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead className="sticky top-0 z-20 bg-neutral-950/95 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    <th className="sticky left-0 z-30 bg-neutral-950/95 px-4 py-3 text-left">
                      Player
                    </th>

                    {!compactMode &&
                      ROUND_LABELS.map((r) => (
                        <th key={r} className="px-2 py-3 text-center text-[9px]">
                          {r}
                        </th>
                      ))}

                    <th className="sticky right-0 z-30 bg-neutral-950/95 px-4 py-3 text-right">
                      Season snapshot
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {players.map((p, idx) => {
                    const s = computeSummary(p, selectedStat);
                    const hits = computeHitRates(p, selectedStat);
                    const rounds = getRounds(p, selectedStat);
                    const blurred = !isPremium && idx >= 20;

                    return (
                      <tr
                        key={p.id}
                        className={`border-t border-neutral-800 hover:bg-neutral-900/60 ${
                          blurred
                            ? "blur-[3px] brightness-[0.6] pointer-events-none"
                            : "cursor-pointer"
                        }`}
                        onClick={() =>
                          !blurred ? setSelectedPlayer(p) : null
                        }
                      >
                        {/* LEFT */}
                        <td className="sticky left-0 z-10 bg-black/95 px-4 py-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 text-[11px] text-neutral-300">
                              {p.rank}
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-neutral-50">
                                {p.name}
                              </div>
                              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                                {p.team} • {p.role}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* MIDDLE */}
                        {!compactMode &&
                          rounds.map((v, i) => (
                            <td
                              key={i}
                              className="px-2 py-2 text-center text-[10px] text-neutral-100"
                            >
                              {v}
                            </td>
                          ))}

                        {/* RIGHT */}
                        <td className="sticky right-0 z-10 bg-black/95 px-4 py-2">
                          <div className="flex flex-col gap-1 text-right">
                            <div className="text-[12px] font-semibold text-yellow-200">
                              AVG {s.avg.toFixed(1)}{" "}
                              {statCfg.valueUnitShort}
                            </div>

                            {!compactMode && (
                              <div className="text-[10px] text-neutral-400">
                                {s.min}–{s.max} • {s.games} gms
                              </div>
                            )}

                            <div className="mt-1 flex flex-wrap justify-end gap-x-4 gap-y-1">
                              {statCfg.thresholds.map((t, i) => (
                                <div key={t} className="flex items-center gap-1">
                                  <span className="text-[9px] text-neutral-500">
                                    {t}+
                                  </span>
                                  <div className="h-1.5 w-10 rounded bg-neutral-800">
                                    <div
                                      className={`h-1.5 rounded ${hitFill(
                                        hits[i]
                                      )}`}
                                      style={{ width: `${hits[i]}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-neutral-300">
                                    {hits[i]}%
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-1 flex justify-end">
                              <ChevronRight className="h-4 w-4 text-yellow-300" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* INSIGHTS */}
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
