import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Search, Lock } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
  "OR","R1","R2","R3","R4",
  "R5","R6","R7","R8","R9",
  "R10","R11","R12","R13","R14",
  "R15","R16","R17","R18","R19",
  "R20","R21","R22","R23",
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

function hitColour(pct: number) {
  if (pct < 10) return "bg-red-600";
  if (pct < 30) return "bg-orange-500";
  if (pct < 50) return "bg-yellow-400";
  if (pct < 80) return "bg-lime-400";
  return "bg-green-500";
}

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/* SNAPSHOT BLOCK                                                             */
/* -------------------------------------------------------------------------- */

function SnapshotBlock({
  thresholds,
  hits,
  avgLabel,
  rangeLabel,
  compact,
}: {
  thresholds: readonly number[];
  hits: readonly number[];
  avgLabel: string;
  rangeLabel: string;
  compact: boolean;
}) {
  const barW = "w-14";

  return (
    <div className="flex flex-col items-end gap-1.5 text-right">
      <div
        className={cx(
          "font-semibold tabular-nums",
          compact ? "text-[13px] text-yellow-300" : "text-[12px] text-yellow-200"
        )}
      >
        {avgLabel}
      </div>

      {!compact && (
        <div className="text-[10px] text-neutral-400">{rangeLabel}</div>
      )}

      <div
        className={cx(
          "mt-1 grid gap-y-1.5",
          compact ? "grid-cols-5 gap-x-4" : "grid-cols-1"
        )}
      >
        {thresholds.map((t, i) => {
          const pct = hits[i];
          return (
            <div
              key={t}
              className={cx(
                "flex items-center justify-end gap-1.5",
                compact && "min-w-[140px]"
              )}
            >
              <span className="text-[9px] text-neutral-500">{t}+</span>
              <div className={cx("h-1.5 rounded bg-neutral-800 border border-neutral-700/30", barW)}>
                <div
                  className={cx("h-1.5 rounded", hitColour(pct))}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[9px] text-neutral-300 tabular-nums">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      <ChevronRight className="mt-1 h-4 w-4 text-yellow-300" />
    </div>
  );
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
  const [query, setQuery] = useState("");

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

  const onOpen = (p: PlayerRow, idx: number) => {
    if (!isPremium && idx >= 20) return;
    setSelectedPlayer(p);
  };

  return (
    <>
      {/* HEADER */}
      {/* (unchanged visually – already correct) */}

      {/* ================= DESKTOP TABLE ================= */}
      <div className="mt-7 hidden md:block">
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/90 shadow-xl">
          <div className="max-h-[720px] overflow-y-auto cursor-grab">
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    <th className="sticky left-0 z-40 bg-neutral-950/80 px-4 py-3 text-left">
                      Player
                    </th>

                    {!compactMode &&
                      ROUND_LABELS.map((r, i) => (
                        <th
                          key={r}
                          className={cx(
                            "px-2.5 py-3 text-center text-[9px]",
                            i % 5 === 0 && "border-l border-neutral-800/70"
                          )}
                        >
                          {r}
                        </th>
                      ))}

                    <th className="sticky right-0 z-40 bg-neutral-950/80 px-4 py-3 text-right w-[320px]">
                      Season snapshot
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlayers.map((p, idx) => {
                    const s = computeSummary(p, selectedStat);
                    const hits = computeHitRates(p, selectedStat);
                    const rounds = getRounds(p, selectedStat);
                    const blurred = !isPremium && idx >= 20;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => onOpen(p, idx)}
                        className={cx(
                          "border-t border-neutral-800/80 transition",
                          idx % 2 === 0 ? "bg-black/30" : "bg-black/10",
                          !blurred && "hover:bg-neutral-900/60",
                          blurred && "blur-[3px] brightness-[0.6] pointer-events-none"
                        )}
                      >
                        <td className="sticky left-0 z-20 bg-black/95 px-4 py-2">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 flex items-center justify-center rounded-full border border-neutral-700 text-[11px] text-neutral-300">
                              {p.rank}
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-neutral-50 leading-tight">
                                {p.name}
                              </div>
                              <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                                {p.team} • {p.role}
                              </div>
                            </div>
                          </div>
                        </td>

                        {!compactMode &&
                          rounds.map((v, i) => (
                            <td
                              key={i}
                              className={cx(
                                "px-2.5 text-center text-[10px] leading-none tabular-nums text-neutral-100",
                                i % 5 === 0 && "border-l border-neutral-800/70"
                              )}
                            >
                              {v}
                            </td>
                          ))}

                        <td className="sticky right-0 z-20 bg-black/95 px-4 py-2 w-[320px]">
                          <SnapshotBlock
                            thresholds={statCfg.thresholds}
                            hits={hits}
                            compact={compactMode}
                            avgLabel={`AVG ${s.avg.toFixed(1)} ${statCfg.valueUnitShort}`}
                            rangeLabel={`${s.min}–${s.max} • ${s.games} gms`}
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {!isPremium && (
                    <tr>
                      <td colSpan={99} className="bg-black/80 px-6 py-6 text-center">
                        <div className="text-yellow-200 text-sm">
                          Unlock remaining players with Neeko+
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MOBILE LIST ================= */}
      {/* untouched except spacing polish – intentionally omitted here */}

      {/* ================= INSIGHTS OVERLAY ================= */}
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