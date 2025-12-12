import React, { useState } from "react";
import { Search, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayerRow, StatLens } from "./MasterTable";

const PAGE_SIZE = 15;

function cx(...c: Array<string | false | undefined>) {
  return c.filter(Boolean).join(" ");
}

function barGradient(pct: number) {
  if (pct < 30) return "from-red-500 to-orange-400";
  if (pct < 60) return "from-orange-400 to-yellow-400";
  if (pct < 85) return "from-yellow-400 to-emerald-400";
  return "from-emerald-400 to-emerald-500";
}

export default function MasterTableMobile({
  players,
  selectedStat,
  setSelectedStat,
  isPremium,
  onSelectPlayer,
  onRequireUpgrade,
}: {
  players: PlayerRow[];
  selectedStat: StatLens;
  setSelectedStat: (s: StatLens) => void;
  isPremium: boolean;
  onSelectPlayer: (p: PlayerRow) => void;
  onRequireUpgrade: () => void;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = players.slice(0, visible);
  const hasMore = visible < players.length;

  return (
    <div className="mt-6 space-y-4">

      {/* HEADER */}
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

        <p className="mt-1 text-xs text-neutral-400">
          Season-wide output and consistency.
        </p>

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
      </div>

      {/* LIST */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 overflow-hidden">
        {shown.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPlayer(p)}
            className="w-full px-4 py-4 text-left border-b border-neutral-800/60 active:bg-neutral-900/40"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-semibold text-neutral-50">
                  {p.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  {p.team} • {p.role}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[12px] font-semibold text-yellow-200">
                  AVG {p.avg.toFixed(1)}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {p.min}–{p.max}
                </div>
              </div>
            </div>

            {p.hitRates.map((r) => (
              <div key={r.label} className="mb-2">
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>{r.label}</span>
                  <span>{r.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${barGradient(r.value)}`}
                    style={{ width: `${r.value}%` }}
                  />
                </div>
              </div>
            ))}
          </button>
        ))}
      </div>

      {/* SHOW MORE */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            className="rounded-full bg-neutral-900 text-neutral-200"
            onClick={() => {
              if (!isPremium) onRequireUpgrade();
              else setVisible((v) => v + PAGE_SIZE);
            }}
          >
            Show more players
          </Button>
        </div>
      )}
    </div>
  );
}