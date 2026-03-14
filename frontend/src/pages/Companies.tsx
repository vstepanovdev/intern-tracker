import { useEffect, useState } from "react";
import { getCompanies, getCompany } from "../api";
import type { Application, Company } from "../types";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<
    (Company & { applications: Application[] }) | null
  >(null);

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(company: Company) {
    try {
      const detail = await getCompany(company.id);
      setSelected(detail);
    } catch {
      setSelected({ ...company, applications: [] });
    }
  }

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Companies</h1>

      <input
        type="text"
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      />

      {selected && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {selected.name}
              </h2>
              <div className="mt-1 flex gap-3 text-sm text-slate-500">
                {selected.industry && <span>{selected.industry}</span>}
                {selected.location && <span>{selected.location}</span>}
                {selected.size && <span>{selected.size}</span>}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>

          {selected.website && (
            <a
              href={selected.website}
              target="_blank"
              rel="noreferrer"
              className="mb-4 inline-block text-sm text-indigo-600 hover:underline"
            >
              {selected.website}
            </a>
          )}

          <h3 className="mb-2 mt-4 text-sm font-medium text-slate-700">
            Applications ({selected.applications.length})
          </h3>
          {selected.applications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {selected.applications.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between py-2 hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-900">
                    {app.position}
                  </span>
                  <StatusBadge status={app.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No applications for this company.
            </p>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No companies found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelect(company)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{company.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-slate-500">
                {company.industry && <p>{company.industry}</p>}
                {company.location && <p>{company.location}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
