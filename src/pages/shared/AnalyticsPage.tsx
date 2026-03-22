import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import procurementEntityService from "@/services/procurementEntityService";
import { formatCurrency } from "@/utils/formatters";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

interface TenderData {
  id: string;
  title: string;
  status: string;
  budget: number;
  currency: string;
  category: string;
  createdAt: any;
  closeDate: any;
  bidCount?: number;
}

interface BidData {
  id: string;
  tenderId: string;
  tenderTitle: string;
  vendorName: string;
  amount: number;
  currency: string;
  status: string;
  evaluationScore?: number;
  createdAt: any;
}

const toDate = (val: any): Date => {
  if (val instanceof Date) return val;
  if (val && typeof val === "object" && "seconds" in val)
    return new Date(val.seconds * 1000);
  return new Date(val);
};

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const [tenders, setTenders] = useState<TenderData[]>([]);
  const [bids, setBids] = useState<BidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"all" | "30d" | "90d" | "year">(
    "all",
  );

  useEffect(() => {
    loadData();
  }, [currentUser?.uid]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTenders, allBids] = await Promise.all([
        procurementEntityService.getAllTenders(),
        procurementEntityService.getAllBids(),
      ]);
      setTenders(allTenders as TenderData[]);
      setBids(allBids as BidData[]);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (timeRange === "all") return { tenders, bids };

    const now = new Date();
    const cutoff = new Date();
    if (timeRange === "30d") cutoff.setDate(now.getDate() - 30);
    else if (timeRange === "90d") cutoff.setDate(now.getDate() - 90);
    else cutoff.setFullYear(now.getFullYear() - 1);

    return {
      tenders: tenders.filter((t) => toDate(t.createdAt) >= cutoff),
      bids: bids.filter((b) => toDate(b.createdAt) >= cutoff),
    };
  }, [tenders, bids, timeRange]);

  const stats = useMemo(() => {
    const t = filteredData.tenders;
    const b = filteredData.bids;

    const totalTenders = t.length;
    const openTenders = t.filter(
      (x) => x.status === "published" || x.status === "open",
    ).length;
    const closedTenders = t.filter((x) => x.status === "closed").length;
    const awardedTenders = t.filter((x) => x.status === "awarded").length;
    const draftTenders = t.filter((x) => x.status === "draft").length;

    const totalBids = b.length;
    const awardedBids = b.filter((x) => x.status === "awarded").length;
    const rejectedBids = b.filter((x) => x.status === "rejected").length;
    const evaluatedBids = b.filter((x) => x.status === "evaluated").length;
    const submittedBids = b.filter((x) => x.status === "submitted").length;

    const totalBudget = t.reduce((sum, x) => sum + (x.budget || 0), 0);
    const totalBidValue = b.reduce((sum, x) => sum + (x.amount || 0), 0);
    const avgBidValue = totalBids > 0 ? totalBidValue / totalBids : 0;
    const avgBidsPerTender = totalTenders > 0 ? totalBids / totalTenders : 0;

    const avgScore =
      b.filter((x) => x.evaluationScore).length > 0
        ? b
            .filter((x) => x.evaluationScore)
            .reduce((sum, x) => sum + (x.evaluationScore || 0), 0) /
          b.filter((x) => x.evaluationScore).length
        : 0;

    return {
      totalTenders,
      openTenders,
      closedTenders,
      awardedTenders,
      draftTenders,
      totalBids,
      awardedBids,
      rejectedBids,
      evaluatedBids,
      submittedBids,
      totalBudget,
      totalBidValue,
      avgBidValue,
      avgBidsPerTender,
      avgScore,
    };
  }, [filteredData]);

  // Category distribution
  const categoryData = useMemo(() => {
    const map: Record<string, { count: number; budget: number }> = {};
    filteredData.tenders.forEach((t) => {
      const cat = t.category || "Uncategorized";
      if (!map[cat]) map[cat] = { count: 0, budget: 0 };
      map[cat].count++;
      map[cat].budget += t.budget || 0;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Bid status distribution
  const bidStatusData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.bids.forEach((b) => {
      const s = b.status || "unknown";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months: { label: string; tenders: number; bids: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      const tCount = tenders.filter((t) => {
        const cd = toDate(t.createdAt);
        return cd >= monthStart && cd <= monthEnd;
      }).length;
      const bCount = bids.filter((b) => {
        const cd = toDate(b.createdAt);
        return cd >= monthStart && cd <= monthEnd;
      }).length;

      months.push({ label, tenders: tCount, bids: bCount });
    }
    return months;
  }, [tenders, bids]);

  // Top tenders by bid count
  const topTenders = useMemo(() => {
    const bidCounts: Record<
      string,
      { title: string; count: number; budget: number }
    > = {};
    filteredData.bids.forEach((b) => {
      if (!bidCounts[b.tenderId]) {
        bidCounts[b.tenderId] = {
          title: b.tenderTitle || b.tenderId,
          count: 0,
          budget: 0,
        };
      }
      bidCounts[b.tenderId].count++;
    });
    filteredData.tenders.forEach((t) => {
      if (bidCounts[t.id]) bidCounts[t.id].budget = t.budget || 0;
    });
    return Object.values(bidCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500";
      case "evaluated":
        return "bg-purple-500";
      case "awarded":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "draft":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  const maxMonthly = Math.max(
    ...monthlyTrend.map((m) => Math.max(m.tenders, m.bids)),
    1,
  );

  if (loading) return <Loading message="Loading analytics..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Procurement performance insights and metrics
          </p>
        </div>
        <div className="flex gap-2">
          {(["all", "30d", "90d", "year"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {range === "all"
                ? "All Time"
                : range === "30d"
                  ? "30 Days"
                  : range === "90d"
                    ? "90 Days"
                    : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {error && <Error message={error} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Tenders"
          value={stats.totalTenders}
          icon={FileText}
          color="bg-blue-500"
          subtitle={`${stats.openTenders} open, ${stats.closedTenders} closed`}
        />
        <KPICard
          title="Total Bids Received"
          value={stats.totalBids}
          icon={BarChart3}
          color="bg-purple-500"
          subtitle={`Avg ${stats.avgBidsPerTender.toFixed(1)} bids/tender`}
        />
        <KPICard
          title="Total Budget"
          value={formatCurrency(stats.totalBudget)}
          icon={DollarSign}
          color="bg-green-500"
          subtitle={`Avg bid: ${formatCurrency(stats.avgBidValue)}`}
        />
        <KPICard
          title="Awards Made"
          value={stats.awardedBids}
          icon={CheckCircle}
          color="bg-amber-500"
          subtitle={
            stats.totalBids > 0
              ? `${((stats.awardedBids / stats.totalBids) * 100).toFixed(0)}% award rate`
              : "No bids yet"
          }
        />
      </div>

      {/* Tender Status Overview + Bid Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tender Status */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tender Status Overview
          </h2>
          <div className="space-y-4">
            <StatusBar
              label="Open / Published"
              count={stats.openTenders}
              total={stats.totalTenders}
              color="bg-green-500"
            />
            <StatusBar
              label="Draft"
              count={stats.draftTenders}
              total={stats.totalTenders}
              color="bg-gray-400"
            />
            <StatusBar
              label="Closed"
              count={stats.closedTenders}
              total={stats.totalTenders}
              color="bg-blue-500"
            />
            <StatusBar
              label="Awarded"
              count={stats.awardedTenders}
              total={stats.totalTenders}
              color="bg-amber-500"
            />
          </div>
        </div>

        {/* Bid Status */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bid Status Breakdown
          </h2>
          {bidStatusData.length > 0 ? (
            <div className="space-y-4">
              {bidStatusData.map((d) => (
                <StatusBar
                  key={d.status}
                  label={d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  count={d.count}
                  total={stats.totalBids}
                  color={getStatusColor(d.status)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No bid data available
            </p>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Monthly Activity (Last 6 Months)
        </h2>
        <div className="flex items-end gap-3 h-52">
          {monthlyTrend.map((m) => (
            <div
              key={m.label}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="flex gap-1 items-end w-full justify-center h-40">
                <div
                  className="bg-blue-500 rounded-t w-5 transition-all duration-500"
                  style={{
                    height: `${Math.max((m.tenders / maxMonthly) * 100, 4)}%`,
                  }}
                  title={`${m.tenders} tenders`}
                />
                <div
                  className="bg-purple-500 rounded-t w-5 transition-all duration-500"
                  style={{
                    height: `${Math.max((m.bids / maxMonthly) * 100, 4)}%`,
                  }}
                  title={`${m.bids} bids`}
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-sm text-gray-600">Tenders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-sm text-gray-600">Bids</span>
          </div>
        </div>
      </div>

      {/* Category Distribution + Top Tenders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tenders by Category
          </h2>
          {categoryData.length > 0 ? (
            <div className="space-y-3">
              {categoryData.map((cat, i) => {
                const colors = [
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-purple-500",
                  "bg-amber-500",
                  "bg-red-500",
                  "bg-cyan-500",
                ];
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {cat.name}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {cat.count} tender{cat.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${colors[i % colors.length]} h-2 rounded-full transition-all duration-500`}
                          style={{
                            width: `${(cat.count / (categoryData[0]?.count || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No category data available
            </p>
          )}
        </div>

        {/* Top Tenders by Bids */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Most Competitive Tenders
          </h2>
          {topTenders.length > 0 ? (
            <div className="space-y-4">
              {topTenders.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Budget: {formatCurrency(t.budget)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{t.count}</p>
                    <p className="text-xs text-gray-500">bids</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No bid data available
            </p>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Avg. Evaluation Score"
            value={
              stats.avgScore > 0 ? `${stats.avgScore.toFixed(1)}/100` : "N/A"
            }
            icon={
              stats.avgScore >= 70 ? (
                <TrendingUp className="text-green-500" size={20} />
              ) : (
                <TrendingDown className="text-red-500" size={20} />
              )
            }
          />
          <MetricCard
            label="Total Bid Value"
            value={formatCurrency(stats.totalBidValue)}
            icon={<DollarSign className="text-blue-500" size={20} />}
          />
          <MetricCard
            label="Bids Under Review"
            value={stats.submittedBids + stats.evaluatedBids}
            icon={<Clock className="text-amber-500" size={20} />}
          />
          <MetricCard
            label="Rejection Rate"
            value={
              stats.totalBids > 0
                ? `${((stats.rejectedBids / stats.totalBids) * 100).toFixed(0)}%`
                : "0%"
            }
            icon={<AlertTriangle className="text-red-500" size={20} />}
          />
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function KPICard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`${color} p-3 rounded-xl text-white`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {count} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
