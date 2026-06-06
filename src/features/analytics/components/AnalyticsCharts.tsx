"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ApplicationSource, ApplicationStatus } from "@/lib/enums";
import { STATUS_LABELS } from "@/components/StatusBadge";

const SOURCE_LABELS: Record<ApplicationSource, string> = {
  LinkedIn: "LinkedIn",
  Naukri: "Naukri",
  Indeed: "Indeed",
  Company_Website: "Company Website",
  Referral: "Referral",
  Glassdoor: "Glassdoor",
  Other: "Other",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Applied: "#94a3b8",
  OA_Scheduled: "#60a5fa",
  OA_Completed: "#3b82f6",
  Recruiter_Screening: "#818cf8",
  Technical_Round_1: "#8b5cf6",
  Technical_Round_2: "#7c3aed",
  Technical_Round_3: "#6d28d9",
  Managerial_Round: "#a855f7",
  HR_Round: "#ec4899",
  Offer_Received: "#10b981",
  Accepted: "#22c55e",
  Rejected: "#ef4444",
  Withdrawn: "#f97316",
  Referral_Asked: "#eab308",
};

interface AnalyticsData {
  byMonth: { month: string; count: number }[];
  byStatus: { status: ApplicationStatus; count: number }[];
  bySource: { source: ApplicationSource; count: number }[];
  byCountry: { country: string; count: number }[];
}

export function ApplicationsByMonth({ data }: { data: AnalyticsData["byMonth"] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" name="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ApplicationsByCountry({ data }: { data: AnalyticsData["byCountry"] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" name="Applications" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ApplicationsByStatus({ data }: { data: AnalyticsData["byStatus"] }) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUS_LABELS[d.status],
      value: d.count,
      color: STATUS_COLORS[d.status],
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          outerRadius={90}
          dataKey="value"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            (percent ?? 0) > 0.05 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ""
          }
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, name]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ApplicationsBySource({ data }: { data: AnalyticsData["bySource"] }) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d, i) => ({
      name: SOURCE_LABELS[d.source],
      value: d.count,
    }));

  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#eab308", "#22c55e", "#06b6d4"];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [value, name]} />
        <Legend iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
}
