import axios from "axios";
import type { Application, Company, CompanySuggestion, DashboardStats } from "./types";

const api = axios.create({
  baseURL: "/api",
});

// Applications
export async function getApplications(status?: string): Promise<Application[]> {
  const params = status ? { status } : {};
  const res = await api.get("/applications", { params });
  return res.data;
}

export async function getApplication(id: number): Promise<Application> {
  const res = await api.get(`/applications/${id}`);
  return res.data;
}

export async function createApplication(data: Partial<Application>): Promise<Application> {
  const res = await api.post("/applications", data);
  return res.data;
}

export async function updateApplication(id: number, data: Partial<Application>): Promise<Application> {
  const res = await api.put(`/applications/${id}`, data);
  return res.data;
}

export async function deleteApplication(id: number): Promise<void> {
  await api.delete(`/applications/${id}`);
}

export async function generateCoverLetter(id: number): Promise<{ cover_letter: string }> {
  const res = await api.post(`/applications/${id}/cover-letter`);
  return res.data;
}

// Companies
export async function getCompanies(): Promise<Company[]> {
  const res = await api.get("/companies");
  return res.data;
}

export async function getCompany(id: number): Promise<Company & { applications: Application[] }> {
  const res = await api.get(`/companies/${id}`);
  return res.data;
}

export async function createCompany(data: Partial<Company>): Promise<Company> {
  const res = await api.post("/companies", data);
  return res.data;
}

export async function getCompanySuggestions(): Promise<CompanySuggestion[]> {
  const res = await api.get("/companies/suggestions");
  return res.data;
}

export async function quickApply(entries: Record<string, unknown>[]): Promise<Application[]> {
  const res = await api.post("/applications/quick-apply", entries);
  return res.data;
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get("/dashboard/stats");
  return res.data;
}

export async function getTimeline(): Promise<Application[]> {
  const res = await api.get("/dashboard/timeline");
  return res.data;
}
