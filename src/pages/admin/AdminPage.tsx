import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  BookOpen,
  Bot,
} from "lucide-react";
import authService from "@/firebase/auth";
import AdminDashboard from "./AdminDashboard";
import AdminUserManagement from "./AdminUserManagement";
import AdminTenderManagement from "./AdminTenderManagement";
import AdminBidProcessing from "./AdminBidProcessing";
import DocumentEvaluationDashboard from "./DocumentEvaluationDashboard";
import AIBidEvaluationPage from "../buyer/AIBidEvaluationPage";

type AdminView =
  | "dashboard"
  | "users"
  | "tenders"
  | "bids"
  | "evaluations"
  | "ai-evaluation";

export default function AdminPage() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: "Overview",
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      badge: "Manage",
    },
    {
      id: "tenders",
      label: "Tenders",
      icon: FileText,
      badge: "Manage",
    },
    {
      id: "bids",
      label: "Bid Processing",
      icon: BarChart3,
      badge: "Process",
    },
    {
      id: "evaluations",
      label: "Document Analysis",
      icon: BookOpen,
      badge: "AI",
    },
    {
      id: "ai-evaluation",
      label: "AI Bid Evaluation",
      icon: Bot,
      badge: "AI",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-primary text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className={`${!sidebarOpen && "hidden"}`}>
              <h2 className="text-xl font-bold">PPRA Admin</h2>
              <p className="text-sm text-blue-200">Procurement Portal</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as AdminView)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? "bg-white/20 text-white"
                    : "hover:bg-white/10 text-blue-100"
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">
                      {item.badge}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-primary/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-blue-100 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === "dashboard" && <AdminDashboard />}
          {currentView === "users" && <AdminUserManagement />}
          {currentView === "tenders" && <AdminTenderManagement />}
          {currentView === "bids" && <AdminBidProcessing />}
          {currentView === "evaluations" && <DocumentEvaluationDashboard />}
          {currentView === "ai-evaluation" && <AIBidEvaluationPage />}
        </div>
      </div>
    </div>
  );
}
