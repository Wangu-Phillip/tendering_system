import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";

export default function ProcurementEntityDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const myTenders = [
    {
      id: 1,
      title: "Office Supplies Purchase",
      postedDate: "2026-03-05",
      deadline: "2026-03-15",
      bidCount: 5,
      status: "open",
    },
    {
      id: 2,
      title: "Website Redesign Project",
      postedDate: "2026-03-04",
      deadline: "2026-03-22",
      bidCount: 8,
      status: "open",
    },
    {
      id: 3,
      title: "Construction Materials Supply",
      postedDate: "2026-03-01",
      deadline: "2026-03-29",
      bidCount: 3,
      status: "closing_soon",
    },
  ];

  const recentBids = [
    {
      id: 1,
      tender: "Office Supplies Purchase",
      vendor: "ABC Supplies Ltd",
      amount: "BWP 4,500",
      status: "submitted",
      submittedDate: "2026-03-05",
    },
    {
      id: 2,
      tender: "Website Redesign Project",
      vendor: "Tech Design Co",
      amount: "BWP 14,000",
      status: "under_evaluation",
      submittedDate: "2026-03-04",
    },
    {
      id: 3,
      tender: "Website Redesign Project",
      vendor: "Creative Studios",
      amount: "BWP 16,500",
      status: "under_evaluation",
      submittedDate: "2026-03-03",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Procurement Dashboard
        </h1>
        <button className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2">
          <Plus size={20} /> Publish Tender
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Active Tenders</p>
          <p className="text-3xl font-bold text-primary mt-2">3</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Bids Received</p>
          <p className="text-3xl font-bold text-secondary mt-2">16</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Closed Tenders</p>
          <p className="text-3xl font-bold text-success mt-2">8</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Contracts Awarded</p>
          <p className="text-3xl font-bold text-warning mt-2">6</p>
        </div>
      </div>

      {/* My Tenders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">My Tenders</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search tenders..."
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
                  Tender Title
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Posted Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Bids
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
              {myTenders.map((tender) => (
                <tr
                  key={tender.id}
                  className="border-b hover:bg-light transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {tender.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {tender.postedDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {tender.deadline}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {tender.bidCount}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        tender.status === "open"
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {tender.status === "open" ? "Open" : "Closing Soon"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button className="text-secondary hover:text-blue-700 font-semibold">
                      View Bids
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 font-semibold">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Bid Submissions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-primary">
            Recent Bid Submissions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Tender
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Bid Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {recentBids.map((bid) => (
                <tr
                  key={bid.id}
                  className="border-b hover:bg-light transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {bid.tender}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {bid.vendor}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {bid.amount}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        bid.status === "submitted"
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {bid.status === "submitted"
                        ? "Submitted"
                        : "Under Evaluation"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {bid.submittedDate}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-secondary hover:text-blue-700 font-semibold">
                      Review & Evaluate
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
