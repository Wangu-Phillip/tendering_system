import { getStatusBadgeColor } from "@utils/formatters";

interface BadgeProps {
  label: string;
  status: string;
  className?: string;
}

export default function Badge({ label, status, className = "" }: BadgeProps) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(status)} ${className}`}
    >
      {label}
    </span>
  );
}
