// AFLPlayers.tsx (Stub Preview Version)
// FULL VALID JSX — ALL TAGS CLOSED — VERCEL-SAFE

/* NOTE:
   This is the complete working stub version.
   - All UI is self-contained
   - No real imports from your project
   - Good for local preview
   - 100% valid JSX
   - Passes Vite build
*/

import { useState, useEffect, useRef, Fragment } from "react";

// UI STUBS ----------------------------------------------------
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

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
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
        return Math.min(value, d + Math.ceil(value / 20));
      });
      frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="tabular-nums">{display}%</span>;
};

const PercentCell = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-12 bg-neutral-800 rounded overflow-hidden">
      <div
        className={`h-full ${percentColor(value)}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
    <AnimatedPercent value={value} />
  </div>
);

// -------------------------------------------------------------
// Main Component
// -------------------------------------------------------------

export default function AFLPlayers() {
  const { isPremium } = useAuth();
  const premiumUser = !!isPremium;

  const [selectedStat, setSelectedStat] = useState("disposals");
  const [compactMode, setCompactMode] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

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

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(40);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((v) => Math.min(v + 40, fullData.length));
        }
      },
      { threshold: 1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fullData.length]);

  const masterData = fullData.slice(0, visibleCount);

  // Sorting for hot/cold lists
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

  const statOptions = [
    { value: "disposals", label: "Disposals" },
    { value: "goals", label: "Goals" },
    { value: "fantasy", label: "Fantasy" },
    { value: "marks", label: "Marks" },
    { value: "tackles", label: "Tackles" },
  ];

  const isStatLocked = (value) =>
    premiumUser ? false : !["disposals", "goals", "fantasy"].includes(value);

  const aiInsights = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    text: `AI insight line ${i + 1} about AFL form trends`,
    value: i % 2 === 0 ? 5 : -3,
  }));

  // -------------------------------------------------------------
  // UI Sections (Hot, Cold, AI, Table)
  // -------------------------------------------------------------

  const TopBottomSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

      {/* Running Hot */}
      <div className="relative rounded-xl border border-emerald-500/40 bg-neutral-900 p-4">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-700/20 px-3 py-1.5">
          <span>🔥 Running Hot</span>
          <span className="text-[11px] text-emerald-200">Top 10</span>
        </div>

        <ul className="space-y-2 text-sm">
          {hotPlayers.map((p, index) => {
            const locked = !premiumUser && index >= freeHotVisible;
            const avg = Math.round(p.rounds.reduce((s, v) => s + v, 0) / p.rounds.length);
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${
                  locked ? "opacity-40 blur-[1px]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {locked && <LockIcon />}
                  <span>{p.name}</span>
                  <span className="text-[11px] text-neutral-400">{p.pos} · {p.team}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkline />
                  <div className="text-xs text-emerald-300 text-right">
                    Avg {avg}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="mt-3 rounded-lg border border-emerald-400/40 bg-neutral-800 px-3 py-2 text-xs">
            <LockIcon />
            Unlock full top-10 with Neeko+
          </div>
        )}
      </div>

      {/* Going Cold */}
      <div className="relative rounded-xl border border-red-500/40 bg-neutral-900 p-4">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/50 bg-red-700/20 px-3 py-1.5">
          <span>❄️ Going Cold</span>
          <span className="text-[11px] text-red-200">Bottom 10</span>
        </div>

        <ul className="space-y-2 text-sm">
          {coldPlayers.map((p, index) => {
            const locked = !premiumUser && index >= freeHotVisible;
            const avg = Math.round(p.rounds.reduce((s, v) => s + v, 0) / p.rounds.length);
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${
                  locked ? "opacity-40 blur-[1px]" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {locked && <LockIcon />}
                  <span>{p.name}</span>
                  <span className="text-[11px] text-neutral-400">{p.pos} · {p.team}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkline />
                  <div className="text-xs text-red-300 text-right">
                    Avg {avg}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="mt-3 rounded-lg border border-red-400/40 bg-neutral-800 px-3 py-2 text-xs">
            <LockIcon />
            Unlock full cold-10 with Neeko+
          </div>
        )}
      </div>
    </div>
  );

  const AIInsightsSection = () => (
    <div className="mt-6 rounded-xl border border-neutral-700 bg-neutral-900 p-4">
      <h2 className="text-lg font-semibold mb-2">🧠 AI Insights</h2>

      <div className="divide-y divide-neutral-800 text-sm">
        {aiInsights.map((item, index) => {
          const locked = !premiumUser && index >= freeAIVisible;
          const arrow = item.value > 0 ? "▲" : "▼";
          const color = item.value > 0 ? "text-emerald-400" : "text-red-400";
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between py-1.5 ${
                locked ? "opacity-40 blur-[1px]" : ""
              }`}
            >
              <span>{item.text}</span>
              <span className={`${color}`}>
                {arrow} {Math.abs(item.value)}%
              </span>
            </div>
          );
        })}
      </div>

      {!premiumUser && (
        <div className="mt-3 rounded-lg border border-yellow-500/30 bg-neutral-800 px-3 py-2 text-xs">
          <LockIcon />
          Unlock all AI trends with Neeko+
        </div>
      )}
    </div>
  );

  const MasterTable = () => (
    <div className="mt-6 rounded-xl border border-yellow-500/30 bg-neutral-950 p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="rounded bg-neutral-900 px-2 py-1 text-xs">
          <option>All Teams</option>
        </select>
        <select className="rounded bg-neutral-900 px-2 py-1 text-xs">
          <option>All Positions</option>
        </select>

        <select className="rounded bg-neutral-900 px-2 py-1 text-xs">
          <option>Season to Date</option>
          <option>Last Round</option>
          <option>Last 3 Rounds</option>
        </select>

        <select
          className="rounded bg-neutral-900 px-2 py-1 text-xs"
          value={selectedStat}
          onChange={(e) => setSelectedStat(e.target.value)}
        >
          {statOptions.map((o) => (
            <option key={o.value} value={o.value} disabled={isStatLocked(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/80">
              <th className="px-2 py-2">Player</th>
              <th className="px-2 py-2">Pos</th>
              <th className="px-2 py-2">Team</th>
              <th className="px-2 py-2 text-right">Low%+</th>
              <th className="px-2 py-2 text-right">Mid%+</th>
              <th className="px-2 py-2 text-right">High%+</th>
              <th className="px-2 py-2 text-right">Min</th>
              <th className="px-2 py-2 text-right">Max</th>
              <th className="px-2 py-2 text-right">Avg</th>
              <th className="px-2 py-2 text-right">Games</th>
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
                    className={`border-b border-neutral-900/80 ${
                      isLockedRow ? "opacity-40" : ""
                    }`}
                  >
                    <td
                      className="cursor-pointer px-2 py-2"
                      onClick={() => toggleRow(p.id)}
                    >
                      <span className="mr-1 text-xs text-neutral-500">
                        {expandedRows[p.id] ? "▼" : "▶"}
                      </span>
                      {isLockedRow && <LockIcon />}
                      {p.name}
                    </td>
                    <td className="px-2 py-2">{p.pos}</td>
                    <td className="px-2 py-2">{p.team}</td>
                    <td className="px-2 py-2 text-right">
                      <PercentCell value={pLow} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <PercentCell value={pMid} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <PercentCell value={pHigh} />
                    </td>
                    <td className="px-2 py-2 text-right">{min}</td>
                    <td className="px-2 py-2 text-right">{max}</td>
                    <td className="px-2 py-2 text-right">{avg}</td>
                    <td className="px-2 py-2 text-right">{p.rounds.length}</td>
                  </tr>

                  {expandedRows[p.id] && (
                    <tr className="border-b border-neutral-900/80 bg-neutral-900/60">
                      <td colSpan={10} className="px-4 py-4">
                        <div className="flex flex-col gap-4 md:flex-row">
                          <div className="md:w-1/2">
                            <h4 className="mb-2 text-xs font-semibold">Trend</h4>
                            <div className="rounded-lg border border-neutral-800 p-3">
                              <Sparkline />
                            </div>
                          </div>
                          <div className="md:w-1/2">
                            <h4 className="mb-2 text-xs font-semibold">
                              AI Form Notes
                            </h4>
                            <p className="text-xs text-neutral-300">
                              Player usage and scoring volatility expected to stabilise.
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
        <div className="mt-3 rounded-lg border border-yellow-500/40 bg-neutral-900 px-3 py-2 text-xs">
          <LockIcon />
          Showing first {freeMasterRows} rows. Unlock full table with Neeko+
        </div>
      )}

      <div ref={loadMoreRef} className="py-4 text-center text-[11px] text-neutral-500">
        Loading more rows…
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // Page shell
  // -------------------------------------------------------------
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      <div className="mb-4 flex items-center justify-between">
        <Button className="bg-transparent px-0">
          <ArrowLeftIcon /> Back
        </Button>
        <span className="text-[11px] uppercase tracking-widest text-neutral-500">
          AFL · Player Stats
        </span>
      </div>

      <h1 className="text-2xl font-bold">AFL Player Stats</h1>
      <p className="text-xs text-neutral-400">
        Master table of player outputs, rolling trends and AI-backed insights.
      </p>

      <TopBottomSection />
      <AIInsightsSection />
      <MasterTable />
    </div>
  );
}
