// src/components/afl/players/MasterTable.tsx

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
  "OR",
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
  "R9",
  "R10",
  "R11",
  "R12",
  "R13",
  "R14",
  "R15",
  "R16",
  "R17",
  "R18",
  "R19",
  "R20",
  "R21",
  "R22",
  "R23",
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
      f.push(
        Math.max(35, baseFantasy + Math.round((Math.random() - 0.5) * 30))
      );
      d.push(
        Math.max(6, baseDisposals + Math.round((Math.random() - 0.5) * 10))
      );
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
      team: ["CARL", "ESS", "COLL", "RICH", "GEEL", "NMFC"][i % 6],
      role: ["MID", "RUC", "FWD", "DEF"][i % 4],
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
  // tighter, more intuitive bands
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
/* SMALL UI PIECES                                                            */
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

  // Make snapshot layout consistent and “even”
  const barW = compact ? "w-16" : "w-14";

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <div className="text-[12px] font-semibold text-yellow-200">{avgLabel}</div>
      {!compact && (
        <div className="text-[10px] text-neutral-400">{rangeLabel}</div>
      )}

      <div
        className={cx(
          "mt-1 grid gap-y-1",
          compact ? "grid-cols-5 gap-x-6" : "grid-cols-1"
        )}
      >
        {thresholds.map((t, i) => {
          const pct = hits[i];
          return (
            <div
              key={t}
              className={cx(
                "flex items-center justify-end gap-1",
                compact ? "min-w-[150px]" : ""
              )}
            >
              <span className="text-[9px] text-neutral-500">{t}+</span>
              <div
                className={cx(
                  "h-1.5 rounded bg-neutral-800/90 border border-neutral-700/30",
                  barW
                )}
              >
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

      <div className="mt-1 flex justify-end">
        <ChevronRight className="h-4 w-4 text-yellow-300" />
      </div>
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

  // premium search
  const [query, setQuery] = useState("");

  useEffect(() => setMounted(true), []);

  const players = useMemo(() => MOCK_PLAYERS, []);
  const statCfg = STAT_CONFIG[selectedStat];

  const filteredPlayers = useMemo(() => {
    if (!isPremium) return players;
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => {
      const hay = `${p.name} ${p.team} ${p.role}`.toLowerCase();
      return hay.includes(q);
    });
  }, [players, isPremium, query]);

  const onOpen = (p: PlayerRow, idx: number) => {
    const blurred = !isPremium && idx >= 20;
    if (!blurred) setSelectedPlayer(p);
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-5 py-4 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                Master Table
              </span>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-neutral-50">
              Full-season player trends
            </h3>
            <p className="mt-2 max-w-lg text-xs text-neutral-400">
              Round-by-round production with season-wide hit-rate distributions.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            {/* Lens pills (desktop + mobile) */}
            <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
              {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStat(s)}
                  className={cx(
                    "rounded-full px-3 py-1.5 transition",
                    selectedStat === s
                      ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.8)]"
                      : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Desktop controls */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-3 py-1.5">
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                <span className="text-[11px] text-neutral-200">
                  Compact leaderboard
                </span>
              </div>

              {isPremium ? (
                <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-3 py-1.5">
                  <Search className="h-3 w-3 text-neutral-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search players…"
                    className="w-[200px] bg-transparent text-[11px] text-neutral-200 placeholder:text-neutral-500 outline-none"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-neutral-800 bg-black/70 px-3 py-1.5">
                  <Lock className="h-3 w-3 text-neutral-500" />
                  <span className="text-[11px] text-neutral-500">
                    Search (Neeko+)
                  </span>
                </div>
              )}
            </div>

            {/* Mobile controls (restored) */}
            <div className="md:hidden flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-black/70 px-3 py-2">
                <div className="text-[11px] text-neutral-200">
                  Compact leaderboard
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>

              {isPremium ? (
                <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-black/70 px-3 py-2">
                  <Search className="h-4 w-4 text-neutral-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search players…"
                    className="w-full bg-transparent text-[12px] text-neutral-200 placeholder:text-neutral-500 outline-none"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-black/60 px-3 py-2">
                  <Lock className="h-4 w-4 text-neutral-500" />
                  <div className="text-[12px] text-neutral-500">
                    Search is Neeko+ only
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="mt-7 hidden md:block">
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/90 shadow-xl">
          {/* Single scroll container (sticky works) */}
          <div className="max-h-[720px] overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    <th className="sticky left-0 z-40 bg-neutral-950/80 backdrop-blur-md px-4 py-3 text-left">
                      <div className="flex items-center justify-between">
                        <span>Player</span>
                        {/* subtle right edge divider */}
                        <span className="ml-3 block h-4 w-px bg-neutral-800" />
                      </div>
                    </th>

                    {!compactMode &&
                      ROUND_LABELS.map((r, i) => (
                        <th
                          key={r}
                          className={cx(
                            "px-2.5 py-3 text-center text-[9px]",
                            i === 0 ? "border-l border-neutral-800/70" : ""
                          )}
                        >
                          {r}
                        </th>
                      ))}

                    <th className="sticky right-0 z-40 bg-neutral-950/80 backdrop-blur-md px-4 py-3 text-right w-[320px]">
                      <div className="flex items-center justify-end gap-3">
                        <span className="block h-4 w-px bg-neutral-800" />
                        <span>Season snapshot</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlayers.map((p, idx) => {
                    const s = computeSummary(p, selectedStat);
                    const hits = computeHitRates(p, selectedStat);
                    const rounds = getRounds(p, selectedStat);
                    const blurred = !isPremium && idx >= 20;

                    const rowHeight = compactMode ? "h-[64px]" : "h-[86px]";
                    const zebra = idx % 2 === 0 ? "bg-black/30" : "bg-black/10";

                    return (
                      <tr
                        key={p.id}
                        className={cx(
                          "border-t border-neutral-800/80 transition",
                          zebra,
                          !blurred && "hover:bg-neutral-900/60",
                          blurred &&
                            "blur-[3px] brightness-[0.6] pointer-events-none"
                        )}
                        onClick={() => onOpen(p, idx)}
                      >
                        {/* LEFT (sticky) */}
                        <td
                          className={cx(
                            "sticky left-0 z-20 bg-black/95 px-4",
                            rowHeight,
                            "shadow-[inset_-14px_0_18px_-18px_rgba(0,0,0,0.95)]"
                          )}
                        >
                          <div className="flex items-center gap-3 py-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 text-[11px] text-neutral-300 tabular-nums">
                              {p.rank}
                            </div>
                            <div className="min-w-[160px]">
                              <div className="text-[13px] font-semibold text-neutral-50 leading-tight">
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
                              className={cx(
                                "px-2.5 text-center text-[10px] text-neutral-100 tabular-nums",
                                rowHeight,
                                i === 0 ? "border-l border-neutral-800/70" : "",
                                // subtle “trend” emphasis without changing mobile:
                                v <= 0 ? "text-neutral-500" : ""
                              )}
                            >
                              {v}
                            </td>
                          ))}

                        {/* RIGHT (sticky snapshot) */}
                        <td
                          className={cx(
                            "sticky right-0 z-20 bg-black/95 px-4",
                            rowHeight,
                            "w-[320px]",
                            "shadow-[inset_14px_0_18px_-18px_rgba(0,0,0,0.95)]",
                            !compactMode && "border-l border-neutral-800/70"
                          )}
                        >
                          <div className="py-2">
                            <SnapshotBlock
                              thresholds={statCfg.thresholds}
                              hits={hits}
                              compact={compactMode}
                              avgLabel={`AVG ${s.avg.toFixed(1)} ${statCfg.valueUnitShort}`}
                              rangeLabel={`${s.min}–${s.max} • ${s.games} gms`}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* premium CTA area for non-premium */}
                  {!isPremium && (
                    <tr className="border-t border-neutral-800/80">
                      <td
                        colSpan={
                          1 +
                          (compactMode ? 0 : ROUND_LABELS.length) +
                          1
                        }
                        className="bg-black/80 px-6 py-6"
                      >
                        <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 px-6 py-5 text-center">
                          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                            <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                              Neeko+ Master Grid
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-neutral-200">
                            Unlock full player list, search, and advanced hit-rate tools.
                          </p>
                          <div className="mt-4 flex justify-center">
                            <Button className="rounded-full bg-yellow-400 text-black hover:bg-yellow-300">
                              Get Neeko+
                            </Button>
                          </div>
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

      {/* ================= MOBILE LIST (RESTORED) ================= */}
      <div className="mt-6 md:hidden">
        <div className="rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            <div className="divide-y divide-neutral-800/80">
              {filteredPlayers.map((p, idx) => {
                const s = computeSummary(p, selectedStat);
                const hits = computeHitRates(p, selectedStat);
                const blurred = !isPremium && idx >= 20;

                // Mobile: do not redesign — keep simple, data-forward
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (!blurred) setSelectedPlayer(p);
                    }}
                    className={cx(
                      "w-full text-left px-4 py-3",
                      blurred
                        ? "blur-[3px] brightness-[0.6] pointer-events-none"
                        : "active:bg-neutral-900/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 text-[12px] text-neutral-300 tabular-nums">
                          {p.rank}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-neutral-50 leading-tight">
                            {p.name}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                            {p.team} • {p.role}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[12px] font-semibold text-yellow-200">
                          AVG {s.avg.toFixed(1)} {statCfg.valueUnitShort}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {s.min}–{s.max} • {s.games} gms
                        </div>
                      </div>
                    </div>

                    {/* hit-rate strip on mobile (compact-friendly) */}
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {statCfg.thresholds.map((t, i) => (
                        <div key={t} className="text-right">
                          <div className="text-[9px] text-neutral-500">{t}+</div>
                          <div className="mt-1 h-1.5 rounded bg-neutral-800/90 border border-neutral-700/30">
                            <div
                              className={cx("h-1.5 rounded", hitColour(hits[i]))}
                              style={{ width: `${hits[i]}%` }}
                            />
                          </div>
                          <div className="mt-1 text-[9px] text-neutral-300 tabular-nums">
                            {hits[i]}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}

              {!isPremium && (
                <div className="px-4 py-5 bg-black/80">
                  <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                      <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                        Neeko+ Master Grid
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-neutral-200">
                      Unlock the full player list + search.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button className="rounded-full bg-yellow-400 text-black hover:bg-yellow-300">
                        Get Neeko+
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
