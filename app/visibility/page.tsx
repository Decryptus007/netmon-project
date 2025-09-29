"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { RefreshCw, Search, Download } from "lucide-react";
import dynamic from "next/dynamic";

// Types for flow data

interface FlowSource {
  ip?: string;
  port?: number;
  protocol?: string;
  bytes: number;
  percentage: number;
  count: number;
}

interface TimeSeriesRecord {
  timestamp: string;
  sourceData: Record<string, number>;
  destData: Record<string, number>;
}

interface Exporter {
  id: string;
  name: string;
  ipAddress: string;
  type: string;
  version: string;
  recordsExported: number;
  status: string;
  lastSeen: string;
  uptime: number;
}

interface GeoRecord {
  countryName: string;
  countryCode: string;
  incoming: number;
  outgoing: number;
  latitude: number;
  longitude: number;
  totalBytes: number;
}

interface FlowRecord {
  id: string;
  bytes: number;
  packets: number;
  sourcePort: number;
  destPort: number;
  protocol: string;
  startTime: string;
  source: string;
  destination: string;
}

interface FlowData {
  metrics: {
    sourceCount: number;
    destinationCount: number;
    sourcePortCount: number;
    destinationPortCount: number;
    totalBytes: number;
    totalPackets: number;
  };
  sources: FlowSource[];
  destinations: FlowSource[];
  sourcePorts: FlowSource[];
  destinationPorts: FlowSource[];
  timeSeriesData: TimeSeriesRecord[];
  conversations: FlowRecord[];
  exporters: Exporter[];
  geoData: GeoRecord[];
}

// Create empty initial data
const emptyInitialData: FlowData = {
  metrics: {
    sourceCount: 0,
    destinationCount: 0,
    sourcePortCount: 0,
    destinationPortCount: 0,
    totalBytes: 0,
    totalPackets: 0,
  },
  sources: [],
  destinations: [],
  sourcePorts: [],
  destinationPorts: [],
  timeSeriesData: [],
  conversations: [],
  exporters: [],
  geoData: [],
};

