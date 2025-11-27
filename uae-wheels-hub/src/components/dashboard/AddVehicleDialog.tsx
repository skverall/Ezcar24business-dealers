import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Camera, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAddVehicle } from "@/hooks/useDashboardData";

const formSchema = z.object({
    vin: z.string().min(1, "VIN is required"),
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
    purchase_price: z.coerce.number().min(0, "Price must be positive"),
    purchase_date: z.date(),
    status: z.enum(["on_sale", "reserved", "sold", "under_service"]),
    notes: z.string().optional(),
});

interface AddVehicleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddVehicleDialog({ open, onOpenChange }: AddVehicleDialogProps) {
    const { mutate: addVehicle, isPending } = useAddVehicle();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            vin: "",
            make: "",
            model: "",
            year: new Date().getFullYear(),
            purchase_price: 0,
            purchase_date: new Date(),
            status: "on_sale",
            notes: "",
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        addVehicle(values, {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">Add Vehicle</DialogTitle>
                </DialogHeader>

                <div className="flex justify-center my-4">
                    <div className="h-24 w-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">
                        <Camera className="h-8 w-8 mb-1" />
                        <span className="text-xs font-medium">Add Photo</span>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Vehicle Details Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <span className="text-lg">🚗</span> Vehicle Details
                            </h3>

                            <FormField
                                control={form.control}
                                name="vin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-slate-500 uppercase">VIN</FormLabel>
                                        <FormControl>
                                            <Input placeholder="# VIN" {...field} className="bg-slate-50 border-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="make"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-slate-500 uppercase">Make</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Toyota" {...field} className="bg-slate-50 border-slate-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="model"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-slate-500 uppercase">Model</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Camry" {...field} className="bg-slate-50 border-slate-200" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-slate-500 uppercase">Year</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="2025" {...field} className="bg-slate-50 border-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Purchase & Status Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <span className="text-lg">💲</span> Purchase & Status
                            </h3>

                            <FormField
                                control={form.control}
                                name="purchase_price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-slate-500 uppercase">Purchase Price (AED)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} className="bg-slate-50 border-slate-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-between gap-4">
                                <FormField
                                    control={form.control}
                                    name="purchase_date"
                                    render={({ field }) => (
                                        <FormItem className="flex-1 flex flex-col">
                                            <FormLabel className="text-xs text-slate-500 uppercase mb-2">Purchase Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal bg-slate-50 border-slate-200",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel className="text-xs text-slate-500 uppercase">Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-slate-50 border-slate-200 text-green-600 font-medium">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="on_sale" className="text-green-600">On Sale</SelectItem>
                                                    <SelectItem value="reserved" className="text-orange-600">Reserved</SelectItem>
                                                    <SelectItem value="sold" className="text-blue-600">Sold</SelectItem>
                                                    <SelectItem value="under_service" className="text-gray-600">Under Service</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <span className="text-lg">📝</span> Notes
                            </h3>
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add any additional notes about the vehicle..."
                                                className="bg-slate-50 border-slate-200 min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                Cancel
                            </Button>
                            <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Vehicle'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
