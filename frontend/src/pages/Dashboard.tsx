import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../api";
import type { DashboardStats, Status } from "../types";
import StatusBadge from "../components/StatusBadge";

const statusColors: Record<string, string> = {
  wishlist: "bg-gray-400",
  applied: "bg-blue-500",
  phone_screen: "bg-yellow-500",
  interview: "bg-purple-500",
  offer: "bg-green-500",
  rejected: "bg-red-500",
  withdrawn: "bg-orange-500",
};

const statusOrder: Status[] = [
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );

  if (error)
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
    );

  if (!stats) return null;

  const statCards = [
    {
      label: "Total Applications",
      value: stats.total,
      bg: "bg-indigo-500",
    },
    {
      label: "Applied",
      value: stats.by_status["applied"] || 0,
      bg: "bg-blue-500",
    },
    {
      label: "Interviewing",
      value:
        (stats.by_status["phone_screen"] || 0) +
        (stats.by_status["interview"] || 0),
      bg: "bg-purple-500",
    },
    {
      label: "Offers",
      value: stats.by_status["offer"] || 0,
      bg: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link
            to="/applications/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add Application
          </Link>
          <Link
            to="/discover"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Discover Companies
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg ${card.bg} p-6 text-white shadow-sm`}
          >
            <p className="text-sm font-medium text-white/80">{card.label}</p>
            <p className="mt-1 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Status Pipeline
        </h2>
        {stats.total > 0 ? (
          <>
            <div className="flex h-8 overflow-hidden rounded-full">
              {statusOrder.map((s) => {
                const count = stats.by_status[s] || 0;
                if (count === 0) return null;
                const pct = (count / stats.total) * 100;
                return (
                  <div
                    key={s}
                    className={`${statusColors[s]} relative`}
                    style={{ width: `${pct}%` }}
                    title={`${s}: ${count}`}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              {statusOrder.map((s) => {
                const count = stats.by_status[s] || 0;
                if (count === 0) return null;
                return (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${statusColors[s]}`}
                    />
                    <span className="capitalize text-slate-600">
                      {s.replace("_", " ")}
                    </span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No applications yet.</p>
        )}
      </div>

      {/* Recent applications */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Recent Applications
        </h2>
        {stats.recent_applications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recent_applications.slice(0, 5).map((app) => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {app.company?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-slate-500">{app.position}</p>
                </div>
                <StatusBadge status={app.status} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No applications yet.</p>
        )}
      </div>
    </div>
  );
}
