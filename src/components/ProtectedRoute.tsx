import { Navigate, Outlet } from "react-router-dom";
import { AuthUser } from "@/firebase/auth";

interface ProtectedRouteProps {
  user: AuthUser | null;
  requiredRole?: "admin" | "vendor" | "buyer";
}

export default function ProtectedRoute({
  user,
  requiredRole,
}: ProtectedRouteProps) {
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to dashboard for non-admin users trying to access admin routes
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
