// src/components/afl/players/MasterTable.tsx

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  ChevronDown,
  Lock,
  Search,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import PlayerInsightsOverlay from "./PlayerInsightsOverlay";

/* -------------------------------------------------------------------------- */
/*                               TYPES                                         */
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
/*                          ROUND LABELS (exported)                           */
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
/*                      STAT CONFIG (separate file)                           */
/* -------------------------------------------------------------------------- */

import { STAT_CONFIG } from "./playerStatConfig";

/* -------------------------------------------------------------------------- */
/*                                  MOCK DATA                                 */
/* -------------------------------------------------------------------------- */

function buildMockPlayers(): PlayerRow[] {
  const list: PlayerRow[] = [];

  for (let i = 1; i <= 60; i++) {
    const baseFantasy = 70 + Math.round(Math.random() * 40);
    const baseDisposals = 18 + Math.round(Math.random() * 10);
    const baseGoals = Math.random() < 0.5 ? 1 : 0;

    const f: number[] = [];
    const d: number[] = [];
    const g: number[] = [];

    for (let r = 0; r < ROUND_LABELS.length; r++) {
      const fantasy =
        baseFantasy +
        Math.round((Math.random() - 0.5) * 24) +
        (Math.random() < 0.1 ? 20 : 0);

      const disposals = baseDisposals + Math.round((Math.random() - 0.5) * 8);

      const goals =
        baseGoals +
        (Math.random() < 0.15 ? 2 : 0) +
        (Math.random() < 0.05 ? 3 : 0);

      f.push(Math.max(40, fantasy));
      d.push(Math.max(8, disposals));
      g.push(Math.max(0, goals));
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
/*                            HELPER LOGIC                                     */
/* -------------------------------------------------------------------------- */

function getRounds(player: PlayerRow, lens: StatLens): number[] {
  switch (lens) {
    case "Fantasy":
      return player.roundsFantasy;
    case "Disposals":
      return player.roundsDisposals;
    case "Goals":
    default:
      return player.roundsGoals;
  }
}

function computeSummary(player: PlayerRow, lens: StatLens) {
  const values = getRounds(player, lens);
  if (!values.length) {
    return { min: 0, max: 0, total: 0, avg: 0, games: 0 };
  }

  const clean = values.filter((v) => typeof v === "number");
  if (!clean.length) {
    return { min: 0, max: 0, total: 0, avg: 0, games: 0 };
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const total = clean.reduce((a, b) => a + b, 0);
  const games = clean.length;
  const avg = total / games;
  return { min, max, total, avg, games };
}

function computeHitRates(player: PlayerRow, lens: StatLens) {
  const values = getRounds(player, lens);
  const clean = values.filter((v) => typeof v === "number");
  const games = clean.length || 1;

  return STAT_CONFIG[lens].thresholds.map((t) =>
    Math.round((clean.filter((v) => v >= t).length / games) * 100)
  );
}

function getHitRateColorClasses(v: number) {
  if (v === 100) return "text-lime-300";
  if (v >= 80) return "text-lime-200";
  if (v >= 60) return "text-yellow-300";
  if (v >= 40) return "text-amber-300";
  if (v >= 20) return "text-orange-300";
  return "text-red-400";
}

/* -------------------------------------------------------------------------- */
/*                                  MOBILE CARD                               */
/* -------------------------------------------------------------------------- */

function MobilePlayerCard({
  player,
  index,
  selectedStat,
  onOpen,
  blurClass,
}: {
  player: PlayerRow;
  index: number;
  selectedStat: StatLens;
  blurClass?: string;
  onOpen: () => void;
}) {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);
  const rounds = getRounds(player, selectedStat);

  return (
    <div
      className={`relative rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-black/95 to-black px-4 py-3 shadow-[0_0_30px_#000] ${blurClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-black/80">
            {index + 1}
          </div>

          <div>
            <div className="text-[13px] font-medium text-neutral-50">
              {player.name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
              {player.team} • {player.role}
            </div>
          </div>
        </div>

        <div className="text-right text-[11px]">
          <div className="text-[10px] text-neutral-500 uppercase tracking-[0.14em]">
            {config.label} avg
          </div>
          <div className="text-sm font-semibold text-yellow-200">
            {summary.avg.toFixed(1)} {config.valueUnitShort}
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {rounds.map((value, i) => (
            <div key={i} className="flex min-w-[46px] flex-col items-center">
              <span className="text-[9px] text-neutral-500">
                {ROUND_LABELS[i]}
              </span>
              <div className="mt-1 flex h-8 w-10 items-center justify-center rounded-md bg-neutral-950 text-[11px] text-neutral-100">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] text-neutral-400">
          Tap insights for full analysis.
        </span>

        <Button
          onClick={onOpen}
          size="sm"
          className="rounded-full bg-yellow-400 text-black px-3 py-1 text-[11px] font-semibold shadow-[0_0_18px_rgba(250,204,21,0.8)]"
        >
          View insights
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function MasterTable() {
  const { isPremium } = useAuth();

  const [selectedStat, setSelectedStat] = useState<StatLens>("Fantasy");
  const [compactMode, setCompactMode] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const players = useMemo(() => MOCK_PLAYERS, []);

  const filteredPlayers = useMemo(() => {
    let list = [...players];

    if (isPremium && search.trim().length > 0) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return list;
  }, [players, isPremium, search]);

  const visiblePlayers = filteredPlayers.slice(0, visibleCount);

  const showMore = () =>
    setVisibleCount((v) => Math.min(v + 20, filteredPlayers.length));

  const statConfig = STAT_CONFIG[selectedStat];

  return (
    <>
      {/* HEADER */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-5 py-4 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
                Master Table
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold text-neutral-50 md:text-2xl">
              Full-season player ledger &amp; hit-rate grid
            </h3>

            <p className="mt-2 max-w-lg text-xs text-neutral-400">
              Complete ledger of round-by-round production, volatility and
              hit-rate bands.
            </p>
          </div>

          {/* Stat pills + controls */}
          <div className="flex flex-1 flex-col gap-3 md:items-end">
            <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
              {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((stat) => (
                <button
                  key={stat}
                  onClick={() => setSelectedStat(stat)}
                  className={`rounded-full px-3 py-1.5 ${
                    selectedStat === stat
                      ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.8)]"
                      : "bg-neutral-900 text-neutral-300"
                  }`}
                >
                  {stat}
                </button>
              ))}
            </div>

            {/* Compact toggle (desktop only) */}
            <div className="hidden items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-3 py-1.5 md:flex">
              <Switch
                checked={compactMode}
                onCheckedChange={setCompactMode}
                className="data-[state=checked]:bg-yellow-400"
              />
              <span className="text-[11px] text-neutral-100">
                Compact rows (summary-only)
              </span>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px]">
              <Search className="h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                disabled={!isPremium}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isPremium ? "Search players…" : "Search (Neeko+ only)"
                }
                className="w-full bg-transparent text-neutral-200 placeholder:text-neutral-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE LIST (unchanged) */}
      <div className="mt-8 md:hidden">
        <div className="space-y-3">
          {visiblePlayers.map((p, index) => {
            const blur =
              !isPremium && index >= 20
                ? "blur-[3px] brightness-[0.6] pointer-events-none"
                : "";

            return (
              <MobilePlayerCard
                key={p.id}
                player={p}
                index={index}
                selectedStat={selectedStat}
                blurClass={blur}
                onOpen={() => setSelectedPlayer(p)}
              />
            );
          })}
        </div>

        {visibleCount < filteredPlayers.length && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={showMore}
              className="rounded-full border-neutral-700 bg-neutral-950 text-xs text-neutral-200"
            >
              Show 20 more players
            </Button>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE – 3-ZONE FREEZE */}
      <div className="mt-8 hidden md:block">
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-black/90 shadow-xl">
          <div className="relative max-h-[520px] overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead className="sticky top-0 z-20 bg-neutral-950/95 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  <tr>
                    {/* ZONE 1: Sticky left identity */}
                    <th
                      className="sticky left-0 z-30 border-r border-neutral-800 bg-neutral-950/95 px-4 py-3 text-left"
                      style={{ minWidth: 260 }}
                    >
                      Player
                    </th>

                    {/* ZONE 2: Rounds (scrollable middle) */}
                    {!compactMode &&
                      ROUND_LABELS.map((label) => (
                        <th
                          key={label}
                          className="border-r border-neutral-900 px-2 py-3 text-center text-[9px]"
                        >
                          {label}
                        </th>
                      ))}

                    {/* ZONE 3: Sticky right summary + hit-rates + CTA */}
                    <th
                      className="sticky right-0 z-30 border-l border-neutral-800 bg-neutral-950/95 px-4 py-3 text-right"
                      style={{ minWidth: 280 }}
                    >
                      <span className="text-[9px] tracking-[0.18em] text-neutral-400">
                        SUMMARY &amp; HIT-RATE
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, index) => {
                    const summary = computeSummary(player, selectedStat);
                    const hits = computeHitRates(player, selectedStat);
                    const rounds = getRounds(player, selectedStat);

                    const rowPad = compactMode ? "py-2" : "py-3";
                    const isBlurred = !isPremium && index >= 20;

                    return (
                      <tr
                        key={player.id}
                        onClick={() =>
                          !isBlurred ? setSelectedPlayer(player) : null
                        }
                        className={`border-t border-neutral-800/70 hover:bg-neutral-900/60 ${rowPad} ${
                          isBlurred
                            ? "blur-[3px] brightness-[0.6] pointer-events-none"
                            : "cursor-pointer"
                        }`}
                      >
                        {/* ZONE 1: Sticky left identity cell */}
                        <td
                          className="sticky left-0 z-10 border-r border-neutral-800 bg-black/95 px-4 align-middle"
                          style={{ minWidth: 260 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-black/80 text-[11px] text-neutral-300">
                              {player.rank}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold text-neutral-50">
                                {player.name}
                              </span>
                              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                                {player.team} • {player.role}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ZONE 2: Rounds (raw ledger) */}
                        {!compactMode &&
                          ROUND_LABELS.map((label, roundIndex) => (
                            <td
                              key={label}
                              className="border-r border-neutral-900 px-2 text-center align-middle text-[10px] text-neutral-100"
                            >
                              {rounds[roundIndex] ?? "-"}
                            </td>
                          ))}

                        {/* ZONE 3: Sticky right summary + hit-rates + CTA */}
                        <td
                          className="sticky right-0 z-10 border-l border-neutral-800 bg-black/95 px-4 align-middle"
                          style={{ minWidth: 280 }}
                        >
                          <div className="flex flex-col items-end gap-1">
                            {/* Summary row */}
                            <div className="flex gap-3 text-[10px] text-neutral-400">
                              <span>MIN</span>
                              <span>MAX</span>
                              <span>AVG</span>
                              <span>TOTAL</span>
                              <span>GMS</span>
                            </div>
                            <div className="flex gap-3 text-[11px]">
                              <span className="text-neutral-100">
                                {summary.min}
                              </span>
                              <span className="text-neutral-100">
                                {summary.max}
                              </span>
                              <span className="text-yellow-200">
                                {summary.avg.toFixed(1)}{" "}
                                {statConfig.valueUnitShort}
                              </span>
                              <span className="text-neutral-100">
                                {summary.total}
                              </span>
                              <span className="text-neutral-100">
                                {summary.games}
                              </span>
                            </div>

                            {/* Hit-rate row */}
                            <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
                              {statConfig.thresholds.map((t, i) => {
                                const hit = hits[i] ?? 0;
                                return (
                                  <div
                                    key={t}
                                    className="flex flex-col items-center"
                                  >
                                    <span className="text-[9px] text-neutral-500">
                                      {t}+
                                    </span>
                                    <span
                                      className={`text-[11px] font-semibold ${getHitRateColorClasses(
                                        hit
                                      )}`}
                                    >
                                      {hit}%
                                    </span>
                                  </div>
                                );
                              })}

                              <button className="ml-2 rounded-full bg-yellow-400/90 px-3 py-1 text-[10px] font-semibold text-black shadow-[0_0_16px_rgba(250,204,21,0.7)] hover:bg-yellow-300">
                                View
                              </button>
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

          <div className="flex items-center justify-between border-t border-neutral-800 px-4 py-2 text-[10px] text-neutral-500">
            <span>
              Showing {filteredPlayers.length} players • Lens:{" "}
              <span className="text-yellow-200">{statConfig.label}</span>
            </span>
            {isPremium ? (
              <span>Click any row for full player insights.</span>
            ) : (
              <span>Neeko+ unlocks search &amp; deeper hit-rate tools.</span>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-yellow-200">
          <Sparkles className="h-3 w-3" />
          <span>Neeko+ Master Grid</span>
        </div>

        <p className="max-w-lg text-xs text-neutral-300">
          Unlock advanced hit-rate bands, compact grid mode and extended
          filters.
        </p>

        <Button
          size="lg"
          className="rounded-full bg-yellow-400 text-black px-7 py-2 text-sm font-semibold shadow-[0_0_30px_rgba(250,204,21,0.8)] hover:bg-yellow-300"
        >
          Get Neeko+
        </Button>
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