import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getApplication,
  createApplication,
  updateApplication,
  getCompanies,
  generateCoverLetter,
} from "../api";
import type { Company, Status } from "../types";

const statuses: { value: Status; label: string }[] = [
  { value: "wishlist", label: "Wishlist" },
  { value: "applied", label: "Applied" },
  { value: "phone_screen", label: "Phone Screen" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

interface FormData {
  company_name: string;
  company_id: number | null;
  position: string;
  status: Status;
  url: string;
  date_applied: string;
  deadline: string;
  cover_letter: string;
  notes: string;
  contact_name: string;
  contact_email: string;
  resume_version: string;
}

const emptyForm: FormData = {
  company_name: "",
  company_id: null,
  position: "",
  status: "wishlist",
  url: "",
  date_applied: "",
  deadline: "",
  cover_letter: "",
  notes: "",
  contact_name: "",
  contact_email: "",
  resume_version: "",
};

export default function ApplicationForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>(emptyForm);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(() => {});

    if (isEdit && id) {
      setLoading(true);
      getApplication(Number(id))
        .then((app) => {
          setForm({
            company_name: app.company?.name || "",
            company_id: app.company_id,
            position: app.position,
            status: app.status,
            url: app.url || "",
            date_applied: app.date_applied || "",
            deadline: app.deadline || "",
            cover_letter: app.cover_letter || "",
            notes: app.notes || "",
            contact_name: app.contact_name || "",
            contact_email: app.contact_email || "",
            resume_version: app.resume_version || "",
          });
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  function handleCompanyInput(value: string) {
    setForm((f) => ({ ...f, company_name: value, company_id: null }));
    if (value.length > 0) {
      const filtered = companies.filter((c) =>
        c.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function selectCompany(company: Company) {
    setForm((f) => ({
      ...f,
      company_name: company.name,
      company_id: company.id,
    }));
    setShowSuggestions(false);
  }

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        position: form.position,
        status: form.status,
        url: form.url || undefined,
        date_applied: form.date_applied || undefined,
        deadline: form.deadline || undefined,
        cover_letter: form.cover_letter || undefined,
        notes: form.notes || undefined,
        contact_name: form.contact_name || undefined,
        contact_email: form.contact_email || undefined,
        resume_version: form.resume_version || undefined,
      };

      if (form.company_id) {
        payload.company_id = form.company_id;
      } else {
        payload.company_name = form.company_name;
      }

      if (isEdit && id) {
        await updateApplication(Number(id), payload);
        navigate(`/applications/${id}`);
      } else {
        const created = await createApplication(payload);
        navigate(`/applications/${created.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateCoverLetter() {
    if (!id) return;
    setGenerating(true);
    try {
      const result = await generateCoverLetter(Number(id));
      setForm((f) => ({ ...f, cover_letter: result.cover_letter }));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to generate cover letter"
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {isEdit ? "Edit Application" : "New Application"}
      </h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Company Name */}
        <div className="relative">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Company Name
          </label>
          <input
            type="text"
            required
            value={form.company_name}
            onChange={(e) => handleCompanyInput(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            placeholder="Start typing to search..."
          />
          {showSuggestions && (
            <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {suggestions.map((c) => (
                <li
                  key={c.id}
                  onMouseDown={() => selectCompany(c)}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50"
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Position & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Position
            </label>
            <input
              type="text"
              required
              value={form.position}
              onChange={(e) => update("position", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* URL */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            URL
          </label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => update("url", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            placeholder="https://..."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Date Applied
            </label>
            <input
              type="date"
              value={form.date_applied}
              onChange={(e) => update("date_applied", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Deadline
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contact Name
            </label>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) => update("contact_name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contact Email
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => update("contact_email", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Resume Version */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Resume Version
          </label>
          <input
            type="text"
            value={form.resume_version}
            onChange={(e) => update("resume_version", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            placeholder="e.g. v2-swe"
          />
        </div>

        {/* Cover Letter */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">
              Cover Letter
            </label>
            {isEdit && (
              <button
                type="button"
                onClick={handleGenerateCoverLetter}
                disabled={generating}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Cover Letter"}
              </button>
            )}
          </div>
          <textarea
            rows={6}
            value={form.cover_letter}
            onChange={(e) => update("cover_letter", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
