import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddSale, useVehicles } from '@/hooks/useDashboardData';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AddSaleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const AddSaleDialog = ({ open, onOpenChange }: AddSaleDialogProps) => {
    const { mutate: addSale, isPending } = useAddSale();
    const { data: vehicles = [] } = useVehicles();

    // Filter for active vehicles only (not sold)
    const activeVehicles = vehicles.filter((v: any) => v.status !== 'sold');

    const [vehicleId, setVehicleId] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleId || !buyerName || !salePrice || !saleDate) return;

        const selectedVehicle = vehicles.find((v: any) => v.id === vehicleId);
        const price = parseFloat(salePrice);
        const profit = price - (selectedVehicle?.purchase_price || 0); // Simplified profit calculation

        addSale({
            vehicle_id: vehicleId,
            buyer_name: buyerName,
            sale_price: price,
            date: format(saleDate, 'yyyy-MM-dd'),
            profit: profit,
            status: 'completed'
        }, {
            onSuccess: () => {
                onOpenChange(false);
                // Reset form
                setVehicleId('');
                setBuyerName('');
                setSalePrice('');
                setSaleDate(new Date());
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record New Sale</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="vehicle">Vehicle</Label>
                        <Select value={vehicleId} onValueChange={setVehicleId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select vehicle..." />
                            </SelectTrigger>
                            <SelectContent>
                                {activeVehicles.length === 0 ? (
                                    <SelectItem value="none" disabled>No active vehicles found</SelectItem>
                                ) : (
                                    activeVehicles.map((v: any) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.year} {v.make} {v.model} - {v.vin?.slice(-6)}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="buyer">Buyer Name</Label>
                        <Input
                            id="buyer"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder="Enter buyer's name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Sale Price (AED)</Label>
                        <Input
                            id="price"
                            type="number"
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Sale Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !saleDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {saleDate ? format(saleDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={saleDate}
                                    onSelect={setSaleDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !vehicleId}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Sale
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
