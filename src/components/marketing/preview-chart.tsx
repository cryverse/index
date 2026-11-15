"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { period: "W1", value: 42 },
  { period: "W2", value: 48 },
  { period: "W3", value: 44 },
  { period: "W4", value: 58 },
  { period: "W5", value: 55 },
  { period: "W6", value: 67 },
  { period: "W7", value: 72 },
];

export function PreviewChart() {
  return (
    <div className="h-[140px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{ fill: "#71717a", fontSize: 10 }}
          />
          <YAxis hide width={0} domain={["dataMin - 10", "dataMax + 10"]} />
          <Tooltip
            contentStyle={{
              background: "#141418",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#a1a1aa" }}
            itemStyle={{ color: "#fafafa" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#previewFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}