import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import { Armchair, Gauge, Sparkles } from 'lucide-react';

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
    readOnly
}: {
    label: string;
    value: InteriorCondition;
    onChange: (val: InteriorCondition) => void;
    readOnly?: boolean;
}) => (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <span className="text-sm font-medium">{label}</span>
        <Select value={value} onValueChange={(val) => onChange(val as InteriorCondition)} disabled={readOnly}>
            <SelectTrigger className={cn(
                "w-[120px] h-8 text-xs",
                value === 'good' ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
                    value === 'fair' ? "text-amber-600 border-amber-200 bg-amber-50" :
                        "text-red-600 border-red-200 bg-red-50"
            )}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="worn">Worn</SelectItem>
                <SelectItem value="stained">Stained</SelectItem>
                <SelectItem value="torn">Torn</SelectItem>
            </SelectContent>
        </Select>
    </div>
);

const InteriorChecklist: React.FC<Props> = ({ data, onChange, readOnly }) => {
    const updateField = (key: keyof InteriorStatus, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <InteriorItem
                    label="Seats / Upholstery"
                    value={data.seats}
                    onChange={(v) => updateField('seats', v)}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Dashboard & Console"
                    value={data.dashboard}
                    onChange={(v) => updateField('dashboard', v)}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Headliner / Roof"
                    value={data.headliner}
                    onChange={(v) => updateField('headliner', v)}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Carpets & Mats"
                    value={data.carpets}
                    onChange={(v) => updateField('carpets', v)}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Door Panels"
                    value={data.doorPanels}
                    onChange={(v) => updateField('doorPanels', v)}
                    readOnly={readOnly}
                />
                <InteriorItem
                    label="Buttons & Controls"
                    value={data.controls}
                    onChange={(v) => updateField('controls', v)}
                    readOnly={readOnly}
                />
            </div>

            <div className="bg-muted/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    Odor Check
                </div>
                <div className="flex flex-wrap gap-2">
                    {['neutral', 'smoke', 'mold', 'other'].map((odor) => (
                        <button
                            key={odor}
                            onClick={() => !readOnly && updateField('odor', odor)}
                            disabled={readOnly}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-medium border transition-all",
                                data.odor === odor
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-background hover:bg-muted border-border text-muted-foreground"
                            )}
                        >
                            {odor.charAt(0).toUpperCase() + odor.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Interior Notes</Label>
                <Textarea
                    value={data.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Describe any specific interior issues..."
                    className="resize-none bg-background/50"
                    disabled={readOnly}
                />
            </div>
        </div>
    );
};

export default InteriorChecklist;
