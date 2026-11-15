import type { LucideIcon } from "lucide-react";

export type DashboardNavId = "overview" | "history" | "sources";

export type ResearchStatus = "completed" | "in_progress" | "draft";

export type ResearchCardItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  status: ResearchStatus;
  icon: LucideIcon;
  detail: {
    objective: string;
    summary: string;
    findings: string[];
  };
};

export type DataSourceItem = {
  id: string;
  name: string;
  type: "csv" | "xlsx" | "pdf";
  size: string;
  updated: string;
};

export type { ResearchAgentResult, ResearchApiError } from "@/types/research";