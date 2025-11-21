import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/lib/auth";

import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import NeekoPlusPurchase from "@/pages/NeekoPlusPurchase";
import Account from "@/pages/Account";
import Billing from "@/pages/Billing";
import About from "@/pages/About";
import Socials from "@/pages/Socials";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import Admin from "@/pages/Admin";
import AdminQueue from "@/pages/AdminQueue";
import Success from "@/pages/Success";
import Cancel from "@/pages/Cancel";
import CreatePassword from "@/pages/CreatePassword";
import NotFound from "@/pages/NotFound";

import Policies from "@/pages/policies/Policies";
import PrivacyPolicy from "@/pages/policies/PrivacyPolicy";
import RefundPolicy from "@/pages/policies/RefundPolicy";
import SecurityPolicy from "@/pages/policies/SecurityPolicy";
import TermsConditions from "@/pages/policies/TermsConditions";
import UserConductPolicy from "@/pages/policies/UserConductPolicy";

import AFLHub from "@/pages/sports/AFLHub";
import AFLPlayers from "@/pages/sports/AFLPlayers";
import AFLTeams from "@/pages/sports/AFLTeams";
import AFLCompleteAIAnalysis from "@/pages/sports/AFLCompleteAIAnalysis";
import AFLMatchCentre from "@/pages/sports/AFLMatchCentre";

import EPLHub from "@/pages/sports/EPLHub";
import EPLPlayers from "@/pages/sports/EPLPlayers";
import EPLTeams from "@/pages/sports/EPLTeams";
import EPLCompleteAIAnalysis from "@/pages/sports/EPLCompleteAIAnalysis";
import EPLMatchCentre from "@/pages/sports/EPLMatchCentre";

import NBAHub from "@/pages/sports/NBAHub";
import NBAPlayers from "@/pages/sports/NBAPlayers";
import NBATeams from "@/pages/sports/NBATeams";
import NBACompleteAIAnalysis from "@/pages/sports/NBACompleteAIAnalysis";
import NBAMatchCentre from "@/pages/sports/NBAMatchCentre";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth page WITHOUT layout */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/create-password" element={<CreatePassword />} />

        {/* Home */}
        <Route path="/" element={<Layout><Index /></Layout>} />

        {/* Core Pages */}
        <Route path="/neeko-plus" element={<Layout><NeekoPlusPurchase /></Layout>} />
        <Route path="/account" element={<Layout><Account /></Layout>} />
        <Route path="/billing" element={<Layout><Billing /></Layout>} />
        <Route path="/success" element={<Layout><Success /></Layout>} />
        <Route path="/cancel" element={<Layout><Cancel /></Layout>} />

        {/* Info Pages */}
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/socials" element={<Layout><Socials /></Layout>} />
        <Route path="/faq" element={<Layout><FAQ /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />

        {/* Policy Pages */}
        <Route path="/policies" element={<Layout><Policies /></Layout>} />
        <Route path="/policies/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/policies/refund" element={<Layout><RefundPolicy /></Layout>} />
        <Route path="/policies/security" element={<Layout><SecurityPolicy /></Layout>} />
        <Route path="/policies/terms" element={<Layout><TermsConditions /></Layout>} />
        <Route path="/policies/user-conduct" element={<Layout><UserConductPolicy /></Layout>} />

        {/* Admin Pages */}
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
        <Route path="/admin/queue" element={<Layout><AdminQueue /></Layout>} />

        {/* AFL Routes */}
        <Route path="/sports/afl" element={<Layout><AFLHub /></Layout>} />
        <Route path="/sports/afl/players" element={<Layout><AFLPlayers /></Layout>} />
        <Route path="/sports/afl/teams" element={<Layout><AFLTeams /></Layout>} />
        <Route path="/sports/afl/ai-analysis" element={<Layout><AFLCompleteAIAnalysis /></Layout>} />
        <Route path="/sports/afl/match-centre" element={<Layout><AFLMatchCentre /></Layout>} />

        {/* EPL Routes */}
        <Route path="/sports/epl" element={<Layout><EPLHub /></Layout>} />
        <Route path="/sports/epl/players" element={<Layout><EPLPlayers /></Layout>} />
        <Route path="/sports/epl/teams" element={<Layout><EPLTeams /></Layout>} />
        <Route path="/sports/epl/ai-analysis" element={<Layout><EPLCompleteAIAnalysis /></Layout>} />
        <Route path="/sports/epl/match-centre" element={<Layout><EPLMatchCentre /></Layout>} />

        {/* NBA Routes */}
        <Route path="/sports/nba" element={<Layout><NBAHub /></Layout>} />
        <Route path="/sports/nba/players" element={<Layout><NBAPlayers /></Layout>} />
        <Route path="/sports/nba/teams" element={<Layout><NBATeams /></Layout>} />
        <Route path="/sports/nba/ai-analysis" element={<Layout><NBACompleteAIAnalysis /></Layout>} />
        <Route path="/sports/nba/match-centre" element={<Layout><NBAMatchCentre /></Layout>} />

        {/* 404 */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
