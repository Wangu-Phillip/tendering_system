import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  User,
  TrendingUp,
  Bot,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import authService from "@/firebase/auth";

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  userRole?: "admin" | "vendor" | "buyer" | null;
}

export default function Sidebar({ isOpen, onToggle, userRole }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getMenuItems = (): MenuItem[] => {
    switch (userRole) {
      case "vendor":
        return [
          {
            label: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            badge: "Home",
          },
          {
            label: "Tenders",
            href: "/tenders",
            icon: FileText,
            badge: "Browse",
          },
          { label: "My Bids", href: "/bids", icon: BarChart3, badge: "Track" },
          { label: "Profile", href: "/profile", icon: User, badge: "Account" },
        ];
      case "buyer":
        return [
          {
            label: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            badge: "Home",
          },
          {
            label: "Tenders",
            href: "/tenders",
            icon: FileText,
            badge: "Manage",
          },
          {
            label: "Bid Submissions",
            href: "/bids",
            icon: BarChart3,
            badge: "Review",
          },
          {
            label: "AI Evaluation",
            href: "/ai-evaluation",
            icon: Bot,
            badge: "AI",
          },
          {
            label: "Analytics",
            href: "/analytics",
            icon: TrendingUp,
            badge: "Insights",
          },
          { label: "Profile", href: "/profile", icon: User, badge: "Account" },
        ];
      case "admin":
        return [
          {
            label: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            badge: "Overview",
          },
          {
            label: "Tenders",
            href: "/tenders",
            icon: FileText,
            badge: "Manage",
          },
          { label: "Bids", href: "/bids", icon: BarChart3, badge: "Process" },
          {
            label: "Analytics",
            href: "/analytics",
            icon: TrendingUp,
            badge: "Insights",
          },
          { label: "Profile", href: "/profile", icon: User, badge: "Account" },
        ];
      default:
        return [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Tenders", href: "/tenders", icon: FileText },
        ];
    }
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case "vendor":
        return { title: "BW Procurement", subtitle: "Bidder Portal" };
      case "buyer":
        return { title: "BW Procurement", subtitle: "Procurement Entity" };
      case "admin":
        return { title: "BW Procurement", subtitle: "Admin Portal" };
      default:
        return { title: "BW Procurement", subtitle: "Portal" };
    }
  };

  const menuItems = getMenuItems();
  const roleInfo = getRoleTitle();
  const isActive = (href: string) => location.pathname === href;

  return (
    <aside
      className={`bg-primary text-white transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      } h-screen flex flex-col`}
    >
      {/* Logo/Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className={`${!isOpen && "hidden"}`}>
            <h2 className="text-xl font-bold">{roleInfo.title}</h2>
            <p className="text-sm text-blue-200">{roleInfo.subtitle}</p>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "bg-white/20 text-white"
                  : "hover:bg-white/10 text-blue-100"
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              {isOpen && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-blue-100 transition-colors"
        >
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
