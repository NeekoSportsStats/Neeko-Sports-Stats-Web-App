// src/pages/sports/AFLPlayers.tsx
// AFL Player Stats — Option C (Pro layout, freemium-friendly)
// Updated with patches:
// - Stronger blurs & mid-card Neeko+ CTAs
// - 2 free items in preview sections (Hot/Cold still 2)
// - Enhanced Position Trends (top performer, % change, arrows)
// - Compare headers visible, section clearly locked
// - Stability Meter richer explanations, 2 free rows
// - Master table uses season summary + year selector instead of L5 columns

import { useEffect, useState, Fragment } from "react";

// ────────────────────────────────────────────────
// Minimal UI stubs — replace with your design-system components
// ────────────────────────────────────────────────
const Button = ({
  children,
  onClick,
  className = "",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) => (
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

const ArrowLeftIcon = () => <span className="mr-2">←</span>;

const LockIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 mr-1 text-[10px] rounded-full border border-yellow-400/70 text-yellow-200 bg-black/40">
    🔒
  </span>
);

const CrownIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 text-[11px] rounded-full bg-yellow-400/90 text-black shadow-sm ml-1">
    👑
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

// Fake auth stub — swap to your real useAuth() implementation
function useAuth() {
  return { isPremium: false };
}

// Simple toast stub
function showLockedToast(message = "Unlock with Neeko+ to use this feature.") {
  if (typeof window !== "undefined" && window.alert) {
    window.alert(message);
  } else {
    console.log("LOCKED:", message);
  }
}

// ────────────────────────────────────────────────
// Types, helpers & dummy data
// ────────────────────────────────────────────────
type StatKey = "fantasy" | "disposals" | "goals";

interface DummyPlayer {
  id: number;
  name: string;
  pos: "MID" | "FWD" | "DEF" | "RUC";
  team: string;
  rounds: number[]; // season games (mock)
}

const allTeams = [
  "All Teams",
  "COLL",
  "ESS",
  "SYD",
  "CARL",
  "RICH",
  "HAW",
  "GEEL",
  "MELB",
];

const allPositions = ["All Positions", "MID", "FWD", "DEF", "RUC"];

const allRoundOptions = ["All Rounds", "Opening Round", "R1", "R2", "R3", "R4", "R5"];

const allYears = [2025, 2024, 2023, 2022, 2021, 2020];

const dashboardFreeHotVisible = 2;
const dashboardFreeColdVisible = 2;
const aiFreeVisible = 2;
const risersFreeVisible = 2;
const stabilityFreeVisible = 2;
const tableFreeRows = 50;

const freeStatSet = new Set<StatKey>(["fantasy", "disposals", "goals"]);

function generateDummyPlayers(): DummyPlayer[] {
  return Array.from({ length: 120 }).map((_, idx) => {
    const base = 80 + (idx % 15);
    const posIdx = idx % 4;
    const pos: DummyPlayer["pos"] =
      posIdx === 0 ? "MID" : posIdx === 1 ? "FWD" : posIdx === 2 ? "DEF" : "RUC";
    const team = ["COLL", "ESS", "SYD", "CARL"][idx % 4];
    const rounds = [
      base - 12 + (idx % 5),
      base - 4 + ((idx * 3) % 7),
      base + 8 - (idx % 9),
      base + 15 - ((idx * 2) % 11),
      base - 6 + (idx % 6),
      base + 4 - (idx % 3),
    ];
    return {
      id: idx + 1,
      name: `Player ${idx + 1}`,
      pos,
      team,
      rounds,
    };
  });
}

const fullData: DummyPlayer[] = generateDummyPlayers();

function getDashboardSeries(player: DummyPlayer, stat: StatKey): number[] {
  const base = player.rounds;
  if (stat === "fantasy") return base;
  if (stat === "disposals") return base.map((v, i) => Math.round(v / 1.6) + (i % 3) * 2);
  if (stat === "goals") return base.map((v, i) => Math.max(0, Math.round((v - 60) / 15) + (i % 2)));
  return base;
}

function lastNGames(series: number[], n: number): number[] {
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

function percentColor(p: number) {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 60) return "bg-lime-400";
  if (p >= 40) return "bg-amber-400";
  return "bg-red-500";
}

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

const AnimatedPercent = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame: number;
    const step = () => {
      setDisplay((d) => {
        if (d >= value) return value;
        const delta = Math.max(1, Math.ceil(value / 25));
        return Math.min(value, d + delta);
      });
      frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="tabular-nums">{display}%</span>;
};

const PercentBar = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-12 rounded-full bg-neutral-800 overflow-hidden">
      <div
        className={`h-full ${percentColor(value)}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
    <AnimatedPercent value={value} />
  </div>
);

// ────────────────────────────────────────────────
// Static AI bullets (stub)
// ────────────────────────────────────────────────
const aiSignals = [
  {
    id: 1,
    text: "High‑ceiling mids are stabilising with stronger floors over the last 3 rounds.",
    delta: +7,
  },
  {
    id: 2,
    text: "Key forwards seeing a slight dip in inside‑50 marks but spike in accuracy.",
    delta: -4,
  },
  {
    id: 3,
    text: "Rebounding defenders trending up in uncontested chains through half‑back.",
    delta: +5,
  },
  {
    id: 4,
    text: "Tagging roles are creating sharp volatility for elite ball‑winners.",
    delta: -6,
  },
];

// ────────────────────────────────────────────────
// Stability helpers
// ────────────────────────────────────────────────
function stabilityMeta(vol: number): { label: string; colour: string; reason: string } {
  if (vol < 4)
    return {
      label: "Rock solid",
      colour: "text-emerald-400",
      reason: "Very low game‑to‑game movement; scores cluster tightly.",
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
    reason: "Huge volatility; slate‑breaking upside with real downside risk.",
  };
}

// ────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────
export default function AFLPlayers() {
  const { isPremium } = useAuth();
  const premiumUser = !!isPremium;

  // Dashboard stat selector (only affects cards above the table)
  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");

  // Master table configuration (independent of global stat)
  const [tableStat, setTableStat] = useState<StatKey>("fantasy");
  const [seasonYear, setSeasonYear] = useState<number>(2025);
  const [teamFilter, setTeamFilter] = useState<string>("All Teams");
  const [positionFilter, setPositionFilter] = useState<string>("All Positions");
  const [roundFilter, setRoundFilter] = useState<string>("All Rounds");
  const [compactMode, setCompactMode] = useState<boolean>(true);
  const [tableVisibleCount, setTableVisibleCount] = useState<number>(50);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Derived dashboard data
  const sortedByForm = [...fullData].sort((a, b) => {
    const lastA = lastNGames(getDashboardSeries(a, selectedStat), 5);
    const lastB = lastNGames(getDashboardSeries(b, selectedStat), 5);
    return average(lastB) - average(lastA);
  });

  const hotPlayers = sortedByForm.slice(0, 6);
  const coldPlayers = [...sortedByForm].reverse().slice(0, 6);

  const risers = [...fullData]
    .map((p) => {
      const series = getDashboardSeries(p, selectedStat);
      const last5 = lastNGames(series, 5);
      if (last5.length < 5) return null;
      const prev4 = last5.slice(0, 4);
      const last = last5[4];
      const diff = last - average(prev4);
      return { player: p, diff };
    })
    .filter((x): x is { player: DummyPlayer; diff: number } => !!x)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 6);

  const stabilityList = [...fullData]
    .map((p) => {
      const series = lastNGames(getDashboardSeries(p, selectedStat), 5);
      return { player: p, vol: stdDev(series) };
    })
    .sort((a, b) => a.vol - b.vol)
    .slice(0, 20);

  // Master table data — season summary for selectedYear (mock: uses same data)
  const filteredTableData = fullData.filter((p) => {
    if (teamFilter !== "All Teams" && p.team !== teamFilter) return false;
    if (positionFilter !== "All Positions" && p.pos !== positionFilter) return false;
    // seasonYear and roundFilter are placeholders until real data is wired
    return true;
  });

  const tableSorted = [...filteredTableData].sort((a, b) => {
    const seriesA = getDashboardSeries(a, tableStat);
    const seriesB = getDashboardSeries(b, tableStat);
    const totalA = seriesA.reduce((s, v) => s + v, 0);
    const totalB = seriesB.reduce((s, v) => s + v, 0);
    return totalB - totalA;
  });

  const tableSlice = tableSorted.slice(0, tableVisibleCount);

  // Compare selections
  const [teamA, setTeamA] = useState<string>("COLL");
  const [teamB, setTeamB] = useState<string>("ESS");
  const [playerAId, setPlayerAId] = useState<number | null>(null);
  const [playerBId, setPlayerBId] = useState<number | null>(null);

  const playersForTeamA = fullData.filter(
    (p) => teamA === "All Teams" || p.team === teamA
  );
  const playersForTeamB = fullData.filter(
    (p) => teamB === "All Teams" || p.team === teamB
  );

  const playerA =
    playersForTeamA.find((p) => p.id === playerAId) ?? playersForTeamA[0];
  const playerB =
    playersForTeamB.find((p) => p.id === playerBId) ??
    playersForTeamB[1] ??
    playersForTeamB[0];

  const compareSeriesA = playerA
    ? lastNGames(getDashboardSeries(playerA, selectedStat), 5)
    : [];
  const compareSeriesB = playerB
    ? lastNGames(getDashboardSeries(playerB, selectedStat), 5)
    : [];

  const compareAvgA = average(compareSeriesA);
  const compareAvgB = average(compareSeriesB);
  const compareTotalA = compareSeriesA.reduce((s, v) => s + v, 0);
  const compareTotalB = compareSeriesB.reduce((s, v) => s + v, 0);
  const compareBestA = compareSeriesA.length ? Math.max(...compareSeriesA) : 0;
  const compareBestB = compareSeriesB.length ? Math.max(...compareSeriesB) : 0;
  const compareWorstA = compareSeriesA.length ? Math.min(...compareSeriesA) : 0;
  const compareWorstB = compareSeriesB.length ? Math.min(...compareSeriesB) : 0;

  // Handlers
  const handleGlobalStatChange = (value: StatKey) => {
    if (!premiumUser && !freeStatSet.has(value)) {
      showLockedToast("Unlock with Neeko+ to use advanced stat types.");
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

  const toggleRow = (id: number) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history) {
      window.history.back();
    }
  };

  // ────────────────────────────────────────────────
  // Render helpers
  // ────────────────────────────────────────────────
  const renderGlobalStatSelector = () => (
    <div className="flex items-center gap-2 text-xs md:text-sm">
      <span className="text-neutral-500 uppercase tracking-[0.16em] text-[10px]">
        Stat Type
      </span>
      <div className="relative">
        <select
          className="h-8 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 pr-8 text-xs md:text-sm text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
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
      {/* Form Leaders (Hot) */}
      <div className="relative rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 via-neutral-950 to-emerald-900/30 p-4 shadow-[0_0_26px_rgba(16,185,129,0.35)] overflow-hidden">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/15 px-3 py-1.5 backdrop-blur-md">
            <span className="text-xs md:text-sm font-medium text-emerald-100">
              🔥 Form Leaders
            </span>
            <span className="text-[10px] text-emerald-200/80">
              Top 6 by last‑5 average
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Neeko+ expands this
          </span>
        </div>

        <ul className="space-y-1.5 text-xs md:text-sm relative z-10">
          {hotPlayers.map((p, index) => {
            const series = lastNGames(getDashboardSeries(p, selectedStat), 5);
            const avgVal = Math.round(average(series));
            const locked = !premiumUser && index >= dashboardFreeHotVisible;
            const strong = avgVal >= 110;

            return (
              <li
                key={p.id}
                className={`rounded-xl bg-neutral-900/50 px-3 py-2 flex items-center justify-between gap-2 hover:bg-neutral-900/90 transition-all ${
                  locked ? "opacity-40 blur-sm" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {locked && <LockIcon />}
                  <span className="font-medium truncate max-w-[7.5rem] md:max-w-[9rem]">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                    {p.pos} · {p.team}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-emerald-300 flex items-center">
                    Avg {avgVal}
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
          <div className="absolute inset-x-0 top-1/2 bottom-0 bg-gradient-to-t from-black/98 via-black/90 to-transparent backdrop-blur-2xl flex items-center justify-center">
            <a
              href="/neeko-plus"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-5 py-2 text-xs font-semibold shadow-[0_0_24px_rgba(250,204,21,0.85)]"
            >
              <LockIcon />
              <span>Unlock full hot list — Neeko+</span>
            </a>
          </div>
        )}
      </div>

      {/* Position‑based trends */}
      <div className="relative rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950/80 via-neutral-950 to-cyan-900/30 p-4 shadow-[0_0_26px_rgba(34,211,238,0.35)] overflow-hidden">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/60 bg-cyan-500/15 px-3 py-1.5 backdrop-blur-md">
              <span className="text-xs md:text-sm font-medium text-cyan-100">
                📊 Position Trends
              </span>
            </div>
            <span className="text-[10px] text-neutral-400">
              Avg season {selectedStat === "fantasy" ? "fantasy" : selectedStat} by role
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            MID view is free
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm relative z-10">
          {(["MID", "FWD", "DEF", "RUC"] as const).map((pos) => {
            const players = fullData.filter((p) => p.pos === pos);
            const seriesAll = players.map((p) => getDashboardSeries(p, selectedStat));
            const currentValues = seriesAll.flatMap((s) => lastNGames(s, 5));
            const prevValues = seriesAll.flatMap((s) => s.slice(0, 5));
            const avgCurrent = average(currentValues);
            const avgPrev = prevValues.length ? average(prevValues) : avgCurrent;
            const pctDiff =
              avgPrev !== 0 ? Math.round(((avgCurrent - avgPrev) / avgPrev) * 100) : 0;

            const best = players
              .map((p) => {
                const s = lastNGames(getDashboardSeries(p, selectedStat), 5);
                return { player: p, avg: average(s) };
              })
              .sort((a, b) => b.avg - a.avg)[0];

            const locked = !premiumUser && pos !== "MID";
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
                className={`rounded-xl border border-cyan-400/30 bg-neutral-950/80 px-3 py-2 flex flex-col gap-1 ${
                  locked ? "opacity-40 blur-sm" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-300">{pos}</span>
                  <span className="text-[10px] text-neutral-500">
                    {players.length} players
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyan-300 flex items-center gap-1">
                    Avg {Math.round(avgCurrent || 0)}
                    <span className={arrowColour}>
                      {arrow} {Math.abs(pctDiff)}%
                    </span>
                  </span>
                  <div className="h-1.5 w-16 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{
                        width: `${Math.max(
                          10,
                          Math.min(100, (avgCurrent || 0) / 1.4)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                {best && (
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span className="truncate mr-2">
                      Top: {best.player.name}
                    </span>
                    <span className="tabular-nums">
                      {Math.round(best.avg)} avg
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!premiumUser && (
          <div className="absolute inset-x-0 top-1/2 bottom-0 bg-gradient-to-t from-black/98 via-black/90 to-transparent backdrop-blur-2xl flex items-center justify-center">
            <a
              href="/neeko-plus"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-5 py-2 text-xs font-semibold shadow-[0_0_22px_rgba(250,204,21,0.75)]"
            >
              <LockIcon />
              <span>Unlock full role trends — Neeko+</span>
            </a>
          </div>
        )}
      </div>

      {/* Risk Watchlist (Cold / volatile) */}
      <div className="relative rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/80 via-neutral-950 to-red-900/30 p-4 shadow-[0_0_26px_rgba(239,68,68,0.35)] overflow-hidden">
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

        <ul className="space-y-1.5 text-xs md:text-sm relative z-10">
          {coldPlayers.map((p, index) => {
            const series = lastNGames(getDashboardSeries(p, selectedStat), 5);
            const avgVal = Math.round(average(series));
            const vol = stdDev(series);
            const locked = !premiumUser && index >= dashboardFreeColdVisible;
            const veryCold = avgVal <= 80;
            const label =
              vol > 10 ? "High volatility" : veryCold ? "Trending down" : "At risk";

            return (
              <li
                key={p.id}
                className={`rounded-xl bg-neutral-900/50 px-3 py-2 flex items-center justify-between gap-2 hover:bg-neutral-900/90 transition-all ${
                  locked ? "opacity-40 blur-sm" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {locked && <LockIcon />}
                  <span className="font-medium truncate max-w-[7.5rem] md:max-w-[9rem]">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                    {p.pos} · {p.team}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-red-300 flex items-center">
                    Avg {avgVal}
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
          <div className="absolute inset-x-0 top-1/2 bottom-0 bg-gradient-to-t from-black/98 via-black/90 to-transparent backdrop-blur-2xl flex items-center justify-center">
            <a
              href="/neeko-plus"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-5 py-2 text-xs font-semibold shadow-[0_0_24px_rgba(250,204,21,0.85)]"
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
    <div className="relative mt-8 rounded-2xl border border-neutral-700 bg-neutral-950/95 p-4 backdrop-blur-md overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            🧠 AI Signals (Preview)
          </h2>
          <p className="text-xs text-neutral-500">
            Quick directional reads. Full breakdown lives on the AI Analysis page.
          </p>
        </div>
        <a
          href="/sports/afl/ai"
          className="text-[11px] text-yellow-400 hover:text-yellow-300 underline underline-offset-2"
        >
          View full AI analysis →
        </a>
      </div>

      <div className="divide-y divide-neutral-800 text-xs md:text-sm relative z-10">
        {aiSignals.map((item, index) => {
          const locked = !premiumUser && index >= aiFreeVisible;
          const positive = item.delta > 0;
          const neutral = item.delta === 0;
          const colour = neutral
            ? "text-yellow-300"
            : positive
            ? "text-emerald-400"
            : "text-red-400";
          const arrow = neutral ? "↔" : positive ? "▲" : "▼";

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between py-1.5 ${
                locked ? "opacity-40 blur-sm" : ""
              }`}
            >
              <span className="pr-3 text-neutral-200">{item.text}</span>
              <span className={`pl-3 tabular-nums ${colour}`}>
                {arrow} {Math.abs(item.delta)}%
              </span>
            </div>
          );
        })}
      </div>

      {!premiumUser && (
        <div className="absolute inset-x-0 top-1/2 bottom-0 bg-gradient-to-t from-black/98 via-black/90 to-transparent backdrop-blur-2xl flex items-center justify-center">
          <a
            href="/neeko-plus"
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-5 py-2 text-xs font-semibold shadow-[0_0_22px_rgba(250,204,21,0.8)]"
          >
            <LockIcon />
            <span>Unlock full AI signals — Neeko+</span>
          </a>
        </div>
      )}
    </div>
  );

  const renderFormRisers = () => (
    <div className="relative mt-6 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/80 via-neutral-950 to-purple-900/30 p-4 shadow-[0_0_26px_rgba(168,85,247,0.4)] overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/60 bg-purple-500/20 px-3 py-1.5 backdrop-blur-md">
          <span className="text-xs md:text-sm font-medium text-purple-100">
            📈 Role & Form Risers
          </span>
          <span className="text-[10px] text-purple-200/80">
            Last game vs previous four
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
          Neeko+ expands this
        </span>
      </div>

      <ul className="space-y-1.5 text-xs md:text-sm relative z-10">
        {risers.map((item, index) => {
          const locked = !premiumUser && index >= risersFreeVisible;
          const { player, diff } = item;
          const series = lastNGames(getDashboardSeries(player, selectedStat), 5);
          const last = series[series.length - 1] ?? 0;

          return (
            <li
              key={player.id}
              className={`rounded-xl bg-neutral-900/55 px-3 py-2 flex items-center justify-between gap-2 hover:bg-neutral-900/95 transition-all ${
                locked ? "opacity-40 blur-sm" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {locked && <LockIcon />}
                <span className="font-medium truncate max-w-[7.5rem] md:max-w-[9rem]">
                  {player.name}
                </span>
                <span className="text-[10px] text-neutral-400 whitespace-nowrap">
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
        <div className="absolute inset-x-0 top-1/2 bottom-0 bg-gradient-to-t from-black/98 via-black/90 to-transparent backdrop-blur-2xl flex items-center justify-center">
          <a
            href="/neeko-plus"
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-5 py-2 text-xs font-semibold shadow-[0_0_22px_rgba(250,204,21,0.8)]"
          >
            <LockIcon />
            <span>Unlock all risers — Neeko+</span>
          </a>
        </div>
      )}
    </div>
  );

  const renderCompareSection = () => (
    <div className="relative mt-8 rounded-3xl border border-neutral-800 bg-neutral-950/95 p-5 shadow-[0_0_30px_rgba(148,163,184,0.35)] max-w-6xl mx-auto overflow-hidden">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-1">
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

      {/* Header row so free users see what they’re missing */}
      <div className="grid grid-cols-3 gap-4 text-[11px] md:text-xs mb-3">
        <div className="text-left text-neutral-400">
          <span className="block uppercase tracking-[0.16em] text-[10px] mb-1">
            Player A
          </span>
          <span className="block text-neutral-500">
            Choose team & player on the left.
          </span>
        </div>
        <div className="text-center text-neutral-400">
          <span className="block uppercase tracking-[0.16em] text-[10px] mb-1">
            Stat lens
          </span>
          <span className="block text-neutral-500">
            {selectedStat === "fantasy"
              ? "Fantasy points (season view)"
              : selectedStat === "disposals"
              ? "Disposals"
              : "Goals"}
          </span>
        </div>
        <div className="text-right text-neutral-400">
          <span className="block uppercase tracking-[0.16em] text-[10px] mb-1">
            Player B
          </span>
          <span className="block text-neutral-500">
            Choose team & player on the right.
          </span>
        </div>
      </div>

      {/* Selectors and stat rows still rendered, but entire middle locked for free */}
      <div className="opacity-60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs md:text-sm mb-4">
          {/* Player A */}
          <div className="flex flex-col gap-2">
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-neutral-100 shadow-inner text-xs"
              value={teamA}
              onChange={(e) => {
                if (!premiumUser) {
                  showLockedToast("Unlock Neeko+ to use interactive compare.");
                  return;
                }
                setTeamA(e.target.value);
                setPlayerAId(null);
              }}
            >
              {allTeams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-neutral-100 shadow-inner text-xs"
              value={playerA?.id ?? ""}
              onChange={(e) => {
                if (!premiumUser) {
                  showLockedToast("Unlock Neeko+ to use interactive compare.");
                  return;
                }
                setPlayerAId(Number(e.target.value));
              }}
            >
              {playersForTeamA.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stat label */}
          <div className="flex flex-col items-center justify-center text-[11px] text-neutral-400">
            <span className="uppercase tracking-[0.16em] text-neutral-500 mb-1">
              Stat lines
            </span>
            <span className="text-xs text-neutral-300 flex items-center gap-1">
              Compare averages, best/worst and totals
              <CrownIcon />
            </span>
          </div>

          {/* Player B */}
          <div className="flex flex-col gap-2">
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-neutral-100 shadow-inner text-xs"
              value={teamB}
              onChange={(e) => {
                if (!premiumUser) {
                  showLockedToast("Unlock Neeko+ to use interactive compare.");
                  return;
                }
                setTeamB(e.target.value);
                setPlayerBId(null);
              }}
            >
              {allTeams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 text-neutral-100 shadow-inner text-xs"
              value={playerB?.id ?? ""}
              onChange={(e) => {
                if (!premiumUser) {
                  showLockedToast("Unlock Neeko+ to use interactive compare.");
                  return;
                }
                setPlayerBId(Number(e.target.value));
              }}
            >
              {playersForTeamB.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-[11px] md:text-xs mb-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] md:text-xs">
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
        <div className="absolute inset-x-0 top-1/3 bottom-0 bg-gradient-to-t from-black/98 via-black/90 to-transparent backdrop-blur-2xl flex items-center justify-center">
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

  const renderStabilityMeter = () => (
    <div className="relative mt-8 rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-950/80 via-neutral-950 to-sky-900/30 p-4 shadow-[0_0_26px_rgba(56,189,248,0.45)] overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 mb-1">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm relative z-10">
        {stabilityList.map((item, index) => {
          const locked = !premiumUser && index >= stabilityFreeVisible;
          const { player, vol } = item;
          const meta = stabilityMeta(vol);

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-xl border border-sky-400/40 bg-neutral-950/90 px-3 py-2 ${
                locked ? "opacity-40 blur-sm" : ""
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-neutral-100">
                  {player.name}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {player.pos} · {player.team}
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5 max-w-[11rem]">
                <span className={`text-xs ${meta.colour}`}>{meta.label}</span>
                <span className="text-[10px] text-neutral-400">
                  Volatility: {vol.toFixed(1)}
                </span>
                <span className="text-[10px] text-neutral-400 text-right">
                  {meta.reason}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {!premiumUser && (
        <div className="absolute inset-x-0 top-1/2 bottom-0 bg-gradient-to-t from-black/98 via-black/90 to-transparent backdrop-blur-2xl flex items-center justify-center">
          <a
            href="/neeko-plus"
            className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-5 py-2 text-[11px] font-semibold shadow-[0_0_22px_rgba(250,204,21,0.8)]"
          >
            <LockIcon />
            <span>Unlock full stability rankings — Neeko+</span>
          </a>
        </div>
      )}
    </div>
  );

  const renderMasterTable = () => (
    <div className="relative mt-8 rounded-3xl border border-yellow-500/35 bg-neutral-950/98 p-5 shadow-[0_0_34px_rgba(250,204,21,0.35)] max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-1">
            Master Player Table
          </p>
          <p className="text-xs text-neutral-400">
            Season summary for the selected year and table stat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Compact toggle */}
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
                className={`h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                  compactMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Table stat selector */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Table stat</span>
            <select
              className="h-8 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
              value={tableStat}
              onChange={(e) => handleTableStatChange(e.target.value as StatKey)}
            >
              <option value="fantasy">Fantasy</option>
              <option value="disposals">Disposals</option>
              <option value="goals">Goals</option>
            </select>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Year</span>
            <select
              className="h-8 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
              value={seasonYear}
              onChange={(e) => setSeasonYear(Number(e.target.value))}
            >
              {allYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Team */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
            Team
          </span>
          <select
            className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
            value={teamFilter}
            onChange={(e) => handleTeamFilterChange(e.target.value)}
          >
            {allTeams.map((t) => (
              <option key={t} value={t}>
                {t}
                {!premiumUser && t !== "All Teams" ? " 🔒" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
            Position
          </span>
          <select
            className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
            value={positionFilter}
            onChange={(e) => handlePositionFilterChange(e.target.value)}
          >
            {allPositions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
                {!premiumUser && pos !== "All Positions" ? " 🔒" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Rounds */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
            Rounds
          </span>
          <select
            className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
            value={roundFilter}
            onChange={(e) => handleRoundFilterChange(e.target.value)}
          >
            {allRoundOptions.map((r) => (
              <option key={r} value={r}>
                {r}
                {!premiumUser && r !== "All Rounds" ? " 🔒" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center text-[11px] text-neutral-500">
          <span>
            Showing <span className="text-neutral-200">{tableSlice.length}</span>{" "}
            of <span className="text-neutral-200">{tableSorted.length}</span> players
          </span>
          {!premiumUser && (
            <span>
              Neeko+ unlocks full table, filters & deeper AI summaries.
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950/95">
        <table className="w-full text-left text-[11px] md:text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/85">
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">Pos</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-2 py-2 text-right">Games</th>
              <th className="px-2 py-2 text-right">Min</th>
              <th className="px-2 py-2 text-right">Max</th>
              <th className="px-2 py-2 text-right">Avg</th>
              <th className="px-2 py-2 text-right">Total</th>
              <th className="px-2 py-2 text-right">Stability</th>
            </tr>
          </thead>
          <tbody>
            {tableSlice.map((p, index) => {
              const series = getDashboardSeries(p, tableStat);
              const games = series.length;
              const minVal = games ? Math.min(...series) : 0;
              const maxVal = games ? Math.max(...series) : 0;
              const total = series.reduce((s, v) => s + v, 0);
              const avgVal = games ? total / games : 0;
              const vol = stdDev(series);
              const meta = stabilityMeta(vol);
              const lockedRow = !premiumUser && index >= tableFreeRows;
              const isExpanded = !!expandedRows[p.id];

              return (
                <Fragment key={p.id}>
                  <tr
                    className={`border-b border-neutral-900/80 transition-colors ${
                      lockedRow ? "opacity-40 blur-sm" : "hover:bg-neutral-900/70"
                    }`}
                  >
                    <td
                      className={`px-3 py-2 align-middle text-neutral-100 cursor-pointer ${
                        compactMode ? "py-1.5" : "py-2.5"
                      }`}
                      onClick={() => !lockedRow && toggleRow(p.id)}
                    >
                      <span className="mr-1 text-[10px] text-neutral-500 inline-block">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                      {lockedRow && <LockIcon />}
                      <span className="font-medium">{p.name}</span>
                    </td>
                    <td className={`px-3 align-middle text-neutral-300 ${compactMode ? "py-1.5" : "py-2.5"}`}>
                      {p.pos}
                    </td>
                    <td className={`px-3 align-middle text-neutral-400 ${compactMode ? "py-1.5" : "py-2.5"}`}>
                      {p.team}
                    </td>
                    <td className={`px-2 align-middle text-right tabular-nums text-neutral-200 ${compactMode ? "py-1.5" : "py-2.5"}`}>
                      {games || "-"}
                    </td>
                    <td className={`px-2 align-middle text-right tabular-nums text-neutral-200 ${compactMode ? "py-1.5" : "py-2.5"}`}>
                      {games ? minVal : "-"}
                    </td>
                    <td className={`px-2 align-middle text-right tabular-nums text-neutral-200 ${compactMode ? "py-1.5" : "py-2.5"}`}>
                      {games ? maxVal : "-"}
                    </td>
                    <td className={`px-2 align-middle text-right tabular-nums text-neutral-100 ${compactMode ? "py-1.5" : "py-2.5"}`}>
                      {games ? Math.round(avgVal) : "-"}
                    </td>
                    <td className={`px-2 align-middle text-right tabular-nums text-neutral-100 ${compactMode ? "py-1.5" : "py-2.5"}`}>
                      {games ? total : "-"}
                    </td>
                    <td className={`px-2 align-middle text-right ${compactMode ? "py-1.5" : "py-2.5"}`}>
                      <span className="inline-flex items-center gap-1 text-[10px]">
                        <span className={meta.colour}>{meta.label}</span>
                      </span>
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
                            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-3 w-full">
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
                              this player's seasonal role, usage and scoring floor for
                              Neeko+ members. Wire this up to your real AI pipeline
                              and reuse this layout to surface deeper insights.
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
      </div>

      {!premiumUser && (
        <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border border-yellow-500/50 bg-gradient-to-r from-black/90 via-black/85 to-yellow-900/40 px-3 py-2 text-[11px] text-neutral-200">
          <div className="flex items-center gap-2">
            <LockIcon />
            <span>
              Showing the first {tableFreeRows} players in full. Neeko+ unlocks the
              complete table, advanced filters and per-player AI commentary.
            </span>
          </div>
          <a
            href="/neeko-plus"
            className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-semibold text-black hover:bg-yellow-300"
          >
            Unlock full table
          </a>
        </div>
      )}

      {tableVisibleCount < tableSorted.length && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={() =>
              setTableVisibleCount((prev) => Math.min(prev + 50, tableSorted.length))
            }
            className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs text-neutral-100 hover:bg-neutral-800 hover:shadow-[0_0_14px_rgba(255,255,255,0.18)]"
          >
            Show more players
          </Button>
        </div>
      )}
    </div>
  );

  // ────────────────────────────────────────────────
  // Page shell
  // ────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* Top strip */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          className="bg-transparent px-0 text-sm text-neutral-300 hover:bg-transparent hover:text-neutral-100"
          onClick={handleBack}
        >
          <ArrowLeftIcon />
          Back
        </Button>
        <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          AFL · Player Stats
        </span>
      </div>

      {/* Hero */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            AFL Player Stats
          </h1>
          <p className="mt-1 text-xs md:text-sm text-neutral-400">
            Live player form, volatility and role-driven signals — built for fantasy &
            betting decisions.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          {renderGlobalStatSelector()}
          {!premiumUser && (
            <span className="text-[10px] text-neutral-500 max-w-xs text-right">
              Fantasy, Disposals & Goals are available here. Advanced stats, deeper AI
              and more positional context live on Neeko+.
            </span>
          )}
        </div>
      </div>

      {renderDashboardRow()}
      {renderAISignals()}
      {renderFormRisers()}
      {renderCompareSection()}
      {renderStabilityMeter()}
      {renderMasterTable()}
    </div>
  );
}
