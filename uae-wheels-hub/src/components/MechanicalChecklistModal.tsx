import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, AlertTriangle, XCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Condition = 'ok' | 'issue' | 'critical' | 'na';

export type DiagnosticItem = {
    key: string;
    label: string;
    condition: Condition;
    notes?: string;
};

export type MechanicalCategory = {
    status: Condition;
    items: DiagnosticItem[];
    notes?: string;
};

export type MechanicalStatus = Record<string, MechanicalCategory>;

const CONDITIONS: { value: Condition; label: string; color: string; icon: any }[] = [
    { value: 'ok', label: 'OK', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Check },
    { value: 'issue', label: 'Issue', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: AlertTriangle },
    { value: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    { value: 'na', label: 'N/A', color: 'bg-muted text-muted-foreground border-border', icon: MinusCircle },
];

export const DEFAULT_CHECKLISTS: Record<string, { label: string; items: string[] }> = {
    engine: {
        label: 'Engine',
        items: [
            'Oil Level & Condition',
            'Oil Leaks',
            'Belts & Pulleys',
            'Engine Mounts',
            'Idle Stability',
            'Exhaust Smoke',
            'Engine Noise',
            'Cooling System Hoses'
        ]
    },
    transmission: {
        label: 'Transmission',
        items: [
            'Gear Engagement',
            'Shift Quality',
            'Fluid Level & Condition',
            'Transmission Leaks',
            'Clutch Operation (if manual)',
            'Drive Shaft / CV Joints'
        ]
    },
    suspension: {
        label: 'Suspension & Steering',
        items: [
            'Shock Absorbers',
            'Bushings & Ball Joints',
            'Steering Play / Noise',
            'Power Steering Fluid',
            'Wheel Bearings',
            'Tire Condition'
        ]
    },
    brakes: {
        label: 'Brakes',
        items: [
            'Brake Pad Life',
            'Disc Condition',
            'Brake Fluid Level',
            'Handbrake Operation',
            'ABS Warning Light'
        ]
    },
    ac: {
        label: 'AC & Cooling',
        items: [
            'Cooling Performance',
            'Fan Operation',
            'Radiator Condition',
            'Coolant Level',
            'Heater Operation'
        ]
    },
    electrical: {
        label: 'Electrical',
        items: [
            'Battery Condition',
            'Alternator Charging',
            'Starter Motor',
            'Headlights & Tail Lights',
            'Windows & Mirrors',
            'Central Locking',
            'Dashboard Warning Lights'
        ]
    }
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    categoryKey: string;
    data: MechanicalCategory | undefined;
    onSave: (key: string, data: MechanicalCategory) => void;
    readOnly?: boolean;
    title?: string;
};

const MechanicalChecklistModal: React.FC<Props> = ({
    isOpen,
    onClose,
    categoryKey,
    data,
    onSave,
    readOnly,
    title
}) => {
    const definition = DEFAULT_CHECKLISTS[categoryKey];

    // Initialize state with existing data or default items
    const [items, setItems] = useState<DiagnosticItem[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen && definition) {
            if (data && data.items && data.items.length > 0) {
                // Merge existing data with definition to handle new checklist items if any added later
                const mergedItems = definition.items.map(label => {
                    const existing = data.items.find(i => i.label === label);
                    return existing || {
                        key: label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                        label,
                        condition: 'ok' as Condition
                    };
                });
                setItems(mergedItems);
                setNotes(data.notes || '');
            } else {
                // Initialize new
                setItems(definition.items.map(label => ({
                    key: label.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    label,
                    condition: 'ok' as Condition
                })));
                setNotes('');
            }
        }
    }, [isOpen, categoryKey, data]);

    const handleItemClick = (index: number) => {
        if (readOnly) return;
        setItems(prev => {
            const newItems = [...prev];
            const currentCondition = newItems[index].condition;

            // Cycle: ok -> issue -> critical -> na -> ok
            let nextCondition: Condition = 'ok';
            if (currentCondition === 'ok') nextCondition = 'issue';
            else if (currentCondition === 'issue') nextCondition = 'critical';
            else if (currentCondition === 'critical') nextCondition = 'na';
            else nextCondition = 'ok';

            newItems[index] = { ...newItems[index], condition: nextCondition };
            return newItems;
        });
    };

    const calculateOverallStatus = (currentItems: DiagnosticItem[]): Condition => {
        if (currentItems.some(i => i.condition === 'critical')) return 'critical';
        if (currentItems.some(i => i.condition === 'issue')) return 'issue';
        return 'ok';
    };

    const handleSave = () => {
        const overallStatus = calculateOverallStatus(items);
        onSave(categoryKey, {
            status: overallStatus,
            items,
            notes
        });
        onClose();
    };

    if (!definition) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className="max-w-md flex flex-col max-h-[85vh]"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {title || definition.label} Inspection
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0">
                    <div className="space-y-2">
                        {items.map((item, idx) => {
                            const statusConfig = CONDITIONS.find(c => c.value === item.condition) || CONDITIONS[0];
                            const Icon = statusConfig.icon;

                            return (
                                <div
                                    key={item.key}
                                    onClick={() => handleItemClick(idx)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98]",
                                        readOnly ? "cursor-default" : "",
                                        statusConfig.color
                                    )}
                                >
                                    <span className="font-medium text-sm">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{statusConfig.label}</span>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Category Notes</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={`Add notes about ${definition.label.toLowerCase()}...`}
                            className="resize-none bg-muted/30 min-h-[60px]"
                            disabled={readOnly}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    {!readOnly && <Button onClick={handleSave} className="bg-luxury text-white hover:bg-luxury/90">Save Check</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MechanicalChecklistModal;
