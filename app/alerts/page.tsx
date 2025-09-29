"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  MoreVertical,
  CheckCircle2,
  CircleAlert,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  name: string;
  device: string;
  timestamp: string;
  severity: "critical" | "warning" | "info";
  status: "active" | "acknowledged" | "resolved";
  description: string;
}

// Sample data
const alerts: Alert[] = [
  {
    id: "1",
    name: "High CPU Usage",
    device: "core-router-1",
    timestamp: "2024-02-20 15:30:00",
    severity: "critical",
    status: "active",
    description: "CPU usage above 90% for more than 5 minutes",
  },
  {
    id: "2",
    name: "Interface Down",
    device: "edge-switch-3",
    timestamp: "2024-02-20 14:45:00",
    severity: "critical",
    status: "acknowledged",
    description: "Interface GigabitEthernet1/0/24 is down",
  },
  {
    id: "3",
    name: "High Memory Usage",
    device: "core-switch-1",
    timestamp: "2024-02-20 13:15:00",
    severity: "warning",
    status: "active",
    description: "Memory usage above 85% for more than 10 minutes",
  },
  {
    id: "4",
    name: "BGP Neighbor Down",
    device: "edge-router-2",
    timestamp: "2024-02-20 12:30:00",
    severity: "critical",
    status: "resolved",
    description: "BGP neighbor 192.168.1.1 is down",
  },
  {
    id: "5",
    name: "Configuration Change",
    device: "fw-1",
    timestamp: "2024-02-20 11:45:00",
    severity: "info",
    status: "acknowledged",
    description: "Configuration changed by user 'admin'",
  },
  {
    id: "6",
    name: "Link Flapping",
    device: "dist-switch-2",
    timestamp: "2024-02-20 10:30:00",
    severity: "warning",
    status: "active",
    description: "Interface GigabitEthernet1/0/1 flapping detected",
  },
];

