import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  user: any | null;
}

export default function ProtectedRoute({ user }: ProtectedRouteProps) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
