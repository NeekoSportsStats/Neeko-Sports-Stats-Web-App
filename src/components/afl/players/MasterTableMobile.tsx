import React, { useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { PlayerRow, StatLens } from "./MasterTable";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                           MASTER TABLE – MOBILE                            */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 8;

export default function MasterTableMobile({
  players,
  selectedStat,
  onPlayerSelect,
}: {
  players: PlayerRow[];
  selectedStat: StatLens;
  onPlayerSelect: (player: PlayerRow) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const visiblePlayers = useMemo(
    () => players.slice(0, visibleCount),
    [players, visibleCount]
  );

  const hasMore = visibleCount < players.length;

  return (
    <>
      <section className="space-y-4">
        {/* ---------------- PLAYER ROWS ---------------- */}
        {visiblePlayers.map((p) => (
          <button
            key={p.id}
            onClick={() => onPlayerSelect(p)}
            className="w-full rounded-2xl border border-neutral-800 bg-black/70 px-4 py-4 text-left transition hover:border-neutral-600"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-neutral-100">
                  {p.name}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-neutral-400">
                  {p.team} • {p.role}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-yellow-300">
                  AVG {p.avg.toFixed(1)}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {p.min}–{p.max} • {p.games} gms
                </div>
              </div>
            </div>

            {/* Consistency */}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-neutral-400">
                <span>Consistency</span>
                <span>{p.consistency}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-orange-400"
                  style={{ width: `${p.consistency}%` }}
                />
              </div>
            </div>

            {/* Ceiling */}
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-[11px] text-neutral-400">
                <span>Ceiling</span>
                <span>{p.ceiling}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-lime-400 via-yellow-400 to-amber-400"
                  style={{ width: `${p.ceiling}%` }}
                />
              </div>
            </div>
          </button>
        ))}

        {/* ---------------- SHOW MORE ---------------- */}
        {hasMore && (
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="w-full rounded-xl border border-neutral-700 bg-black/60 py-2.5 text-sm text-neutral-300 transition hover:border-neutral-500"
          >
            Show more players
          </button>
        )}

        {/* ---------------- CTA (MATCHES AIINSIGHTS) ---------------- */}
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="group relative mt-6 w-full rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-yellow-500/0 to-transparent px-5 py-4 text-left"
        >
          <div className="text-[11px] uppercase tracking-[0.18em] text-yellow-200/80">
            Neeko+ Player Suite
          </div>
          <div className="mt-1 text-sm font-semibold text-yellow-100">
            Unlock full player list & advanced trends
          </div>
          <p className="mt-1 text-xs text-neutral-300">
            Access deeper consistency windows, ceiling profiles and AI-driven
            player insights.
          </p>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-yellow-400/50 bg-black/60 shadow-[0_0_14px_rgba(250,204,21,0.6)] transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4 text-yellow-300" />
          </div>
        </button>
      </section>

      {/* ---------------- UPGRADE MODAL (SAFE) ---------------- */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-gradient-to-b from-neutral-950 via-black to-black px-6 py-6">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-black/70 text-neutral-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="text-[10px] uppercase tracking-[0.18em] text-yellow-200/80">
              Neeko+ Upgrade
            </div>

            <h3 className="mt-2 text-xl font-semibold text-neutral-50">
              Unlock full player analysis
            </h3>

            <p className="mt-2 text-sm text-neutral-300">
              Get access to the complete player database, advanced trend
              breakdowns and AI-powered projections.
            </p>

            <a
              href="/neeko-plus"
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 px-4 py-3 text-sm font-semibold text-black shadow-[0_0_28px_rgba(250,204,21,0.8)]"
            >
              Upgrade to Neeko+
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="mt-3 w-full rounded-2xl border border-neutral-700 bg-black/70 py-2.5 text-sm text-neutral-200"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}