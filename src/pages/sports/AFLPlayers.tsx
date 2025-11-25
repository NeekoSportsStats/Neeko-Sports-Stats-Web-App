// AFLPlayers.tsx (Stub Preview Version v2)
// FULL VALID JSX — ALL TAGS CLOSED — VERCEL-SAFE
//
// This is a self-contained preview component:
// - Uses local UI stubs (no project imports)
// - Dummy player + AI data
// - Includes premium-style blur/overlay gating
// - Layout roughly matches EPL Player Stats card layout

import { useState, useEffect, useRef, Fragment } from "react";

// ────────────────────────────────────────────────
// UI STUBS
// ────────────────────────────────────────────────
const Button = ({ children, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white ${className}`}
  >
    {children}
  </button>
);

const ArrowLeftIcon = () => <span className="mr-2">←</span>;

const LockIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 mr-1 text-[10px] rounded-full border border-yellow-400/60 text-yellow-300">
    🔒
  </span>
);

const FireIcon = () => (
  <span className="ml-1 text-xs" role="img" aria-label="hot">
    🔥
  </span>
);

const Sparkline = () => (
  <svg width="160" height="40" className="overflow-visible">
    <polyline
      fill="none"
      stroke="#22c55e"
      strokeWidth="2"
      points="0,26 20,22 40,18 60,20 80,14 100,10 120,12 140,8 160,10"
    />
  </svg>
);

// Fake auth stub
function useAuth() {
  return { isPremium: false };
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
const thresholdsMap = {
  disposals: { low: 15, mid: 20, high: 25 },
  goals: { low: 1, mid: 2, high: 3 },
  fantasy: { low: 80, mid: 100, high: 120 },
  marks: { low: 4, mid: 6, high: 8 },
  tackles: { low: 3, mid: 6, high: 8 },
};

function computePerc(values, type) {
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

function percentColor(p) {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 60) return "bg-lime-400";
  if (p >= 40) return "bg-amber-400";
  return "bg-red-500";
}

// Animated counter
const AnimatedPercent = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame;
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

const PercentCell = ({ value }) => (
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

// Round labels for table when not in compact mode
const roundLabels = ["OR", "R1", "R2", "R3", "R4", "R5"];

// Example filters
const allTeams = ["All Teams", "COLL", "ESS", "SYD", "CARL", "RICH", "HAW", "GEEL", "MELB"];
const allPositions = ["All Positions", "MID", "FWD", "DEF", "RUC", "FWD/MID", "DEF/MID"];
const allRoundOptions = ["All Rounds", "Opening Round", "R1", "R2", "R3", "R4", "R5"];

const statOptions = [
  { value: "disposals", label: "Disposals", premium: false },
  { value: "goals", label: "Goals", premium: false },
  { value: "fantasy", label: "Fantasy", premium: false },
  { value: "marks", label: "Marks", premium: true },
  { value: "tackles", label: "Tackles", premium: true },
  { value: "cba_rate", label: "CBA Rate", premium: true },
  { value: "contested", label: "Contested Possessions", premium: true },
];

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────
export default function AFLPlayers() {
  const { isPremium } = useAuth();
  const premiumUser = !!isPremium;

  const [selectedStat, setSelectedStat] = useState("disposals");
  const [compactMode, setCompactMode] = useState(true);
  const [compareMode, setCompareMode] = useState(false); // reserved for later
  const [expandedRows, setExpandedRows] = useState({});

  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [positionFilter, setPositionFilter] = useState("All Positions");
  const [roundFilter, setRoundFilter] = useState("All Rounds");

  const toggleRow = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // Dummy data: 200 players
  const fullData = Array.from({ length: 200 }).map((_, idx) => {
    const base = 30 - (idx % 7);
    return {
      id: idx + 1,
      name: `Player ${idx + 1}`,
      pos: idx % 4 === 0 ? "RUC" : idx % 3 === 0 ? "DEF" : idx % 2 ? "MID" : "FWD",
      team: ["COLL", "ESS", "SYD", "CARL"][idx % 4],
      rounds: [base, base + 2, base - 1, base + 3, base - 2, base + 1],
    };
  });

  // Very light filter application (just to make UI feel real)
  const filteredData = fullData.filter((p) => {
    if (teamFilter !== "All Teams" && p.team !== teamFilter) return false;
    if (positionFilter !== "All Positions" && p.pos !== positionFilter) return false;
    // roundFilter not used on dummy data; left for real integration
    return true;
  });

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(40);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((v) => Math.min(v + 40, filteredData.length));
        }
      },
      { threshold: 1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredData.length]);

  const masterData = filteredData.slice(0, visibleCount);

  // Sorting for hot/cold lists based on fullData
  const sortedByForm = [...fullData].sort((a, b) => {
    const avgA = a.rounds.reduce((s, v) => s + v, 0) / a.rounds.length;
    const avgB = b.rounds.reduce((s, v) => s + v, 0) / b.rounds.length;
    return avgB - avgA;
  });

  const hotPlayers = sortedByForm.slice(0, 10);
  const coldPlayers = [...sortedByForm].reverse().slice(0, 10);

  const freeHotVisible = 4;
  const freeAIVisible = 4;
  const freeMasterRows = 15;

  const isStatLocked = (value) =>
    statOptions.find((s) => s.value === value)?.premium && !premiumUser;

  const aiInsights = [
    { id: 1, text: "High-possession mids up in consistency over the last 3 rounds", value: +6 },
    { id: 2, text: "Key forwards seeing reduced inside-50 targets week-on-week", value: -4 },
    { id: 3, text: "Intercept defenders gaining more uncontested marks across half-back", value: +3 },
    { id: 4, text: "Rucks showing a spike in hit-out-to-advantage impact", value: +2 },
    { id: 5, text: "Tackling pressure slightly down in contested situations", value: -2 },
    { id: 6, text: "Outside runners increasing uncontested chains through the corridor", value: +5 },
    { id: 7, text: "Small forwards seeing volatile role changes impacting scoreboard", value: -3 },
    { id: 8, text: "Inside mids stabilising time-on-ground after early-season fluctuations", value: +4 },
    { id: 9, text: "Half-backs slightly down on rebound 50 involvement", value: -1 },
    { id: 10, text: "Tagging roles creating sharp dips in elite mid output", value: -5 },
  ];

  // ────────────────────────────────────────────────
  // Sections
  // ────────────────────────────────────────────────

  const TopBottomSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      {/* Running Hot */}
      <div className="relative rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/70 via-neutral-950 to-emerald-900/20 p-4 shadow-[0_0_25px_rgba(16,185,129,0.25)] overflow-hidden">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-600/15 px-3 py-1.5 backdrop-blur">
          <span className="text-sm">🔥 Running Hot</span>
          <span className="text-[11px] text-emerald-200">Top 10 by recent form</span>
        </div>

        <ul className="space-y-2 text-sm relative z-10">
          {hotPlayers.map((p, index) => {
            const locked = !premiumUser && index >= freeHotVisible;
            const avg = Math.round(p.rounds.reduce((s, v) => s + v, 0) / p.rounds.length);
            const strongTrend = avg >= 28; // tweak threshold as needed

            return (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-transform duration-150 hover:-translate-y-0.5 ${
                  locked ? "opacity-60 blur-md" : "bg-neutral-900/40 hover:bg-neutral-900/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  {locked && <LockIcon />}
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[11px] text-neutral-400">
                    {p.pos} · {p.team}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block w-20">
                    <Sparkline />
                  </div>
                  <div className="text-xs text-emerald-300 flex flex-col items-end">
                    <span className="font-semibold flex items-center">
                      Avg {avg}
                      {strongTrend && <FireIcon />}
                    </span>
                    <span className="text-[10px] text-emerald-200/80">Trending up</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="pointer-events-none absolute inset-x-0 top-16 bottom-0 bg-gradient-to-b from-transparent via-neutral-950/80 to-black/95 backdrop-blur-xl flex items-start justify-center pt-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-4 py-1 text-xs font-semibold shadow-lg">
              <LockIcon />
              <span>Unlock with Neeko+</span>
            </div>
          </div>
        )}
      </div>

      {/* Going Cold */}
      <div className="relative rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/70 via-neutral-950 to-red-900/20 p-4 shadow-[0_0_25px_rgba(239,68,68,0.25)] overflow-hidden">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-600/15 px-3 py-1.5 backdrop-blur">
          <span className="text-sm">❄️ Going Cold</span>
          <span className="text-[11px] text-red-200">Bottom 10 by recent form</span>
        </div>

        <ul className="space-y-2 text-sm relative z-10">
          {coldPlayers.map((p, index) => {
            const locked = !premiumUser && index >= freeHotVisible;
            const avg = Math.round(p.rounds.reduce((s, v) => s + v, 0) / p.rounds.length);
            const strongDrop = avg <= 20; // arbitrary threshold for "cold"

            return (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-transform duration-150 hover:-translate-y-0.5 ${
                  locked ? "opacity-60 blur-md" : "bg-neutral-900/40 hover:bg-neutral-900/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  {locked && <LockIcon />}
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[11px] text-neutral-400">
                    {p.pos} · {p.team}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block w-20">
                    <Sparkline />
                  </div>
                  <div className="text-xs text-red-300 flex flex-col items-end">
                    <span className="font-semibold flex items-center">
                      Avg {avg}
                      {strongDrop && (
                        <span className="ml-1 text-[10px]" role="img" aria-label="cold">
                          ❄️
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-red-200/80">Trending down</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="pointer-events-none absolute inset-x-0 top-16 bottom-0 bg-gradient-to-b from-transparent via-neutral-950/80 to-black/95 backdrop-blur-xl flex items-start justify-center pt-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-4 py-1 text-xs font-semibold shadow-lg">
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
          <p className="text-xs text-neutral-400">
            Sentence-level trends with % shifts — most recent rounds only.
          </p>
        </div>
        <span className="text-xs text-yellow-400 underline underline-offset-2 cursor-default">
          View full AI analysis
        </span>
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
              className={`flex items-center justify-between py-1.5 ${
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
        <div className="pointer-events-none absolute inset-x-0 top-10 bottom-0 bg-gradient-to-b from-transparent via-neutral-950/85 to-black/95 backdrop-blur-xl flex items-start justify-center pt-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-4 py-1 text-xs font-semibold shadow-lg">
            <LockIcon />
            <span>Unlock with Neeko+</span>
          </div>
        </div>
      )}
    </div>
  );

  const MasterTable = () => (
    <div className="relative mt-8 rounded-3xl border border-yellow-500/30 bg-neutral-950/95 p-5 shadow-[0_0_40px_rgba(250,204,21,0.18)] max-w-6xl mx-auto overflow-hidden">
      {/* View Options header row */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
            View Options
          </p>
          <p className="text-xs text-neutral-400">
            Adjust filters and view density for the master player table.
          </p>
        </div>

        {/* Compact toggle */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-neutral-400">Compact View</span>
          <button
            type="button"
            onClick={() => setCompactMode((prev) => !prev)}
            className={`flex h-5 w-10 items-center rounded-full border px-0.5 transition ${
              compactMode
                ? "bg-neutral-800 border-neutral-600"
                : "bg-emerald-500/80 border-emerald-300"
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-white shadow transform transition ${
                compactMode ? "translate-x-0" : "translate-x-5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Filter buttons row */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 text-xs">
        {/* Team filter */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-neutral-500">
            Team
          </span>
          <select
            className="h-9 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            {allTeams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        {/* Position filter */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-neutral-500">
            Position
          </span>
          <select
            className="h-9 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            {allPositions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Rounds filter */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-neutral-500">
            Rounds
          </span>
          <select
            className="h-9 rounded-full border border-neutral-700 bg-neutral-900 px-3 text-neutral-100 shadow-inner"
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
          >
            {allRoundOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Stats filter with greyed-out premium options */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-neutral-500">
            Stat Type
          </span>
          <select
            className="h-9 rounded-full border border-yellow-500/40 bg-neutral-900 px-3 text-neutral-100 shadow-inner"
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value)}
          >
            {statOptions.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.premium && !premiumUser}
              >
                {opt.label}
                {opt.premium ? " (Neeko+)" : ""}
              </option>
            ))}
          </select>
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
                  <th key={label} className="px-3 py-2 text-right">
                    {label}
                  </th>
                ))}
              <th className="px-3 py-2 text-right">Low%+</th>
              <th className="px-3 py-2 text-right">Mid%+</th>
              <th className="px-3 py-2 text-right">High%+</th>
              <th className="px-3 py-2 text-right">Min</th>
              <th className="px-3 py-2 text-right">Max</th>
              <th className="px-3 py-2 text-right">Avg</th>
            </tr>
          </thead>

          <tbody>
            {masterData.map((p, index) => {
              const isLockedRow = !premiumUser && index >= freeMasterRows;
              const { pLow, pMid, pHigh } = computePerc(p.rounds, selectedStat);
              const min = Math.min(...p.rounds);
              const max = Math.max(...p.rounds);
              const avg = Math.round(
                p.rounds.reduce((s, v) => s + v, 0) / p.rounds.length
              );

              return (
                <Fragment key={p.id}>
                  <tr
                    className={`border-b border-neutral-900/80 transition-colors ${
                      isLockedRow
                        ? "opacity-60 blur-md"
                        : compareMode
                        ? "hover:bg-neutral-900/70"
                        : "hover:bg-neutral-900/60"
                    }`}
                  >
                    <td
                      className="cursor-pointer px-3 py-2 align-middle text-neutral-100"
                      onClick={() => toggleRow(p.id)}
                    >
                      <span className="mr-1 text-xs text-neutral-500">
                        {expandedRows[p.id] ? "▼" : "▶"}
                      </span>
                      {isLockedRow && <LockIcon />}
                      <span className="font-medium">{p.name}</span>
                    </td>
                    <td className="px-3 py-2 align-middle text-neutral-300">
                      {p.pos}
                    </td>
                    <td className="px-3 py-2 align-middle text-neutral-400">
                      {p.team}
                    </td>

                    {!compactMode &&
                      p.rounds.map((value, idx) => (
                        <td
                          key={idx}
                          className="px-3 py-2 align-middle text-right tabular-nums text-neutral-200"
                        >
                          {value}
                        </td>
                      ))}

                    <td className="px-3 py-2 align-middle">
                      <PercentCell value={pLow} />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <PercentCell value={pMid} />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <PercentCell value={pHigh} />
                    </td>

                    <td className="px-3 py-2 align-middle text-right tabular-nums text-neutral-200">
                      {min}
                    </td>
                    <td className="px-3 py-2 align-middle text-right tabular-nums text-neutral-200">
                      {max}
                    </td>
                    <td className="px-3 py-2 align-middle text-right tabular-nums text-neutral-100">
                      {avg}
                    </td>
                  </tr>

                  {expandedRows[p.id] && (
                    <tr className="border-b border-neutral-900/80 bg-neutral-950/90">
                      <td colSpan={20} className="px-4 py-4">
                        <div className="flex flex-col gap-4 md:flex-row">
                          <div className="md:w-1/2">
                            <h4 className="mb-2 text-xs font-semibold text-neutral-200">
                              Recent Trend
                            </h4>
                            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-3">
                              <Sparkline />
                            </div>
                          </div>
                          <div className="md:w-1/2">
                            <h4 className="mb-2 text-xs font-semibold text-neutral-200">
                              AI Form Notes
                            </h4>
                            <p className="text-xs text-neutral-300">
                              Form line shows meaningful shifts across the last few
                              rounds. AI expects role, usage and scoring volatility
                              to stabilise if team roles remain consistent.
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
        <div className="pointer-events-none absolute inset-x-0 top-32 bottom-0 bg-gradient-to-b from-transparent via-neutral-950/88 to-black/98 backdrop-blur-2xl flex items-start justify-center pt-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 text-black px-4 py-1 text-xs font-semibold shadow-2xl">
            <LockIcon />
            <span>Unlock with Neeko+</span>
          </div>
        </div>
      )}

      <div
        ref={loadMoreRef}
        className="py-4 text-center text-[11px] text-neutral-500 relative z-10"
      >
        Loading more rows…
      </div>
    </div>
  );

  // ────────────────────────────────────────────────
  // Page shell
  // ────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <div className="mb-4 flex items-center justify-between">
        <Button className="bg-transparent px-0 text-sm text-neutral-300 hover:bg-transparent hover:text-neutral-100">
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
      <MasterTable />
    </div>
  );
}
