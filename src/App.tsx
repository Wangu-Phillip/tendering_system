import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import authService, { AuthUser } from "@/firebase/auth";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";

// Public Pages
import LoginPage from "./pages/public/LoginPage";
import CreateAccountPage from "./pages/public/CreateAccountPage";
import ContactPage from "./pages/public/ContactPage";
import NotFoundPage from "./pages/public/NotFoundPage";

// Admin Pages
import AdminPage from "./pages/admin/AdminPage";

// Vendor Pages
import BidderDashboard from "./pages/vendor/BidderDashboard";

// Buyer Pages
import ProcurementEntityDashboard from "./pages/buyer/ProcurementEntityDashboard";

// Shared Pages
import DashboardPage from "./pages/shared/DashboardPage";
import TendersPage from "./pages/shared/TendersPage";
import TenderDetailPage from "./pages/shared/TenderDetailPage";
import BidsPage from "./pages/shared/BidsPage";
import BidDetailPage from "./pages/shared/BidDetailPage";
import ProfilePage from "./pages/shared/ProfilePage";
import AnalyticsPage from "./pages/shared/AnalyticsPage";

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(
      (user: AuthUser | null) => {
        setCurrentUser(user);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get the appropriate dashboard based on user role
  const getDashboardComponent = () => {
    switch (currentUser?.role) {
      case "vendor":
        return <BidderDashboard />;
      case "buyer":
        return <ProcurementEntityDashboard />;
      case "admin":
        return <Navigate to="/admin" replace />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AuthProvider
      currentUser={currentUser}
      loading={loading}
      userRole={currentUser?.role}
    >
      <Router>
        <Routes>
          {/* Public Routes - Accessible to everyone */}
          <Route
            path="/"
            element={
              currentUser ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage />
              )
            }
          />
          <Route
            path="/login"
            element={
              currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />
            }
          />
          <Route
            path="/register"
            element={
              currentUser ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <CreateAccountPage />
              )
            }
          />
          <Route path="/contact" element={<ContactPage />} />

          {/* Admin Routes */}
          <Route
            element={<ProtectedRoute user={currentUser} requiredRole="admin" />}
          >
            <Route path="/admin/*" element={<AdminPage />} />
          </Route>

          {/* Protected Routes - Require authentication */}
          <Route element={<ProtectedRoute user={currentUser} />}>
            <Route element={<Layout user={currentUser} />}>
              {/* Role-based Dashboard */}
              <Route
                path="/dashboard"
                element={
                  currentUser ? getDashboardComponent() : <DashboardPage />
                }
              />

              {/* Shared Pages */}
              <Route path="/tenders" element={<TendersPage />} />
              <Route path="/tenders/:id" element={<TenderDetailPage />} />
              <Route path="/bids" element={<BidsPage />} />
              <Route path="/bids/:id" element={<BidDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Role-specific Pages */}
              {currentUser?.role === "buyer" && (
                <Route path="/analytics" element={<AnalyticsPage />} />
              )}
            </Route>
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
