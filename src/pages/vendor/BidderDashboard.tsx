import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTenders } from "@hooks/useTenders";
import { useBids } from "@hooks/useBids";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Button from "@components/Button";
import Badge from "@components/Badge";
import { formatCurrency, formatDate } from "@utils/formatters";
import { Tender, Bid } from "@types";

export default function BidderDashboard() {
  const { currentUser } = useAuth();
  const {
    tenders,
    loading: tendersLoading,
    error: tendersError,
  } = useTenders();
  const { bids, loading: bidsLoading, error: bidsError } = useBids();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Filter user's bids
  const myBids = bids.filter((bid: Bid) => bid.vendorId === currentUser?.uid);

  // Filter open tenders - check for both 'open' status and 'published' status (from admin-created tenders)
  const openTenders = tenders.filter(
    (tender: Tender) =>
      (tender as any).status === "open" ||
      (tender as any).status === "published",
  );

  // Filter tenders by search and category
  const filteredTenders = openTenders.filter((tender: Tender) => {
    const matchesSearch =
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.description.toLowerCase().includes(searchTerm.toLowerCase());
    const tenderCategory = (tender as any).category || "";
    const matchesCategory =
      filterCategory === "all" || tenderCategory === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const stats = {
    activeTenders: openTenders.length,
    myBids: myBids.length,
    awarded: myBids.filter((b) => b.status === "awarded").length,
    underReview: myBids.filter(
      (b) => b.status === "evaluated" || b.status === "submitted",
    ).length,
    rejected: myBids.filter((b) => b.status === "rejected").length,
    totalBidAmount: myBids.reduce((sum, bid) => sum + bid.amount, 0),
    averageBidAmount:
      myBids.length > 0
        ? Math.round(
            myBids.reduce((sum, bid) => sum + bid.amount, 0) / myBids.length,
          )
        : 0,
  };

  // Get unique categories
  const categories = Array.from(
    new Set(
      tenders
        .map((t: Tender) => (t as any).category || "")
        .filter((cat) => cat !== ""),
    ),
  ).sort();

  if (tendersLoading || bidsLoading)
    return <Loading message="Loading dashboard..." />;
  if (tendersError) return <Error message={tendersError} />;
  if (bidsError) return <Error message={bidsError} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Welcome, {currentUser?.displayName || "Bidder"}
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your bids and explore new tendering opportunities
          </p>
        </div>
        <Link to="/profile">
          <Button variant="secondary">Account Settings</Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">
                Active Tenders
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.activeTenders}
              </p>
            </div>
            <FileText className="text-blue-500 opacity-20" size={32} />
          </div>
          <p className="text-xs text-gray-500 mt-3">Open for bidding</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">My Bids</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.myBids}
              </p>
            </div>
            <TrendingUp className="text-purple-500 opacity-20" size={32} />
          </div>
          <p className="text-xs text-gray-500 mt-3">Total submitted</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">Awarded</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.awarded}
              </p>
            </div>
            <CheckCircle className="text-green-500 opacity-20" size={32} />
          </div>
          <p className="text-xs text-gray-500 mt-3">Successfully won</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium">Under Review</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.underReview}
              </p>
            </div>
            <AlertCircle className="text-orange-500 opacity-20" size={32} />
          </div>
          <p className="text-xs text-gray-500 mt-3">Pending decision</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
          <p className="text-blue-100 text-sm font-medium">Total Bid Amount</p>
          <p className="text-3xl font-bold mt-2">
            {formatCurrency(stats.totalBidAmount, "BWP")}
          </p>
          <p className="text-blue-100 text-xs mt-3">
            {stats.myBids} bids submitted
          </p>
        </div>

        <div className="bg-gradient-to-br from-secondary to-blue-600 rounded-lg shadow p-6 text-white">
          <p className="text-blue-100 text-sm font-medium">
            Average Bid Amount
          </p>
          <p className="text-3xl font-bold mt-2">
            {formatCurrency(stats.averageBidAmount, "BWP")}
          </p>
          <p className="text-blue-100 text-xs mt-3">Per submission</p>
        </div>
      </div>

      {/* My Recent Bids */}
      {myBids.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                My Recent Bids
              </h2>
              <Link
                to="/bids"
                className="text-secondary hover:underline text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Tender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Bid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myBids.slice(0, 5).map((bid: Bid) => (
                  <tr key={bid.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {bid.tenderId}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(bid.amount, bid.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          bid.status === "awarded"
                            ? "bg-green-100 text-green-800"
                            : bid.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : bid.status === "submitted"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {bid.status.charAt(0).toUpperCase() +
                          bid.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {bid.evaluationScore
                        ? `${bid.evaluationScore}/100`
                        : "Pending"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(bid.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={`/bids/${bid.id}`}
                        className="text-secondary hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available Tenders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Available Tenders
            </h2>
            <Link
              to="/tenders"
              className="text-secondary hover:underline text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search tenders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary flex items-center gap-2"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tenders List */}
        {filteredTenders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No tenders found matching your search criteria</p>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {filteredTenders.slice(0, 5).map((tender: Tender) => (
              <Link
                key={tender.id}
                to={`/tenders/${tender.id}`}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-secondary hover:bg-blue-50 transition"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-secondary">
                    {tender.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {tender.description}
                  </p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      Budget:{" "}
                      <span className="font-medium">
                        {formatCurrency(
                          tender.budget,
                          (tender as any).currency || "BWP",
                        )}
                      </span>
                    </span>
                    <span className="text-gray-600">
                      Category:{" "}
                      <span className="font-medium">
                        {(tender as any).category || "N/A"}
                      </span>
                    </span>
                    <span className="text-gray-600">
                      Deadline:{" "}
                      <span className="font-medium">
                        {formatDate(
                          (tender as any).closeDate || (tender as any).deadline,
                          "short",
                        )}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <Badge
                    label={(tender as any).status?.toUpperCase() || "DRAFT"}
                    status={(tender as any).status || "draft"}
                  />
                  <span className="text-xs text-gray-500">
                    {(tender as any).bidCount || 0} bids
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50 to-secondary/10 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">
          💡 Getting Started Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium">1. Browse Tenders</p>
            <p>
              Explore all available tender opportunities in your area of
              expertise
            </p>
          </div>
          <div>
            <p className="font-medium">2. Submit Bids</p>
            <p>Prepare a competitive bid with your pricing and proposal</p>
          </div>
          <div>
            <p className="font-medium">3. Track Status</p>
            <p>Monitor your bid status and receive evaluation feedback</p>
          </div>
        </div>
      </div>
    </div>
  );
}
