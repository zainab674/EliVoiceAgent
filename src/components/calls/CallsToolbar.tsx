
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import TimeRangeSelector from "@/components/dashboard/TimeRangeSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CallsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  resolutionFilter: string;
  onResolutionChange: (value: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export default function CallsToolbar({
  searchQuery,
  onSearchChange,
  resolutionFilter,
  onResolutionChange,
  dateRange,
  onDateRangeChange,
}: CallsToolbarProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-[var(--space-2xl)]">
      <div className="relative">
        <Search className="absolute left-4 top-4 h-4 w-4 text-muted-foreground/70 z-10" />
        <Input
          placeholder="Search by customer name or phone..."
          className="pl-12 text-base font-medium"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div>
        <TimeRangeSelector onRangeChange={onDateRangeChange} />
      </div>
    </div>
  );
}
