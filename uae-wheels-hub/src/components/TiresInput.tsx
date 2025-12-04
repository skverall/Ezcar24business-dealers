import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Disc } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TireCondition = 'good' | 'fair' | 'poor' | 'replace';

export type TireDetails = {
    brand: string;
    size: string;
    dot: string; // Week/Year
    treadDepth: string;
    condition: TireCondition;
};

export type TiresStatus = {
    frontLeft: TireDetails;
    frontRight: TireDetails;
    rearLeft: TireDetails;
    rearRight: TireDetails;
    spare: TireDetails;
};

export const DEFAULT_TIRE_DETAILS: TireDetails = {
    brand: '',
    size: '',
    dot: '',
    treadDepth: '',
    condition: 'good',
};

export const DEFAULT_TIRES_STATUS: TiresStatus = {
    frontLeft: { ...DEFAULT_TIRE_DETAILS },
    frontRight: { ...DEFAULT_TIRE_DETAILS },
    rearLeft: { ...DEFAULT_TIRE_DETAILS },
    rearRight: { ...DEFAULT_TIRE_DETAILS },
    spare: { ...DEFAULT_TIRE_DETAILS },
};

type Props = {
    data: TiresStatus;
    onChange: (data: TiresStatus) => void;
    readOnly?: boolean;
};

const TireCard = ({
    label,
    value,
    onChange,
    readOnly
}: {
    label: string;
    value: TireDetails;
    onChange: (val: TireDetails) => void;
    readOnly?: boolean
}) => {
    return (
        <div className="bg-background/50 p-3 rounded-xl border border-border/50 space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <Disc className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{label}</span>
                <div className={cn(
                    "ml-auto w-2 h-2 rounded-full",
                    value.condition === 'good' ? "bg-emerald-500" :
                        value.condition === 'fair' ? "bg-yellow-500" :
                            value.condition === 'poor' ? "bg-orange-500" :
                                "bg-red-500"
                )} />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Brand</Label>
                    <Input
                        value={value.brand}
                        onChange={(e) => onChange({ ...value, brand: e.target.value })}
                        className="h-7 text-xs"
                        placeholder="Michelin"
                        disabled={readOnly}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Size</Label>
                    <Input
                        value={value.size}
                        onChange={(e) => onChange({ ...value, size: e.target.value })}
                        className="h-7 text-xs"
                        placeholder="225/45R17"
                        disabled={readOnly}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">DOT (Date)</Label>
                    <Input
                        value={value.dot}
                        onChange={(e) => onChange({ ...value, dot: e.target.value })}
                        className="h-7 text-xs"
                        placeholder="2423"
                        disabled={readOnly}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Tread</Label>
                    <Input
                        value={value.treadDepth}
                        onChange={(e) => onChange({ ...value, treadDepth: e.target.value })}
                        className="h-7 text-xs"
                        placeholder="6mm"
                        disabled={readOnly}
                    />
                </div>
                <div className="col-span-2 space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Condition</Label>
                    <Select
                        value={value.condition}
                        onValueChange={(val) => onChange({ ...value, condition: val as TireCondition })}
                        disabled={readOnly}
                    >
                        <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                            <SelectItem value="replace">Replace Immediately</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};

const TiresInput: React.FC<Props> = ({ data, onChange, readOnly }) => {
    const updateTire = (key: keyof TiresStatus, tireData: TireDetails) => {
        onChange({
            ...data,
            [key]: tireData
        });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TireCard
                    label="Front Left"
                    value={data.frontLeft}
                    onChange={(val) => updateTire('frontLeft', val)}
                    readOnly={readOnly}
                />
                <TireCard
                    label="Front Right"
                    value={data.frontRight}
                    onChange={(val) => updateTire('frontRight', val)}
                    readOnly={readOnly}
                />
                <TireCard
                    label="Rear Left"
                    value={data.rearLeft}
                    onChange={(val) => updateTire('rearLeft', val)}
                    readOnly={readOnly}
                />
                <TireCard
                    label="Rear Right"
                    value={data.rearRight}
                    onChange={(val) => updateTire('rearRight', val)}
                    readOnly={readOnly}
                />
            </div>
            <div className="max-w-md mx-auto">
                <TireCard
                    label="Spare Tire"
                    value={data.spare}
                    onChange={(val) => updateTire('spare', val)}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
};

export default TiresInput;
