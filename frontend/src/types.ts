export type Status =
  | "wishlist"
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export interface Company {
  id: number;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  notes?: string;
  created_at: string;
}

export interface Application {
  id: number;
  company_id: number;
  company: Company;
  position: string;
  status: Status;
  url?: string;
  date_applied?: string;
  date_updated: string;
  deadline?: string;
  cover_letter?: string;
  notes?: string;
  resume_version?: string;
  contact_name?: string;
  contact_email?: string;
  created_at: string;
}

export interface CompanySuggestion {
  name: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  apply_url: string;
  intern_position: string;
  tips: string;
}

export interface DashboardStats {
  total: number;
  by_status: Record<string, number>;
  recent_applications: Application[];
}
