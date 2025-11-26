// src/pages/sports/AFLPlayers.tsx
// AFL Player Stats — Pro layout with freemium gating
// v2 patches:
// - Position Trends: MID + RUC free, FWD/DEF locked for free users
// - Compare section blur lowered to expose more headers
// - Stability Meter: 4 free cards, overlay starts higher over rows 3–4
// - Master Table: heavy blur overlay for locked area; round columns OR, R1–R5

import { useState, useEffect, Fragment } from "react";

// -----------------------------------------------------------------------------
// Minimal UI stubs — swap these to your real component library in your project
// -----------------------------------------------------------------------------
type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

const Button = ({
  children,
  onClick,
  className = "",
  type = "button",
  disabled,
}: ButtonProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      disabled
        ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
        : "bg-neutral-800 hover:bg-neutral-700 text-white"
    } ${className}`}
  >
    {children}
  </button>
);

const ArrowLeftIcon = () => <span className="mr-1">←</span>;

const CrownIcon = () => (
  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[11px] text-black shadow-sm ml-1">
    👑
  </span>
);

const LockIcon = () => (
  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-yellow-400/70 bg-black/40 text-[10px] text-yellow-200 mr-1">
    🔒
  </span>
);

const FireIcon = () => (
  <span className="ml-1 text-xs" role="img" aria-label="hot">
    🔥
  </span>
);

const ColdIcon = () => (
  <span className="ml-1 text-xs" role="img" aria-label="cold">
    ❄️
  </span>
);

const WarningIcon = () => (
  <span className="ml-1 text-xs" role="img" aria-label="risk">
    ⚠️
  </span>
);

// Stub auth — replace with your real useAuth()
function useAuth() {
  return { isPremium: false };
}

// Simple toast stub
function showLockedToast(message: string) {
  if (typeof window !== "undefined") {
    window.alert(message);
  } else {
    console.log("LOCKED:", message);
  }
}

// -----------------------------------------------------------------------------
// Data types & helpers
// -----------------------------------------------------------------------------
type StatKey = "fantasy" | "disposals" | "goals";

type Position = "MID" | "FWD" | "DEF" | "RUC";

interface Player {
  id: number;
  name: string;
  pos: Position;
  team: string;
  rounds: number[]; // mock season series
}

const ALL_TEAMS = [
  "All Teams",
  "COLL",
  "ESS",
  "SYD",
  "CARL",
  "GEEL",
  "MELB",
  "RICH",
];

const ALL_POSITIONS = ["All Positions", "MID", "FWD", "DEF", "RUC"];

const ALL_ROUND_FILTERS = ["All Rounds", "Opening Round", "R1", "R2", "R3", "R4", "R5"];

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

const DASH_HOT_FREE = 2;
const DASH_COLD_FREE = 2;
const AI_FREE = 2;
const RISERS_FREE = 2;
const STABILITY_FREE = 4; // v2: 4 free cards
const TABLE_FREE_ROWS = 15;

const FREE_STAT_SET = new Set<StatKey>(["fantasy", "disposals", "goals"]);

function generatePlayers(): Player[] {
  return Array.from({ length: 120 }).map((_, i) => {
    const base = 80 + (i % 15);
    const posIndex = i % 4;
    const pos: Position =
      posIndex === 0 ? "MID" : posIndex === 1 ? "FWD" : posIndex === 2 ? "DEF" : "RUC";
    const team = ["COLL", "ESS", "SYD", "CARL"][i % 4];
    const rounds = [
      base - 10 + (i % 5), // OR
      base - 5 + (i % 4), // R1
      base + 3 - (i % 6), // R2
      base + 8 - (i % 7), // R3
      base + 1 + (i % 3), // R4
      base + 4 - (i % 2), // R5
    ];
    return {
      id: i + 1,
      name: `Player ${i + 1}`,
      pos,
      team,
      rounds,
    };
  });
}

const ALL_PLAYERS: Player[] = generatePlayers();

function lastN(series: number[], n: number) {
  return series.slice(-n);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = average(values);
  const variance =
    values.reduce((s, v) => s + (v - avg) * (v - avg), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function getSeriesForStat(p: Player, stat: StatKey): number[] {
  const base = p.rounds;
  if (stat === "fantasy") return base;
  if (stat === "disposals") return base.map((v, i) => Math.round(v / 1.6) + (i % 3) * 2);
  if (stat === "goals") return base.map((v, i) => Math.max(0, Math.round((v - 60) / 15)));
  return base;
}

// Sparkline
const TrendSparkline = ({ values }: { values: number[] }) => {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 160;
      const y = 40 - ((v - min) / range) * 30 - 5;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={160} height={40} className="overflow-visible">
      <polyline
        fill="none"
        stroke="#22c55e"
        strokeWidth={2}
        points={points}
        className="transition-all duration-200"
      />
      {values.map((v, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * 160;
        const y = 40 - ((v - min) / range) * 30 - 5;
        return <circle key={i} cx={x} cy={y} r={2.5} fill="#22c55e" />;
      })}
    </svg>
  );
};

// Stability meta
function stabilityMeta(vol: number) {
  if (vol < 4)
    return {
      label: "Rock solid",
      colour: "text-emerald-400",
      reason: "Very low game-to-game movement; scores cluster tightly.",
    };
  if (vol < 8)
    return {
      label: "Steady",
      colour: "text-emerald-300",
      reason: "Small ups and downs; reliable role and usage.",
    };
  if (vol < 12)
    return {
      label: "Swingy",
      colour: "text-amber-300",
      reason: "Meaningful swings in output; matchup and role sensitive.",
    };
  return {
    label: "Rollercoaster",
    colour: "text-red-400",
    reason: "Huge volatility; slate-breaking upside with real downside risk.",
  };
}

// AI signals mock
const AI_SIGNALS = [
  {
    id: 1,
    text: "High-ceiling mids are stabilising with stronger floors over the last 3 rounds.",
    delta: +7,
  },
  {
    id: 2,
    text: "Key forwards seeing a slight dip in inside-50 marks but spike in accuracy.",
    delta: -4,
  },
  {
    id: 3,
    text: "Rebounding defenders trending up in uncontested chains through half-back.",
    delta: +5,
  },
  {
    id: 4,
    text: "Tagging roles are creating sharp volatility for elite ball-winners.",
    delta: -6,
  },
];

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------
export default function AFLPlayers() {
  const { isPremium } = useAuth();
  const premiumUser = !!isPremium;

  // Shared stat lens
  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");

  // Table state
  const [tableStat, setTableStat] = useState<StatKey>("fantasy");
  const [seasonYear, setSeasonYear] = useState<number>(2025);
  const [teamFilter, setTeamFilter] = useState<string>("All Teams");
  const [positionFilter, setPositionFilter] = useState<string>("All Positions");
  const [roundFilter, setRoundFilter] = useState<string>("All Rounds");
  const [compactMode, setCompactMode] = useState<boolean>(true);
  const [tableVisibleCount, setTableVisibleCount] = useState<number>(TABLE_FREE_ROWS);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Compare state
  const [teamA, setTeamA] = useState<string>("COLL");
  const [teamB, setTeamB] = useState<string>("ESS");
  const [playerAId, setPlayerAId] = useState<number | null>(null);
  const [playerBId, setPlayerBId] = useState<number | null>(null);

  // Derived data --------------------------------------------------------------
  const sortedByForm = [...ALL_PLAYERS].sort((a, b) => {
    const aAvg = average(lastN(getSeriesForStat(a, selectedStat), 5));
    const bAvg = average(lastN(getSeriesForStat(b, selectedStat), 5));
    return bAvg - aAvg;
  });

  const hotList = sortedByForm.slice(0, 6);
  const coldList = [...sortedByForm].reverse().slice(0, 6);

  const risers = [...ALL_PLAYERS]
    .map((p) => {
      const series = getSeriesForStat(p, selectedStat);
      const l5 = lastN(series, 5);
      if (l5.length < 5) return null;
      const prev4 = l5.slice(0, 4);
      const last = l5[4];
      return { player: p, diff: last - average(prev4), last };
    })
    .filter(Boolean)
    .sort((a, b) => (b as any).diff - (a as any).diff)
    .slice(0, 6) as { player: Player; diff: number; last: number }[];

  const stabilityList = [...ALL_PLAYERS]
    .map((p) => {
      const l5 = lastN(getSeriesForStat(p, selectedStat), 5);
      return { player: p, vol: stdDev(l5) };
    })
    .sort((a, b) => a.vol - b.vol)
    .slice(0, 20);

  // Table filtering (mock: year and roundFilter not yet wired to data)
  const filteredTable = ALL_PLAYERS.filter((p) => {
    if (teamFilter !== "All Teams" && p.team !== teamFilter) return false;
    if (positionFilter !== "All Positions" && p.pos !== positionFilter) return false;
    return true;
  });

  const tableSorted = [...filteredTable].sort((a, b) => {
    const aSeries = getSeriesForStat(a, tableStat);
    const bSeries = getSeriesForStat(b, tableStat);
    const aTotal = aSeries.reduce((s, v) => s + v, 0);
    const bTotal = bSeries.reduce((s, v) => s + v, 0);
    return bTotal - aTotal;
  });

  const tableSlice = tableSorted.slice(0, tableVisibleCount);

  // Compare calculations
  const playersTeamA = ALL_PLAYERS.filter((p) => teamA === "All Teams" || p.team === teamA);
  const playersTeamB = ALL_PLAYERS.filter((p) => teamB === "All Teams" || p.team === teamB);

  const playerA = playersTeamA.find((p) => p.id === playerAId) ?? playersTeamA[0];
  const playerB =
    playersTeamB.find((p) => p.id === playerBId) ?? playersTeamB[1] ?? playersTeamB[0];

  const compareSeriesA = playerA ? lastN(getSeriesForStat(playerA, selectedStat), 5) : [];
  const compareSeriesB = playerB ? lastN(getSeriesForStat(playerB, selectedStat), 5) : [];

  const compareAvgA = average(compareSeriesA);
  const compareAvgB = average(compareSeriesB);
  const compareTotalA = compareSeriesA.reduce((s, v) => s + v, 0);
  const compareTotalB = compareSeriesB.reduce((s, v) => s + v, 0);
  const compareBestA = compareSeriesA.length ? Math.max(...compareSeriesA) : 0;
  const compareBestB = compareSeriesB.length ? Math.max(...compareSeriesB) : 0;
  const compareWorstA = compareSeriesA.length ? Math.min(...compareSeriesA) : 0;
  const compareWorstB = compareSeriesB.length ? Math.min(...compareSeriesB) : 0;

  // Handlers ------------------------------------------------------------------
  const handleGlobalStatChange = (value: StatKey) => {
    if (!premiumUser && !FREE_STAT_SET.has(value)) {
      showLockedToast("Unlock Neeko+ to use this stat lens.");
      return;
    }
    setSelectedStat(value);
  };

  const handleTableStatChange = (value: StatKey) => {
    setTableStat(value);
  };

  const handleTeamFilterChange = (value: string) => {
    if (!premiumUser && value !== "All Teams") {
      showLockedToast("Neeko+ unlocks team filters.");
      return;
    }
    setTeamFilter(value);
  };

  const handlePositionFilterChange = (value: string) => {
    if (!premiumUser && value !== "All Positions") {
      showLockedToast("Neeko+ unlocks position filters.");
      return;
    }
    setPositionFilter(value);
  };

  const handleRoundFilterChange = (value: string) => {
    if (!premiumUser && value !== "All Rounds") {
      showLockedToast("Neeko+ unlocks round filters.");
      return;
    }
    setRoundFilter(value);
  };

  const toggleRowExpanded = (id: number) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderStatSelector = () => (
    <div className="flex items-center gap-2 text-xs md:text-sm">
      <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        Stat Type
      </span>
      <div className="relative">
        <select
          className="h-8 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 pr-7 text-xs md:text-sm text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
          value={selectedStat}
          onChange={(e) => handleGlobalStatChange(e.target.value as StatKey)}
        >
          <option value="fantasy">Fantasy</option>
          <option value="disposals">Disposals</option>
          <option value="goals">Goals</option>
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">
          ▼
        </span>
      </div>
    </div>
  );

  const renderDashboardRow = () => (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {/* Hot list */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 via-neutral-950 to-emerald-900/30 p-4 shadow-[0_0_26px_rgba(16,185,129,0.35)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/15 px-3 py-1.5 backdrop-blur-md">
            <span className="text-xs md:text-sm font-medium text-emerald-100">
              🔥 Form Leaders
            </span>
            <span className="text-[10px] text-emerald-200/80">
              Top 6 by last-5 average
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Neeko+ expands this
          </span>
        </div>

        <ul className="relative z-10 space-y-1.5 text-xs md:text-sm">
          {hotList.map((p, idx) => {
            const series = lastN(getSeriesForStat(p, selectedStat), 5);
            const avg = Math.round(average(series));
            const isLocked = !premiumUser && idx >= DASH_HOT_FREE;
            const strong = avg >= 110;

            return (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-2 rounded-xl bg-neutral-900/55 px-3 py-2 transition-colors hover:bg-neutral-900/95 ${
                  isLocked ? "opacity-40 blur-sm" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isLocked && <LockIcon />}
                  <span className="max-w-[9rem] truncate whitespace-nowrap font-medium">{p.name}</span>
                  <span className="whitespace-nowrap text-[10px] text-neutral-400">
                    {p.pos} · {p.team}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="flex items-center text-xs text-emerald-300">
                    Avg {avg}
                    {strong && <FireIcon />}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Season snapshot (mock L5)
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/98 to-transparent backdrop-blur-2xl">
            <a
              href="/neeko-plus"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2 text-xs font-semibold text-black shadow-[0_0_24px_rgba(250,204,21,0.9)]"
            >
              <LockIcon />
              <span>Unlock full hot list — Neeko+</span>
            </a>
          </div>
        )}
      </div>

      {/* Position trends */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950/80 via-neutral-950 to-cyan-900/30 p-4 shadow-[0_0_26px_rgba(34,211,238,0.35)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/60 bg-cyan-500/15 px-3 py-1.5 backdrop-blur-md">
              <span className="text-xs md:text-sm font-medium text-cyan-100">
                📊 Position Trends
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">
              Avg last-5 {selectedStat === "fantasy" ? "fantasy scores" : selectedStat} by
              role
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            MID &amp; RUC view free
          </span>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-2 text-xs md:text-sm">
          {(["MID", "RUC", "DEF", "FWD"] as Position[]).map((pos) => {
            const players = ALL_PLAYERS.filter((p) => p.pos === pos);
            const allSeries = players.map((p) => getSeriesForStat(p, selectedStat));
            const curVals = allSeries.flatMap((s) => lastN(s, 5));
            const prevVals = allSeries.flatMap((s) => s.slice(0, 5));
            const avgCur = average(curVals);
            const avgPrev = prevVals.length ? average(prevVals) : avgCur;
            const pctDiff =
              avgPrev !== 0 ? Math.round(((avgCur - avgPrev) / avgPrev) * 100) : 0;

            const top = players
              .map((p) => {
                const l5 = lastN(getSeriesForStat(p, selectedStat), 5);
                return { player: p, avg: average(l5) };
              })
              .sort((a, b) => b.avg - a.avg)[0];

            const isLocked =
              !premiumUser && !(pos === "MID" || pos === "RUC"); // v2: MID+RUC free

            const arrow =
              pctDiff > 3 ? "▲" : pctDiff < -3 ? "▼" : "●";
            const arrowColour =
              pctDiff > 3
                ? "text-emerald-300"
                : pctDiff < -3
                ? "text-red-300"
                : "text-yellow-300";

            return (
              <div
                key={pos}
                className={`flex flex-col gap-1 rounded-xl border border-cyan-400/30 bg-neutral-950/85 px-3 py-2 ${
                  isLocked ? "opacity-40 blur-sm" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-300">{pos}</span>
                  <span className="text-[10px] text-neutral-500">
                    {players.length} players
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-cyan-300">
                    Avg {Math.round(avgCur || 0)}
                    <span className={arrowColour}>
                      {arrow} {Math.abs(pctDiff)}%
                    </span>
                  </span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-900">
                    <div
                      className="h-full bg-cyan-400"
                      style={{
                        width: `${Math.max(
                          10,
                          Math.min(100, (avgCur || 0) / 1.4)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                {top && (
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span className="truncate pr-2">Top: {top.player.name}</span>
                    <span className="tabular-nums">
                      {Math.round(top.avg)} avg
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!premiumUser && (
          <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/98 to-transparent backdrop-blur-2xl">
            <a
              href="/neeko-plus"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2 text-xs font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.9)]"
            >
              <LockIcon />
              <span>Unlock full role trends — Neeko+</span>
            </a>
          </div>
        )}
      </div>

      {/* Risk watchlist */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/80 via-neutral-950 to-red-900/30 p-4 shadow-[0_0_26px_rgba(239,68,68,0.35)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/60 bg-red-500/15 px-3 py-1.5 backdrop-blur-md">
            <span className="text-xs md:text-sm font-medium text-red-100">
              ⚠️ Risk Watchlist
            </span>
            <span className="text-[10px] text-red-200/80">
              Trending cold or volatile
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Neeko+ expands this
          </span>
        </div>

        <ul className="relative z-10 space-y-1.5 text-xs md:text-sm">
          {coldList.map((p, idx) => {
            const series = lastN(getSeriesForStat(p, selectedStat), 5);
            const avg = Math.round(average(series));
            const vol = stdDev(series);
            const isLocked = !premiumUser && idx >= DASH_COLD_FREE;
            const veryCold = avg <= 80;
            const label =
              vol > 10 ? "High volatility" : veryCold ? "Trending down" : "At risk";

            return (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-2 rounded-xl bg-neutral-900/55 px-3 py-2 transition-colors hover:bg-neutral-900/95 ${
                  isLocked ? "opacity-40 blur-sm" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isLocked && <LockIcon />}
                  <span className="max-w-[9rem] truncate whitespace-nowrap font-medium">{p.name}</span>
                  <span className="whitespace-nowrap text-[10px] text-neutral-400">
                    {p.pos} · {p.team}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="flex items-center text-xs text-red-300">
                    Avg {avg}
                    {veryCold && <ColdIcon />}
                    {vol > 10 && <WarningIcon />}
                  </span>
                  <span className="text-[10px] text-neutral-500">{label}</span>
                </div>
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/98 to-transparent backdrop-blur-2xl">
            <a
              href="/neeko-plus"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2 text-xs font-semibold text-black shadow-[0_0_24px_rgba(250,204,21,0.9)]"
            >
              <LockIcon />
              <span>Unlock full risk watchlist — Neeko+</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );

  const renderAISignals = () => (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950/95 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold">
            🧠 AI Signals (Preview)
          </h2>
          <p className="text-xs text-neutral-500">
            Quick directional reads. Full breakdown lives on the AI Analysis page.
          </p>
        </div>
        <a
          href="/sports/afl/ai"
          className="text-[11px] text-yellow-400 underline underline-offset-2 hover:text-yellow-300"
        >
          View full AI analysis →
        </a>
      </div>

      <div className="relative z-10 divide-y divide-neutral-800 text-xs md:text-sm">
        {AI_SIGNALS.map((sig, idx) => {
          const isLocked = !premiumUser && idx >= AI_FREE;
          const positive = sig.delta > 0;
          const neutral = sig.delta === 0;
          const colour = neutral
            ? "text-yellow-300"
            : positive
            ? "text-emerald-400"
            : "text-red-400";
          const arrow = neutral ? "↔" : positive ? "▲" : "▼";

          return (
            <div
              key={sig.id}
              className={`flex items-center justify-between py-1.5 ${
                isLocked ? "opacity-40 blur-sm" : ""
              }`}
            >
              <span className="pr-3 text-neutral-200">{sig.text}</span>
              <span className={`pl-3 tabular-nums ${colour}`}>
                {arrow} {Math.abs(sig.delta)}%
              </span>
            </div>
          );
        })}
      </div>

      {!premiumUser && (
        <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/98 to-transparent backdrop-blur-2xl">
          <a
            href="/neeko-plus"
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2 text-[11px] font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.8)]"
          >
            <LockIcon />
            <span>Unlock full AI signals — Neeko+</span>
          </a>
        </div>
      )}
    </div>
  );

  const renderRisers = () => (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/80 via-neutral-950 to-purple-900/30 p-4 shadow-[0_0_26px_rgba(168,85,247,0.4)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/60 bg-purple-500/20 px-3 py-1.5 backdrop-blur-md">
          <span className="text-xs md:text-sm font-medium text-purple-100">
            📈 Role &amp; Form Risers
          </span>
          <span className="text-[10px] text-purple-200/80">
            Last game vs previous four
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          Neeko+ expands this
        </span>
      </div>

      <ul className="relative z-10 space-y-1.5 text-xs md:text-sm">
        {risers.map((entry, idx) => {
          const { player, diff, last } = entry;
          const isLocked = !premiumUser && idx >= RISERS_FREE;

          return (
            <li
              key={player.id}
              className={`flex items-center justify-between gap-2 rounded-xl bg-neutral-900/55 px-3 py-2 transition-colors hover:bg-neutral-900/95 ${
                isLocked ? "opacity-40 blur-sm" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                {isLocked && <LockIcon />}
                <span className="max-w-[9rem] truncate whitespace-nowrap font-medium">{player.name}</span>
                <span className="whitespace-nowrap text-[10px] text-neutral-400">
                  {player.pos} · {player.team}
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs text-emerald-300">
                  Last: {Math.round(last)} ({diff >= 0 ? "+" : ""}
                  {Math.round(diff)})
                </span>
                <span className="text-[10px] text-neutral-500">
                  Strong short-term lift
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {!premiumUser && (
        <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/98 to-transparent backdrop-blur-2xl">
          <a
            href="/neeko-plus"
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2 text-[11px] font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.8)]"
          >
            <LockIcon />
            <span>Unlock all risers — Neeko+</span>
          </a>
        </div>
      )}
    </div>
  );

  const renderCompare = () => (
    <div className="relative mt-8 max-w-6xl mx-auto overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950/95 p-5 shadow-[0_0_30px_rgba(148,163,184,0.35)]">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            Compare Players
          </p>
          <p className="text-xs text-neutral-400">
            Side-by-side form view for your selected stat.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <LockIcon />
          <span>Neeko+ Feature</span>
        </div>
      </div>

      {/* Headers visible for all users */}
      <div className="mb-3 grid grid-cols-3 gap-4 text-[11px] md:text-xs">
        <div className="text-left text-neutral-400">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.16em]">
            Player A
          </span>
          <span>Choose team &amp; player on the left.</span>
        </div>
        <div className="text-center text-neutral-400">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.16em]">
            Stat lens
          </span>
          <span>
            {selectedStat === "fantasy"
              ? "Fantasy points (season view)"
              : selectedStat === "disposals"
              ? "Disposals"
              : "Goals"}
          </span>
        </div>
        <div className="text-right text-neutral-400">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.16em]">
            Player B
          </span>
          <span>Choose team &amp; player on the right.</span>
        </div>
      </div>

      {/* Selectors & metrics (locked by overlay for free users) */}
      <div className="opacity-60">
        <div className="mb-4 grid grid-cols-1 gap-4 text-xs md:grid-cols-3 md:text-sm">
          {/* Player A */}
          <div className="flex flex-col gap-2">
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-xs text-neutral-100 shadow-inner"
              value={teamA}
              onChange={(e) => {
                if (!premiumUser) {
                  showLockedToast("Unlock Neeko+ to use interactive comparison.");
                  return;
                }
                setTeamA(e.target.value);
                setPlayerAId(null);
              }}
            >
              {ALL_TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-xs text-neutral-100 shadow-inner"
              value={playerA?.id ?? ""}
              onChange={(e) => {
                if (!premiumUser) {
                  showLockedToast("Unlock Neeko+ to use interactive comparison.");
                  return;
                }
                setPlayerAId(Number(e.target.value));
              }}
            >
              {playersTeamA.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stat descriptor */}
          <div className="flex flex-col items-center justify-center text-[11px] text-neutral-400">
            <span className="mb-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Stat lines
            </span>
            <span className="flex items-center gap-1 text-xs text-neutral-300">
              Compare averages, best/worst &amp; totals
              <CrownIcon />
            </span>
          </div>

          {/* Player B */}
          <div className="flex flex-col gap-2">
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-xs text-neutral-100 shadow-inner"
              value={teamB}
              onChange={(e) => {
                if (!premiumUser) {
                  showLockedToast("Unlock Neeko+ to use interactive comparison.");
                  return;
                }
                setTeamB(e.target.value);
                setPlayerBId(null);
              }}
            >
              {ALL_TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-xs text-neutral-100 shadow-inner"
              value={playerB?.id ?? ""}
              onChange={(e) => {
                if (!premiumUser) {
                  showLockedToast("Unlock Neeko+ to use interactive comparison.");
                  return;
                }
                setPlayerBId(Number(e.target.value));
              }}
            >
              {playersTeamB.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metrics */}
        <div className="mb-4 grid grid-cols-3 gap-3 text-[11px] md:text-xs">
          <div className="space-y-1 text-right text-neutral-100">
            <div className="tabular-nums">{Math.round(compareAvgA || 0)}</div>
            <div className="tabular-nums">{compareBestA || "--"}</div>
            <div className="tabular-nums">{compareWorstA || "--"}</div>
            <div className="tabular-nums">{compareTotalA || "--"}</div>
          </div>
          <div className="space-y-1 text-center text-neutral-400">
            <div className="uppercase tracking-[0.12em]">Season Avg</div>
            <div className="uppercase tracking-[0.12em]">Best</div>
            <div className="uppercase tracking-[0.12em]">Worst</div>
            <div className="uppercase tracking-[0.12em]">Season Total</div>
          </div>
          <div className="space-y-1 text-left text-neutral-100">
            <div className="tabular-nums">{Math.round(compareAvgB || 0)}</div>
            <div className="tabular-nums">{compareBestB || "--"}</div>
            <div className="tabular-nums">{compareWorstB || "--"}</div>
            <div className="tabular-nums">{compareTotalB || "--"}</div>
          </div>
        </div>

        {/* Sparklines */}
        <div className="grid grid-cols-1 gap-4 text-[11px] md:grid-cols-2 md:text-xs">
          <div>
            <p className="mb-1 text-neutral-300">Player A — trend preview</p>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-3">
              <TrendSparkline values={compareSeriesA} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-neutral-300">Player B — trend preview</p>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-3">
              <TrendSparkline values={compareSeriesB} />
            </div>
          </div>
        </div>
      </div>

      {!premiumUser && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/98 to-transparent backdrop-blur-2xl"
          style={{ top: "55%" }}
        >
          <a
            href="/neeko-plus"
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-3 text-sm font-semibold text-black shadow-[0_0_26px_rgba(250,204,21,0.9)]"
          >
            <LockIcon />
            <span>Unlock interactive player comparison — Neeko+</span>
          </a>
        </div>
      )}
    </div>
  );

  const renderStability = () => (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-950/80 via-neutral-950 to-sky-900/30 p-4 shadow-[0_0_26px_rgba(56,189,248,0.45)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Stability Meter
          </p>
          <p className="text-xs text-neutral-300">
            Measures how swingy a player has been over the last 5 games.
          </p>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
          <LockIcon />
          Neeko+ deep view
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-2 text-xs md:grid-cols-2 md:text-sm">
        {stabilityList.map((entry, idx) => {
          const { player, vol } = entry;
          const isLocked = !premiumUser && idx >= STABILITY_FREE;
          const meta = stabilityMeta(vol);

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-xl border border-sky-400/40 bg-neutral-950/90 px-3 py-2 ${
                isLocked ? "opacity-40 blur-sm" : ""
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-neutral-100">{player.name}</span>
                <span className="text-[10px] text-neutral-400">
                  {player.pos} · {player.team}
                </span>
              </div>
              <div className="flex max-w-[11rem] flex-col items-end gap-0.5 text-right">
                <span className={`text-xs ${meta.colour}`}>{meta.label}</span>
                <span className="text-[10px] text-neutral-400">
                  Volatility: {vol.toFixed(1)}
                </span>
                <span className="text-[10px] text-neutral-400">{meta.reason}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!premiumUser && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/98 to-transparent backdrop-blur-2xl"
          style={{ top: "42%" }} // overlay starts above row 3 so 4 cards remain free
        >
          <a
            href="/neeko-plus"
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2 text-[11px] font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.8)]"
          >
            <LockIcon />
            <span>Unlock full stability rankings — Neeko+</span>
          </a>
        </div>
      )}
    </div>
  );


  const calcThresholdPercent = (series: number[], threshold: number) => {
    if (!series.length) return 0;
    const count = series.filter((v) => v >= threshold).length;
    return (count / series.length) * 100;
  };

  const thresholdBarClass = (pct: number) => {
    if (pct >= 70) return "bg-emerald-500/80";
    if (pct >= 40) return "bg-yellow-400/80";
    if (pct > 0) return "bg-red-500/80";
    return "bg-neutral-800";
  };

  const renderMasterTable = () => {
    const roundLabels = ["OR", "R1", "R2", "R3", "R4", "R5"];

    return (
      <div className="relative mx-auto mt-8 max-w-6xl rounded-3xl border border-yellow-500/35 bg-neutral-950/98 p-5 shadow-[0_0_34px_rgba(250,204,21,0.35)]">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              Master Player Table
            </p>
            <p className="text-xs text-neutral-400">
              Season summary for the selected year and table stat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Compact */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Compact view</span>
              <button
                type="button"
                onClick={() => setCompactMode((prev) => !prev)}
                className={`flex h-5 w-10 items-center rounded-full border px-0.5 transition-all ${
                  compactMode
                    ? "bg-emerald-500/80 border-emerald-300"
                    : "bg-neutral-900 border-neutral-600"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    compactMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {/* Stat */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Table stat</span>
              <select
                className="h-8 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
                value={tableStat}
                onChange={(e) => handleTableStatChange(e.target.value as StatKey)}
              >
                <option value="fantasy">Fantasy</option>
                <option value="disposals">Disposals</option>
                <option value="goals">Goals</option>
              </select>
            </div>
            {/* Year */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Year</span>
              <select
                className="h-8 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
                value={seasonYear}
                onChange={(e) => setSeasonYear(Number(e.target.value))}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Team
            </span>
            <select
              className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
              value={teamFilter}
              onChange={(e) => handleTeamFilterChange(e.target.value)}
            >
              {ALL_TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                  {!premiumUser && t !== "All Teams" ? " 🔒" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Position
            </span>
            <select
              className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
              value={positionFilter}
              onChange={(e) => handlePositionFilterChange(e.target.value)}
            >
              {ALL_POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                  {!premiumUser && pos !== "All Positions" ? " 🔒" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Rounds
            </span>
            <select
              className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
              value={roundFilter}
              onChange={(e) => handleRoundFilterChange(e.target.value)}
            >
              {ALL_ROUND_FILTERS.map((r) => (
                <option key={r} value={r}>
                  {r}
                  {!premiumUser && r !== "All Rounds" ? " 🔒" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-center text-[11px] text-neutral-500">
            <span>
              Showing <span className="text-neutral-200">{tableSlice.length}</span> of{" "}
              <span className="text-neutral-200">{tableSorted.length}</span> players
            </span>
            {!premiumUser && (
              <span>Neeko+ unlocks full table, filters &amp; AI summaries.</span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="relative overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950/95">
          <table className="min-w-[960px] w-full text-left text-[11px] md:text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/85">
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2">Team</th>
                {roundLabels.map((label) => (
                  <th key={label} className="px-2 py-2 text-right">
                    {label}
                  </th>
                ))}
                <th className="px-2 py-2 text-right">Games</th>
                <th className="px-2 py-2 text-right">Min</th>
                <th className="px-2 py-2 text-right">Max</th>
                <th className="px-2 py-2 text-right">Avg</th>
                <th className="px-2 py-2 text-right">Total</th>
                
                <th className="px-2 py-2 text-right">%15+</th>
                <th className="px-2 py-2 text-right">%20+</th>
                <th className="px-2 py-2 text-right">%25+</th>
                <th className="px-2 py-2 text-right">%30+</th>
                <th className="px-2 py-2 text-right">%35+</th>
                
                <th className="px-2 py-2 text-right">%60+</th>
                <th className="px-2 py-2 text-right">%70+</th>
                <th className="px-2 py-2 text-right">%80+</th>
                <th className="px-2 py-2 text-right">%90+</th>
                <th className="px-2 py-2 text-right">%100+</th>
                
                <th className="px-2 py-2 text-right">%1+</th>
                <th className="px-2 py-2 text-right">%2+</th>
                <th className="px-2 py-2 text-right">%3+</th>
                <th className="px-2 py-2 text-right">%4+</th>
                <th className="px-2 py-2 text-right">%5+</th>
                <th className="px-2 py-2 text-right">Stability</th>
              </tr>
            </thead>
            <tbody>
              {tableSlice.map((p, idx) => {
                const series = getSeriesForStat(p, tableStat);
                const games = series.length;
                const minVal = games ? Math.min(...series) : 0;
                const maxVal = games ? Math.max(...series) : 0;
                const total = series.reduce((s, v) => s + v, 0);
                const avgVal = games ? total / games : 0;
                const vol = stdDev(series);
                const meta = stabilityMeta(vol);
                const lockedRow = !premiumUser && idx >= TABLE_FREE_ROWS;
                const isExpanded = !!expandedRows[p.id];

                // Threshold series (always computed off their native stat)
                const disposalsSeries = getSeriesForStat(p, "disposals");
                const fantasySeries = getSeriesForStat(p, "fantasy");
                const goalsSeries = getSeriesForStat(p, "goals");

                const disposalsThresholds = [15, 20, 25, 30, 35].map((t) =>
                  calcThresholdPercent(disposalsSeries, t)
                );
                const fantasyThresholds = [60, 70, 80, 90, 100].map((t) =>
                  calcThresholdPercent(fantasySeries, t)
                );
                const goalsThresholds = [1, 2, 3, 4, 5].map((t) =>
                  calcThresholdPercent(goalsSeries, t)
                );

                const cellPad = compactMode ? "py-1.5" : "py-2.5";

                return (
                  <Fragment key={p.id}>
                    <tr
                      className={`border-b border-neutral-900/80 transition-colors ${
                        lockedRow ? "opacity-40 blur-sm" : "hover:bg-neutral-900/70"
                      }`}
                    >
                      <td
                        className={`px-3 ${cellPad} align-middle cursor-pointer text-neutral-100`}
                        onClick={() => !lockedRow && toggleRowExpanded(p.id)}
                      >
                        <span className="mr-1 inline-block text-[10px] text-neutral-500">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                        {lockedRow && <LockIcon />}
                        <span className="font-medium">{p.name}</span>
                      </td>
                      <td
                        className={`px-3 ${cellPad} align-middle text-neutral-300`}
                      >
                        {p.pos}
                      </td>
                      <td
                        className={`px-3 ${cellPad} align-middle text-neutral-400`}
                      >
                        {p.team}
                      </td>

                      {roundLabels.map((_, i) => (
                        <td
                          key={i}
                          className={`px-2 ${cellPad} align-middle text-right tabular-nums text-neutral-200`}
                        >
                          {series[i] ?? "-"}
                        </td>
                      ))}

                      <td
                        className={`px-2 ${cellPad} align-middle text-right tabular-nums text-neutral-200`}
                      >
                        {games || "-"}
                      </td>
                      <td
                        className={`px-2 ${cellPad} align-middle text-right tabular-nums text-neutral-200`}
                      >
                        {games ? minVal : "-"}
                      </td>
                      <td
                        className={`px-2 ${cellPad} align-middle text-right tabular-nums text-neutral-200`}
                      >
                        {games ? maxVal : "-"}
                      </td>
                      <td
                        className={`px-2 ${cellPad} align-middle text-right tabular-nums text-neutral-100`}
                      >
                        {games ? Math.round(avgVal) : "-"}
                      </td>
                      <td
                        className={`px-2 ${cellPad} align-middle text-right tabular-nums text-neutral-100`}
                      >
                        {games ? total : "-"}
                      </td>
                      
                      {disposalsThresholds.map((pct, i) => (
                        <td
                          key={`d-${p.id}-${i}`}
                          className={`px-2 ${cellPad} align-middle text-right text-[10px]`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span className="tabular-nums text-neutral-100">
                              {pct ? Math.round(pct) : 0}%
                            </span>
                            <span
                              className={`h-2 w-6 rounded-full ${thresholdBarClass(pct)}`}
                            />
                          </div>
                        </td>
                      ))}
                      
                      {fantasyThresholds.map((pct, i) => (
                        <td
                          key={`f-${p.id}-${i}`}
                          className={`px-2 ${cellPad} align-middle text-right text-[10px]`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span className="tabular-nums text-neutral-100">
                              {pct ? Math.round(pct) : 0}%
                            </span>
                            <span
                              className={`h-2 w-6 rounded-full ${thresholdBarClass(pct)}`}
                            />
                          </div>
                        </td>
                      ))}
                      
                      {goalsThresholds.map((pct, i) => (
                        <td
                          key={`g-${p.id}-${i}`}
                          className={`px-2 ${cellPad} align-middle text-right text-[10px]`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span className="tabular-nums text-neutral-100">
                              {pct ? Math.round(pct) : 0}%
                            </span>
                            <span
                              className={`h-2 w-6 rounded-full ${thresholdBarClass(pct)}`}
                            />
                          </div>
                        </td>
                      ))}
                      <td
                        className={`px-2 ${cellPad} align-middle text-right text-[10px]`}
                      >
                        <span className={meta.colour}>{meta.label}</span>
                      </td>
                    </tr>

                    {isExpanded && !lockedRow && (
                      <tr className="border-b border-neutral-900/80 bg-neutral-950/95">
                        <td colSpan={20} className="px-4 py-4">
                          <div className="flex flex-col gap-4 md:flex-row">
                            <div className="md:w-1/2">
                              <h4 className="mb-2 text-[11px] font-semibold text-neutral-200">
                                Season trend (games)
                              </h4>
                              <div className="w-full rounded-lg border border-neutral-800 bg-neutral-900/80 p-3">
                                <TrendSparkline values={series} />
                                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-neutral-300">
                                  {series.map((v, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5"
                                    >
                                      <span className="tabular-nums">{v}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="md:w-1/2">
                              <h4 className="mb-2 text-[11px] font-semibold text-neutral-200">
                                AI form snapshot
                              </h4>
                              <p className="text-[11px] text-neutral-300">
                                This is a stub description for how AI will talk about
                                this player's seasonal role, usage and scoring floor
                                for Neeko+ members. Wire this up to your AI pipeline
                                and reuse this layout for deeper insights.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {!premiumUser && (
            <div
              className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/98 to-transparent backdrop-blur-2xl"
              style={{ top: "60%" }}
            >
              <a
                href="/neeko-plus"
                className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-2 text-xs font-semibold text-black shadow-[0_0_24px_rgba(250,204,21,0.9)]"
              >
                <LockIcon />
                <span>Unlock full master table — Neeko+</span>
              </a>
            </div>
          )}
        </div>

        {tableVisibleCount < tableSorted.length && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={() =>
                setTableVisibleCount((prev) =>
                  Math.min(prev + 50, tableSorted.length)
                )
              }
              className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs text-neutral-100 hover:bg-neutral-800 hover:shadow-[0_0_14px_rgba(255,255,255,0.18)]"
            >
              Show more players
            </Button>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Shell
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          onClick={handleBack}
          className="bg-transparent px-0 text-sm text-neutral-300 hover:bg-transparent hover:text-neutral-100"
        >
          <ArrowLeftIcon />
          Back
        </Button>
        <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          AFL · Player Stats
        </span>
      </div>

      {/* Hero */}
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            AFL Player Stats
          </h1>
          <p className="mt-1 text-xs md:text-sm text-neutral-400">
            Live player form, volatility and role-driven signals — built for fantasy &
            betting decisions.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          {renderStatSelector()}
          {!premiumUser && (
            <span className="max-w-xs text-right text-[10px] text-neutral-500">
              Fantasy, Disposals &amp; Goals are available on this page. Advanced stats,
              deeper AI and more live on Neeko+.
            </span>
          )}
        </div>
      </div>

      {renderDashboardRow()}
      {renderAISignals()}
      {renderRisers()}
      {renderCompare()}
      {renderStability()}
      {renderMasterTable()}
    </div>
  );
}
