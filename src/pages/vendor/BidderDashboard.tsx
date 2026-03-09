import { useState } from "react";
import { Search, Filter } from "lucide-react";

export default function BidderDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const recentTenders = [
    {
      id: 1,
      title: "Office Supplies Purchase",
      deadline: "2026-03-15",
      budget: "BWP 5,000",
      status: "open",
    },
    {
      id: 2,
      title: "Website Redesign Project",
      deadline: "2026-03-22",
      budget: "BWP 15,000",
      status: "open",
    },
    {
      id: 3,
      title: "Construction Materials Supply",
      deadline: "2026-03-29",
      budget: "BWP 50,000",
      status: "open",
    },
  ];

  const myBids = [
    {
      id: 1,
      tender: "Office Supplies Purchase",
      amount: "BWP 4,500",
      status: "submitted",
      submittedDate: "2026-03-05",
    },
    {
      id: 2,
      tender: "Website Redesign Project",
      amount: "BWP 14,000",
      status: "under_review",
      submittedDate: "2026-03-04",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Bidder Dashboard</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Active Tenders</p>
          <p className="text-3xl font-bold text-primary mt-2">12</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">My Bids</p>
          <p className="text-3xl font-bold text-secondary mt-2">5</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Awarded</p>
          <p className="text-3xl font-bold text-success mt-2">2</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Average Amount</p>
          <p className="text-3xl font-bold text-warning mt-2">BWP 12.5K</p>
        </div>
      </div>

      {/* Available Tenders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-primary">
              Available Tenders
            </h2>
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
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTenders.map((tender) => (
                <tr
                  key={tender.id}
                  className="border-b hover:bg-light transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {tender.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {tender.deadline}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {tender.budget}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-success/20 text-success rounded-full text-xs font-semibold">
                      Open
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-secondary hover:text-blue-700 font-semibold">
                      View & Bid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Bids */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-primary">My Bids</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                  Tender
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
              {myBids.map((bid) => (
                <tr
                  key={bid.id}
                  className="border-b hover:bg-light transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {bid.tender}
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
                        : "Under Review"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {bid.submittedDate}
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
