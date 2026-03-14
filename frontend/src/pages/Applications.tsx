import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApplications } from "../api";
import type { Application, Status } from "../types";
import StatusBadge from "../components/StatusBadge";

const filterTabs: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Wishlist", value: "wishlist" },
  { label: "Applied", value: "applied" },
  { label: "Interview", value: "interview" },
  { label: "Offer", value: "offer" },
  { label: "Rejected", value: "rejected" },
];

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getApplications(filter || undefined)
      .then(setApplications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <Link
          to="/applications/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Application
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      ) : applications.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">No applications found.</p>
          <Link
            to="/applications/new"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Create your first application
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Company
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Position
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Date Applied
                </th>
                <th className="px-4 py-3 font-medium text-slate-600">
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {app.company?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{app.position}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status as Status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {app.date_applied || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {app.deadline || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
