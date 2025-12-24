import React from 'react';
import { Button } from "@/components/ui/button";
import { presets } from "./presets";
import { cn } from "@/lib/utils";

interface PresetSelectorProps {
    selectedPreset: string;
    onPresetChange: (value: string) => void;
}

export function PresetSelector({ selectedPreset, onPresetChange }: PresetSelectorProps) {
    return (
        <div className="flex flex-col space-y-2 w-40">
            <h4 className="font-medium text-sm mb-2 text-foreground/80">Presets</h4>
            <div className="flex flex-col gap-1">
                {presets.map((preset) => (
                    <Button
                        key={preset.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => onPresetChange(preset.value)}
                        className={cn(
                            "justify-start h-8 px-2 font-normal hover:bg-primary/10 hover:text-primary transition-colors text-left",
                            selectedPreset === preset.value && "bg-primary/15 text-primary font-medium"
                        )}
                    >
                        {preset.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
