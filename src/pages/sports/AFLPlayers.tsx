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

const ArrowLeftIcon = () => <span className="mr-1 text-xs">←</span>;

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

const DASH_HOT_FREE = 6; // fully free in UI now
// All selectable stat types for Compare Players
const ALL_STATS = [
  { key: "fantasy", label: "Fantasy Points" },
  { key: "disposals", label: "Disposals" },
  { key: "goals", label: "Goals" },
  { key: "marks", label: "Marks" },
  { key: "tackles", label: "Tackles" },
  { key: "kicks", label: "Kicks" },
  { key: "handballs", label: "Handballs" },
  { key: "hitouts", label: "Hitouts" },
];

const DASH_COLD_FREE = 6; // fully free in UI now
const AI_FREE = 3; // first 3 AI insights emphasised as free
const RISERS_FREE = 6; // risers now visually free; constant kept for future use
const STABILITY_FREE = 6; // 6 free stability cards (2x3)
const TABLE_FREE_ROWS = 25; // 25 free rows in master table

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
const TrendSparkline = ({ values, height = 18 }: { values: number[], height?: number }) => {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 160;
      const y = height - ((v - min) / range) * (height - 4);
      return `${x},${y}`;
    }).join(" ");
  return (
    <svg width={160} height={height} className="overflow-visible">
      <polyline fill="none" stroke="#22c55e" strokeWidth={2} points={points} />
      {values.map((v, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * 160;
        const y = height - ((v - min) / range) * (height - 4);
        return <circle key={i} cx={x} cy={y} r={1.6} fill="#22c55e" />;
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
  {
    id: 5,
    text: "Wing roles are lifting in uncontested marks as teams widen the ground.",
    delta: +3,
  },
  {
    id: 6,
    text: "Second rucks are quietly building scoring spikes when resting forward.",
    delta: +4,
  },
  {
    id: 7,
    text: "Shutdown defenders are suppressing one key scorer but leaking to smalls.",
    delta: -3,
  },
  {
    id: 8,
    text: "Inside mids with centre-bounce bumps are seeing short-term volatility.",
    delta: -2,
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
  const [openRiserId, setOpenRiserId] = useState<number | null>(null);
  const [openFallerId, setOpenFallerId] = useState<number | null>(null);

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

  
  const moversBase = [...ALL_PLAYERS]
    .map((p) => {
      const series = getSeriesForStat(p, selectedStat);
      const l5 = lastN(series, 5);
      if (l5.length < 5) return null;

      const prev4 = l5.slice(0, 4);
      const last = l5[4];
      const prevAvg = average(prev4);
      const diff = last - prevAvg;

      return { player: p, diff, last, prevAvg };
    })
    .filter(Boolean) as {
      player: Player;
      diff: number;
      last: number;
      prevAvg: number;
    };
const risers = moversBase
    .filter((m) => m.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 6);

  const fallers = moversBase
    .filter((m) => m.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 6);

  
  const stabilityList = [...ALL_PLAYERS]
    .map((p) => {
      const l5 = lastN(getSeriesForStat(p, selectedStat), 5);
      if (l5.length < 5) return null;
      const vol = stdDev(l5);
      return { player: p, vol };
    })
    .filter(Boolean) as { player: Player; vol: number }[];
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
    {/* Hot list — fully free */}
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 via-neutral-950 to-emerald-900/30 p-4 shadow-[0_0_26px_rgba(16,185,129,0.28)]">
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
          Live form preview
        </span>
      </div>

      <ul className="relative z-10 space-y-1.5 text-xs md:text-sm">
        {hotList.map((p) => {
          const l5 = lastN(getSeriesForStat(p, selectedStat), 5);
          const avg = Math.round(average(l5) || 0);
          const strong = avg >= 95;

          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-neutral-900/55 px-3 py-2 transition-colors hover:bg-neutral-900/95"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="max-w-[9rem] truncate whitespace-nowrap font-medium">
                    {p.name}
                  </span>
                  <span className="whitespace-nowrap text-[10px] text-neutral-400">
                    {p.pos} · {p.team}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">
                  Season snapshot (mock L5)
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="flex items-center text-xs text-emerald-300">
                  Avg {avg}
                  {strong && <FireIcon />}
                </span>
                <span className="text-[10px] text-neutral-500">
                  Stable recent scores
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>

    {/* Position trends — role list, fully free */}
    <div className="relative overflow-hidden rounded-xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950/80 via-neutral-950 to-cyan-900/30 p-4 shadow-[0_0_26px_rgba(34,211,238,0.28)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/60 bg-cyan-500/15 px-3 py-1.5 backdrop-blur-md">
            <span className="text-xs md:text-sm font-medium text-cyan-100">
              📊 Position Trends
            </span>
          </div>
          <span className="text-[10px] text-neutral-400">
            Avg last-5 {selectedStat === "fantasy" ? "fantasy scores" : selectedStat} by role
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          All roles free
        </span>
      </div>

      <ul className="relative z-10 space-y-1.5 text-xs md:text-sm">
        {(["MID", "RUC", "DEF", "FWD"] as Position[]).map((pos) => {
          const rolePlayers = ALL_PLAYERS.filter((p) => p.pos === pos);
          const allSeries = rolePlayers.map((p) => getSeriesForStat(p, selectedStat));

          const curVals = allSeries.flatMap((s) => lastN(s, 5));
          const prevVals = allSeries.flatMap((s) => s.slice(0, 5));

          const avgCur = average(curVals);
          const avgPrev = prevVals.length ? average(prevVals) : avgCur;
          const pctDiff =
            avgPrev !== 0 ? Math.round(((avgCur - avgPrev) / avgPrev) * 100) : 0;

          const arrow = pctDiff > 3 ? "▲" : pctDiff < -3 ? "▼" : "●";
          const arrowColour =
            pctDiff > 3
              ? "text-emerald-300"
              : pctDiff < -3
              ? "text-red-300"
              : "text-yellow-300";

          // Top 3 players for this role by last-5 average
          const topThree = rolePlayers
            .map((p) => {
              const l5 = lastN(getSeriesForStat(p, selectedStat), 5);
              return { player: p, avg: average(l5) };
            })
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 3);

          // Role-level mock sparkline based on current average
          const mockRoleSeries = avgCur
            ? [
                Math.round(avgCur * 0.88),
                Math.round(avgCur * 0.94),
                Math.round(avgCur),
                Math.round(avgCur * 1.06),
                Math.round(avgCur * 1.1),
              ]
            : [0, 0, 0, 0, 0];

          return (
            <li
              key={pos}
              className="rounded-xl bg-neutral-900/55 px-3 py-2 transition-colors hover:bg-neutral-900/95"
            >
              {/* Header row: role + players + avg / change */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium text-neutral-100">{pos}</span>
                  <span className="text-[10px] text-neutral-500">
                    {rolePlayers.length} players
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="flex items-center gap-1 text-xs text-cyan-300">
                    Avg {Math.round(avgCur || 0)}
                    <span className={arrowColour}>
                      {arrow} {Math.abs(pctDiff)}%
                    </span>
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    vs previous block of games (mock)
                  </span>
                </div>
              </div>

              {/* Full-width sparkline */}
              {/* Top 3 by role */}
              {topThree.length > 0 && (
                <p className="mt-2 text-[10px] text-neutral-400 truncate">
                  Top 3:{" "}
                  {topThree
                    .map((entry) => entry.player.name)
                    .join(", ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
    {/* Risk watchlist — fully free */}
    <div className="relative overflow-hidden rounded-xl border border-red-500/45 bg-gradient-to-br from-red-950/80 via-neutral-950 to-red-900/30 p-4 shadow-[0_0_26px_rgba(248,113,113,0.35)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-400/60 bg-red-500/20 px-3 py-1.5 backdrop-blur-md">
          <span className="text-xs md:text-sm font-medium text-red-100">
            ⚠️ Risk Watchlist
          </span>
          <span className="text-[10px] text-red-200/80">
            Trending cold or volatile
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          Full list free
        </span>
      </div>

      <ul className="relative z-10 space-y-1.5 text-xs md:text-sm">
        {coldList.map((p) => {
          const series = lastN(getSeriesForStat(p, selectedStat), 5);
          const avg = Math.round(average(series));
          const vol = stdDev(series);
          const veryCold = avg <= 80;
          const label =
            vol > 10 ? "High volatility" : veryCold ? "Trending down" : "At risk";

          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-neutral-900/55 px-3 py-2 transition-colors hover:bg-neutral-900/95"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="max-w-[9rem] truncate whitespace-nowrap font-medium">
                  {p.name}
                </span>
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
                <span className="text-[10px] text-neutral-500">
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);
const renderAISignals = () => (
  <div className="relative mt-8 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-950/95 p-4 backdrop-blur-md">
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

    <div className="relative">
      <div className="relative z-10 divide-y divide-neutral-800 text-xs md:text-sm">
        {AI_SIGNALS.map((sig, idx) => {
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
              className="flex items-center justify-between gap-4 py-2"
            >
              <p className="max-w-xl text-neutral-200">{sig.text}</p>
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className={colour}>{arrow}</span>
                <span className={colour}>{Math.abs(sig.delta)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Soft lock: only top 3 are clearly visible for free users */}
      {!premiumUser && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/98 via-black/96 to-transparent backdrop-blur-2xl shadow-[0_0_26px_rgba(0,0,0,0.35)]"
          style={{ top: "58%" }}
        >
          <div className="flex h-full items-center justify-center">
            <a
              href="/neeko-plus"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-2 text-xs font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.75)]"
            >
              <LockIcon />
              <span>Unlock full AI insights — with Neeko+</span>
            </a>
          </div>
        </div>
      )}
    </div>
  </div>
);
const renderRisers = () => (
  <div className="relative mt-6 overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-purple-950/50 to-purple-900/30 p-4 shadow-[0_0_26px_rgba(168,85,247,0.32)]">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/60 bg-purple-500/20 px-3 py-1.5 backdrop-blur-md">
        <span className="text-xs md:text-sm font-medium text-purple-100">
          📉📈 Role &amp; Form Movers
        </span>
        <span className="text-[10px] text-purple-200/80">
          Last game vs previous four
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
        Free preview
      </span>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* RISERS COLUMN */}
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
          📈 Risers
        </h3>
        <ul className="space-y-2">
          {risers.map(({ player, diff, last }) => {
            const isOpen = openRiserId === player.id;
            const changeLabel =
              diff > 10 ? "Big short-term lift" : diff > 5 ? "Strong lift" : "Mild improvement";

            const mockSeries = [
              Math.max(0, Math.round(last - diff * 1.6)),
              Math.max(0, Math.round(last - diff * 1.1)),
              Math.max(0, Math.round(last - diff * 0.6)),
              Math.max(0, Math.round(last - diff * 0.2)),
              Math.round(last),
            ];

            return (
              <li
                key={player.id}
                className="rounded-xl bg-neutral-900/55 px-3 py-2 transition-all duration-200 hover:bg-neutral-900/95 hover:shadow-[0_0_18px_rgba(16,185,129,0.28)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenRiserId(isOpen ? null : player.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-neutral-50">
                      {player.name}
                    </span>
                    <span className="truncate text-[11px] text-neutral-400">
                      {player.pos} · {player.team}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-emerald-400">
                        +{Math.round(diff)}
                      </div>
                      <div className="text-[10px] text-neutral-400">vs prev 4</div>
                    </div>
                    <div className="h-6 w-10 overflow-hidden rounded-md bg-neutral-950/70 px-1 py-0.5">
                      <TrendSparkline values={mockSeries} />
                    </div>
                    <span className="text-xs text-neutral-400">{isOpen ? "▴" : "▾"}</span>
                  </div>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isOpen ? "260px" : "0px" }}
                >
                  {isOpen && (
  <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/80 p-3 text-[11px] text-neutral-300">
    <p className="text-neutral-400">
      Detailed movement breakdown will appear here. Connect this to your AI or deeper analysis later.
    </p>
  </div>
)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* FALLS COLUMN */}
      <div>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-300">
          📉 Falls
        </h3>
        <ul className="space-y-2">
          {fallers.map(({ player, diff, last }) => {
            const isOpen = openFallerId === player.id;
            const absDiff = Math.abs(diff);
            const changeLabel =
              absDiff > 10 ? "Sharp short-term drop" : absDiff > 5 ? "Noticeable dip" : "Mild pullback";

            const mockSeries = [
              Math.max(0, Math.round(last + absDiff * 1.6)),
              Math.max(0, Math.round(last + absDiff * 1.1)),
              Math.max(0, Math.round(last + absDiff * 0.6)),
              Math.max(0, Math.round(last + absDiff * 0.2)),
              Math.round(last),
            ];

            return (
              <li
                key={player.id}
                className="rounded-xl bg-neutral-900/55 px-3 py-2 transition-all duration-200 hover:bg-neutral-900/95 hover:shadow-[0_0_18px_rgba(248,113,113,0.28)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenFallerId(isOpen ? null : player.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-neutral-50">
                      {player.name}
                    </span>
                    <span className="truncate text-[11px] text-neutral-400">
                      {player.pos} · {player.team}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-red-400">
                        {Math.round(diff)}
                      </div>
                      <div className="text-[10px] text-neutral-400">vs prev 4</div>
                    </div>
                    <div className="h-6 w-10 overflow-hidden rounded-md bg-neutral-950/70 px-1 py-0.5">
                      <TrendSparkline values={mockSeries} />
                    </div>
                    <span className="text-xs text-neutral-400">{isOpen ? "▴" : "▾"}</span>
                  </div>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isOpen ? "260px" : "0px" }}
                >
                  {isOpen && (
  <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/80 p-3 text-[11px] text-neutral-300">
    <p className="text-neutral-400">
      Detailed movement breakdown will appear here. Connect this to your AI or deeper analysis later.
    </p>
  </div>
)}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  </div>
);
const renderCompare = () => (
  <div className="relative mt-16 max-w-6xl mx-auto overflow-hidden rounded-xl border border-neutral-700 bg-neutral-950/95 p-5 shadow-[0_0_30px_rgba(148,163,184,0.3)]">
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          Compare Players
        </p>
        <p className="text-xs text-neutral-400">
          Side-by-side form view for your selected stat.
        </p>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-neutral-400">
        <LockIcon />
        <span>Interactive compare is part of Neeko+.</span>
      </div>
    </div>

    {/* Headline summary */}
    <div className="mb-5 grid grid-cols-1 gap-4 text-xs md:grid-cols-3 md:text-sm">
      <div className="text-left text-neutral-400">
        <span className="mb-1 block text-[10px] uppercase tracking-[0.16em]">
          Player A
        </span>
        <span>Select a team &amp; player on Neeko+.</span>
      </div>
      <div className="text-center text-neutral-400">
        <span className="mb-1 block text-[10px] uppercase tracking-[0.16em]">
          Stat Lens
        </span>
        <span>Fantasy points (season view).</span>
      </div>
      <div className="text-right text-neutral-400">
        <span className="mb-1 block text-[10px] uppercase tracking-[0.16em]">
          Player B
        </span>
        <span>Second player unlocks with Neeko+.</span>
      </div>
    </div>

    {/* Selectors & metrics — softly locked for free users */}
    <div className={premiumUser ? "" : "opacity-70"}>
      <div className="mb-4 grid grid-cols-1 gap-4 text-xs md:grid-cols-3 md:text-sm">
        {/* Player A */}
        <div className="flex flex-col gap-2">
          <select
            className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-xs text-neutral-100 shadow-inner"
            value={teamA}
            onChange={(e) => {
              setTeamA(e.target.value);
              setPlayerAId(null);
            }}
            disabled={!premiumUser}
          >
            {ALL_TEAMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-xs text-neutral-100 shadow-inner"
            value={playerAId ?? ""}
            onChange={(e) => setPlayerAId(Number(e.target.value))}
            disabled={!premiumUser}
          >
            <option value="">Select player</option>
            {playersTeamA.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stat lens */}
        <div className="flex flex-col gap-2">
          <select
            className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-xs text-neutral-100 shadow-inner"
            value={selectedStat}
            disabled={!premiumUser}
            onChange={(e) => setSelectedStat(e.target.value as StatKey)}
          >
            {ALL_STATS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Player B */}
        <div className="flex flex-col gap-2">
          <select
            className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-xs text-neutral-100 shadow-inner"
            value={teamB}
            onChange={(e) => {
              setTeamB(e.target.value);
              setPlayerBId(null);
            }}
            disabled={!premiumUser}
          >
            {ALL_TEAMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-xs text-neutral-100 shadow-inner"
            value={playerBId ?? ""}
            onChange={(e) => setPlayerBId(Number(e.target.value))}
            disabled={!premiumUser}
          >
            <option value="">Select player</option>
            {playersTeamB.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison chart stub */}
      <div className="rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 px-4 py-6">
        <p className="mb-3 text-xs text-neutral-400">
          Once unlocked, this section will show a full side-by-side trend graph, last-5
          averages and volatility comparison for your selected stat.
        </p>
        <div className="h-32 rounded-xl border border-neutral-800 bg-neutral-950/80" />
      </div>
    </div>

    {/* Soft lock overlay */}
    {!premiumUser && (
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/98 via-black/96 to-transparent backdrop-blur-2xl shadow-[0_0_26px_rgba(0,0,0,0.35)]"
        style={{ top: "55%" }}
      >
        <div className="flex h-full items-center justify-center">
          <a
            href="/neeko-plus"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-2 text-xs font-semibold text-black shadow-[0_0_26px_rgba(250,204,21,0.8)]"
          >
            <LockIcon />
            <span>Unlock full interactive compare — Neeko+</span>
          </a>
        </div>
      </div>
    )}
  </div>
);
const renderStability = () => (
    <div className="relative mt-8 overflow-hidden rounded-xl border border-sky-500/40 bg-gradient-to-br from-sky-950/80 via-neutral-950 to-sky-900/30 p-4 shadow-[0_0_26px_rgba(56,189,248,0.35)]">
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
        {stabilityList.slice(0, 12).map((entry, idx) => {
          const { player, vol } = entry;
          const isLocked = !premiumUser && idx >= STABILITY_FREE;
          const meta = stabilityMeta(vol);

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-xl border border-sky-400/40 bg-neutral-950/90 px-3 py-1.5 ${
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
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/96 to-transparent backdrop-blur-2xl shadow-[0_0_26px_rgba(0,0,0,0.35)]"
          style={{ top: "44%" }} // overlay starts above row 3 so 4 cards remain free
        >
          <a
            href="/neeko-plus"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-yellow-400 px-5 py-2 text-[11px] font-semibold text-black shadow-[0_0_22px_rgba(250,204,21,0.7)]"
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
      <div className="relative mx-auto mt-8 max-w-6xl rounded-3xl border border-yellow-400/45 bg-neutral-950/98 p-5 shadow-[0_0_30px_rgba(250,204,21,0.35)]">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
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
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
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
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
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
            <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
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
        <div className="relative mt-4 mb-10 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/95">
          <table className="min-w-[960px] w-full text-left text-[11px] md:text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/85">
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2">Team</th>
                {!compactMode && roundLabels.map((label) => (
                  <th key={label} className="px-2 py-2 text-right">
                    {label}
                  </th>
                ))}
                <th className="px-2 py-2 text-right">Games</th>
                <th className="px-2 py-2 text-right">Min</th>
                <th className="px-2 py-2 text-right">Max</th>
                <th className="px-2 py-2 text-right">Avg</th>
                <th className="px-2 py-2 text-right">Total</th>
                {/* Dynamic threshold headers */}
                {(() => {
                  const stat = tableStat;
                  if (stat === "disposals") return ["%15+","%20+","%25+","%30+","%35+"].map(h=>(
                    <th className="px-2 py-2 text-right">{h}</th>
                  ));
                  if (stat === "fantasy") return ["%60+","%70+","%80+","%90+","%100+"].map(h=>(
                    <th className="px-2 py-2 text-right">{h}</th>
                  ));
                  if (stat === "goals") return ["%1+","%2+","%3+","%4+","%5+"].map(h=>(
                    <th className="px-2 py-2 text-right">{h}</th>
                  ));
                  return null;
                })()}
                <th className="px-3 py-2 text-right">Stability</th>

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

                // Dynamic threshold configuration based on current table stat
                const thresholdConfig =
                  tableStat === "disposals"
                    ? { series: disposalsSeries, thresholds: [15, 20, 25, 30, 35] }
                    : tableStat === "fantasy"
                    ? { series: fantasySeries, thresholds: [60, 70, 80, 90, 100] }
                    : tableStat === "goals"
                    ? { series: goalsSeries, thresholds: [1, 2, 3, 4, 5] }
                    : { series, thresholds: [] as number[] };

                const cellPad = compactMode ? "py-1.5" : "py-2.5";

                return (
                  <Fragment key={p.id}>
                    <tr
                      className={`border-b border-neutral-900/80 transition-colors ${
                        lockedRow ? "opacity-40 blur-sm" : "hover:bg-neutral-900/70"
                      }`}
                      style={{ height: compactMode ? 36 : 44 }}
                    >
                      <td
                        className={`px-3 ${cellPad} align-middle cursor-pointer text-neutral-100`}
                        onClick={() => !lockedRow && toggleRowExpanded(p.id)}
                      >
                        <span className="mr-1 inline-block text-[10px] text-neutral-500">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                        {lockedRow && <LockIcon />}
                        <span className="font-medium whitespace-nowrap truncate">{p.name}</span>
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

                      {!compactMode && roundLabels.map((_, i) => (
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

                      {thresholdConfig.thresholds.map((t, i) => {
                        const pct = calcThresholdPercent(thresholdConfig.series, t);
                        return (
                          <td
                            key={`th-${p.id}-${i}`}
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
                        );
                      })}
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
              className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/98 via-black/96 to-transparent backdrop-blur-2xl shadow-[0_0_26px_rgba(0,0,0,0.35)]"
              style={{ top: "58%" }}
            >
              <a
                href="/neeko-plus"
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-2 text-xs font-semibold text-black shadow-[0_0_24px_rgba(250,204,21,0.8)]"
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
  const renderQuickNav = () => (
    <div className="fixed right-4 top-1/3 z-40 hidden flex-col gap-3 text-[10px] text-neutral-400 lg:flex">
      <a
        href="#section-form-leaders"
        className="group inline-flex flex-col items-center gap-1"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950/80 group-hover:border-yellow-400 group-hover:bg-yellow-400/10">
          🔥
        </span>
        <span className="opacity-0 group-hover:opacity-100">Form</span>
      </a>
      <a
        href="#section-ai-signals"
        className="group inline-flex flex-col items-center gap-1"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950/80 group-hover:border-yellow-400 group-hover:bg-yellow-400/10">
          🧠
        </span>
        <span className="opacity-0 group-hover:opacity-100">AI</span>
      </a>
      <a
        href="#section-risers"
        className="group inline-flex flex-col items-center gap-1"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950/80 group-hover:border-yellow-400 group-hover:bg-yellow-400/10">
          ⬆️
        </span>
        <span className="opacity-0 group-hover:opacity-100">Risers</span>
      </a>
      <a
        href="#section-compare"
        className="group inline-flex flex-col items-center gap-1"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950/80 group-hover:border-yellow-400 group-hover:bg-yellow-400/10">
          🔀
        </span>
        <span className="opacity-0 group-hover:opacity-100">Compare</span>
      </a>
      <a
        href="#section-stability"
        className="group inline-flex flex-col items-center gap-1"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950/80 group-hover:border-yellow-400 group-hover:bg-yellow-400/10">
          📉
        </span>
        <span className="opacity-0 group-hover:opacity-100">Stability</span>
      </a>
      <a
        href="#section-master-table"
        className="group inline-flex flex-col items-center gap-1"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950/80 group-hover:border-yellow-400 group-hover:bg-yellow-400/10">
          📑
        </span>
        <span className="opacity-0 group-hover:opacity-100">Table</span>
      </a>
    </div>
  );

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-8 text-white">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between gap-2">
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
              Live player form, volatility and role-driven signals — built for fantasy coaches and smarter decisions.
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

        {/* Sticky section tabs (desktop only) */}
        <div className="sticky top-16 z-30 -mx-4 mb-4 hidden border-b border-neutral-900/70 bg-gradient-to-b from-black/95 via-black/90 to-transparent px-4 py-2 text-[11px] text-neutral-400 md:flex">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 overflow-x-auto">
            <a href="#section-form-leaders" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-neutral-900 hover:text-neutral-100">
              <span>🔥</span>
              <span>Form &amp; Positions</span>
            </a>
            <a href="#section-risers" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-neutral-900 hover:text-neutral-100">
              <span>📉📈</span>
              <span>Movers</span>
            </a>
            <a href="#section-ai-signals" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-neutral-900 hover:text-neutral-100">
              <span>🧠</span>
              <span>AI Signals</span>
            </a>
            <a href="#section-compare" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-neutral-900 hover:text-neutral-100">
              <span>🔀</span>
              <span>Compare</span>
            </a>
            <a href="#section-stability" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-neutral-900 hover:text-neutral-100">
              <span>📉</span>
              <span>Stability</span>
            </a>
            <a href="#section-master-table" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition hover:bg-neutral-900 hover:text-neutral-100">
              <span>📑</span>
              <span>Master Table</span>
            </a>
          </div>
        </div>

        <section id="section-form-leaders" className="scroll-mt-28">
          {renderDashboardRow()}
        </section>
        <section id="section-risers" className="scroll-mt-28">
          {renderRisers()}
        </section>
        <section id="section-ai-signals" className="scroll-mt-28">
          {renderAISignals()}
        </section>
        <section id="section-compare" className="scroll-mt-28">
          {renderCompare()}
        </section>
        <section id="section-stability" className="scroll-mt-28">
          {renderStability()}
        </section>
        <section id="section-master-table" className="scroll-mt-28">
          {renderMasterTable()}
        </section>
      </div>
      {renderQuickNav()}
    </>
  );
}
