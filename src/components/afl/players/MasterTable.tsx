import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/* ============================================================
   MOCK DATA
   ============================================================ */

interface Player {
  id: number;
  name: string;
  team: string;
  fantasy: number;
  disposals: number;
  goals: number;
  hit90: number;
  hit100: number;
  hit110: number;
  rounds: number[];
}

const MOCK_PLAYERS: Player[] = Array.from({ length: 60 }).map((_, i) => ({
  id: i + 1,
  name: `Player ${i + 1}`,
  team: ["GEEL", "CARL", "COLL", "ESS", "RICH", "NMFC"][i % 6],
  fantasy: Math.floor(Math.random() * 120),
  disposals: Math.floor(Math.random() * 35),
  goals: Math.floor(Math.random() * 5),
  hit90: Math.floor(Math.random() * 100),
  hit100: Math.floor(Math.random() * 100),
  hit110: Math.floor(Math.random() * 100),
  rounds: Array.from({ length: 10 }).map(() =>
    Math.floor(Math.random() * 120)
  ),
}));

/* ============================================================
   MASTER TABLE
   ============================================================ */

export default function MasterTable() {
  const { isPremium } = useAuth();

  const [lens, setLens] = useState<"fantasy" | "disposals" | "goals">(
    "fantasy"
  );

  const [visibleRows, setVisibleRows] = useState(20);

  const [teamFilter, setTeamFilter] = useState("");
  const [roundFilter, setRoundFilter] = useState("");
  const [search, setSearch] = useState("");

  /* ============================================================
     TEAM & ROUND LISTS (Auto-detected — Option C)
     ============================================================ */
  const uniqueTeams = [...new Set(MOCK_PLAYERS.map((p) => p.team))];
  const roundCount = MOCK_PLAYERS[0]?.rounds?.length || 10;
  const roundLabels = Array.from({ length: roundCount }).map(
    (_, i) => `R${i + 1}`
  );

  /* ============================================================
     FILTERED DATA
     ============================================================ */

  const filteredPlayers = useMemo(() => {
    return MOCK_PLAYERS.filter((p) => {
      if (teamFilter && p.team !== teamFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [teamFilter, search]);

  const visible = filteredPlayers.slice(0, visibleRows);

  const getStatValue = (p: Player) => {
    if (lens === "fantasy") return p.fantasy;
    if (lens === "disposals") return p.disposals;
    return p.goals;
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="w-full mt-10 pb-20 px-2 sm:px-0">
      {/* ============================================================
         FILTER BAR — TEAM | ROUND | SEARCH
         ============================================================ */}
      <div className="flex flex-wrap items-center gap-3 bg-neutral-900/40 border border-neutral-800 rounded-xl px-4 py-3 mb-5">
        {/* TEAM FILTER */}
        <div className="flex items-center gap-2">
          <span className="uppercase text-[10px] tracking-[0.14em] text-neutral-400">
            Team
          </span>

          {isPremium ? (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="
                px-2.5 py-1 text-[11px] rounded-md 
                bg-neutral-900 border border-neutral-700 text-neutral-200
                focus:border-yellow-400 outline-none
              "
            >
              <option value="">All</option>
              {uniqueTeams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : (
            <button
              className="
                px-2.5 py-1 text-[11px] rounded-md 
                bg-neutral-900/60 border border-neutral-700/60 text-neutral-600
                blur-[1px] flex items-center gap-1
              "
            >
              All
              <span className="text-yellow-400 text-[10px]">🔒</span>
            </button>
          )}
        </div>

        {/* ROUND FILTER */}
        <div className="flex items-center gap-2">
          <span className="uppercase text-[10px] tracking-[0.14em] text-neutral-400">
            Round
          </span>

          {isPremium ? (
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="
                px-2.5 py-1 text-[11px] rounded-md 
                bg-neutral-900 border border-neutral-700 text-neutral-200
                focus:border-yellow-400 outline-none
              "
            >
              <option value="">All</option>
              {roundLabels.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <button
              className="
                px-2.5 py-1 text-[11px] rounded-md 
                bg-neutral-900/60 border border-neutral-700/60 text-neutral-600
                blur-[1px] flex items-center gap-1
              "
            >
              All
              <span className="text-yellow-400 text-[10px]">🔒</span>
            </button>
          )}
        </div>

        {/* SEARCH BAR */}
        <div className="ml-auto">
          {isPremium ? (
            <input
              type="text"
              placeholder="Search players…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-40 sm:w-56 px-3 py-1.5 rounded-full
                bg-neutral-900 border border-neutral-700
                text-sm text-neutral-200 placeholder:text-neutral-500
                focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/60
                outline-none transition-all
              "
            />
          ) : (
            <button
              className="
                w-40 sm:w-56 px-3 py-1.5 rounded-full text-left
                bg-neutral-900/60 border border-neutral-700/60
                text-sm text-neutral-600 blur-[1px]
                flex items-center gap-2
              "
            >
              <span className="flex-1">Search players…</span>
              <span className="text-yellow-400 text-xs">🔒</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
         STAT LENS — Fantasy | Disposals | Goals
         ============================================================ */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
        {["fantasy", "disposals", "goals"].map((l) => (
          <button
            key={l}
            onClick={() => setLens(l as any)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              lens === l
                ? "bg-yellow-400 text-black shadow-[0_0_10px_rgba(255,200,0,0.5)]"
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            )}
          >
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>

      {/* ============================================================
         TABLE WRAPPER
         ============================================================ */}
      <div className="overflow-x-auto no-scrollbar border border-neutral-800 rounded-xl">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-900/80 border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">{lens}</th>
              <th className="px-4 py-3">90+</th>
              <th className="px-4 py-3">100+</th>
              <th className="px-4 py-3">110+</th>
            </tr>
          </thead>

          <tbody>
            {visible.map((p, index) => (
              <tr
                key={p.id}
                className={cn(
                  "border-b border-neutral-800",
                  !isPremium && index >= 20 && "blur-[2px]"
                )}
              >
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3">{getStatValue(p)}</td>
                <td className="px-4 py-3">{p.hit90}</td>
                <td className="px-4 py-3">{p.hit100}</td>
                <td className="px-4 py-3">{p.hit110}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ============================================================
         CTA AREA
         ============================================================ */}

      <div className="w-full flex justify-center py-10 relative">
        {/* Premium Lock CTA */}
        {!isPremium && visibleRows >= 20 && (
          <>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-none" />
            <button
              className="
                relative z-10 px-6 py-3 rounded-full
                bg-black/90 border border-yellow-500/20
                text-yellow-300 text-sm font-medium
                shadow-[0_0_20px_rgba(255,200,0,0.25)]
                hover:shadow-[0_0_30px_rgba(255,200,0,0.4)]
                hover:border-yellow-400/40
                transition-all
              "
            >
              Unlock full player ledger
            </button>
          </>
        )}

        {/* Show more rows */}
        {isPremium && visibleRows < filteredPlayers.length && (
          <button
            onClick={() => setVisibleRows((v) => v + 20)}
            className="
              px-6 py-3 rounded-full
              bg-neutral-900 border border-neutral-700
              text-neutral-200 hover:bg-neutral-800 hover:border-yellow-400
              transition-all
            "
          >
            Show 20 more rows
          </button>
        )}
      </div>
    </div>
  );
}
