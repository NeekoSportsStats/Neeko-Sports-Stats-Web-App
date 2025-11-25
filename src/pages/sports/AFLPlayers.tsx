// AFLPlayers_stub_v5.tsx
// Stub-only preview component for AFL Player Stats page.
// - Uses local UI stubs (no external imports)
// - Dummy data only
// - Implements premium blur/lock behaviour, tier badges, compare CTA, etc.
// Safe to paste into a Vite+React+Tailwind project as src/pages/sports/AFLPlayers.tsx
// once you replace the UI stubs + routing hooks with your actual components.

import { useState, useEffect, useRef, Fragment } from "react";

// ────────────────────────────────────────────────
// UI STUBS (replace with your design-system components in real app)
// ────────────────────────────────────────────────
const Button = ({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white transition-colors ${className}`}
  >
    {children}
  </button>
);

const ArrowLeftIcon = () => <span className="mr-2">←</span>;

const LockIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 mr-1 text-[10px] rounded-full border border-yellow-400/60 text-yellow-300 bg-black/40">
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

// Simple sparkline that can be used for last 5 games
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
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={2.5} fill="#22c55e" />
          </g>
        );
      })}
    </svg>
  );
};

// Fake auth stub (wire to real useAuth later)
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
// Helpers
// ────────────────────────────────────────────────
const thresholdsMap: Record<
  string,
  { low: number; mid: number; high: number }
> = {
  disposals: { low: 15, mid: 20, high: 25 },
  goals: { low: 1, mid: 2, high: 3 },
  fantasy: { low: 80, mid: 100, high: 120 },
  marks: { low: 4, mid: 6, high: 8 },
  tackles: { low: 3, mid: 6, high: 8 },
};

function getStatSeries(p: DummyPlayer, stat: string): number[] {
  // In this stub, all stats share the same rounds array.
  // In the real app, map stat -> specific stat history here.
  return p.rounds;
}


function computePerc(values: number[], type: string) {
  const t = thresholdsMap[type] ?? thresholdsMap.disposals;
  const played = values.filter((v) => v != null && !Number.isNaN(v));
  const games = played.length;
  if (!games) return { pLow: 0, pMid: 0, pHigh: 0 };
  return {
    pLow: Math.round((played.filter((v) => v >= t.low).length / games) * 100),
    pMid: Math.round((played.filter((v) => v >= t.mid).length / games) * 100),
    pHigh: Math.round((played.filter((v) => v >= t.high).length / games) * 100),
  };
}

function percentColor(p: number) {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 60) return "bg-lime-400";
  if (p >= 40) return "bg-amber-400";
  return "bg-red-500";
}

// Animated counter
const AnimatedPercent = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame: number;
    const step = () => {
      setDisplay((d) => {
        if (d >= value) return value;
        return Math.min(value, d + Math.max(1, Math.ceil(value / 20)));
      });
      frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="tabular-nums">{display}%</span>;
};

const PercentCell = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2 justify-end">
    <div className="h-1.5 w-12 bg-neutral-800 rounded overflow-hidden">
      <div
        className={`h-full ${percentColor(value)}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
    <AnimatedPercent value={value} />
  </div>
);

const roundLabels = ["OR", "R1", "R2", "R3", "R4", "R5"];

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
const allPositions = [
  "All Positions",
  "MID",
  "FWD",
  "DEF",
  "RUC",
  "FWD/MID",
  "DEF/MID",
];
const allRoundOptions = [
  "All Rounds",
  "Opening Round",
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
];

const statOptions = [
  { value: "disposals", label: "Disposals", premium: false },
  { value: "goals", label: "Goals", premium: false },
  { value: "fantasy", label: "Fantasy", premium: false },
  { value: "marks", label: "Marks", premium: true },
  { value: "tackles", label: "Tackles", premium: true },
  { value: "cba_rate", label: "CBA Rate", premium: true },
  { value: "contested", label: "Contested Possessions", premium: true },
];

const freeStatSet = new Set(["disposals", "goals", "fantasy"]);

// decide tier based on average
function getTier(avg: number) {
  if (avg >= 30) return { label: "S", className: "bg-amber-400 text-black" };
  if (avg >= 25)
    return { label: "A", className: "bg-emerald-500/90 text-black" };
  if (avg >= 20)
    return { label: "B", className: "bg-sky-500/80 text-black" };
  return { label: "C", className: "bg-neutral-700 text-neutral-100" };
}

// target threshold label based on selected stat
function getHitTarget(selectedStat: string) {
  switch (selectedStat) {
    case "disposals":
      return { label: "20+ Hit%", threshold: 20 };
    case "goals":
      return { label: "2+ Hit%", threshold: 2 };
    case "fantasy":
      return { label: "100+ Hit%", threshold: 100 };
    case "marks":
      return { label: "6+ Hit%", threshold: 6 };
    case "tackles":
      return { label: "6+ Hit%", threshold: 6 };
    default:
      return { label: "Target Hit%", threshold: thresholdsMap.disposals.mid };
  }
}

function computeHitPercent(values: number[], threshold: number) {
  const played = values.filter((v) => v != null && !Number.isNaN(v));
  const games = played.length;
  if (!games) return 0;
  return Math.round((played.filter((v) => v >= threshold).length / games) * 100);
}

function isStatLocked(stat: string, premiumUser: boolean) {
  if (premiumUser) return false;
  const freeStats = new Set(["disposals", "goals", "fantasy"]);
  return !freeStats.has(stat);
}



// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface DummyPlayer {
  id: number;
  name: string;
  pos: string;
  team: string;
  rounds: number[];
}

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
export default function AFLPlayers() {
  const { isPremium } = useAuth();
  const premiumUser = !!isPremium;

  const [selectedStat, setSelectedStat] = useState<string>("disposals");
  const [compactMode, setCompactMode] = useState<boolean>(true);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [expandedHot, setExpandedHot] = useState<Record<number, boolean>>({});
  const [expandedCold, setExpandedCold] = useState<Record<number, boolean>>({});

  const [teamFilter, setTeamFilter] = useState<string>("All Teams");
  const [positionFilter, setPositionFilter] = useState<string>("All Positions");
  const [roundFilter, setRoundFilter] = useState<string>("All Rounds");

  const toggleRow = (id: number) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleHotRow = (id: number) =>
    setExpandedHot((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleColdRow = (id: number) =>
    setExpandedCold((prev) => ({ ...prev, [id]: !prev[id] }));

  // Dummy data: 200 players, 6 rounds
  const fullData: DummyPlayer[] = Array.from({ length: 200 }).map((_, idx) => {
    const base = 30 - (idx % 7);
    return {
      id: idx + 1,
      name: `Player ${idx + 1}`,
      pos: idx % 4 === 0 ? "RUC" : idx % 3 === 0 ? "DEF" : idx % 2 ? "MID" : "FWD",
      team: ["COLL", "ESS", "SYD", "CARL"][idx % 4],
      rounds: [base, base + 2, base - 1, base + 3, base - 2, base + 1],
    };
  });

  // Filters for master table
  const filteredData = fullData.filter((p) => {
    if (teamFilter !== "All Teams" && p.team !== teamFilter) return false;
    if (positionFilter !== "All Positions" && p.pos !== positionFilter) return false;
    // roundFilter reserved for real data later
    return true;
  });

  
  // Sort master table by last-5 TOTAL descending for the selected stat
  const sortedFilteredData = [...filteredData].sort((a, b) => {
    const seriesA = getStatSeries(a, selectedStat);
    const seriesB = getStatSeries(b, selectedStat);
    const last5A = seriesA.slice(-5);
    const last5B = seriesB.slice(-5);
    const totalA = last5A.reduce((s, v) => s + v, 0);
    const totalB = last5B.reduce((s, v) => s + v, 0);
    return totalB - totalA;
  });

  // Show-more pagination for table
  const [visibleCount, setVisibleCount] = useState<number>(50);


  const masterData = sortedFilteredData.slice(0, visibleCount);

  // Hot / cold lists based on last-5 average
  const sortedByForm = [...fullData].sort((a, b) => {
    const valsA = getStatSeries(a, selectedStat);
    const valsB = getStatSeries(b, selectedStat);
    const last5A = valsA.slice(-5);
    const last5B = valsB.slice(-5);
    const avgA =
      last5A.reduce((s, v) => s + v, 0) / Math.max(last5A.length, 1);
    const avgB =
      last5B.reduce((s, v) => s + v, 0) / Math.max(last5B.length, 1);
    return avgB - avgA;
  });

  const hotPlayers = sortedByForm.slice(0, 10);
  const coldPlayers = [...sortedByForm].reverse().slice(0, 10);

  const freeHotVisible = 4;
  const freeAIVisible = 4;
  const freeMasterRows = 10;

  const aiInsights = [
    {
      id: 1,
      text: "High-possession mids up in consistency over the last 3 rounds.",
      value: +6,
    },
    {
      id: 2,
      text: "Key forwards seeing reduced inside-50 targets week-on-week.",
      value: -4,
    },
    {
      id: 3,
      text: "Intercept defenders gaining more uncontested marks across half-back.",
      value: +3,
    },
    {
      id: 4,
      text: "Rucks showing a spike in hit-out-to-advantage impact.",
      value: +2,
    },
    {
      id: 5,
      text: "Tackling pressure slightly down in contested situations.",
      value: -2,
    },
    {
      id: 6,
      text: "Outside runners increasing uncontested chains through the corridor.",
      value: +5,
    },
    {
      id: 7,
      text: "Small forwards seeing volatile role changes impacting scoreboard.",
      value: -3,
    },
    {
      id: 8,
      text: "Inside mids stabilising time-on-ground after early-season fluctuations.",
      value: +4,
    },
    {
      id: 9,
      text: "Half-backs slightly down on rebound 50 involvement.",
      value: -1,
    },
    {
      id: 10,
      text: "Tagging roles creating sharp dips in elite mid output.",
      value: -5,
    },
  ];

  // Filter handlers with lock behaviour
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!premiumUser && value !== "All Teams") {
      showLockedToast("Unlock with Neeko+ to filter by team.");
      e.target.blur();
      return;
    }
    setTeamFilter(value);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!premiumUser && value !== "All Positions") {
      showLockedToast("Unlock with Neeko+ to filter by position.");
      e.target.blur();
      return;
    }
    setPositionFilter(value);
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!premiumUser && value !== "All Rounds") {
      showLockedToast("Unlock with Neeko+ to filter by rounds.");
      e.target.blur();
      return;
    }
    setRoundFilter(value);
  };

  const handleStatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!premiumUser && !freeStatSet.has(value)) {
      showLockedToast("Unlock with Neeko+ to use advanced stat types.");
      e.target.blur();
      return;
    }
    setSelectedStat(value);
  };

  const hitTarget = getHitTarget(selectedStat);

  // ────────────────────────────────────────────────
  // Sections
  // ────────────────────────────────────────────────

  const HotColdStatFilter = () => (
    <div className="mb-3 flex items-center justify-start gap-2 text-xs">
      <span className="text-[11px] uppercase tracking-wide text-neutral-500">
        Stat
      </span>
      <select
        className="h-8 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner text-xs"
        value={selectedStat}
        onChange={handleStatChange}
      >
        {statOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
            {opt.premium ? " (Neeko+ 🔒)" : ""}
          </option>
        ))}
      </select>
    </div>
  );

  const TopBottomSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {/* Running Hot */}
      <div className="relative rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/70 via-neutral-950 to-emerald-900/20 p-4 shadow-[0_0_25px_rgba(16,185,129,0.25)] overflow-hidden">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full drop-shadow-[0_0_6px_rgba(255,255,255,0.25)] border border-emerald-400/40 bg-emerald-600/15 px-3 py-1.5 backdrop-blur">
            <span className="text-sm">🔥 Running Hot</span>
            <span className="text-[11px] text-emerald-200">
              Top 10 by recent form (last 5 games)
            </span>
          </div>
          <HotColdStatFilter />
        </div>

        <ul className="space-y-2 text-sm relative z-10">
          {hotPlayers.map((p, index) => {
            const locked = !premiumUser && index >= freeHotVisible;
            const last5 = getStatSeries(p, selectedStat).slice(-5);
            const avg =
              last5.reduce((s, v) => s + v, 0) / Math.max(last5.length, 1);
            const strongTrend = avg >= 28;
            const isExpanded = expandedHot[p.id];

            return (
              <li
                key={p.id}
                className={`rounded-xl max-w-xl mx-auto bg-neutral-900/40 hover:bg-neutral-900/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)] ${
                  locked ? "opacity-60 blur-md" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => !locked && toggleHotRow(p.id)}
                  className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 leading-normal"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {locked && <LockIcon />}
                    <span className="font-medium truncate max-w-[7rem] md:max-w-[10rem]">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                      {p.pos} · {p.team}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                    <div className="w-full sm:w-28 md:w-32">
                      <TrendSparkline values={last5} />
                    </div>
                    <div className="text-xs text-emerald-300 flex flex-col items-end">
                      <span className="font-semibold flex items-center whitespace-nowrap">
                        Avg {Math.round(avg)}
                        {strongTrend && <FireIcon />}
                      </span>
                      <span className="text-[10px] text-emerald-200/80">
                        Trending up
                      </span>
                    </div>
                  </div>
                </button>

                {isExpanded && !locked && (
                  <div className="border-t border-neutral-800 px-3 pb-3 pt-2 text-[11px]">
                    <div className="mb-1 text-neutral-400">Last 5 games</div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-950/90 p-3">
                      <TrendSparkline values={last5} />
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-neutral-300">
                        {last5.map((v, i) => (
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
                )}
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="pointer-events-none absolute inset-x-0 top-20 bottom-0 bg-gradient-to-b from-transparent via-neutral-950/90 to-black/95 backdrop-blur-2xl flex items-start justify-center">
            <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-8 py-3 text-base font-semibold shadow-[0_0_25px_rgba(255,215,0,0.4)] animate-pulse transform transition-transform hover:scale-[1.03] active:scale-[0.98]">
              <LockIcon />
              <span>Unlock with Neeko+</span>
            </div>
          </div>
        )}
      </div>

      {/* Going Cold */}
      <div className="relative rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/70 via-neutral-950 to-red-900/20 p-4 shadow-[0_0_25px_rgba(239,68,68,0.25)] overflow-hidden">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full drop-shadow-[0_0_6px_rgba(255,255,255,0.25)] border border-red-400/40 bg-red-600/15 px-3 py-1.5 backdrop-blur">
            <span className="text-sm">❄️ Going Cold</span>
            <span className="text-[11px] text-red-200">
              Bottom 10 by recent form (last 5 games)
            </span>
          </div>
          <HotColdStatFilter />
        </div>

        <ul className="space-y-2 text-sm relative z-10">
          {coldPlayers.map((p, index) => {
            const locked = !premiumUser && index >= freeHotVisible;
            const last5 = getStatSeries(p, selectedStat).slice(-5);
            const avg =
              last5.reduce((s, v) => s + v, 0) / Math.max(last5.length, 1);
            const strongDrop = avg <= 20;
            const isExpanded = expandedCold[p.id];

            return (
              <li
                key={p.id}
                className={`rounded-xl max-w-xl mx-auto bg-neutral-900/40 hover:bg-neutral-900/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(239,68,68,0.35)] ${
                  locked ? "opacity-60 blur-md" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => !locked && toggleColdRow(p.id)}
                  className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 leading-normal"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {locked && <LockIcon />}
                    <span className="font-medium truncate max-w-[7rem] md:max-w-[10rem]">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                      {p.pos} · {p.team}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                    <div className="w-full sm:w-28 md:w-32">
                      <TrendSparkline values={last5} />
                    </div>
                    <div className="text-xs text-red-300 flex flex-col items-end">
                      <span className="font-semibold flex items-center whitespace-nowrap">
                        Avg {Math.round(avg)}
                        {strongDrop && <ColdIcon />}
                      </span>
                      <span className="text-[10px] text-red-200/80">
                        Trending down
                      </span>
                    </div>
                  </div>
                </button>

                {isExpanded && !locked && (
                  <div className="border-t border-neutral-800 px-3 pb-3 pt-2 text-[11px]">
                    <div className="mb-1 text-neutral-400">Last 5 games</div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-950/90 p-3">
                      <TrendSparkline values={last5} />
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-neutral-300">
                        {last5.map((v, i) => (
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
                )}
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="pointer-events-none absolute inset-x-0 top-20 bottom-0 bg-gradient-to-b from-transparent via-neutral-950/90 to-black/95 backdrop-blur-2xl flex items-start justify-center">
            <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-8 py-3 text-base font-semibold shadow-[0_0_25px_rgba(255,215,0,0.4)] animate-pulse transform transition-transform hover:scale-[1.03] active:scale-[0.98]">
              <LockIcon />
              <span>Unlock with Neeko+</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

const AIInsightsSection = () => (
    <div className="relative mt-8 rounded-2xl border border-neutral-700 bg-neutral-950/90 p-4 backdrop-blur-md overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">🧠 AI Trend Insights</h2>
          {/* Player-based AI, description removed per spec */}
        </div>
        <a
          href="/sports/afl/ai"
          className="text-xs text-yellow-400 hover:text-yellow-300 underline underline-offset-2"
        >
          View full AI analysis
        </a>
      </div>

      <div className="divide-y divide-neutral-800 text-sm relative z-10">
        {aiInsights.map((item, index) => {
          const locked = !premiumUser && index >= freeAIVisible;
          const positive = item.value > 0;
          const neutral = item.value === 0;
          const colour = neutral
            ? "text-yellow-300"
            : positive
            ? "text-emerald-400"
            : "text-red-400";
          const arrow = neutral ? "↔" : positive ? "▲" : "▼";

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between py-1.5 transition-all duration-150 ${
                locked ? "opacity-60 blur-md" : ""
              }`}
            >
              <span className="pr-3 text-neutral-200">{item.text}</span>
              <span className={`pl-3 tabular-nums ${colour}`}>
                {arrow} {Math.abs(item.value)}%
              </span>
            </div>
          );
        })}
      </div>

      {!premiumUser && (
        <div className="pointer-events-none absolute inset-x-0 top-24 bottom-0 bg-gradient-to-b from-transparent via-neutral-950/88 to-black/96 backdrop-blur-2xl flex items-start justify-center">
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-8 py-3 text-base font-semibold shadow-[0_0_25px_rgba(255,215,0,0.4)] animate-pulse transform transition-transform hover:scale-[1.03] active:scale-[0.98]">
            <LockIcon />
            <span>Unlock with Neeko+</span>
          </div>
        </div>
      )}
    </div>
  );

  

  const ComparePlayersSection = () => {
    // Simple two-step selector: Team -> Player, for each side.
    const [teamA, setTeamA] = useState<string>("COLL");
    const [teamB, setTeamB] = useState<string>("ESS");
    const [playerAId, setPlayerAId] = useState<number | null>(null);
    const [playerBId, setPlayerBId] = useState<number | null>(null);

    const playersForTeamA = fullData.filter((p) => teamA === "All Teams" || p.team === teamA);
    const playersForTeamB = fullData.filter((p) => teamB === "All Teams" || p.team === teamB);

    const playerA = playersForTeamA.find((p) => p.id === playerAId) ?? playersForTeamA[0];
    const playerB = playersForTeamB.find((p) => p.id === playerBId) ?? playersForTeamB[0];

    const seriesA = playerA ? getStatSeries(playerA, selectedStat).slice(-5) : [];
    const seriesB = playerB ? getStatSeries(playerB, selectedStat).slice(-5) : [];

    const avgA =
      seriesA.length > 0
        ? seriesA.reduce((s, v) => s + v, 0) / seriesA.length
        : 0;
    const avgB =
      seriesB.length > 0
        ? seriesB.reduce((s, v) => s + v, 0) / seriesB.length
        : 0;

    const handleTeamAChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (!premiumUser) {
        showLockedToast("Unlock Neeko+ to use Compare Players.");
        e.target.blur();
        return;
      }
      setTeamA(value);
      setPlayerAId(null);
    };

    const handleTeamBChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (!premiumUser) {
        showLockedToast("Unlock Neeko+ to use Compare Players.");
        e.target.blur();
        return;
      }
      setTeamB(value);
      setPlayerBId(null);
    };

    const handlePlayerAChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number(e.target.value);
      if (!premiumUser) {
        showLockedToast("Unlock Neeko+ to use Compare Players.");
        e.target.blur();
        return;
      }
      setPlayerAId(value || null);
    };

    const handlePlayerBChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number(e.target.value);
      if (!premiumUser) {
        showLockedToast("Unlock Neeko+ to use Compare Players.");
        e.target.blur();
        return;
      }
      setPlayerBId(value || null);
    };

    const statLabels = [
      "Last 5 avg",
      "Best score",
      "Worst score",
      "Total last 5",
      "Hit rate vs threshold",
    ];

    const hitPctA = computeHitPercent(
      seriesA,
      getHitTarget(selectedStat).threshold
    );
    const hitPctB = computeHitPercent(
      seriesB,
      getHitTarget(selectedStat).threshold
    );

    return (
      <div className="relative mt-8 rounded-3xl border border-yellow-500/30 bg-neutral-950/95 p-5 shadow-[0_0_32px_rgba(250,204,21,0.18)] max-w-6xl mx-auto overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Compare Players</h2>
            <p className="text-xs text-neutral-400">
              Head-to-head view of player form and key stats for the selected metric.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-neutral-400">
            <span>Neeko+ feature</span>
            <LockIcon />
          </div>
        </div>

        {/* Selectors */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Player A selectors */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">
              Player A
            </span>
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner transition-colors focus:outline-none focus:ring-1 focus:ring-yellow-400/60"
              value={teamA}
              onChange={handleTeamAChange}
            >
              {allTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner transition-colors focus:outline-none focus:ring-1 focus:ring-yellow-400/60"
              value={playerA?.id ?? ""}
              onChange={handlePlayerAChange}
            >
              {playersForTeamA.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.pos}
                </option>
              ))}
            </select>
          </div>

          {/* Stat label column */}
          <div className="flex flex-col gap-2 items-center justify-center">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">
              Stat
            </span>
            <span className="inline-flex items-center rounded-full border border-yellow-500/40 bg-neutral-900 px-3 py-1 text-[11px] text-yellow-200">
              {statOptions.find((s) => s.value === selectedStat)?.label ??
                "Stat"}
            </span>
          </div>

          {/* Player B selectors */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wide text-right text-neutral-500">
              Player B
            </span>
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner transition-colors focus:outline-none focus:ring-1 focus:ring-yellow-400/60"
              value={teamB}
              onChange={handleTeamBChange}
            >
              {allTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner transition-colors focus:outline-none focus:ring-1 focus:ring-yellow-400/60"
              value={playerB?.id ?? ""}
              onChange={handlePlayerBChange}
            >
              {playersForTeamB.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.pos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison grid */}
        <div className="relative mt-4 rounded-2xl border border-neutral-800 bg-neutral-950/90 p-4 overflow-hidden">
          <div className="grid grid-cols-3 gap-3 text-[11px] md:text-xs">
            <div className="space-y-2">
              <div className="font-semibold text-neutral-100 truncate">
                {playerA?.name}
              </div>
              <div className="text-[10px] text-neutral-400">
                {playerA?.pos} · {playerA?.team}
              </div>
            </div>
            <div className="space-y-2 text-center text-neutral-400">
              <div className="font-semibold text-neutral-200">
                Key metrics (last 5)
              </div>
              <div className="text-[10px]">
                Showing how each player compares on the chosen stat.
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="font-semibold text-neutral-100 truncate">
                {playerB?.name}
              </div>
              <div className="text-[10px] text-neutral-400">
                {playerB?.pos} · {playerB?.team}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] md:text-xs">
            <div className="space-y-1 text-right text-neutral-100">
              <div className="tabular-nums">{avgA ? Math.round(avgA) : "--"}</div>
              <div className="tabular-nums">
                {seriesA.length ? Math.max(...seriesA) : "--"}
              </div>
              <div className="tabular-nums">
                {seriesA.length ? Math.min(...seriesA) : "--"}
              </div>
              <div className="tabular-nums">
                {seriesA.length ? seriesA.reduce((s, v) => s + v, 0) : "--"}
              </div>
              <div className="tabular-nums">
                {seriesA.length ? `${hitPctA}%` : "--"}
              </div>
            </div>

            <div className="space-y-1 text-center text-neutral-400">
              {statLabels.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>

            <div className="space-y-1 text-left text-neutral-100">
              <div className="tabular-nums">{avgB ? Math.round(avgB) : "--"}</div>
              <div className="tabular-nums">
                {seriesB.length ? Math.max(...seriesB) : "--"}
              </div>
              <div className="tabular-nums">
                {seriesB.length ? Math.min(...seriesB) : "--"}
              </div>
              <div className="tabular-nums">
                {seriesB.length ? seriesB.reduce((s, v) => s + v, 0) : "--"}
              </div>
              <div className="tabular-nums">
                {seriesB.length ? `${hitPctB}%` : "--"}
              </div>
            </div>
          </div>

          {/* Blur + premium CTA overlay for free users */}
          {!premiumUser && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-8 py-3 text-sm font-semibold shadow-[0_0_25px_rgba(255,215,0,0.4)] animate-pulse transform transition-transform hover:scale-[1.03] active:scale-[0.98]"
                onClick={() => showLockedToast("Compare Players is a Neeko+ feature.")}
              >
                <LockIcon />
                <span>Unlock Player Comparison — Neeko+</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };


const MasterTable = () => {
    const hitTarget = getHitTarget(selectedStat);

    return (
      <div className="relative mt-8 rounded-3xl border border-yellow-500/30 bg-neutral-950/95 p-5 shadow-[0_0_32px_rgba(250,204,21,0.18)] max-w-6xl mx-auto">
        {/* Header row */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
              Master Player Table
            </p>
            <p className="text-xs text-neutral-400">
              Sorted by total over the last 5 games for the selected stat.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* Compact toggle */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Compact View</span>
              <button
                type="button"
                onClick={() => setCompactMode((prev) => !prev)}
                className={`flex h-5 w-10 items-center rounded-full border px-0.5 transition-all duration-200 ${
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
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Team */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">
              Team
            </span>
            <div className="relative">
              <select
                className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 pr-8 text-neutral-100 shadow-inner"
                value={teamFilter}
                onChange={handleTeamChange}
              >
                {allTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                    {!premiumUser && team !== "All Teams" ? " 🔒" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Position */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">
              Position
            </span>
            <div className="relative">
              <select
                className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 pr-8 text-neutral-100 shadow-inner"
                value={positionFilter}
                onChange={handlePositionChange}
              >
                {allPositions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                    {!premiumUser && pos !== "All Positions" ? " 🔒" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rounds */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">
              Rounds
            </span>
            <div className="relative">
              <select
                className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 pr-8 text-neutral-100 shadow-inner"
                value={roundFilter}
                onChange={handleRoundChange}
              >
                {allRoundOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                    {!premiumUser && opt !== "Season to Date" ? " 🔒" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stat */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">
              Stat Type
            </span>
            <div className="relative">
              <select
                className="h-9 w-full rounded-full border border-neutral-700 bg-neutral-900 px-3 pr-8 text-neutral-100 shadow-inner"
                value={selectedStat}
                onChange={handleStatChange}
              >
                {statOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={isStatLocked(opt.value)}>
                    {opt.label}
                    {isStatLocked(opt.value) ? " (Neeko+)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950/90">
          <table className="w-full text-left text-[11px] md:text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80">
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2">Pos</th>
                <th className="px-3 py-2">Team</th>
                {!compactMode &&
                  roundLabels.map((label) => (
                    <th key={label} className="px-2 py-2 text-right">
                      {label}
                    </th>
                  ))}
                <th className="px-2 py-2 text-right">Min (L5)</th>
                <th className="px-2 py-2 text-right">Max (L5)</th>
                <th className="px-2 py-2 text-right">Avg (L5)</th>
                <th className="px-2 py-2 text-right">Total (L5)</th>
                <th className="px-2 py-2 text-right">
                  Hit {hitTarget.label}
                </th>
              </tr>
            </thead>

            <tbody>
              {masterData.map((p, index) => {
                const isLockedRow = !premiumUser && index >= freeMasterRows;
                const isExpanded = expandedRows[p.id];

                const series = getStatSeries(p, selectedStat);
                const last5 = series.slice(-5);
                const minL5 = last5.length ? Math.min(...last5) : 0;
                const maxL5 = last5.length ? Math.max(...last5) : 0;
                const totalL5 = last5.reduce((s, v) => s + v, 0);
                const avgL5 =
                  last5.length > 0 ? totalL5 / last5.length : 0;
                const hitPercent = computeHitPercent(
                  last5,
                  hitTarget.threshold
                );

                return (
                  <Fragment key={p.id}>
                    <tr
                      className={`border-b border-neutral-900/80 transition-colors ${
                        isLockedRow
                          ? "opacity-60 blur-[1px]"
                          : "hover:bg-neutral-900/60 hover:-translate-y-[1px] transition-transform"
                      }`}
                    >
                      <td
                        className="cursor-pointer px-3 py-2 align-middle text-neutral-100"
                        onClick={() => !isLockedRow && toggleRow(p.id)}
                      >
                        <span className="mr-1 text-xs text-neutral-500 inline-block">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                        {isLockedRow && <LockIcon />}
                        <span className="font-medium inline-flex items-center gap-2">
                          <span>{p.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle text-neutral-300">
                        {p.pos}
                      </td>
                      <td className="px-3 py-2 align-middle text-neutral-400">
                        {p.team}
                      </td>

                      {!compactMode &&
                        roundLabels.map((label, idx) => (
                          <td
                            key={label}
                            className="px-2 py-2 align-middle text-right tabular-nums text-neutral-200"
                          >
                            {series[idx] ?? "-"}
                          </td>
                        ))}

                      <td className="px-2 py-2 align-middle text-right tabular-nums text-neutral-200">
                        {minL5 || minL5 === 0 ? minL5 : "-"}
                      </td>
                      <td className="px-2 py-2 align-middle text-right tabular-nums text-neutral-200">
                        {maxL5 || maxL5 === 0 ? maxL5 : "-"}
                      </td>
                      <td className="px-2 py-2 align-middle text-right tabular-nums text-neutral-100">
                        {last5.length ? Math.round(avgL5) : "-"}
                      </td>
                      <td className="px-2 py-2 align-middle text-right tabular-nums text-neutral-100">
                        {totalL5 || totalL5 === 0 ? totalL5 : "-"}
                      </td>
                      <td className="px-2 py-2 align-middle text-right tabular-nums text-neutral-200">
                        {last5.length ? `${hitPercent}%` : "-"}
                      </td>
                    </tr>

                    {isExpanded && !isLockedRow && (
                      <tr className="border-b border-neutral-900/80 bg-neutral-950/90">
                        <td colSpan={100} className="px-4 py-4">
                          <div className="flex flex-col gap-4 md:flex-row">
                            <div className="md:w-1/2">
                              <h4 className="mb-2 text-xs font-semibold text-neutral-200">
                                Recent Trend (last 5)
                              </h4>
                              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-3">
                                <TrendSparkline values={last5} />
                                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-neutral-300">
                                  {last5.map((v, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5"
                                    >
                                      <span className="tabular-nums">
                                        {v}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="md:w-1/2">
                              <h4 className="mb-2 text-xs font-semibold text-neutral-200">
                                AI Form Summary
                              </h4>
                              <p className="text-xs text-neutral-300">
                                AI highlights how this player's recent output stacks up against their last five matches, surfacing role, usage and scoring context for Neeko+ members.
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

        {/* Neeko+ CTA below blurred rows */}
        {!premiumUser && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-yellow-500/40 bg-gradient-to-r from-neutral-950 via-neutral-900 to-yellow-900/30 px-3 py-2 text-[11px] text-neutral-200">
            <div className="flex items-center gap-2">
              <LockIcon />
              <span>
                Showing the first {freeMasterRows} players in full. Upgrade to Neeko+ to unlock the complete table and advanced filters.
              </span>
            </div>
            <a
              href="/neeko-plus"
              className="ml-3 rounded-md bg-yellow-400 px-2 py-1 text-[11px] font-semibold text-black hover:bg-yellow-300"
            >
              Unlock table
            </a>
          </div>
        )}

        {/* Show more button */}
        {visibleCount < sortedFilteredData.length && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs text-neutral-100 hover:bg-neutral-800 hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] transition"
              onClick={() =>
                setVisibleCount((v) =>
                  Math.min(v + 50, sortedFilteredData.length)
                )
              }
            >
              Show more players
            </button>
          </div>
        )}
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // Page shell
  // ────────────────────────────────────────────────
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history) {
      window.history.back();
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <div className="mb-4 flex items-center justify-between">
        <Button
          className="bg-transparent px-0 text-sm text-neutral-300 hover:bg-transparent hover:text-neutral-100"
          onClick={handleBack}
        >
          <ArrowLeftIcon /> Back
        </Button>
        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
          AFL · Player Stats
        </span>
      </div>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">AFL Player Stats</h1>
          <p className="text-xs text-neutral-400 md:text-sm">
            Live player metrics, trends & AI-backed insights.
          </p>
        </div>
      </div>

      <TopBottomSection />
      <AIInsightsSection />
      <ComparePlayersSection />
      <MasterTable />
    </div>
  );
}
