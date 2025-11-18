import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";       // ✅ FIXED
import Auth from "@/pages/Auth";
import NeekoPlusPurchase from "@/pages/NeekoPlusPurchase";
import Index from "@/pages/Index";
import { AuthProvider } from "@/lib/auth";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth page WITHOUT layout */}
        <Route path="/auth" element={<Auth />} />

        {/* Home */}
        <Route
          path="/"
          element={
            <Layout>
              <Index />
            </Layout>
          }
        />

        {/* Neeko+ */}
        <Route
          path="/neeko-plus"
          element={
            <Layout>
              <NeekoPlusPurchase />
            </Layout>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;