// AFLPlayers.tsx — Debug-safe version
// Fix: Removed broken relative imports (../components/ui/button, ../lib/auth).
// Replaced with internal stub components so the file compiles in any environment.
// Once integrated into your real project, restore real imports.

import { useState } from "react";

//--------------------------------------------------
// STUB COMPONENTS (replace with real ones in your app)
//--------------------------------------------------
const Button = ({ children, onClick }) => (
  <button onClick={onClick} className="px-3 py-2 bg-neutral-800 rounded text-white">
    {children}
  </button>
);

const ArrowLeft = () => <span>{"<-"}</span>;

// Auth stub
function useAuth() {
  return { isPremium: false };
}

// Supabase stub
const supabase = {
  from: () => ({ select: () => ({}) }),
};

//--------------------------------------------------
// MAIN PAGE COMPONENT
//--------------------------------------------------
export default function AFLPlayers() {
  const [loading] = useState(false);
  const [selectedStat, setSelectedStat] = useState("disposals");
  const { isPremium } = useAuth();
  const premiumUser = isPremium ?? false;

  //--------------------------------------------------
  // DUMMY DATA
  //--------------------------------------------------
  const masterData = Array.from({ length: 10 }).map((_, idx) => ({
    id: idx + 1,
    name: `Player ${idx + 1}`,
    pos: idx % 2 ? "MID" : "FWD",
    team: idx % 2 ? "ESS" : "COLL",
    rounds: [30, 28, 26, 25, 29, 27],
    isPremiumRow: idx >= 5,
  }));

  //--------------------------------------------------
  // THRESHOLDS
  //--------------------------------------------------
  const STAT_THRESHOLDS = {
    disposals: { low: 15, mid: 20, high: 25 },
    goals: { low: 1, mid: 2, high: 3 },
    fantasy: { low: 80, mid: 100, high: 120 },
  };

  function computePercentages(values, type) {
    const t = STAT_THRESHOLDS[type] || STAT_THRESHOLDS.disposals;
    const played = values.filter((v) => v !== null && v !== undefined);
    const games = played.length;
    if (!games) return { p80: 0, p90: 0, p100: 0 };
    return {
      p80: Math.round((played.filter((v) => v >= t.low).length / games) * 100),
      p90: Math.round((played.filter((v) => v >= t.mid).length / games) * 100),
      p100: Math.round((played.filter((v) => v >= t.high).length / games) * 100),
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
        <div className={`h-full ${getColor(value)}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-neutral-200">{value}%</span>
    </div>
  );

  //--------------------------------------------------
  // MASTER TABLE
  //--------------------------------------------------
  const MasterTable = () => (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 mt-6">
      <div className="flex items-center gap-3 mb-4">
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="p-2">Player</th>
              <th className="p-2">Pos</th>
              <th className="p-2">Team</th>
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
                <tr key={p.id} className="border-b border-neutral-800">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.pos}</td>
                  <td className="p-2">{p.team}</td>
                  {p.rounds.map((r, i) => (
                    <td key={i} className={locked ? "p-2 blur-sm" : "p-2"}>{r}</td>
                  ))}
                  <td className="p-2"><PercentCell value={p80} /></td>
                  <td className="p-2"><PercentCell value={p90} /></td>
                  <td className="p-2"><PercentCell value={p100} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  //--------------------------------------------------
  // PAGE RENDER
  //--------------------------------------------------
  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <Button onClick={() => {}}>
        <ArrowLeft /> Back
      </Button>

      <h1 className="text-3xl font-bold mt-4">AFL Player Stats</h1>
      <p className="text-neutral-400 mb-6">Live player metrics, trends & insights</p>

      {loading ? (
        <div className="h-4 w-1/3 bg-neutral-800 animate-pulse rounded" />
      ) : (
        <MasterTable />
      )}
    </div>
  );
}