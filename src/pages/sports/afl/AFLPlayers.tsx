// src/pages/sports/afl/AFLPlayers.tsx
import React, { useEffect, useState } from "react";

import RoundSummary from "@/components/afl/players/RoundSummary";
import FormStabilityGrid from "@/components/afl/players/FormStabilityGrid";
import PositionTrends from "@/components/afl/players/PositionTrends";
import AIInsights from "@/components/afl/players/AIInsights";
import MasterTable from "@/components/afl/players/MasterTable";

export default function AFLPlayersPage() {
  const [activeSection, setActiveSection] = useState("round-momentum");
  const [isStuck, setIsStuck] = useState(false);

  // Scroll-Spy Tracking
  useEffect(() => {
    const sectionIds = [
      "round-momentum",
      "form-stability",
      "position-trends",
      "ai-insights",
      "master-table",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "-20% 0px -40% 0px",
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Sticky Detection
  useEffect(() => {
    const bar = document.getElementById("selector-bar");
    if (!bar) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 1 }
    );

    obs.observe(bar);
    return () => obs.disconnect();
  }, []);

  const sections: { id: string; label: string }[] = [
    { id: "round-momentum", label: "Round Momentum" },
    { id: "form-stability", label: "Form Stability" },
    { id: "position-trends", label: "Position Trends" },
    { id: "ai-insights", label: "AI Insights" },
    { id: "master-table", label: "Master Table" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* PAGE HEADER */}
      <header className="mb-7 md:mb-9">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          AFL Player Performance Dashboard
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
          League-wide momentum, fantasy analytics, player trends, stability
          metrics, role intelligence, predictive insights and full-season
          ledgers — all in one AFL dashboard.
        </p>
      </header>

      {/* INVISIBLE ANCHOR FOR STICKY LOGIC */}
      <div id="selector-bar" className="h-1 w-full" />

      {/* PREMIUM GLASS SECTIONS NAV */}
      <div
        className={`
          sticky top-16 z-40 mb-10 transition-all duration-300
          ${isStuck ? "scale-[1.01]" : ""}
        `}
      >
        <div
          className={`
            rounded-2xl border px-4 py-3 md:px-6 md:py-4
            backdrop-blur-xl bg-gradient-to-r
            from-yellow-500/10 via-black/80 to-yellow-500/10
            shadow-[0_18px_70px_rgba(0,0,0,0.85)]
            ${
              isStuck
                ? "border-yellow-400/60 shadow-[0_0_40px_rgba(250,204,21,0.55)]"
                : "border-white/12"
            }
          `}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-yellow-200/80">
                Sections
              </div>
              <p className="max-w-xl text-[11px] leading-relaxed text-neutral-300/90">
                Jump between round momentum, stability grids, position trends,
                AI analysis and the full-season ledger — without losing your
                place in the dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              {sections.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`
                    inline-flex items-center rounded-full border px-3.5 py-1.5
                    text-xs font-medium tracking-wide transition-all
                    ${
                      activeSection === id
                        ? "border-yellow-300 bg-yellow-400 text-black shadow-[0_0_26px_rgba(250,204,21,0.9)]"
                        : "border-white/16 bg-black/40 text-neutral-200 hover:border-yellow-400/70 hover:bg-yellow-500/10 hover:text-white"
                    }
                  `}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PAGE SECTIONS */}
      <div className="space-y-16">
        <section id="round-momentum" className="scroll-mt-28">
          <RoundSummary />
        </section>

        <section id="form-stability" className="scroll-mt-28">
          <FormStabilityGrid />
        </section>

        <section id="position-trends" className="scroll-mt-28">
          <PositionTrends />
        </section>

        <section id="ai-insights" className="scroll-mt-28">
          <AIInsights />
        </section>

        <section id="master-table" className="scroll-mt-28">
          <MasterTable />
        </section>
      </div>
    </div>
  );
}
