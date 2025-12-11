import React, { useCallback, memo, useRef } from 'react';
import { Label } from "@/components/ui/label";
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
    odor: 'neutral' | 'fresh' | 'perfume' | 'smoke' | 'mold' | 'other';
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

type InteriorItemProps = {
    label: string;
    value: InteriorCondition;
    fieldKey: keyof InteriorStatus;
    onFieldChange: (key: keyof InteriorStatus, value: InteriorCondition) => void;
    icon: any;
    readOnly?: boolean;
};

const conditionOptions: { value: InteriorCondition; label: string; color: string }[] = [
    { value: 'good', label: 'Good', color: 'bg-emerald-500' },
    { value: 'fair', label: 'Fair', color: 'bg-amber-500' },
    { value: 'poor', label: 'Poor', color: 'bg-orange-500' },
    { value: 'worn', label: 'Worn', color: 'bg-orange-400' },
    { value: 'stained', label: 'Stained', color: 'bg-red-400' },
    { value: 'torn', label: 'Torn', color: 'bg-red-500' },
];

const getConditionStyle = (value: InteriorCondition) => {
    switch (value) {
        case 'good':
            return 'text-emerald-600 border-emerald-300 bg-emerald-50';
        case 'fair':
            return 'text-amber-600 border-amber-300 bg-amber-50';
        default:
            return 'text-red-600 border-red-300 bg-red-50';
    }
};

// Using native select to avoid Radix UI portal scroll issues
const InteriorItem = memo(({
    label,
    value,
    fieldKey,
    onFieldChange,
    icon: Icon,
    readOnly
}: InteriorItemProps) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        e.stopPropagation();
        onFieldChange(fieldKey, e.target.value as InteriorCondition);
    }, [fieldKey, onFieldChange]);

    return (
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 p-3 rounded-xl border border-border/40 bg-card hover:bg-accent/50 transition-all group">
            <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-muted rounded-lg text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium leading-tight">{label}</span>
            </div>
            <select
                value={value}
                onChange={handleChange}
                disabled={readOnly}
                className={cn(
                    "w-[90px] h-8 px-2 text-[11px] font-medium rounded-md border cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "appearance-none bg-no-repeat bg-right badge-print",
                    getConditionStyle(value)
                )}
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                }}
            >
                {conditionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
});
InteriorItem.displayName = 'InteriorItem';

const ODOR_OPTIONS: { value: InteriorStatus['odor']; label: string }[] = [
    { value: 'fresh', label: 'Fresh' },
    { value: 'perfume', label: 'Perfume' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'smoke', label: 'Smoke' },
    { value: 'mold', label: 'Damp' },
    { value: 'other', label: 'Other' },
];

const InteriorChecklist: React.FC<Props> = ({ data, onChange, readOnly }) => {
    // Use ref to always have access to latest data without re-creating callbacks
    const dataRef = useRef(data);
    dataRef.current = data;

    // Single stable callback that uses ref
    const handleFieldChange = useCallback((key: keyof InteriorStatus, value: any) => {
        onChange({ ...dataRef.current, [key]: value });
    }, [onChange]);

    const handleOdorChange = useCallback((odor: string) => {
        if (!readOnly) {
            onChange({ ...dataRef.current, odor: odor as InteriorStatus['odor'] });
        }
    }, [onChange, readOnly]);

    const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange({ ...dataRef.current, notes: e.target.value });
    }, [onChange]);

    const handleSetAllGood = useCallback(() => {
        onChange({
            ...dataRef.current,
            seats: 'good',
            dashboard: 'good',
            headliner: 'good',
            carpets: 'good',
            doorPanels: 'good',
            controls: 'good',
        });
    }, [onChange]);

    const handleClear = useCallback(() => {
        onChange(DEFAULT_INTERIOR_STATUS);
    }, [onChange]);

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
                    fieldKey="seats"
                    onFieldChange={handleFieldChange}
                    icon={Armchair}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Dashboard & Console"
                    value={data.dashboard}
                    fieldKey="dashboard"
                    onFieldChange={handleFieldChange}
                    icon={Gauge}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Headliner / Roof"
                    value={data.headliner}
                    fieldKey="headliner"
                    onFieldChange={handleFieldChange}
                    icon={Maximize}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Carpets & Mats"
                    value={data.carpets}
                    fieldKey="carpets"
                    onFieldChange={handleFieldChange}
                    icon={Footprints}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Door Panels"
                    value={data.doorPanels}
                    fieldKey="doorPanels"
                    onFieldChange={handleFieldChange}
                    icon={DoorOpen}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Buttons & Controls"
                    value={data.controls}
                    fieldKey="controls"
                    onFieldChange={handleFieldChange}
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
                    {ODOR_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleOdorChange(option.value)}
                            disabled={readOnly}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                                data.odor === option.value
                                    ? "bg-luxury text-white border-luxury shadow-md scale-105"
                                    : "bg-background hover:bg-accent border-border text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 mt-auto">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interior Notes</Label>
                <Textarea
                    value={data.notes}
                    onChange={handleNotesChange}
                    placeholder="Describe any specific interior issues..."
                    className="resize-none bg-background/50 min-h-[80px] rounded-xl border-border/50 focus:border-luxury/50"
                    disabled={readOnly}
                />
            </div>
        </div>
    );
};

export default InteriorChecklist;
