"use client";
import { RefreshCw, Search, ChevronDown, ChevronsUpDown, ChevronUp, Info, Bell, AlertCircle, Server, ChevronRight, Activity, Cpu, HardDrive, Network} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import  Link from "next/link";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { addDays, isAfter, isBefore, subDays, format, subHours, subMinutes } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { DeviceMetricsOverview } from "@/app/devices/components/DeviceMetricsOverview";
import { DeviceTimePicker } from "@/app/devices/components/DeviceTimePicker";

interface Device {
  id: string;
  hostname: string;
  ipAddress: string;
  model: string;
  version: string;
  serialNumber: string;
  uptime: string;
  lastUpdate: string;
  status: 'Online' | 'Warning' | 'Offline';
}

type SortConfig = {
  key: keyof Device | null;
  direction: 'asc' | 'desc' | null;
};

const devices: Device[] = [
  {
    id: "1",
    hostname: "csr1000v-1",
    ipAddress: "sandbox-iosxe-latest-1.cisco.com",
    model: "CSR1000V",
    version: "17.3",
    serialNumber: "9ESGOBARV9D",
    uptime: "5 days, 6:27:22",
    lastUpdate: "22.06.2021 16:04:40",
    status: "Online"
  },
  {
    id: "2",
    hostname: "IR1101",
    ipAddress: "10.0.0.69",
    model: "IR1101-K9",
    version: "17.5",
    serialNumber: "FCW23200HFC",
    uptime: "1:23:40",
    lastUpdate: "22.06.2021 14:02:01",
    status: "Online"
  },
  {
    id: "3",
    hostname: "application-10",
    ipAddress: "10.49.213.89",
    model: "C9300-24T",
    version: "16.12",
    serialNumber: "FCW2124L120",
    uptime: "200 days, 4:20:00",
    lastUpdate: "14.06.2021 18:08:32",
    status: "Warning"
  }
];

const timeRangeOptions = [
  { label: "Last 15 minutes", value: "15m", getFn: () => subMinutes(new Date(), 15) },
  { label: "Last 1 hour", value: "1h", getFn: () => subHours(new Date(), 1) },
  { label: "Last 24 hours", value: "24h", getFn: () => subHours(new Date(), 24) },
  { label: "Last 7 days", value: "7d", getFn: () => subDays(new Date(), 7) },
  { label: "Last 30 days", value: "30d", getFn: () => subDays(new Date(), 30) },
];

const cpuData = [
  { time: '22:45', value: 40 },
  { time: '23:00', value: 45 },
  { time: '23:15', value: 42 },
  { time: '23:30', value: 48 },
  { time: '23:45', value: 45 },
];

const loadData = [
  { time: '22:45', value: 0.65 },
  { time: '23:00', value: 0.75 },
  { time: '23:15', value: 0.70 },
  { time: '23:30', value: 0.80 },
  { time: '23:45', value: 0.75 },
];

