import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import {
    Armchair,
    Gauge,
    Sparkles,
    CheckCircle2,
    Trash2,
    Maximize,
    Footprints,
    DoorOpen,
    ToggleLeft
} from 'lucide-react';

export type InteriorCondition = 'good' | 'fair' | 'poor' | 'stained' | 'torn' | 'worn';

export type InteriorStatus = {
    seats: InteriorCondition;
    dashboard: InteriorCondition;
    headliner: InteriorCondition;
    carpets: InteriorCondition;
    doorPanels: InteriorCondition;
    controls: InteriorCondition;
    odor: 'neutral' | 'smoke' | 'mold' | 'other';
    notes: string;
};

export const DEFAULT_INTERIOR_STATUS: InteriorStatus = {
    seats: 'good',
    dashboard: 'good',
    headliner: 'good',
    carpets: 'good',
    doorPanels: 'good',
    controls: 'good',
    odor: 'neutral',
    notes: '',
};

type Props = {
    data: InteriorStatus;
    onChange: (data: InteriorStatus) => void;
    readOnly?: boolean;
};

const InteriorItem = ({
    label,
    value,
    onChange,
    icon: Icon,
    readOnly
}: {
    label: string;
    value: InteriorCondition;
    onChange: (val: InteriorCondition) => void;
    icon: any;
    readOnly?: boolean;
}) => (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/50 transition-all group">
        <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium truncate">{label}</span>
        </div>
        <Select value={value} onValueChange={(val) => onChange(val as InteriorCondition)} disabled={readOnly}>
            <SelectTrigger type="button" className={cn(
                "w-[140px] h-9 text-xs font-medium transition-all",
                value === 'good' ? "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100/50" :
                    value === 'fair' ? "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100/50" :
                        "text-red-600 border-red-200 bg-red-50 hover:bg-red-100/50"
            )}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="good">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Good
                    </div>
                </SelectItem>
                <SelectItem value="fair">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Fair
                    </div>
                </SelectItem>
                <SelectItem value="poor">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        Poor
                    </div>
                </SelectItem>
                <SelectItem value="worn">Worn</SelectItem>
                <SelectItem value="stained">Stained</SelectItem>
                <SelectItem value="torn">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Torn
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    </div>
);

const InteriorChecklist: React.FC<Props> = ({ data, onChange, readOnly }) => {
    console.log('InteriorChecklist render');
    const updateField = (key: keyof InteriorStatus, value: any) => {
        onChange({ ...data, [key]: value });
    };

    const handleSetAllGood = () => {
        onChange({
            ...data,
            seats: 'good',
            dashboard: 'good',
            headliner: 'good',
            carpets: 'good',
            doorPanels: 'good',
            controls: 'good',
        });
    };

    const handleClear = () => {
        onChange(DEFAULT_INTERIOR_STATUS);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-luxury/10 rounded-xl text-luxury">
                        <Armchair className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Interior Condition</h3>
                        <p className="text-xs text-muted-foreground">Cabin & Upholstery</p>
                    </div>
                </div>
                {!readOnly && (
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" variant="outline" size="icon" onClick={handleSetAllGood} className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Set All to Good</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" variant="outline" size="icon" onClick={handleClear} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reset</TooltipContent>
                        </Tooltip>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InteriorItem
                    label="Seats / Upholstery"
                    value={data.seats}
                    onChange={(v) => updateField('seats', v)}
                    icon={Armchair}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Dashboard & Console"
                    value={data.dashboard}
                    onChange={(v) => updateField('dashboard', v)}
                    icon={Gauge}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Headliner / Roof"
                    value={data.headliner}
                    onChange={(v) => updateField('headliner', v)}
                    icon={Maximize}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Carpets & Mats"
                    value={data.carpets}
                    onChange={(v) => updateField('carpets', v)}
                    icon={Footprints}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Door Panels"
                    value={data.doorPanels}
                    onChange={(v) => updateField('doorPanels', v)}
                    icon={DoorOpen}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Buttons & Controls"
                    value={data.controls}
                    onChange={(v) => updateField('controls', v)}
                    icon={ToggleLeft}
                    readOnly={readOnly}
                />
            </div>

            <div className="bg-muted/30 p-4 rounded-2xl space-y-3 border border-border/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-luxury" />
                    Odor Check
                </div>
                <div className="flex flex-wrap gap-2">
                    {['neutral', 'smoke', 'mold', 'other'].map((odor) => (
                        <button
                            key={odor}
                            type="button"
                            onClick={() => !readOnly && updateField('odor', odor)}
                            disabled={readOnly}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                                data.odor === odor
                                    ? "bg-luxury text-white border-luxury shadow-md scale-105"
                                    : "bg-background hover:bg-accent border-border text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {odor.charAt(0).toUpperCase() + odor.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 mt-auto">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interior Notes</Label>
                <Textarea
                    value={data.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Describe any specific interior issues..."
                    className="resize-none bg-background/50 min-h-[80px] rounded-xl border-border/50 focus:border-luxury/50"
                    disabled={readOnly}
                />
            </div>
        </div>
    );
};

export default InteriorChecklist;
