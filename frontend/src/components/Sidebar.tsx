import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: HomeIcon },
  { to: "/applications", label: "Applications", icon: DocumentTextIcon },
  { to: "/companies", label: "Companies", icon: BuildingOfficeIcon },
  { to: "/discover", label: "Discover", icon: MagnifyingGlassIcon },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 rounded-lg bg-slate-900 p-2 text-white md:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-white transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 px-6">
          <span className="text-xl font-bold tracking-tight text-indigo-400">
            InternTracker
          </span>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-indigo-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
