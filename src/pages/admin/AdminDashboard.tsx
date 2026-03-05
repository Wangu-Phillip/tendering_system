import { useState } from "react";
import { Users, TrendingUp, AlertCircle, Search, Filter } from "lucide-react";

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const systemStats = [
    { label: "Total Users", value: "245", icon: Users, color: "text-primary" },
    {
      label: "Active Tenders",
      value: "18",
      icon: TrendingUp,
      color: "text-secondary",
    },
    {
      label: "Total Bids",
      value: "342",
      icon: AlertCircle,
      color: "text-success",
    },
    {
      label: "Contracts Awarded",
      value: "28",
      icon: TrendingUp,
      color: "text-warning",
    },
  ];

  const recentUsers = [
    {
      id: 1,
      name: "Acme Corporation",
      email: "info@acme.com",
      role: "buyer",
      registeredDate: "2026-03-01",
      status: "active",
    },
    {
      id: 2,
      name: "ABC Supplies Ltd",
      email: "contact@abcsupplies.com",
      role: "vendor",
      registeredDate: "2026-03-02",
      status: "active",
    },
    {
      id: 3,
      name: "Tech Design Co",
      email: "hello@techdesign.com",
      role: "vendor",
      registeredDate: "2026-03-03",
      status: "active",
    },
    {
      id: 4,
      name: "Global Services Inc",
      email: "admin@globalservices.com",
      role: "buyer",
      registeredDate: "2026-03-04",
      status: "pending",
    },
  ];

  const systemLogs = [
    {
      id: 1,
      action: "User Registration",
      user: "ABC Supplies Ltd",
      timestamp: "2026-03-05 10:30 AM",
      status: "success",
    },
    {
      id: 2,
      action: "Tender Published",
      user: "Acme Corporation",
      timestamp: "2026-03-05 09:15 AM",
      status: "success",
    },
    {
      id: 3,
      action: "Bid Submission",
      user: "Tech Design Co",
      timestamp: "2026-03-05 08:45 AM",
      status: "success",
    },
    {
      id: 4,
      action: "User Suspended",
      user: "Unknown Vendor",
      timestamp: "2026-03-04 02:20 PM",
      status: "warning",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System Management & Monitoring</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {systemStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {stat.value}
                  </p>
                </div>
                <Icon className={`${stat.color}`} size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">
              User Management
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <button className="p-2 border rounded-lg hover:bg-light transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Organization Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-light transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-xs font-semibold capitalize">
                      {user.role === "buyer" ? "Procurement Entity" : "Bidder"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {user.registeredDate}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === "active"
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {user.status === "active" ? "Active" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button className="text-secondary hover:text-blue-700 font-semibold">
                      View
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 font-semibold">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-primary">
            System Activity Logs
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  User/Entity
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {systemLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b hover:bg-light transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        log.status === "success"
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {log.status === "success" ? "Success" : "Warning"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-secondary hover:text-blue-700 font-semibold">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
