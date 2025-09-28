"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { ChartLine, Server, AlertTriangle, Network, ArrowDown, ArrowUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

const networkData = [
  { time: '00:00', traffic: 65, latency: 28 },
  { time: '04:00', traffic: 78, latency: 35 },
  { time: '08:00', traffic: 85, latency: 42 },
  { time: '12:00', traffic: 92, latency: 38 },
  { time: '16:00', traffic: 88, latency: 32 },
  { time: '20:00', traffic: 72, latency: 30 },
  { time: '24:00', traffic: 68, latency: 27 },
];

const deviceData = [
  { name: 'Router-01', status: 'Online', cpu: 75, memory: 65, uptime: '15d 4h' },
  { name: 'Switch-Core', status: 'Online', cpu: 45, memory: 55, uptime: '23d 12h' },
  { name: 'Firewall-Main', status: 'Warning', cpu: 92, memory: 88, uptime: '7d 8h' },
];

const StatsCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  detail 
}: { 
  icon: unknown;
  label: string;
  value: string;
  trend: string;
  detail?: string;
}) => (
  <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
        </div>
      </div>
      <span className={cn(
        "text-sm flex items-center gap-1",
        trend.startsWith("+") ? "text-success" : "text-error"
      )}>
        {trend.startsWith("+") ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        {trend}
      </span>
    </div>
  </div>
);

const DeviceStatusTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="text-left border-b border-gray-200">
          <th className="pb-3 text-sm font-medium text-gray-500">Device</th>
          <th className="pb-3 text-sm font-medium text-gray-500">Status</th>
          <th className="pb-3 text-sm font-medium text-gray-500">CPU</th>
          <th className="pb-3 text-sm font-medium text-gray-500">Memory</th>
          <th className="pb-3 text-sm font-medium text-gray-500">Uptime</th>
        </tr>
      </thead>
      <tbody>
        {deviceData.map((device, i) => (
          <tr key={i} className="border-b border-gray-100 last:border-0">
            <td className="py-3 text-sm">{device.name}</td>
            <td className="py-3">
              <span className={cn(
                "px-2 py-1 text-xs rounded-full",
                device.status === 'Online' ? "bg-success/10 text-success" :
                device.status === 'Warning' ? "bg-warning/10 text-warning" :
                "bg-error/10 text-error"
              )}>
                {device.status}
              </span>
            </td>
            <td className="py-3">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
    className={cn(
                      "h-full rounded-full",
                      device.cpu > 90 ? "bg-error" :
                      device.cpu > 70 ? "bg-warning" :
                      "bg-success"
                    )}
                    style={{ width: `${device.cpu}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{device.cpu}%</span>
              </div>
            </td>
            <td className="py-3">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${device.memory}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{device.memory}%</span>
              </div>
            </td>
            <td className="py-3 text-sm text-gray-600">{device.uptime}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function DashboardLayout() {
  return(
    <div>
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">Network Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            icon={ChartLine}
            label="Network Usage"
            value="86.2%"
            trend="+2.5%"
            detail="8.6 GB/s current throughput"
          />
          <StatsCard 
            icon={Server}
            label="Active Devices"
            value="1,284"
            trend="+12"
            detail="98.5% availability"
          />
          <StatsCard 
            icon={AlertTriangle}
            label="Active Alerts"
            value="23"
            trend="-5"
            detail="4 critical, 19 warnings"
          />
          <StatsCard 
            icon={Network}
            label="Avg. Latency"
            value="42ms"
            trend="+3ms"
            detail="Peak: 67ms at 14:30"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Network Traffic</h2>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-primary/80" />
                  Traffic
                </span>
                <span className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                  Latency
                </span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={networkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="traffic" 
                    stroke="#6366F1" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Device Health</h2>
              <span className="text-sm text-gray-500">Last updated: 2 mins ago</span>
            </div>
            <DeviceStatusTable />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Active Alerts</h2>
            <button className="text-sm text-primary hover:text-primary/80">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { type: 'critical', message: 'High CPU Usage - Firewall-Main', time: '2m ago' },
              { type: 'warning', message: 'Memory Usage Above 80% - Router-01', time: '15m ago' },
              { type: 'warning', message: 'High Network Latency - Switch-Core', time: '23m ago' }
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    alert.type === 'critical' ? "bg-error" : "bg-warning"
                  )} />
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
                <span className="text-sm text-gray-500">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
