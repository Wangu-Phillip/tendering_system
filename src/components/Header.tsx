import { Link, useNavigate } from "react-router-dom";
import authService from "@firebase/auth";
import { useState } from "react";

interface HeaderProps {
  user: any | null;
}

export default function Header({ user }: HeaderProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-danger text-white";
      case "vendor":
        return "bg-success text-white";
      case "buyer":
        return "bg-secondary text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "vendor":
        return "Bidder";
      case "buyer":
        return "Procurement Entity";
      default:
        return "User";
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <h1 className="text-2xl font-bold text-primary">BW Procurement</h1>
        </Link>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">{user?.email}</p>
            {user?.role && (
              <span
                className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(user.role)}`}
              >
                {getRoleLabel(user.role)}
              </span>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center"
            >
              {user?.displayName?.charAt(0).toUpperCase() || "U"}
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowMenu(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
