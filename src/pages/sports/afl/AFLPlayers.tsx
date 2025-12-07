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

  /* 🔥 1. Scroll-Spy Tracking */
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
          if (entry.isIntersecting) setActiveSection(entry.target.id);
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

  /* 🔥 2. Sticky Detection */
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

  /* ✨ Soft Glow (new) */
  const softGlow =
    "bg-yellow-500/10 text-yellow-300 border-yellow-400 shadow-[0_0_28px_8px_rgba(255,210,0,0.22)]";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">

      {/* PAGE HEADER */}
      <header className="mb-7 md:mb-9">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          AFL Player Performance Dashboard
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-white/70 leading-relaxed">
          League-wide momentum, fantasy analytics, player trends, stability metrics, role intelligence,
          predictive insights and full-season ledgers — all in one AFL dashboard.
        </p>
      </header>

      {/* INVISIBLE ANCHOR FOR STICKY LOGIC */}
      <div id="selector-bar" className="h-1 w-full"></div>

      {/* ⭐ STICKY SELECTOR BAR */}
      <div
        className={`
          sticky top-16 z-40 
          rounded-xl border border-white/10 backdrop-blur-sm px-4 py-5 mb-10
          transition-all duration-300
          ${isStuck ? "bg-black/40 shadow-[0_6px_24px_rgba(0,0,0,0.35)]" : "bg-white/5"}
        `}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45 mb-3">
          Sections
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          {/* Buttons */}
          {[
            ["round-momentum", "Round Momentum"],
            ["form-stability", "Form Stability"],
            ["position-trends", "Position Trends"],
            ["ai-insights", "AI Insights"],
            ["master-table", "Master Table"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={`
                rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 
                text-xs font-medium transition-all
                ${
                  activeSection === id
                    ? softGlow
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              {label}
            </a>
          ))}
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