export default function Devices() {

  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<DateRange | undefined>({
    from: timeRangeOptions[4].getFn(),
    to: new Date(),
  });
  const [selectedRange, setSelectedRange] = useState("30d");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: null,
  });

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    metadata: true,
    alerts: true,
    services: true,
    metrics: true
  });

  const handleTimeRangeChange = (value: string) => {
    const option = timeRangeOptions.find(opt => opt.value === value);
    if (option) {
      setSelectedRange(value);
      setDate({
        from: option.getFn(),
        to: new Date()
      });
    }
  };

  const handleSort = (key: keyof Device) => {
    setSortConfig((current) => {
      if (current.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        if (current.direction === 'desc') {
          return { key: null, direction: null };
        }
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: keyof Device) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-4 h-4 ml-1" />;
    }
    return <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const sortedAndFilteredDevices = useMemo(() => {
    let filtered = devices;

    // Date range filtering
    if (date?.from || date?.to) {
      filtered = filtered.filter(device => {
        const deviceDate = new Date(device.lastUpdate);
        if (date.from && isBefore(deviceDate, date.from)) return false;
        if (date.to && isAfter(deviceDate, addDays(date.to, 1))) return false;
        return true;
      });
    }

    // Search filtering
    if (searchQuery.trim()) {
      return filtered.filter(device => {
        const query = searchQuery.toLowerCase();
        
        // Handle basic field:value queries
        if (query.includes(":")) {
          const [field, value] = query.split(":");
          const trimmedValue = value.trim();
          
          switch (field.trim()) {
            case "hostname":
              return device.hostname.toLowerCase().includes(trimmedValue);
            case "ip":
            case "ipaddress":
              return device.ipAddress.toLowerCase().includes(trimmedValue);
            case "model":
              return device.model.toLowerCase().includes(trimmedValue);
            case "version":
              return device.version.toLowerCase().includes(trimmedValue);
            case "serial":
              return device.serialNumber.toLowerCase().includes(trimmedValue);
            case "status":
              return device.status.toLowerCase().includes(trimmedValue);
            default:
              return false;
          }
        }
        
        // Free text search across all fields
        return (
          device.hostname.toLowerCase().includes(query) ||
          device.ipAddress.toLowerCase().includes(query) ||
          device.model.toLowerCase().includes(query) ||
          device.version.toLowerCase().includes(query) ||
          device.serialNumber.toLowerCase().includes(query) ||
          device.status.toLowerCase().includes(query)
        );
      });
    }

    // Sorting
    if (sortConfig.key && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (sortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [searchQuery, date, sortConfig]);

  return (
    <div className="animate-fade-in">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Devices</h1>
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10 font-mono"
                placeholder='Search devices (e.g., "status:online" or "hostname:csr")'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent className="bg-white border rounded-md shadow-lg">
                <div className="px-2 py-1.5 text-sm font-medium text-gray-500 border-b">Quick select</div>
                {timeRangeOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="hover:bg-gray-100"
                  >
                    {option.label}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-sm font-medium text-gray-500 border-t mt-1">Custom range</div>
                <div className="p-2 bg-white">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className={cn(
                          "flex w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                          "cursor-pointer transition-colors",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "LLL dd, y")} -{" "}
                              {format(date.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(date.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-4 bg-white border rounded-md shadow-lg" 
                      align="start"
                    >
                      <div className="space-y-4">
                        <div className="text-sm font-medium">
                          {date?.from && date?.to ? (
                            <>
                              {format(date.from, "MMM d")} - {format(date.to, "MMM d")}
                            </>
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </div>
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={date?.from}
                          selected={date}
                          onSelect={setDate}
                          numberOfMonths={1}
                          className="rounded-md border shadow-sm"
                          classNames={{
                            months: "space-y-4",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button: cn(
                              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                            ),
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: cn(
                              "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-100",
                              "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                              "focus-within:relative focus-within:z-20 h-9 w-9"
                            ),
                            day: cn(
                              "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                              "hover:bg-gray-100 rounded-md transition-colors",
                              "text-gray-900"
                            ),
                            day_selected:
                              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-gray-100 text-gray-900 font-semibold",
                            day_outside: "text-gray-400",
                            day_disabled: "text-gray-400 opacity-50",
                            day_range_middle:
                              "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                            day_hidden: "invisible",
                          }}
                          disabled={(date) =>
                            isAfter(date, new Date()) ||
                            isBefore(date, subDays(new Date(), 30))
                          }
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead 
                    onClick={() => handleSort('hostname')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Hostname
                      {getSortIcon('hostname')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('ipAddress')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      IP Address
                      {getSortIcon('ipAddress')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('model')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Device Model
                      {getSortIcon('model')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('version')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      IOS XE Version
                      {getSortIcon('version')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('serialNumber')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Serial Number
                      {getSortIcon('serialNumber')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('uptime')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Uptime
                      {getSortIcon('uptime')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('lastUpdate')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Last Database Update
                      {getSortIcon('lastUpdate')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('status')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredDevices.map((device) => (
                  <TableRow 
                    key={device.id}
                    className="hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => {
                      setSelectedDevice(device);
                      setSheetOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">
                      <button 
                        className="text-primary hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDevice(device);
                          setSheetOpen(true);
                        }}
                      >
                        {device.hostname}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{device.ipAddress}</TableCell>
                    <TableCell>{device.model}</TableCell>
                    <TableCell>{device.version}</TableCell>
                    <TableCell className="font-mono text-sm">{device.serialNumber}</TableCell>
                    <TableCell>{device.uptime}</TableCell>
                    <TableCell>{device.lastUpdate}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        device.status === 'Online' ? "bg-success/10 text-success" :
                        device.status === 'Warning' ? "bg-warning/10 text-warning" :
                        "bg-error/10 text-error"
                      )}>
                        {device.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-5xl w-[100vw] overflow-y-auto">
            {selectedDevice && (
              <div className="space-y-8">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl font-semibold">
                      {selectedDevice.hostname}
                    </SheetTitle>
                    <Link 
                      href={`/devices/${selectedDevice.id}`}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                    >
                      <span>View full page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedDevice.ipAddress}
                  </p>
                </SheetHeader>

                <DeviceTimePicker />
                
                <DeviceMetricsOverview />

                <Collapsible 
                  open={openSections.metadata} 
                  onOpenChange={(isOpen) => setOpenSections(prev => ({ ...prev, metadata: isOpen }))}
                >
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <h2 className="text-sm font-semibold">Metadata</h2>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {openSections.metadata ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <Button variant="link" className="ml-auto text-sm" size="sm">
                      Show all
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <CollapsibleContent className="pt-4">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <span className="text-sm text-muted-foreground">Host IP</span>
                        <p className="text-sm font-medium mt-1">N/A</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Host OS version</span>
                        <p className="text-sm font-medium mt-1">N/A</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible 
                  open={openSections.alerts} 
                  onOpenChange={(isOpen) => setOpenSections(prev => ({ ...prev, alerts: isOpen }))}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <h2 className="text-sm font-semibold">Alerts</h2>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      0 active
                    </span>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {openSections.alerts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <div className="flex gap-2 ml-auto">
                      <Button variant="link" className="text-sm" size="sm">
                        Create rule
                      </Button>
                      <Button variant="link" className="text-sm" size="sm">
                        Show all
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <p>No active alerts</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible 
                  open={openSections.services} 
                  onOpenChange={(isOpen) => setOpenSections(prev => ({ ...prev, services: isOpen }))}
                >
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <h2 className="text-sm font-semibold">Services</h2>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {openSections.services ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <Button variant="link" className="ml-auto text-sm" size="sm">
                      Show all
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <p>No services found on this host.</p>
                      <Button variant="link" className="text-sm" size="sm">
                        Troubleshooting
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible 
                  open={openSections.metrics} 
                  onOpenChange={(isOpen) => setOpenSections(prev => ({ ...prev, metrics: isOpen }))}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <h2 className="text-sm font-semibold">Metrics</h2>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {openSections.metrics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-6 pt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Cpu className="h-4 w-4" />
                        <h3 className="text-sm font-semibold">CPU</h3>
                        <Button variant="link" className="ml-auto text-sm" size="sm">
                          Show all
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border">
                          <h4 className="text-sm font-medium mb-4">CPU Usage</h4>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={cpuData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#8884d8" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg border">
                          <h4 className="text-sm font-medium mb-4">Normalized Load</h4>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={loadData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <HardDrive className="h-4 w-4" />
                        <h3 className="text-sm font-semibold">Memory</h3>
                        <Button variant="link" className="ml-auto text-sm" size="sm">
                          Show all
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Network className="h-4 w-4" />
                        <h3 className="text-sm font-semibold">Network</h3>
                        <Button variant="link" className="ml-auto text-sm" size="sm">
                          Show all
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    
  );
}