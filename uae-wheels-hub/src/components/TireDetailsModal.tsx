import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
            <DialogContent
                className="sm:max-w-[420px] rounded-2xl border border-border/70 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.5)] bg-card"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-luxury/5 rounded-md border border-luxury/20 text-luxury">
                            <Disc className="w-5 h-5" />
                        </div>
                        Update Tire Details
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Update tire brand, size, DOT date, tread depth, and condition information.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tire-brand" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Brand</Label>
                            <Input
                                id="tire-brand"
                                value={tireData.brand}
                                onChange={(e) => onDataChange({ ...tireData, brand: e.target.value })}
                                className="h-10 rounded-md bg-background text-base sm:text-sm"
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
                                className="h-10 rounded-md bg-background text-base sm:text-sm"
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
                                className="h-10 rounded-md bg-background font-mono text-base sm:text-sm"
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
                                className="h-10 rounded-md bg-background text-base sm:text-sm"
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
                                    "w-full h-11 px-3 rounded-md bg-background border border-border/60 text-sm appearance-none cursor-pointer hover:bg-muted/20 transition-colors",
                                    "focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30"
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
                            className="w-full gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/30 rounded-md"
                        >
                            <Copy className="w-4 h-4" />
                            Apply Details to All Tires
                        </Button>
                    )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} className="rounded-md hover:bg-muted/50">Cancel</Button>
                    {!readOnly && (
                        <Button onClick={onSave} className="rounded-md bg-foreground hover:bg-foreground/90 text-background">Save Changes</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TireDetailsModal;
