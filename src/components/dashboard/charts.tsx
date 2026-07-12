"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tooltipStyle = {
  backgroundColor: "rgb(42,42,42)",
  border: "1px solid rgb(74,74,74)",
  borderRadius: 0,
  color: "rgb(224,224,224)",
};

interface SeriesPoint {
  month: string;
  consumption: number;
  revenue: number;
  devices: number;
  customers: number;
}

export function DashboardCharts({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Gas Consumption</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid stroke="rgb(74,74,74)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="rgb(160,160,160)" fontSize={12} />
              <YAxis stroke="rgb(160,160,160)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="consumption"
                stroke="rgb(104,159,56)"
                fill="rgb(104,159,56)"
                fillOpacity={0.25}
                name="kg"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="rgb(74,74,74)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="rgb(160,160,160)" fontSize={12} />
              <YAxis stroke="rgb(160,160,160)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="revenue" fill="rgb(229,57,53)" name="N$" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Activity</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="rgb(74,74,74)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="rgb(160,160,160)" fontSize={12} />
              <YAxis stroke="rgb(160,160,160)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line
                type="monotone"
                dataKey="devices"
                stroke="rgb(100,181,246)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Growth</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid stroke="rgb(74,74,74)" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="rgb(160,160,160)" fontSize={12} />
              <YAxis stroke="rgb(160,160,160)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="customers"
                stroke="rgb(255,160,0)"
                fill="rgb(255,160,0)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
