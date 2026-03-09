import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Shield,
  Trash2,
  Eye,
  Lock,
  Unlock,
} from "lucide-react";
import adminService, { User } from "@/services/adminService";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUSers();
  }, [users, searchTerm, filterRole]);

  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === "object" && "message" in err) {
      return String((err as any).message);
    }
    return String(err) || "An error occurred";
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await adminService.getAllUsers();
      setUsers(userData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filterUSers = () => {
    let result = users;

    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.organizationName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (filterRole !== "all") {
      result = result.filter((user) => user.role === filterRole);
    }

    setFilteredUsers(result);
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await adminService.deactivateUser(userId);
      setUsers(
        users.map((u) => (u.uid === userId ? { ...u, isActive: false } : u)),
      );
      setShowModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await adminService.activateUser(userId);
      setUsers(
        users.map((u) => (u.uid === userId ? { ...u, isActive: true } : u)),
      );
      setShowModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    )
      return;

    try {
      await adminService.deleteUser(userId);
      setUsers(users.filter((u) => u.uid !== userId));
      setShowModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleChangeRole = async (
    userId: string,
    newRole: "bidder" | "procurement_entity",
  ) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(
        users.map((u) => (u.uid === userId ? { ...u, role: newRole } : u)),
      );
      setShowModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage all users, roles, and permissions
        </p>
      </div>

      {error && <Error message={error} />}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="all">All Roles</option>
              <option value="bidder">Bidder</option>
              <option value="procurement_entity">Procuring Entity</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Filter size={18} />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Organization
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Registered
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.uid}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.displayName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.organizationName || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                        {user.role === "bidder" ? "Bidder" : "Procuring Entity"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-primary mb-6">
              User Actions
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowModal(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <Eye className="text-secondary" size={20} />
                <div>
                  <p className="font-medium">View Details</p>
                  <p className="text-xs text-gray-500">
                    View full user profile
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  if (selectedUser) {
                    handleChangeRole(
                      selectedUser.uid,
                      selectedUser.role === "bidder"
                        ? "procurement_entity"
                        : "bidder",
                    );
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <Shield className="text-purple-600" size={20} />
                <div>
                  <p className="font-medium">Change Role</p>
                  <p className="text-xs text-gray-500">
                    Current:{" "}
                    {selectedUser.role === "bidder"
                      ? "Bidder"
                      : "Procuring Entity"}
                  </p>
                </div>
              </button>

              {selectedUser.isActive ? (
                <button
                  onClick={() => handleDeactivateUser(selectedUser.uid)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  <Lock className="text-red-600" size={20} />
                  <div>
                    <p className="font-medium">Deactivate Account</p>
                    <p className="text-xs text-gray-500">
                      User won't be able to login
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleActivateUser(selectedUser.uid)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                >
                  <Unlock className="text-green-600" size={20} />
                  <div>
                    <p className="font-medium">Activate Account</p>
                    <p className="text-xs text-gray-500">
                      User will be able to login
                    </p>
                  </div>
                </button>
              )}

              <button
                onClick={() => handleDeleteUser(selectedUser.uid)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                <Trash2 className="text-danger" size={20} />
                <div>
                  <p className="font-medium">Delete User</p>
                  <p className="text-xs text-gray-500">Permanent action</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-6 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
