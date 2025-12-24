import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface ComparisonSelectorProps {
    comparisonType: string;
    onComparisonTypeChange: (value: string) => void;
    selectingCompareRange: boolean;
    onToggleCompareRangeSelect: () => void;
    compareWith?: { from: Date; to: Date };
}

export function ComparisonSelector({
    comparisonType,
    onComparisonTypeChange,
    selectingCompareRange,
    onToggleCompareRangeSelect,
    compareWith
}: ComparisonSelectorProps) {
    return (
        <div className="mt-4 space-y-3">
            <div className="space-y-2">
                <Label>Compare with</Label>
                <Select value={comparisonType} onValueChange={onComparisonTypeChange}>
                    <SelectTrigger className="liquid-input">
                        <SelectValue placeholder="Select comparison" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="previous_period">Previous period</SelectItem>
                        <SelectItem value="previous_year">Previous year</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {comparisonType === 'custom' && (
                <div className="flex flex-col gap-2 mt-2">
                    <Button
                        variant={selectingCompareRange ? "default" : "outline"}
                        size="sm"
                        onClick={onToggleCompareRangeSelect}
                        className="w-full text-xs btn-glass-light"
                    >
                        {selectingCompareRange ? "Selecting range..." : "Select custom range"}
                    </Button>

                    {compareWith?.from && compareWith?.to && (
                        <div className="text-xs text-muted-foreground text-center">
                            {format(compareWith.from, "MMM d, yyyy")} - {format(compareWith.to, "MMM d, yyyy")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
