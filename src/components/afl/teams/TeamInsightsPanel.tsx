// src/components/afl/teams/TeamInsightsPanel.tsx
import React, { useEffect } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { X } from "lucide-react";

// import MODE_CONFIG so mode labels render correctly
import { MODE_CONFIG } from "./TeamMasterTable";

interface TeamInsightsPanelProps {
  onClose: () => void;
  team: any;
  mode: string;
  modeSeries: number[];
  modeSummary: {
    min: number;
    max: number;
    average: number;
    total: number;
  };
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return isMobile;
};

export default function TeamInsightsPanel({
  onClose,
  team,
  mode,
  modeSeries,
  modeSummary,
}: TeamInsightsPanelProps) {
  const isMobile = useIsMobile();
  const controls = useAnimation();

  const teamName = team?.name ?? "Team";
  const teamCode = team?.code ?? "";

  const last8 = modeSeries.slice(-8);
  const last5 = modeSeries.slice(-5);

  const label = MODE_CONFIG[mode]?.label ?? "Scoring";

  // Slide up on mobile
  useEffect(() => {
    if (isMobile) {
      controls.start({
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 28 },
      });
    }
  }, [controls, isMobile]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      controls
        .start({
          y: "100%",
          transition: { type: "spring", stiffness: 260, damping: 30 },
        })
        .then(() => onClose());
    } else {
      controls.start({
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 28 },
      });
    }
  };

  const Content = (
    <div className="flex h-full flex-col bg-black/95 text-neutral-50">
      {/* HEADER */}
      <div className="flex items-start justify-between border-b border-yellow-500/20 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-yellow-400">
            TEAM INSIGHTS
          </p>
          <h2 className="mt-1 text-lg font-semibold">{teamName}</h2>
          <p className="text-xs uppercase tracking-widest text-neutral-400">{teamCode}</p>
        </div>

        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-full border border-yellow-500/40 bg-black/60 hover:border-yellow-400 hover:text-yellow-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* MAIN SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Last 8 Window */}
        <section className="rounded-2xl border border-yellow-500/20 bg-black/60 px-4 py-4">
          <div className="flex justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold text-yellow-300 tracking-widest">
                {label} WINDOW
              </p>
              <p className="text-xs text-neutral-400">Last 8 rounds</p>
            </div>
            <p className="text-xl font-semibold text-yellow-300">{modeSummary.average}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {last8.map((v, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full border border-yellow-500/20 bg-black/70 text-sm"
              >
                {v}
              </span>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="rounded-2xl border border-yellow-500/20 bg-black/60 px-4 py-4">
          <p className="text-[11px] font-semibold tracking-widest text-neutral-400 mb-3">
            {label} STATS
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] uppercase text-neutral-500">AVG</p>
              <p className="text-lg font-semibold">{modeSummary.average}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-neutral-500">TOTAL</p>
              <p className="text-lg font-semibold">{modeSummary.total}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-neutral-500">MIN</p>
              <p className="text-lg font-semibold">{modeSummary.min}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-neutral-500">MAX</p>
              <p className="text-lg font-semibold">{modeSummary.max}</p>
            </div>
          </div>

          <p className="mt-4 mb-2 text-[11px] uppercase text-neutral-500">Last 5</p>
          <div className="flex flex-wrap gap-2">
            {last5.map((v, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-neutral-900 text-sm">
                {v}
              </span>
            ))}
          </div>
        </section>

        {/* AI Summary */}
        <section className="rounded-2xl border border-yellow-500/20 bg-black/80 px-4 py-4">
          <p className="text-[11px] text-yellow-300 tracking-widest mb-2">AI SUMMARY</p>
          <p className="text-sm leading-relaxed">
            {team.aiSummary ??
              `${teamName} is showing neutral-positive territory in ${label.toLowerCase()} trends.`}
          </p>
        </section>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {/* BACKDROP */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* MOBILE BOTTOM SHEET */}
      {isMobile ? (
        <motion.div
          className="fixed bottom-0 inset-x-0 z-50"
          initial={{ y: "100%" }}
          animate={controls}
          exit={{ y: "100%" }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={handleDragEnd}
        >
          <div className="mx-auto max-w-xl w-full rounded-t-3xl border border-yellow-500/30 bg-black/95">
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1.5 w-14 bg-neutral-700 rounded-full" />
            </div>
            <div className="max-h-[80vh] overflow-y-auto">{Content}</div>
          </div>
        </motion.div>
      ) : (
        /* DESKTOP SIDE PANEL */
        <motion.div
          className="fixed inset-y-0 right-0 z-50 w-full max-w-md"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
        >
          <div className="h-full bg-black/95 border-l border-yellow-500/30 overflow-hidden">
            {Content}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
