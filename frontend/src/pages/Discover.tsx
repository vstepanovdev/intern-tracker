import { useEffect, useState } from "react";
import {
  getCompanySuggestions,
  createCompany,
  createApplication,
  quickApply,
} from "../api";
import type { CompanySuggestion } from "../types";
import { useNavigate } from "react-router-dom";

const categories = ["All", "Big Tech", "Finance", "Startups", "Mid-size"];

const categoryFilter: Record<string, (c: CompanySuggestion) => boolean> = {
  All: () => true,
  "Big Tech": (c) => {
    const big = ["google", "meta", "apple", "amazon", "microsoft", "netflix", "nvidia", "bloomberg"];
    return big.some((b) => c.name.toLowerCase().includes(b));
  },
  Finance: (c) => {
    const fin = ["goldman", "jpmorgan", "bloomberg", "coinbase", "robinhood", "stripe", "square"];
    return fin.some((f) => c.name.toLowerCase().includes(f)) ||
      (c.industry || "").toLowerCase().includes("fintech") ||
      (c.industry || "").toLowerCase().includes("banking");
  },
  Startups: (c) => ["startup", "small"].includes((c.size || "").toLowerCase()),
  "Mid-size": (c) => (c.size || "").toLowerCase() === "mid",
};

export default function Discover() {
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preparingName, setPreparingName] = useState<string | null>(null);
  const [batchApplying, setBatchApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    getCompanySuggestions()
      .then(setSuggestions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleSelect(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectAll() {
    const visible = filtered.map((c) => c.name);
    setSelected((prev) => {
      const allSelected = visible.every((n) => prev.has(n));
      if (allSelected) return new Set();
      return new Set([...prev, ...visible]);
    });
  }

  async function handlePrepare(company: CompanySuggestion) {
    setPreparingName(company.name);
    try {
      let createdCompany;
      try {
        createdCompany = await createCompany({
          name: company.name,
          website: company.website,
          industry: company.industry,
          size: company.size,
          location: company.location,
        });
      } catch {
        // already exists
      }

      const app = await createApplication({
        company_name: company.name,
        company_id: createdCompany?.id,
        position: company.intern_position,
        status: "wishlist",
        url: company.apply_url,
        notes: `Tips: ${company.tips}`,
      } as Record<string, unknown>);

      navigate(`/applications/${app.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to prepare application");
    } finally {
      setPreparingName(null);
    }
  }

  async function handleBatchApply() {
    if (selected.size === 0) return;
    setBatchApplying(true);
    setError("");
    setSuccessMsg("");
    try {
      const entries = suggestions
        .filter((s) => selected.has(s.name))
        .map((s) => ({
          company_name: s.name,
          position: s.intern_position,
          status: "applied",
          url: s.apply_url,
          date_applied: new Date().toISOString().split("T")[0],
          notes: `Tips: ${s.tips}`,
        }));

      const created = await quickApply(entries);
      setSuccessMsg(
        `Created ${created.length} application(s). Opening career pages...`
      );

      // Open career pages in new tabs
      suggestions
        .filter((s) => selected.has(s.name) && s.apply_url)
        .forEach((s, i) => {
          setTimeout(() => window.open(s.apply_url, "_blank"), i * 300);
        });

      setSelected(new Set());
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Batch apply failed");
    } finally {
      setBatchApplying(false);
    }
  }

  function handleOpenApply(company: CompanySuggestion) {
    window.open(company.apply_url, "_blank");
  }

  const catFilter = categoryFilter[category] || (() => true);
  const filtered = suggestions
    .filter(catFilter)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.industry || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.location || "").toLowerCase().includes(search.toLowerCase())
    );

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );

  if (error && suggestions.length === 0)
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Discover Companies
        </h1>
        {selected.size > 0 && (
          <button
            onClick={handleBatchApply}
            disabled={batchApplying}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {batchApplying ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 0 1-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              </svg>
            )}
            Quick Apply to {selected.size} Selected
          </button>
        )}
      </div>

      {successMsg && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800 font-medium">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {/* Search + Select All */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, industry, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
        <button
          onClick={selectAll}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {filtered.every((c) => selected.has(c.name)) && filtered.length > 0
            ? "Deselect All"
            : "Select All"}
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              category === cat
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          No companies found in this category.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => {
            const isSelected = selected.has(company.name);
            const tipsExpanded = expandedTips.has(company.name);
            return (
              <div
                key={company.name}
                className={`flex flex-col rounded-lg border-2 bg-white shadow-sm transition-all ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header with checkbox */}
                <div className="flex items-start gap-3 p-4 pb-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(company.name)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {company.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          company.size === "large"
                            ? "bg-blue-100 text-blue-700"
                            : company.size === "mid"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {company.size}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{company.industry}</p>
                    <p className="text-xs text-slate-400">{company.location}</p>
                    <p className="mt-1 text-xs font-medium text-indigo-600">
                      {company.intern_position}
                    </p>
                  </div>
                </div>

                {/* Tips section */}
                {company.tips && (
                  <div className="px-4 pb-2">
                    <button
                      onClick={() =>
                        setExpandedTips((prev) => {
                          const next = new Set(prev);
                          if (next.has(company.name)) next.delete(company.name);
                          else next.add(company.name);
                          return next;
                        })
                      }
                      className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                    >
                      <svg className={`h-3 w-3 transition-transform ${tipsExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                      Interview Tips
                    </button>
                    {tipsExpanded && (
                      <p className="mt-1 text-xs text-slate-600 bg-amber-50 rounded p-2">
                        {company.tips}
                      </p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-auto border-t border-slate-100 p-3 flex gap-2">
                  <button
                    onClick={() => handleOpenApply(company)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Apply Now
                  </button>
                  <button
                    onClick={() => handlePrepare(company)}
                    disabled={preparingName === company.name}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    {preparingName === company.name ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    )}
                    Prepare
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
