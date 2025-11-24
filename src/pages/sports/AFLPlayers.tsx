// AFLPlayers.tsx — Fully corrected file
// Fix for SyntaxError at (170:0): Added missing closing </span>, </li>, </ul>, </div>, table cells, and ensured all JSX blocks are properly closed.
// This version compiles with no unexpected tokens.

import { useState } from "react";

// ---- STUB COMPONENTS (replace with real app imports later) ----
const Button = ({ children, onClick }) => (
  <button onClick={onClick} className="px-3 py-2 bg-neutral-800 rounded text-white">{children}</button>
);
const ArrowLeft = () => <span>{"<-"}</span>;

const Sparkline = () => (
  <svg width="80" height="24">
    <polyline
      fill="none"
      stroke="#10b981"
      strokeWidth="2"
      points="0,18 15,10 30,6 45,12 60,8 75,4"
    />
  </svg>
);

const BlurOverlay = () => (
  <div className="absolute inset-0 backdrop-blur-md bg-black/40 rounded-xl flex items-center justify-center">
    <div className="text-yellow-300 text-sm font-semibold">Neeko+ Required</div>
  </div>
);

function useAuth() {
  return { isPremium: false };
}

const Shimmer = () => (
  <div className="w-full h-3 rounded bg-neutral-800 animate-pulse" />
);

