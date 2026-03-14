import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationDetail from "./pages/ApplicationDetail";
import Companies from "./pages/Companies";
import Discover from "./pages/Discover";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 pt-16 md:pt-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/applications/new" element={<ApplicationForm />} />
            <Route path="/applications/:id" element={<ApplicationDetail />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/discover" element={<Discover />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
