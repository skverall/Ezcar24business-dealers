import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disc, Copy } from 'lucide-react';
import { TireDetails, TireCondition } from '@/types/inspection';
import { cn } from '@/lib/utils';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    tireData: TireDetails;
    onDataChange: (data: TireDetails) => void;
    onSave: () => void;
    onApplyToAll: () => void;
    readOnly?: boolean;
};

const TireDetailsModal: React.FC<Props> = ({
    isOpen,
    onClose,
    tireData,
    onDataChange,
    onSave,
    onApplyToAll,
    readOnly
}) => {

    const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onDataChange({ ...tireData, condition: e.target.value as TireCondition });
    };

    const conditionOptions: { value: TireCondition; label: string; color: string }[] = [
        { value: 'good', label: 'Good Condition', color: 'bg-emerald-500' },
        { value: 'fair', label: 'Fair Wear', color: 'bg-amber-500' },
        { value: 'poor', label: 'Poor Condition', color: 'bg-orange-500' },
        { value: 'replace', label: 'Replace Immediately', color: 'bg-red-500' },
    ];

    const getConditionColor = (condition: string) => {
        const option = conditionOptions.find(o => o.value === condition);
        return option ? option.color : 'bg-gray-500';
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] rounded-3xl border-border/50 shadow-2xl bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-luxury/10 rounded-full text-luxury">
                            <Disc className="w-5 h-5" />
                        </div>
                        Update Tire Details
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tire-brand" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Brand</Label>
                            <Input
                                id="tire-brand"
                                value={tireData.brand}
                                onChange={(e) => onDataChange({ ...tireData, brand: e.target.value })}
                                className="h-10 rounded-xl bg-background/50 text-base sm:text-sm"
                                placeholder="e.g. Michelin"
                                disabled={readOnly}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tire-size" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</Label>
                            <Input
                                id="tire-size"
                                value={tireData.size}
                                onChange={(e) => onDataChange({ ...tireData, size: e.target.value })}
                                className="h-10 rounded-xl bg-background/50 text-base sm:text-sm"
                                placeholder="e.g. 245/40R19"
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tire-dot" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">DOT (Year)</Label>
                            <Input
                                id="tire-dot"
                                value={tireData.dot}
                                onChange={(e) => onDataChange({ ...tireData, dot: e.target.value })}
                                className="h-10 rounded-xl bg-background/50 font-mono text-base sm:text-sm"
                                placeholder="e.g. 1224"
                                disabled={readOnly}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tire-depth" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tread Depth (mm)</Label>
                            <Input
                                id="tire-depth"
                                value={tireData.treadDepth}
                                onChange={(e) => onDataChange({ ...tireData, treadDepth: e.target.value })}
                                className="h-10 rounded-xl bg-background/50 text-base sm:text-sm"
                                placeholder="e.g. 6.5"
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tire-condition" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Condition</Label>

                        {/* Native Select for Performance */}
                        <div className="relative">
                            <select
                                id="tire-condition"
                                value={tireData.condition}
                                onChange={handleConditionChange}
                                disabled={readOnly}
                                className={cn(
                                    "w-full h-11 px-3 rounded-xl bg-background/50 border border-border/50 text-sm appearance-none cursor-pointer hover:bg-accent/50 transition-colors",
                                    "focus:outline-none focus:ring-2 focus:ring-luxury/20 focus:border-luxury/50"
                                )}
                            >
                                {conditionOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {/* Custom arrow indicator or status dot if possible - simpler is better for now */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", getConditionColor(tireData.condition))} />
                            </div>
                        </div>
                    </div>

                    {!readOnly && (
                        <Button
                            variant="outline"
                            onClick={onApplyToAll}
                            className="w-full gap-2 text-muted-foreground hover:text-luxury hover:border-luxury/50 hover:bg-luxury/5"
                        >
                            <Copy className="w-4 h-4" />
                            Apply Details to All Tires
                        </Button>
                    )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl hover:bg-muted/50">Cancel</Button>
                    {!readOnly && (
                        <Button onClick={onSave} className="rounded-xl bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/20">Save Changes</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TireDetailsModal;
