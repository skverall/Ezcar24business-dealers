import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Wrench, FileText, MapPin, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ServiceRecord } from '@/types/inspection';
import { format } from 'date-fns';

type Props = {
    records: ServiceRecord[];
    onChange: (records: ServiceRecord[]) => void;
    readOnly?: boolean;
};

const SERVICE_TYPES: { value: ServiceRecord['type']; label: string; color: string; icon: any }[] = [
    { value: 'Service', label: 'Service', color: 'bg-blue-500', icon: Wrench },
    { value: 'Repair', label: 'Repair', color: 'bg-orange-500', icon: Wrench },
    { value: 'Inspection', label: 'Inspection', color: 'bg-emerald-500', icon: FileText },
    { value: 'Other', label: 'Other', color: 'bg-purple-500', icon: FileText },
];

const ServiceHistoryTimeline: React.FC<Props> = ({ records, onChange, readOnly }) => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Omit<ServiceRecord, 'id'>>({
        date: new Date().toISOString().slice(0, 10),
        type: 'Service',
        mileage: '',
        description: '',
        center: ''
    });

    const handleSave = () => {
        if (!formData.date || !formData.description) return;

        const newRecord: ServiceRecord = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            ...formData
        };

        if (editingId) {
            onChange(records.map(r => r.id === editingId ? newRecord : r).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
            onChange([...records, newRecord].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }

        setIsAddOpen(false);
        setEditingId(null);
        resetForm();
    };

    const handleDelete = (id: string) => {
        onChange(records.filter(r => r.id !== id));
    };

    const handleEdit = (record: ServiceRecord) => {
        setFormData({
            date: record.date,
            type: record.type,
            mileage: record.mileage,
            description: record.description,
            center: record.center || ''
        });
        setEditingId(record.id);
        setIsAddOpen(true);
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().slice(0, 10),
            type: 'Service',
            mileage: '',
            description: '',
            center: ''
        });
        setEditingId(null);
    };

    // If empty and readOnly (public view), show nothing or minimal message
    if (records.length === 0 && readOnly) {
        return (
            <div className="bg-card/50 backdrop-blur-md rounded-3xl p-6 border border-border/50 text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground">
                    <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-muted-foreground">Service History</h3>
                <p className="text-sm text-muted-foreground/60">No service records available for this vehicle.</p>
            </div>
        );
    }

    return (
        <div className="bg-card/50 backdrop-blur-md rounded-3xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-luxury" />
                    Service History
                </h3>
                {!readOnly && (
                    <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button size="sm" onClick={() => { resetForm(); setIsAddOpen(true); }} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Record
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Record' : 'Add Service Record'}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {SERVICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="e.g. Oil change, filter replacement" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Mileage (km)</Label>
                                        <Input value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} placeholder="e.g. 50,000" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Service Center</Label>
                                        <Input value={formData.center} onChange={e => setFormData({ ...formData, center: e.target.value })} placeholder="Optional" />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Record'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="relative space-y-4 sm:space-y-0 sm:grid sm:grid-cols-[120px_1fr] sm:gap-x-8 sm:gap-y-8 before:absolute before:hidden sm:before:block before:inset-0 before:w-px before:bg-border/50 before:left-[136px] before:h-full">
                {records.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl border-border/50 bg-muted/10">
                        No service history added yet.
                    </div>
                ) : (
                    records.map((record) => {
                        const typeConfig = SERVICE_TYPES.find(t => t.value === record.type) || SERVICE_TYPES[3];
                        const dateObj = new Date(record.date);

                        return (
                            <React.Fragment key={record.id}>
                                {/* Date Column */}
                                <div className="hidden sm:flex flex-col items-end text-right pt-1 relative">
                                    <span className="text-2xl font-bold tabular-nums text-foreground">{format(dateObj, 'dd')}</span>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{format(dateObj, 'MMM yyyy')}</span>
                                </div>

                                {/* Content Column */}
                                <div className="relative">
                                    {/* Dot on timeline - hidden on mobile */}
                                    <div className={cn(
                                        "absolute w-3 h-3 rounded-full border-2 border-background top-3 -left-[22px] z-10 ring-4 ring-background hidden sm:block",
                                        typeConfig.color
                                    )} />

                                    <div className="bg-card border border-border/50 rounded-xl p-4 hover:bg-accent/5 transition-colors group relative">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="secondary" className="text-xs font-normal">
                                                        {record.type}
                                                    </Badge>
                                                    <span className="text-sm font-semibold">{record.description}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    {record.mileage && (
                                                        <div className="flex items-center gap-1">
                                                            <Gauge className="w-3 h-3" />
                                                            {record.mileage} km
                                                        </div>
                                                    )}
                                                    {record.center && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {record.center}
                                                        </div>
                                                    )}
                                                    {/* Mobile Date */}
                                                    <div className="sm:hidden flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(record.date), 'MMM dd, yyyy')}
                                                    </div>
                                                </div>
                                            </div>

                                            {!readOnly && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(record)}>
                                                        <Wrench className="w-3 h-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(record.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ServiceHistoryTimeline;
