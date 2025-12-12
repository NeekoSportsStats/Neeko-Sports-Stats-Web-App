import React, { useMemo } from "react";
import { Search, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function hitColour(pct: number) {
  if (pct < 30) return "bg-red-500";
  if (pct < 50) return "bg-yellow-400";
  if (pct < 75) return "bg-lime-400";
  return "bg-green-500";
}

function getRounds(player: PlayerRow, lens: StatLens) {
  if (lens === "Fantasy") return player.roundsFantasy;
  if (lens === "Disposals") return player.roundsDisposals;
  return player.roundsGoals;
}

function computeSummary(player: PlayerRow, lens: StatLens) {
  const v = getRounds(player, lens);
  const total = v.reduce((a, b) => a + b, 0);
  const avg = total / v.length;
  return {
    total,
    avg,
    min: Math.min(...v),
    max: Math.max(...v),
    games: v.length,
  };
}

function computeHitRate(player: PlayerRow, lens: StatLens, threshold: number) {
  const v = getRounds(player, lens);
  return Math.round((v.filter((x) => x >= threshold).length / v.length) * 100);
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function MasterTableMobile({
  players,
  selectedStat,
  setSelectedStat,
  isPremium,
  query,
  setQuery,
  onSelectPlayer,
}: {
  players: PlayerRow[];
  selectedStat: StatLens;
  setSelectedStat: (s: StatLens) => void;
  isPremium: boolean;
  query: string;
  setQuery: (v: string) => void;
  onSelectPlayer: (p: PlayerRow) => void;
}) {
  const sorted = useMemo(() => {
    return [...players].sort(
      (a, b) =>
        computeSummary(b, selectedStat).total -
        computeSummary(a, selectedStat).total
    );
  }, [players, selectedStat]);

  return (
    <div className="mt-6 pb-28">
      {/* ================= HEADER ================= */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-4 py-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
            Master Table
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold text-neutral-50">
          Full-season player trends
        </h3>

        {/* Lens pills */}
        <div className="mt-4 flex gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
          {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStat(s)}
              className={cx(
                "rounded-full px-3 py-1.5",
                selectedStat === s
                  ? "bg-yellow-400 text-black"
                  : "bg-neutral-900 text-neutral-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mt-3">
          {isPremium ? (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-black/70 px-3 py-2">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search players…"
                className="w-full bg-transparent text-[12px] text-neutral-200 placeholder:text-neutral-500 outline-none"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-black/40 px-3 py-2 opacity-60">
              <Lock className="h-4 w-4 text-neutral-500" />
              <span className="text-[12px] text-neutral-500">
                Search is Neeko+ only
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ================= LIST ================= */}
      <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 overflow-hidden">
        {sorted.map((p, idx) => {
          const s = computeSummary(p, selectedStat);
          const consistency = computeHitRate(p, selectedStat, 70);
          const ceiling = computeHitRate(p, selectedStat, 100);
          const blurred = !isPremium && idx >= 20;

          return (
            <button
              key={p.id}
              onClick={() => !blurred && onSelectPlayer(p)}
              className={cx(
                "w-full px-4 py-4 text-left border-t border-neutral-800",
                blurred
                  ? "blur-[3px] brightness-[0.6] pointer-events-none"
                  : "active:bg-neutral-900/40"
              )}
            >
              {/* Header */}
              <div className="flex justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-neutral-50">
                    {p.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {p.team} • {p.role}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[12px] font-semibold text-yellow-200">
                      AVG {s.avg.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {s.min}–{s.max} • {s.games} gms
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-yellow-300" />
                </div>
              </div>

              {/* Bars */}
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-[10px] text-neutral-400">
                    Consistency (70+)
                  </div>
                  <div className="mt-1 h-2 rounded bg-neutral-800">
                    <div
                      className={cx("h-2 rounded", hitColour(consistency))}
                      style={{ width: `${consistency}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-300">
                    {consistency}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-neutral-400">
                    Ceiling (100+)
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-neutral-800">
                    <div
                      className={cx("h-1.5 rounded", hitColour(ceiling))}
                      style={{ width: `${ceiling}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-300">
                    {ceiling}%
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {!isPremium && (
          <div className="px-4 py-6 bg-black/80">
            <Button className="w-full rounded-full bg-yellow-400 text-black">
              Get Neeko+
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}