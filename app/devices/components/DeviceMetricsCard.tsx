
import { LucideIcon } from "lucide-react";

interface DeviceMetricsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
}

export const DeviceMetricsCard = ({
  title,
  value,
  subtitle,
  icon: Icon
}: DeviceMetricsCardProps) => {
  return (
    <div className="p-4 bg-white rounded-lg border space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
};