export default function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [, setHoveredStatus] = useState<
    "active" | "acknowledged" | "resolved" | null
  >(null);

  // Filter alerts based on current filters
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || alert.status === statusFilter;

    const matchesSeverity =
      severityFilter === "all" || alert.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Count by status and severity for summary
  const counts = {
    active: alerts.filter((a) => a.status === "active").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };

  const handleAcknowledge = (id: string) => {
    console.log(`Acknowledging alert ${id}`);
  };

  const handleResolve = (id: string) => {
    console.log(`Resolving alert ${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Alerts Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage network alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-red-500 text-white px-2.5">
            {counts.active} Active
          </Badge>
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            Configure Notifications
          </Button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Status Overview
            </h3>
            <CircleAlert className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2 flex justify-between items-center">
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={() => setHoveredStatus("active")}
                onMouseLeave={() => setHoveredStatus(null)}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">Active</span>
                <Badge
                  variant="outline"
                  className="ml-2 bg-white text-red-600 border-red-200"
                >
                  {counts.active}
                </Badge>
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={() => setHoveredStatus("acknowledged")}
                onMouseLeave={() => setHoveredStatus(null)}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Acknowledged</span>
                <Badge
                  variant="outline"
                  className="ml-2 bg-white text-blue-600 border-blue-200"
                >
                  {counts.acknowledged}
                </Badge>
              </div>
              <div
                className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={() => setHoveredStatus("resolved")}
                onMouseLeave={() => setHoveredStatus(null)}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Resolved</span>
                <Badge
                  variant="outline"
                  className="ml-2 bg-white text-green-600 border-green-200"
                >
                  {counts.resolved}
                </Badge>
              </div>
            </div>

            <div className="relative h-24 w-24">
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="text-2xl font-bold text-gray-800">
                  {alerts.length}
                </span>
              </div>

              {/* Simplified circular segments without gaps */}
              <div
                className="h-full w-full rounded-full relative overflow-hidden"
                style={{
                  background:
                    alerts.length > 0
                      ? `conic-gradient(
                        #EF4444 0deg ${
                          (counts.active / alerts.length) * 360
                        }deg,
                        #3B82F6 ${(counts.active / alerts.length) * 360}deg ${
                          ((counts.active + counts.acknowledged) /
                            alerts.length) *
                          360
                        }deg,
                        #22C55E ${
                          ((counts.active + counts.acknowledged) /
                            alerts.length) *
                          360
                        }deg 360deg
                      )`
                      : "#E5E7EB",
                }}
              >
                {/* Inner white circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Severity Distribution
            </h3>
            <ShieldAlert className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Critical</span>
                </div>
                <span className="text-sm font-medium">{counts.critical}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-red-500 h-2.5 rounded-full"
                  style={{
                    width: `${(counts.critical / alerts.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Warning</span>
                </div>
                <span className="text-sm font-medium">{counts.warning}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-amber-500 h-2.5 rounded-full"
                  style={{
                    width: `${(counts.warning / alerts.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Info</span>
                </div>
                <span className="text-sm font-medium">{counts.info}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${(counts.info / alerts.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Recent Activity
            </h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2 space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="p-1.5 bg-blue-100 rounded-full text-blue-600">
                <Check className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-sm">
                  <span className="font-medium">Admin</span> acknowledged an
                  alert
                </div>
                <div className="text-xs text-gray-500 mt-0.5">2 hours ago</div>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
              <div className="p-1.5 bg-red-100 rounded-full text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-sm">
                  <span className="font-medium">System</span> created 3 new
                  alerts
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Today at 10:45 AM
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 rounded-full text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-sm">
                  <span className="font-medium">Tech1</span> resolved 5 alerts
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Yesterday</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] border-gray-200 bg-gray-50 focus:bg-white transition-colors">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px] border-gray-200 bg-gray-50 focus:bg-white transition-colors">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions - TODO: Implement bulk selection functionality */}
      {/* {selectedAlerts.length > 0 && (
        <div className="bg-[#5BB6B7]/10 border border-[#5BB6B7]/30 p-3 rounded-lg flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{selectedAlerts.length}</span> alerts
            selected
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-[#5BB6B7] border-[#5BB6B7]/30 hover:bg-[#5BB6B7]/10"
            >
              <Check className="h-4 w-4 mr-1" /> Acknowledge
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-[#5BB6B7] border-[#5BB6B7]/30 hover:bg-[#5BB6B7]/10"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve
            </Button>
          </div>
        </div>
      )} */}

      {/* Alerts Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[80px]">Severity</TableHead>
              <TableHead>Alert</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center bg-gray-50/50"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Search className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-gray-500">
                      No alerts found matching your filters
                    </p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setSeverityFilter("all");
                      }}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map((alert) => (
                <TableRow key={alert.id} className="group hover:bg-gray-50/80">
                  <TableCell>
                    {alert.severity === "critical" && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                    {alert.severity === "warning" && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                    )}
                    {alert.severity === "info" && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        <Info className="h-5 w-5 text-blue-500" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {alert.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {alert.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
                        {alert.device}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {timeSince(alert.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-xs font-medium capitalize",
                        alert.status === "active" &&
                          "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
                        alert.status === "acknowledged" &&
                          "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
                        alert.status === "resolved" &&
                          "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                      )}
                    >
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {alert.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="hidden group-hover:flex items-center h-8 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Ack
                        </Button>
                      )}

                      {(alert.status === "active" ||
                        alert.status === "acknowledged") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolve(alert.id)}
                          className="hidden group-hover:flex items-center h-8 px-2 text-green-600 hover:text-green-800 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="text-gray-700">
                            <Info className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {alert.status === "active" && (
                            <DropdownMenuItem
                              onClick={() => handleAcknowledge(alert.id)}
                              className="text-blue-600"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Acknowledge
                            </DropdownMenuItem>
                          )}

                          {(alert.status === "active" ||
                            alert.status === "acknowledged") && (
                            <DropdownMenuItem
                              onClick={() => handleResolve(alert.id)}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Resolve
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Helper function to display relative time
function timeSince(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return Math.floor(seconds) + " seconds ago";
}
