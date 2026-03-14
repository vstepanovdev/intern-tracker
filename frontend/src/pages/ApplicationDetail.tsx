import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getApplication, updateApplication, deleteApplication } from "../api";
import type { Application, Status } from "../types";
import StatusBadge from "../components/StatusBadge";

const statusFlow: Status[] = [
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
];

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getApplication(Number(id))
      .then(setApp)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: Status) {
    if (!id || !app) return;
    try {
      const updated = await updateApplication(Number(id), {
        status: newStatus,
      });
      setApp(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleDelete() {
    if (!id || !confirm("Are you sure you want to delete this application?"))
      return;
    try {
      await deleteApplication(Number(id));
      navigate("/applications");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

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

  if (!app) return null;

  const currentIdx = statusFlow.indexOf(app.status);
  const nextStatus = currentIdx >= 0 && currentIdx < statusFlow.length - 1
    ? statusFlow[currentIdx + 1]
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/applications"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            &larr; Back to Applications
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {app.position}
          </h1>
          <p className="text-lg text-slate-600">
            {app.company?.name || "Unknown Company"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/applications/${app.id}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/applications/${app.id}`, { state: { edit: true } });
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status & Quick Actions */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Current Status</p>
            <div className="mt-1">
              <StatusBadge status={app.status} />
            </div>
          </div>
          <div className="flex gap-2">
            {nextStatus && (
              <button
                onClick={() => handleStatusChange(nextStatus)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Move to {nextStatus.replace("_", " ")}
              </button>
            )}
            {app.status !== "rejected" && app.status !== "withdrawn" && (
              <>
                <button
                  onClick={() => handleStatusChange("rejected")}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Rejected
                </button>
                <button
                  onClick={() => handleStatusChange("withdrawn")}
                  className="rounded-lg border border-orange-300 px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                >
                  Withdrawn
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status timeline */}
        <div className="mt-6 flex items-center gap-1">
          {statusFlow.map((s, i) => {
            const isActive = i <= currentIdx && currentIdx >= 0;
            return (
              <div key={s} className="flex flex-1 flex-col items-center">
                <div
                  className={`h-2 w-full rounded-full ${
                    isActive ? "bg-indigo-500" : "bg-slate-200"
                  }`}
                />
                <span className="mt-1 text-xs text-slate-500 capitalize">
                  {s.replace("_", " ")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Application Info */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Application Details
          </h2>
          <dl className="space-y-3">
            {app.url && (
              <div>
                <dt className="text-sm font-medium text-slate-500">URL</dt>
                <dd>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    {app.url}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-slate-500">
                Date Applied
              </dt>
              <dd className="text-sm text-slate-900">
                {app.date_applied || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Deadline</dt>
              <dd className="text-sm text-slate-900">
                {app.deadline || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">
                Last Updated
              </dt>
              <dd className="text-sm text-slate-900">{app.date_updated}</dd>
            </div>
            {app.resume_version && (
              <div>
                <dt className="text-sm font-medium text-slate-500">
                  Resume Version
                </dt>
                <dd className="text-sm text-slate-900">
                  {app.resume_version}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Company Info */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Company Info
          </h2>
          {app.company ? (
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-slate-500">Name</dt>
                <dd className="text-sm text-slate-900">{app.company.name}</dd>
              </div>
              {app.company.website && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Website
                  </dt>
                  <dd>
                    <a
                      href={app.company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      {app.company.website}
                    </a>
                  </dd>
                </div>
              )}
              {app.company.industry && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Industry
                  </dt>
                  <dd className="text-sm text-slate-900">
                    {app.company.industry}
                  </dd>
                </div>
              )}
              {app.company.location && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Location
                  </dt>
                  <dd className="text-sm text-slate-900">
                    {app.company.location}
                  </dd>
                </div>
              )}
              {app.company.size && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Size</dt>
                  <dd className="text-sm text-slate-900">
                    {app.company.size}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-slate-500">No company info available</p>
          )}
        </div>
      </div>

      {/* Contact */}
      {(app.contact_name || app.contact_email) && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Contact
          </h2>
          <dl className="space-y-3">
            {app.contact_name && (
              <div>
                <dt className="text-sm font-medium text-slate-500">Name</dt>
                <dd className="text-sm text-slate-900">{app.contact_name}</dd>
              </div>
            )}
            {app.contact_email && (
              <div>
                <dt className="text-sm font-medium text-slate-500">Email</dt>
                <dd>
                  <a
                    href={`mailto:${app.contact_email}`}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    {app.contact_email}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Cover Letter */}
      {app.cover_letter && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Cover Letter
          </h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {app.cover_letter}
          </p>
        </div>
      )}

      {/* Notes */}
      {app.notes && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {app.notes}
          </p>
        </div>
      )}
    </div>
  );
}