// Dashboard components
const MetricCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) => (
  <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <div className="mt-1 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
      {subtitle && <p className="ml-2 text-sm text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

const COLORS = [
  "#36A2EB",
  "#FF6384",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8AC6D1",
  "#F1948A",
  "#58D68D",
  "#BB8FCE",
];

const PieChartCard = ({
  title,
  data,
  dataKey,
  nameKey,
  valueFormatter,
}: {
  title: string;
  data: unknown[];
  dataKey: string;
  nameKey: string;
  valueFormatter?: (value: number) => string;
}) => (
  <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100 flex flex-col h-full">
    <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
    <div className="flex-grow">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
            label={false}
            labelLine={false}
            isAnimationActive={false}
            legendType="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) =>
              valueFormatter ? valueFormatter(value) : value.toString()
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
      {data.slice(0, 6).map((entry, index) => (
        <div key={index} className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-1"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          ></div>
          <span className="truncate">
            {(entry as Record<string, unknown>)[nameKey] as string}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const AreaChartCard = ({
  title,
  data,
  keys,
  colors,
}: {
  title: string;
  data: unknown[];
  keys: string[];
  colors: string[];
}) => (
  <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100 flex flex-col h-full">
    <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
    <div className="flex-grow">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(tick) => {
              const date = new Date(tick);
              return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
            }}
            minTickGap={30}
          />
          <YAxis tickFormatter={(tick) => `${Math.round(tick / 1024)} KB`} />
          <Tooltip
            formatter={(value: number) => [
              `${(value / 1024).toFixed(2)} KB`,
              "",
            ]}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
            }}
          />
          {keys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
      {keys.map((key, index) => (
        <div key={index} className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-1"
            style={{ backgroundColor: colors[index % colors.length] }}
          ></div>
          <span className="truncate">{key}</span>
        </div>
      ))}
    </div>
  </div>
);

// Process time series data
const processTimeSeriesData = (
  data: TimeSeriesRecord[] = [],
  type: "source" | "dest"
) => {
  // Add a safety check to handle undefined or empty data
  if (!data || data.length === 0) {
    return { data: [], keys: [] };
  }

  // Extract all unique keys (IPs) from the time series
  const keys = Array.from(
    new Set(
      data.flatMap((point) =>
        Object.keys(type === "source" ? point.sourceData : point.destData)
      )
    )
  );

  // Format data for stacked area chart
  const formattedData = data.map((point) => {
    const formattedPoint: Record<string, unknown> = {
      timestamp: point.timestamp,
    };

    // Add value for each IP
    keys.forEach((key) => {
      formattedPoint[key] =
        (type === "source" ? point.sourceData : point.destData)[key] || 0;
    });

    return formattedPoint;
  });

  return { data: formattedData, keys };
};

// Conversation Partners Tab
const ConversationPartnersTab = ({ data }: { data: FlowRecord[] }) => {
  const safeData = data;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
        <div className="flex justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700">
            Conversation Partners
          </h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md flex items-center gap-1 text-gray-600">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Source
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Destination
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Bytes
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Packets
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Protocol
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Start Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeData.map((conversation) => (
                <tr key={conversation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {conversation.source}:{conversation.sourcePort}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversation.destination}:{conversation.destPort}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversation.bytes
                      ? conversation.bytes.toLocaleString()
                      : "0"}{" "}
                    B
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversation.packets
                      ? conversation.packets.toLocaleString()
                      : "0"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversation.protocol || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversation.startTime
                      ? new Date(conversation.startTime).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Traffic Analysis Tab
const TrafficAnalysisTab = ({ data }: { data: FlowData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
        <div className="flex justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700">
            Traffic Analysis
          </h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md flex items-center gap-1 text-gray-600">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Source
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Destination
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Protocol
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Bytes
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Packets
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.timeSeriesData.map((record: TimeSeriesRecord) => {
                const timestamp = new Date(record.timestamp);

                return (
                  <tr key={record.timestamp}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {timestamp.toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Object.keys(record.sourceData).join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Object.keys(record.destData).join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Object.values(record.sourceData).length > 0
                        ? Object.values(record.sourceData)
                            .map((value) => {
                              const protocol = Object.keys(
                                record.sourceData
                              ).find((key) => record.sourceData[key] === value);
                              return protocol ? protocol : "";
                            })
                            .join(", ")
                        : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Object.values(record.sourceData)
                        .reduce((sum, value) => sum + value, 0)
                        .toLocaleString()}{" "}
                      B
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Object.values(record.sourceData).length.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Top-N Analysis Tab
const TopNAnalysisTab = ({ data }: { data: FlowData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
        <div className="flex justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700">
            Top-N Analysis
          </h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md flex items-center gap-1 text-gray-600">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Partner
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Bytes
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Packets
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.sources.slice(0, 10).map((partner: FlowSource) => {
                const key =
                  partner.ip ||
                  partner.port?.toString() ||
                  `partner-${Math.random()}`;
                const displayName =
                  partner.ip || partner.port?.toString() || "unknown";
                return (
                  <tr key={key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {displayName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {partner.bytes.toLocaleString()} B
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {partner.count.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Geo Location Tab
const GeoLocationTab = ({ data }: { data: GeoRecord[] }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
        <div className="flex justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700">Geo Location</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md flex items-center gap-1 text-gray-600">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Country
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Incoming Traffic
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Outgoing Traffic
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((record: GeoRecord) => {
                return (
                  <tr key={record.countryName}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.countryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.incoming.toLocaleString()} B
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.outgoing.toLocaleString()} B
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Flow Exporters Tab
const FlowExportersTab = ({ data }: { data: Exporter[] }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
        <div className="flex justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700">
            Flow Exporters
          </h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md flex items-center gap-1 text-gray-600">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  IP Address
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Version
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Records
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((exporter) => {
                const lastSeen = new Date(exporter.lastSeen);

                // Format uptime in days, hours, minutes
                const uptimeDays = Math.floor(exporter.uptime / 86400);
                const uptimeHours = Math.floor(
                  (exporter.uptime % 86400) / 3600
                );
                const uptimeMinutes = Math.floor((exporter.uptime % 3600) / 60);
                const uptimeFormatted = `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`;

                return (
                  <tr key={exporter.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {exporter.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exporter.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exporter.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exporter.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exporter.recordsExported.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          exporter.status === "active"
                            ? "bg-green-100 text-green-800"
                            : exporter.status === "warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {exporter.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{lastSeen.toLocaleTimeString()}</div>
                      <div className="text-xs">{uptimeFormatted}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Records by Exporter
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString(),
                  "Records",
                ]}
              />
              <Bar dataKey="recordsExported" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Exporter Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Active",
                    value: data.filter((e) => e.status === "active").length,
                  },
                  {
                    name: "Warning",
                    value: data.filter((e) => e.status === "warning").length,
                  },
                  {
                    name: "Inactive",
                    value: data.filter((e) => e.status === "inactive").length,
                  },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#4BC0C0" />
                <Cell fill="#FFCE56" />
                <Cell fill="#FF6384" />
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toString(), "Exporters"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Raw Flow Records Tab Component
const RawFlowRecordsTab = ({ data }: { data: FlowSource[] }) => {
  const safeData = data;
  const [searchTerm, setSearchTerm] = useState("");

  // Generate some example flow records from the provided data
  const flowRecords = safeData.slice(0, 50).map((source, i) => {
    // Use data passed through props instead of global sourcesData
    return {
      id: `flow-${i}`,
      timestamp: new Date(
        Date.now() - Math.floor(Math.random() * 3600000)
      ).toISOString(),
      sourceIP: source.ip || source.port?.toString() || "unknown",
      sourcePort: Math.floor(Math.random() * 65535) + 1,
      destIP: `10.12.190.${Math.floor(Math.random() * 254) + 1}`,
      destPort: [80, 443, 22, 53, 8080, 3389][Math.floor(Math.random() * 6)],
      protocol: ["TCP", "UDP", "ICMP"][Math.floor(Math.random() * 3)],
      bytes: Math.floor(Math.random() * 10000) + 100,
      packets: Math.floor(Math.random() * 100) + 1,
      flags: ["SYN", "ACK", "SYN-ACK", "FIN", "RST"][
        Math.floor(Math.random() * 5)
      ],
    };
  });

  // Filter records based on search term
  const filteredRecords = flowRecords.filter(
    (record) =>
      record.sourceIP.includes(searchTerm) ||
      record.destIP.includes(searchTerm) ||
      record.protocol.includes(searchTerm.toUpperCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
        <div className="flex justify-between mb-4">
          <h3 className="text-base font-medium text-gray-700">
            Raw Flow Records
          </h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search flows..."
                className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-md w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md flex items-center gap-1 text-gray-600">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
            <button className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md flex items-center gap-1 text-gray-600">
              <Download className="h-3 w-3" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Source IP:Port
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Destination IP:Port
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Protocol
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Bytes
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Packets
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Flags
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.sourceIP}:{record.sourcePort}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.destIP}:{record.destPort}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.protocol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.bytes.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.packets.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.flags}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Move the generation functions inside the main component
export default function FlowVisibilityPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [flowData, setFlowData] = useState(emptyInitialData);
  const [isLoading, setIsLoading] = useState(true);

  // This will only run on the client after hydration
  useEffect(() => {
    const generateData = () => {
      // Helper functions
      const generateSourceDestData = (count: number, prefix: string) => {
        return Array.from({ length: count }, (_, i) => {
          const num = i + 1;
          const ip = `${prefix}.${num}`;
          const bytes = Math.floor(Math.random() * 1000000) + 10000;
          const percentage = 0; // Will be calculated later
          const count = Math.floor(Math.random() * 1000) + 100;
          return { ip, bytes, percentage, count };
        }).sort((a, b) => b.bytes - a.bytes);
      };

      const calculatePercentages = (items: FlowSource[]) => {
        const total = items.reduce((sum, item) => sum + item.bytes, 0);
        return items.map((item) => ({
          ...item,
          percentage: Number(((item.bytes / total) * 100).toFixed(2)),
        }));
      };

      // Generate the data
      const sourcesData = calculatePercentages(
        generateSourceDestData(8, "172.20.20")
      );
      const destinationsData = calculatePercentages(
        generateSourceDestData(8, "10.12.190")
      );
      const sourcePortsData = calculatePercentages(
        Array.from({ length: 6 }, (_, i) => ({
          port: [80, 443, 22, 53, 8080, 3389][i],
          protocol: ["HTTP", "HTTPS", "SSH", "DNS", "HTTP-ALT", "RDP"][i],
          bytes: Math.floor(Math.random() * 1000000) + 10000,
          percentage: 0,
          count: Math.floor(Math.random() * 1000) + 100,
        }))
      );
      const destinationPortsData = calculatePercentages(
        Array.from({ length: 6 }, (_, i) => ({
          port: [80, 443, 22, 53, 8080, 3389][i],
          protocol: ["HTTP", "HTTPS", "SSH", "DNS", "HTTP-ALT", "RDP"][i],
          bytes: Math.floor(Math.random() * 1000000) + 10000,
          percentage: 0,
          count: Math.floor(Math.random() * 1000) + 100,
        }))
      );

      // Create time series data
      const createTimeSeriesData = () => {
        return Array.from({ length: 24 }, (_, i) => {
          const date = new Date();
          date.setHours(date.getHours() - 24 + i);

          // Generate data for each source and destination
          const sourceData: { [key: string]: number } = {};
          const destData: { [key: string]: number } = {};

          sourcesData.slice(0, 5).forEach((source) => {
            if (source.ip) {
              sourceData[source.ip] = Math.floor(Math.random() * 30000) + 5000;
            }
          });

          destinationsData.slice(0, 5).forEach((dest) => {
            if (dest.ip) {
              destData[dest.ip] = Math.floor(Math.random() * 30000) + 5000;
            }
          });

          return {
            timestamp: date.toISOString(),
            sourceData,
            destData,
          };
        });
      };

      // Create conversations data
      const generateConversations = () => {
        return Array.from({ length: 20 }, (_, i) => {
          const source =
            sourcesData[Math.floor(Math.random() * sourcesData.length)].ip;
          const destination =
            destinationsData[
              Math.floor(Math.random() * destinationsData.length)
            ].ip;
          // ... rest of the conversation generation logic
          return {
            id: `conv-${i}`,
            source,
            destination,
            sourcePort: [80, 443, 22, 53, 8080, 3389][
              Math.floor(Math.random() * 6)
            ],
            destPort: [80, 443, 22, 53, 8080, 3389][
              Math.floor(Math.random() * 6)
            ],
            protocol: ["TCP", "UDP", "ICMP"][Math.floor(Math.random() * 3)],
            bytes: Math.floor(Math.random() * 10000000) + 50000,
            packets: Math.floor(Math.random() * 50000) + 1000,
            flows: Math.floor(Math.random() * 500) + 10,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
          };
        });
      };

      // Generate exporters and geo data similarly
      const mockConversations = generateConversations();
      const mockExporters = generateExporterData();
      const mockGeoData = generateGeoData();

      return {
        metrics: {
          sourceCount: 1300,
          destinationCount: 1300,
          sourcePortCount: 1280,
          destinationPortCount: 1280,
          totalBytes: 247104202,
          totalPackets: 1543982,
        },
        sources: sourcesData,
        destinations: destinationsData,
        sourcePorts: sourcePortsData,
        destinationPorts: destinationPortsData,
        timeSeriesData: createTimeSeriesData(),
        conversations: mockConversations,
        exporters: mockExporters,
        geoData: mockGeoData,
      };
    };

    setIsLoading(true);
    setTimeout(() => {
      try {
        const data = generateData();
        setFlowData(data as typeof flowData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error generating data:", error);
        setIsLoading(false);
      }
    }, 500);
  }, []);

  // Process time series data (only if data is loaded)
  const sourceTimeSeriesData = !isLoading
    ? processTimeSeriesData(flowData.timeSeriesData, "source")
    : { data: [], keys: [] };
  const destTimeSeriesData = !isLoading
    ? processTimeSeriesData(flowData.timeSeriesData, "dest")
    : { data: [], keys: [] };

  return (
    <div className="p-5">
      {/* Your existing JSX, but add loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <div className="text-sm text-gray-600">Loading flow data...</div>
          </div>
        </div>
      ) : (
        <div className="border-b border-gray-200 mb-5">
          <h1 className="text-2xl font-bold mb-4">Network Flow Visibility</h1>
          <div className="flex space-x-6 text-sm mb-2 overflow-x-auto">
            <button
              className={`py-2 px-1 font-medium border-b-2 ${
                activeTab === "overview"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`py-2 px-1 font-medium border-b-2 ${
                activeTab === "conversation"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent"
              }`}
              onClick={() => setActiveTab("conversation")}
            >
              Conversation Partners
            </button>
            <button
              className={`py-2 px-1 font-medium border-b-2 ${
                activeTab === "traffic"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent"
              }`}
              onClick={() => setActiveTab("traffic")}
            >
              Traffic Analysis
            </button>
            <button
              className={`py-2 px-1 font-medium border-b-2 ${
                activeTab === "topn"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent"
              }`}
              onClick={() => setActiveTab("topn")}
            >
              Top-N
            </button>
            <button
              className={`py-2 px-1 font-medium border-b-2 ${
                activeTab === "geo"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent"
              }`}
              onClick={() => setActiveTab("geo")}
            >
              Geo Location
            </button>
            <button
              className={`py-2 px-1 font-medium border-b-2 ${
                activeTab === "exporters"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent"
              }`}
              onClick={() => setActiveTab("exporters")}
            >
              Flow Exporters
            </button>
            <button
              className={`py-2 px-1 font-medium border-b-2 ${
                activeTab === "raw"
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent"
              }`}
              onClick={() => setActiveTab("raw")}
            >
              Raw Flow Records
            </button>
          </div>
        </div>
      )}

      {/* Render appropriate tab content */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <MetricCard
              title="Source Count"
              value={flowData.metrics.sourceCount.toLocaleString()}
              subtitle=""
            />
            <MetricCard
              title="Destination Count"
              value={flowData.metrics.destinationCount.toLocaleString()}
              subtitle=""
            />
            <MetricCard
              title="Source Ports"
              value={flowData.metrics.sourcePortCount.toLocaleString()}
              subtitle=""
            />
            <MetricCard
              title="Destination Ports"
              value={flowData.metrics.destinationPortCount.toLocaleString()}
              subtitle=""
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <PieChartCard
              title="Sources (bytes)"
              data={flowData.sources}
              dataKey="bytes"
              nameKey="ip"
              valueFormatter={(value) =>
                `${(value / (1024 * 1024)).toFixed(2)} MB`
              }
            />
            <PieChartCard
              title="Source Ports (bytes)"
              data={flowData.sourcePorts}
              dataKey="bytes"
              nameKey="port"
              valueFormatter={(value) => `${(value / 1024).toFixed(2)} KB`}
            />
            <PieChartCard
              title="Destination (bytes)"
              data={flowData.destinations}
              dataKey="bytes"
              nameKey="ip"
              valueFormatter={(value) =>
                `${(value / (1024 * 1024)).toFixed(2)} MB`
              }
            />
            <PieChartCard
              title="Destination Ports (bytes)"
              data={flowData.destinationPorts}
              dataKey="bytes"
              nameKey="port"
              valueFormatter={(value) => `${(value / 1024).toFixed(2)} KB`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <AreaChartCard
              title="Sources (bytes)"
              data={sourceTimeSeriesData.data}
              keys={sourceTimeSeriesData.keys}
              colors={COLORS}
            />
            <AreaChartCard
              title="Destinations (bytes)"
              data={destTimeSeriesData.data}
              keys={destTimeSeriesData.keys}
              colors={COLORS}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BarChartWithIPs
              title="Sources (packets)"
              data={flowData.sources}
              dataKey="count"
              color="#8884d8"
            />

            <BarChartWithIPs
              title="Destinations (packets)"
              data={flowData.destinations}
              dataKey="count"
              color="#82ca9d"
            />
          </div>

          <div className="mb-5">
            <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
              <h3 className="text-base font-medium text-gray-700 mb-4">
                Destination Geo Location Heatmap
              </h3>
              <div className="h-[400px] w-full">
                <GeoLocationMap data={flowData.geoData} />
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "conversation" &&
        (flowData.conversations ? (
          <ConversationPartnersTab data={flowData.conversations} />
        ) : (
          <div className="text-center py-10 text-gray-500">
            No conversation data available
          </div>
        ))}
      {activeTab === "traffic" && <TrafficAnalysisTab data={flowData} />}
      {activeTab === "topn" && <TopNAnalysisTab data={flowData} />}
      {activeTab === "geo" &&
        (flowData.geoData ? (
          <GeoLocationTab data={flowData.geoData} />
        ) : (
          <div className="text-center py-10 text-gray-500">
            No geographic data available
          </div>
        ))}
      {activeTab === "exporters" &&
        (flowData.exporters ? (
          <FlowExportersTab data={flowData.exporters} />
        ) : (
          <div className="text-center py-10 text-gray-500">
            No exporter data available
          </div>
        ))}
      {activeTab === "raw" &&
        (flowData.sources ? (
          <RawFlowRecordsTab data={flowData.sources} />
        ) : (
          <div className="text-center py-10 text-gray-500">
            No flow records available
          </div>
        ))}
    </div>
  );
}

// Inside the useEffect generateData function
const generateExporterData = () => {
  const exporterTypes = ["Router", "Switch", "Firewall", "Dedicated Probe"];
  const deviceNames = [
    "core-rtr-01",
    "edge-fw-02",
    "dist-sw-03",
    "probe-nf-01",
    "branch-rtr-05",
  ];

  return Array.from({ length: 5 }, (_, i) => {
    const name = deviceNames[i];
    const type =
      exporterTypes[Math.floor(Math.random() * exporterTypes.length)];
    const ipOctet = Math.floor(Math.random() * 250) + 1;
    const ipAddress = `192.168.1.${ipOctet}`;
    const recordsExported = Math.floor(Math.random() * 1000000) + 50000;
    const status = ["active", "active", "active", "warning", "inactive"][
      Math.floor(Math.random() * 5)
    ];
    const lastSeen = new Date(
      Date.now() - Math.floor(Math.random() * 3600000)
    ).toISOString();
    const uptime = Math.floor(Math.random() * 30 * 86400) + 86400; // 1-30 days in seconds
    const version = `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(
      Math.random() * 10
    )}`;

    return {
      id: `exporter-${i}`,
      name,
      ipAddress,
      type,
      version,
      recordsExported,
      status,
      lastSeen,
      uptime,
    };
  });
};

const generateGeoData = () => {
  const countries = [
    { name: "United States", code: "US", lat: 37.0902, lng: -95.7129 },
    { name: "United Kingdom", code: "GB", lat: 55.3781, lng: -3.436 },
    { name: "Germany", code: "DE", lat: 51.1657, lng: 10.4515 },
    { name: "Japan", code: "JP", lat: 36.2048, lng: 138.2529 },
    { name: "Australia", code: "AU", lat: -25.2744, lng: 133.7751 },
    { name: "China", code: "CN", lat: 35.8617, lng: 104.1954 },
    { name: "Brazil", code: "BR", lat: -14.235, lng: -51.9253 },
    { name: "India", code: "IN", lat: 20.5937, lng: 78.9629 },
  ];

  return countries.map((country) => {
    const incoming = Math.floor(Math.random() * 50000000) + 1000000;
    const outgoing = Math.floor(Math.random() * 50000000) + 1000000;
    return {
      countryCode: country.code,
      countryName: country.name,
      latitude: country.lat,
      longitude: country.lng,
      incoming,
      outgoing,
      totalBytes: incoming + outgoing,
    };
  });
};

// Enhance bar charts for IP addresses
const BarChartWithIPs = ({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: FlowSource[];
  dataKey: string;
  color: string;
}) => {
  // Since this component is only used with sources/destinations (which have ip), use "ip"
  const xAxisDataKey = "ip";

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisDataKey}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickFormatter={(value) => value.toLocaleString()} />
          <Tooltip formatter={(value) => [value.toLocaleString(), "Packets"]} />
          <Bar dataKey={dataKey} fill={color} name="Packets" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Dynamically import the map component to avoid SSR issues with browser-only libraries
const GeoLocationMap = dynamic(() => import("@/components/geo-location-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-md">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});
