import { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Search,
  Filter,
  FileText,
  CheckCircle,
  BarChart3,
  UserCheck,
} from "lucide-react";
import adminService, { SystemActivity } from "@/services/adminService";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

interface SystemStats {
  totalUsers: number;
  totalBidders: number;
  totalProcuringEntities: number;
  totalTenders: number;
  totalBids: number;
  totalContracts: number;
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch system stats and activities in parallel
      const [statsData, activitiesData] = await Promise.all([
        adminService.getSystemStats(),
        adminService.getSystemActivities(10),
      ]);

      setStats(statsData);
      setActivities(activitiesData);
    } catch (err) {
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String((err as any).message)
          : "Failed to load dashboard data";
      setError(errorMessage);
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const systemStats = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-blue-50",
    },
    {
      label: "Bidders",
      value: stats?.totalBidders || 0,
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-purple-50",
    },
    {
      label: "Procuring Entities",
      value: stats?.totalProcuringEntities || 0,
      icon: Users,
      color: "text-success",
      bgColor: "bg-green-50",
    },
    {
      label: "Active Tenders",
      value: stats?.totalTenders || 0,
      icon: FileText,
      color: "text-warning",
      bgColor: "bg-amber-50",
    },
    {
      label: "Total Bids",
      value: stats?.totalBids || 0,
      icon: CheckCircle,
      color: "text-info",
      bgColor: "bg-sky-50",
    },
    {
      label: "Awarded Contracts",
      value: stats?.totalContracts || 0,
      icon: BarChart3,
      color: "text-danger",
      bgColor: "bg-red-50",
    },
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        {currentUser && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <UserCheck size={20} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Logged in as:{" "}
                  <span className="font-bold text-blue-900">
                    {currentUser.displayName || currentUser.email}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Role:{" "}
                  <span className="font-bold text-blue-600 uppercase">
                    {currentUser.role || "N/A"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
        <p className="text-gray-600 mt-1">System Overview & Monitoring</p>
      </div>

      {error && <Error message={error} />}

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl border border-gray-200 p-6 transition-all hover:shadow-md`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-bold text-primary mt-3">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg bg-white/50`}>
                  <Icon size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent System Activities */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-primary">
              Recent System Activities
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                />
              </div>
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Entity Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {activity.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {activity.entityType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {activity.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No activities recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