// ---- MAIN COMPONENT ----
export default function AFLPlayers() {
  const { isPremium } = useAuth();
  const premiumUser = isPremium ?? false;

  const [loading] = useState(false);
  const [selectedStat, setSelectedStat] = useState("disposals");
  const [compareMode, setCompareMode] = useState(false);

  // ---- Dummy Data ----
  const masterData = Array.from({ length: 10 }).map((_, idx) => ({
    id: idx + 1,
    name: `Player ${idx + 1}`,
    pos: idx % 2 ? "MID" : "FWD",
    team: idx % 2 ? "ESS" : "COLL",
    rounds: [30, 28, 26, 25, 29, 27],
    isPremiumRow: idx >= 5,
  }));

  const topPerformers = Array.from({ length: 5 }).map((_, i) => ({
    name: `Top Player ${i + 1}`,
    team: i % 2 ? "ESS" : "COLL",
    stat: 25 + i,
    isPremiumRow: i >= 2,
  }));

  const bottomPerformers = Array.from({ length: 5 }).map((_, i) => ({
    name: `Low Player ${i + 1}`,
    team: i % 2 ? "SYD" : "CARL",
    stat: 5 + i,
    isPremiumRow: i >= 2,
  }));

  const aiTrends = Array.from({ length: 8 }).map((_, i) => ({
    text: `Player trend insight ${i + 1}`,
    pct: i % 2 ? 14 + i : -(10 + i),
    up: i % 2 === 0,
    isPremiumRow: i >= 3,
  }));

  // ---- Table Logic ----
  const STAT_THRESHOLDS = {
    disposals: { low: 15, mid: 20, high: 25 },
    goals: { low: 1, mid: 2, high: 3 },
    fantasy: { low: 80, mid: 100, high: 120 },
  };

  function computePercentages(values, type) {
    const t = STAT_THRESHOLDS[type] || STAT_THRESHOLDS.disposals;
    const played = values.filter((v) => v !== null && v !== undefined);
    const g = played.length;
    if (!g) return { p80: 0, p90: 0, p100: 0 };
    return {
      p80: Math.round((played.filter((v) => v >= t.low).length / g) * 100),
      p90: Math.round((played.filter((v) => v >= t.mid).length / g) * 100),
      p100: Math.round((played.filter((v) => v >= t.high).length / g) * 100),
    };
  }

  function getColor(p) {
    if (p >= 80) return "bg-emerald-500";
    if (p >= 60) return "bg-lime-400";
    if (p >= 40) return "bg-amber-400";
    return "bg-red-500";
  }

  const PercentCell = ({ value }) => (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-10 bg-neutral-800 rounded overflow-hidden">
        <div
          className={`h-full ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-neutral-200">{value}%</span>
    </div>
  );

  // ---- MASTER TABLE ----
  const MasterTable = () => (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-neutral-400 text-sm">Stat Type:</span>
          <select
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded p-2 text-sm"
          >
            <option value="disposals">Disposals</option>
            <option value="goals">Goals</option>
            <option value="fantasy">Fantasy</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={compareMode}
            onChange={() => setCompareMode(!compareMode)}
          />
          Compare Mode
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="p-2">Player</th>
              <th className="p-2">Pos</th>
              <th className="p-2">Team</th>
              <th className="p-2">Trend</th>
              {masterData[0].rounds.map((_, i) => (
                <th key={i} className="p-2">R{i + 1}</th>
              ))}
              <th className="p-2">80%+</th>
              <th className="p-2">90%+</th>
              <th className="p-2">100%+</th>
            </tr>
          </thead>

          <tbody>
            {masterData.map((p) => {
              const locked = !premiumUser && p.isPremiumRow;
              const { p80, p90, p100 } = computePercentages(p.rounds, selectedStat);

              return (
                <tr key={p.id} className="border-b border-neutral-800 relative">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.pos}</td>
                  <td className="p-2">{p.team}</td>
                  <td className="p-2"><Sparkline /></td>

                  {p.rounds.map((r, i) => (
                    <td key={i} className={locked ? "p-2 blur-sm" : "p-2"}>{r}</td>
                  ))}

                  <td className="p-2"><PercentCell value={p80} /></td>
                  <td className="p-2"><PercentCell value={p90} /></td>
                  <td className="p-2"><PercentCell value={p100} /></td>

                  {locked && (
                    <td className="p-2 relative">
                      <BlurOverlay />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ---- PAGE RETURN ----
  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <Button><ArrowLeft /> Back</Button>

      {/* TOP + BOTTOM PERFORMERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {/* Top Performers */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 relative">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">🔥 Running Hot</h2>
          <ul className="space-y-2">
            {topPerformers.map((p, i) => (
              <li key={i} className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2">
                  <span className="text-emerald-400">🔥</span>
                  {p.name} — {p.team}
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-2 w-12 bg-neutral-800 rounded overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${p.stat}%` }} />
                  </div>
                  {p.stat}
                </span>
              </li>
            ))}
          </ul>
          {!premiumUser && <BlurOverlay />}
        </div>

        {/* Bottom Performers */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 relative">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">❄️ Going Cold</h2>
          <ul className="space-y-2">
            {bottomPerformers.map((p, i) => (
              <li key={i} className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2">
                  <span className="text-blue-300">❄️</span>
                  {p.name} — {p.team}
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-2 w-12 bg-neutral-800 rounded overflow-hidden">
                    <div className="bg-blue-400 h-full" style={{ width: `${p.stat}%` }} />
                  </div>
                  {p.stat}
                </span>
              </li>
            ))}
          </ul>
          {!premiumUser && <BlurOverlay />}
        </div>
      </div>

      {/* AI TRENDS */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mt-8 relative">
        <h2 className="text-lg font-semibold mb-3">AI Trend Insights</h2>
        <ul className="divide-y divide-neutral-800">
          {aiTrends.map((t, i) => (
            <li key={i} className="flex justify-between py-2 text-sm items-center">
              <span>{t.text}</span>
              <span className={t.up ? "text-emerald-400" : "text-red-400"}>{t.pct}%</span>
            </li>
          ))}
        </ul>
        <div className="text-right mt-3">
          <a href="#" className="text-sm text-yellow-400 hover:underline">View full AI analysis →</a>
        </div>
        {!premiumUser && <BlurOverlay />}
      </div>

      {/* MASTER TABLE */}
      {loading ? (
        <div className="mt-6"><Shimmer /></div>
      ) : (
        <MasterTable />
      )}
    </div>
  );
}

