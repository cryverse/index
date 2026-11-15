import { BarChart3, LineChart, TrendingUp } from "lucide-react";
import type { DataSourceItem, ResearchCardItem } from "./types";

export const EXAMPLE_PROMPTS = [
  "Compare Q3 revenue growth across enterprise vs. SMB segments",
  "Summarize customer churn drivers from last quarter's survey data",
  "Identify competitive risks in the analytics vendor landscape",
] as const;

export const RECENT_RESEARCH: ResearchCardItem[] = [
  {
    id: "q3-saas-landscape",
    title: "Q3 competitive landscape — SaaS analytics",
    description:
      "Market momentum and vendor concentration across analytics categories.",
    date: "Nov 12, 2025",
    status: "completed",
    icon: TrendingUp,
    detail: {
      objective:
        "Quantify category growth and surface concentration risk across vendors.",
      summary:
        "Enterprise analytics adoption accelerated while mid-market consolidation increased supplier dependency in two regions.",
      findings: [
        "Category revenue grew 18.4% QoQ, led by enterprise plans.",
        "Top three vendors account for 61% of new logo volume.",
        "Support SLA variance correlates with elevated churn in EMEA.",
      ],
    },
  },
  {
    id: "customer-cohort",
    title: "Customer cohort retention analysis",
    description:
      "Twelve-month retention curves for annual vs. monthly billing cohorts.",
    date: "Nov 8, 2025",
    status: "in_progress",
    icon: LineChart,
    detail: {
      objective:
        "Compare retention outcomes between billing models and onboarding paths.",
      summary:
        "Annual cohorts retain 14 points higher at month six; guided onboarding lifts week-four activation.",
      findings: [
        "Month-three retention: 78% annual vs. 64% monthly.",
        "Guided onboarding improves activation by 22%.",
        "Expansion revenue concentrates in accounts with 3+ integrations.",
      ],
    },
  },
  {
    id: "pricing-sensitivity",
    title: "Pricing sensitivity benchmark",
    description:
      "Willingness-to-pay signals from win/loss notes and survey responses.",
    date: "Nov 3, 2025",
    status: "draft",
    icon: BarChart3,
    detail: {
      objective:
        "Estimate price elasticity for the professional tier across segments.",
      summary:
        "Mid-market buyers anchor on per-seat transparency; enterprise buyers prioritize audit trails and SSO.",
      findings: [
        "47% of losses cite opaque seat-based pricing.",
        "Security review cycles add 19 days to average close time.",
        "Bundled analytics is the top cited upsell trigger.",
      ],
    },
  },
];

export const DATA_SOURCES: DataSourceItem[] = [
  {
    id: "sales-report",
    name: "Sales Report.csv",
    type: "csv",
    size: "2.4 MB",
    updated: "Updated 2h ago",
  },
  {
    id: "customer-analysis",
    name: "Customer Analysis.xlsx",
    type: "xlsx",
    size: "1.8 MB",
    updated: "Updated yesterday",
  },
  {
    id: "market-overview",
    name: "Market Overview.pdf",
    type: "pdf",
    size: "940 KB",
    updated: "Updated Nov 10",
  },
];
