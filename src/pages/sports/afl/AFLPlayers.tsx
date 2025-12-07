import React, { useEffect, useState } from "react";

import RoundSummary from "@/components/afl/players/RoundSummary";
import FormStabilityGrid from "@/components/afl/players/FormStabilityGrid";
import PositionTrends from "@/components/afl/players/PositionTrends";
import AIInsights from "@/components/afl/players/AIInsights";
import MasterTable from "@/components/afl/players/MasterTable";

export default function AFLPlayersPage() {
  const [activeSection, setActiveSection] = useState("round-momentum");
  const [isStuck, setIsStuck] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                         1. Scroll Spy + Smooth Nav                         */
  /* -------------------------------------------------------------------------- */

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
        threshold: 0.28,
        rootMargin: "-20% 0px -40% 0px",
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* Smooth scrolling on pill click */
  useEffect(() => {
    const links = document.querySelectorAll("a[href^='#']");

    const handleClick = (e: Event) => {
      e.preventDefault();
      const target = (e.currentTarget as HTMLAnchorElement).getAttribute("href");
      if (!target) return;

      const el = document.querySelector(target);
      if (!el) return;

      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 110,
        behavior: "smooth",
      });
    };

    links.forEach((link) => link.addEventListener("click", handleClick));

    return () =>
      links.forEach((link) => link.removeEventListener("click", handleClick));
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                           2. Sticky Nav Detection                          */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /*                      3. Show “Back to Top” Button                          */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const onScroll = () => {
      setShowTopButton(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                           Premium Glass Styling                            */
  /* -------------------------------------------------------------------------- */

  const sections = [
    { id: "round-momentum", label: "Round Momentum" },
    { id: "form-stability", label: "Form Stability" },
    { id: "position-trends", label: "Position Trends" },
    { id: "ai-insights", label: "AI Insights" },
    { id: "master-table", label: "Master Table" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* PAGE HEADER */}
      <header className="mb-8 md:mb-10 opacity-0 animate-fadeIn">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          AFL Player Performance Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
          League-wide momentum, fantasy analytics, player trends, stability
          metrics, role intelligence, predictive insights and full-season
          ledgers — all in one AFL dashboard.
        </p>
      </header>

      {/* Invisible anchor for sticky logic */}
      <div id="selector-bar" className="h-1 w-full"></div>

      {/* ---------------------------------------------------------------------- */}
      {/*                      PREMIUM NAV — Glass + Glow A1                     */}
      {/* ---------------------------------------------------------------------- */}

      <div
        className={`
          sticky top-16 z-40 transition-all duration-300 mb-10
          ${isStuck ? "scale-[1.012]" : ""}
        `}
      >
        <div
          className={`
            rounded-2xl border backdrop-blur-xl bg-gradient-to-r
            from-yellow-500/10 via-black/80 to-yellow-500/10
            px-4 py-3 md:px-6 md:py-4
            shadow-[0_18px_70px_rgba(0,0,0,0.85)]
            ${
              isStuck
                ? "border-yellow-400/60 shadow-[0_0_40px_rgba(250,204,21,0.55)]"
                : "border-white/10"
            }
          `}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-yellow-200/80">
                Sections
              </div>
              <p className="max-w-xl text-[11px] text-neutral-300/90">
                Navigate between trends, analytics, insights & the full-season ledger.
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

      {/* ---------------------------------------------------------------------- */}
      {/*                            PAGE SECTIONS                               */}
      {/* ---------------------------------------------------------------------- */}

      <div className="space-y-20 md:space-y-24">
        <section id="round-momentum" className="scroll-mt-28 opacity-0 animate-sectionFade">
          <RoundSummary />
        </section>

        <section id="form-stability" className="scroll-mt-28 opacity-0 animate-sectionFade">
          <FormStabilityGrid />
        </section>

        <section id="position-trends" className="scroll-mt-28 opacity-0 animate-sectionFade">
          <PositionTrends />
        </section>

        <section id="ai-insights" className="scroll-mt-28 opacity-0 animate-sectionFade">
          <AIInsights />
        </section>

        <section id="master-table" className="scroll-mt-28 opacity-0 animate-sectionFade">
          <MasterTable />
        </section>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/*                        FLOATING "BACK TO TOP"                          */}
      {/* ---------------------------------------------------------------------- */}

      {showTopButton && (
        <button
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          className="
            fixed bottom-6 right-6 z-50 rounded-full
            bg-yellow-400 px-4 py-2 text-sm font-semibold text-black
            shadow-[0_0_30px_rgba(250,204,21,0.8)]
            hover:bg-yellow-300 transition-all
          "
        >
          Back to Top
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Animations                                  */
/* -------------------------------------------------------------------------- */

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    animate?: string;
  }
}

/* Tailwind animation utilities (add these in your globals or keep here if using safelist) */

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }

  @keyframes sectionFade {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-sectionFade {
    animation: sectionFade 0.6s ease-out forwards;
    animation-delay: 0.15s;
  }
`;
