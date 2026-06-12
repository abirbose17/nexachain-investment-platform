import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import Layout           from "./components/layout/Layout";
import LoginPage        from "./pages/LoginPage";
import RegisterPage     from "./pages/RegisterPage";
import DashboardPage    from "./pages/DashboardPage";
import InvestmentsPage  from "./pages/InvestmentsPage";
import ROIHistoryPage   from "./pages/ROIHistoryPage";
import ReferralsPage    from "./pages/ReferralsPage";
import ReferralTreePage from "./pages/ReferralTreePage";

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        <Route path="/dashboard"     element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/investments"   element={<AppLayout><InvestmentsPage /></AppLayout>} />
        <Route path="/roi-history"   element={<AppLayout><ROIHistoryPage /></AppLayout>} />
        <Route path="/referrals"     element={<AppLayout><ReferralsPage /></AppLayout>} />
        <Route path="/referral-tree" element={<AppLayout><ReferralTreePage /></AppLayout>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
