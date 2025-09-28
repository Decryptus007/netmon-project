
import { Activity, Cpu, HardDrive } from "lucide-react";
import { DeviceMetricsCard } from "./DeviceMetricsCard";

export const DeviceMetricsOverview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <DeviceMetricsCard
        title="CPU Usage"
        value="N/A"
        subtitle="Average"
        icon={Cpu}
      />
      <DeviceMetricsCard
        title="Normalized Load"
        value="N/A"
        subtitle="Average"
        icon={Activity}
      />
      <DeviceMetricsCard
        title="Memory Usage"
        value="N/A"
        subtitle="Average"
        icon={HardDrive}
      />
      <DeviceMetricsCard
        title="Disk Usage"
        value="N/A"
        subtitle="Max"
        icon={HardDrive}
      />
    </div>
  );
};