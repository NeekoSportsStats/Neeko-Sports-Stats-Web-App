// src/pages/sports/afl/AFLPlayers.tsx
import React, { useEffect, useState } from "react";

import RoundSummary from "@/components/afl/players/RoundSummary";
import FormStabilityGrid from "@/components/afl/players/FormStabilityGrid";
import PositionTrends from "@/components/afl/players/PositionTrends";
import AIInsights from "@/components/afl/players/AIInsights";
import MasterTable from "@/components/afl/players/MasterTable"; // ⭐ NEW

export default function AFLPlayersPage() {
  const [activeSection, setActiveSection] = useState("round-momentum");

  /** 🔥 SCROLL-SPY LOGIC */
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
        rootMargin: "-20% 0px -30% 0px",
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /** ⭐ Glow class */
  const glow =
    "bg-yellow-500/10 text-yellow-400 border-yellow-400 shadow-[0_0_18px_rgba(255,215,0,0.35)]";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* PAGE HEADER */}
      <header className="mb-7 md:mb-9">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          AFL Player Performance Dashboard
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-white/70 leading-relaxed">
          League-wide momentum, fantasy analytics, player trends, stability
          metrics, role intelligence, predictive insights and full-season
          ledgers — all in one AFL dashboard.
        </p>
      </header>

      {/* SELECTOR BAR */}
      <div className="mb-10 rounded-xl border border-white/10 bg-white/5 px-4 py-5 backdrop-blur-sm">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45 mb-3">
          Sections
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">

          {/* Round Momentum */}
          <a
            href="#round-momentum"
            className={`
              rounded-full border border-white/15 bg-white/5
              px-3.5 py-1.5 text-xs font-medium transition-all
              ${activeSection === "round-momentum"
                ? glow
                : "text-white/75 hover:bg-white/10 hover:text-white"}
            `}
          >
            Round Momentum
          </a>

          {/* Form Stability */}
          <a
            href="#form-stability"
            className={`
              rounded-full border border-white/15 bg-white/5
              px-3.5 py-1.5 text-xs font-medium transition-all
              ${activeSection === "form-stability"
                ? glow
                : "text-white/75 hover:bg-white/10 hover:text-white"}
            `}
          >
            Form Stability
          </a>

          {/* Position Trends */}
          <a
            href="#position-trends"
            className={`
              rounded-full border border-white/15 bg-white/5
              px-3.5 py-1.5 text-xs font-medium transition-all
              ${activeSection === "position-trends"
                ? glow
                : "text-white/75 hover:bg-white/10 hover:text-white"}
            `}
          >
            Position Trends
          </a>

          {/* AI Insights */}
          <a
            href="#ai-insights"
            className={`
              rounded-full border border-white/15 bg-white/5
              px-3.5 py-1.5 text-xs font-medium transition-all
              ${activeSection === "ai-insights"
                ? glow
                : "text-white/75 hover:bg-white/10 hover:text-white"}
            `}
          >
            AI Insights
          </a>

          {/* Master Table */}
          <a
            href="#master-table"
            className={`
              rounded-full border border-white/15 bg-white/5
              px-3.5 py-1.5 text-xs font-medium transition-all
              ${activeSection === "master-table"
                ? glow
                : "text-white/75 hover:bg-white/10 hover:text-white"}
            `}
          >
            Master Table
          </a>
        </div>
      </div>

      {/* ALL SECTIONS */}
      <div className="space-y-16">
        {/* SECTION 1 — Round Momentum */}
        <section id="round-momentum" className="scroll-mt-24">
          <RoundSummary />
        </section>

        {/* SECTION 2 — Form Stability */}
        <section id="form-stability" className="scroll-mt-24">
          <FormStabilityGrid />
        </section>

        {/* SECTION 3 — Position Trends */}
        <section id="position-trends" className="scroll-mt-24">
          <PositionTrends />
        </section>

        {/* SECTION 4 — AI Insights */}
        <section id="ai-insights" className="scroll-mt-24">
          <AIInsights />
        </section>

        {/* SECTION 5 — Master Table */}
        <section id="master-table" className="scroll-mt-24">
          <MasterTable />
        </section>
      </div>
    </div>
  );
}
