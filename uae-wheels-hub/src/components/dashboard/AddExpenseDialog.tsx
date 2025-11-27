import { useState } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon, Loader2, Car, User, Briefcase, Building2, Megaphone, X, ChevronRight, CreditCard } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAddExpense } from "@/hooks/useDashboardData";

interface AddExpenseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ExpenseFormValues {
    amount: string;
    category: string;
    description: string;
    date: Date;
}

const CATEGORIES = [
    { id: "Vehicle", icon: Car, label: "Vehicle" },
    { id: "Personal", icon: User, label: "Personal" },
    { id: "Employee", icon: Briefcase, label: "Employee" },
    { id: "Office", icon: Building2, label: "Office" },
    { id: "Marketing", icon: Megaphone, label: "Marketing" },
];

export const AddExpenseDialog = ({ open, onOpenChange }: AddExpenseDialogProps) => {
    const { mutate: addExpense, isPending } = useAddExpense();
    const [date, setDate] = useState<Date>(new Date());
    const [selectedCategory, setSelectedCategory] = useState("Vehicle");

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseFormValues>({
        defaultValues: {
            date: new Date(),
            category: "Vehicle"
        }
    });

    const amountValue = watch("amount");

    const onSubmit = (data: ExpenseFormValues) => {
        addExpense({
            amount: parseFloat(data.amount),
            category: selectedCategory,
            description: data.description,
            date: date.toISOString(),
        }, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] p-0 gap-0 bg-slate-50 overflow-hidden rounded-3xl border-0">
                <div className="p-4 flex items-center justify-between bg-white">
                    <DialogClose className="rounded-full h-8 w-8 bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        <X className="h-4 w-4 text-slate-500" />
                    </DialogClose>
                    <h2 className="text-lg font-semibold">Edit Expense</h2> {/* Title from screenshot */}
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 bg-slate-100 hover:bg-slate-200">
                        <span className="sr-only">Options</span>
                        <div className="flex gap-0.5">
                            <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                            <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                            <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                        </div>
                    </Button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
                    <div className="bg-white pb-8 pt-2 flex flex-col items-center justify-center space-y-2">
                        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">AMOUNT</span>
                        <div className="flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-300 mr-2">AED</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                className="text-6xl font-bold text-black w-48 text-center bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-200"
                                {...register("amount", { required: true })}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="bg-white pb-6 px-4 overflow-x-auto no-scrollbar">
                        <div className="flex gap-4 min-w-max px-2">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory(cat.id);
                                            setValue("category", cat.id);
                                        }}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={cn(
                                            "h-14 w-14 rounded-full flex items-center justify-center transition-all duration-200",
                                            isSelected ? "bg-blue-900 text-white shadow-lg scale-110" : "bg-white border border-slate-100 text-slate-400 group-hover:border-slate-300"
                                        )}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium transition-colors",
                                            isSelected ? "text-slate-900" : "text-slate-400"
                                        )}>
                                            {cat.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Description Field */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 text-slate-400 flex flex-col justify-between py-0.5">
                                    <div className="h-0.5 w-full bg-current rounded-full"></div>
                                    <div className="h-0.5 w-3/4 bg-current rounded-full"></div>
                                    <div className="h-0.5 w-1/2 bg-current rounded-full"></div>
                                </div>
                                <input
                                    placeholder="Description (e.g. Buying stuff for office)"
                                    className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-base font-medium placeholder:text-slate-400"
                                    {...register("description")}
                                />
                            </div>
                            <div className="h-px bg-slate-100 my-3 ml-7"></div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                                    <span className="text-base font-medium text-slate-900">Date</span>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 rounded-lg bg-slate-100 text-slate-900 font-medium hover:bg-slate-200 px-3"
                                        >
                                            {date ? format(date, "d MMM yyyy") : "Pick date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => d && setDate(d)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Selectors */}
                        <div className="space-y-3">
                            <button type="button" className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-transform">
                                <div className="flex items-center gap-3">
                                    <Car className="h-5 w-5 text-slate-400" />
                                    <div className="text-left">
                                        <div className="text-xs text-slate-400 font-medium">Vehicle</div>
                                        <div className="text-base font-semibold text-slate-900">Select Vehicle</div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300" />
                            </button>

                            <button type="button" className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-transform">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                        <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs text-slate-400 font-medium">Paid By</div>
                                        <div className="text-base font-semibold text-slate-900">Aydan</div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300" />
                            </button>

                            <button type="button" className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-transform">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <CreditCard className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs text-slate-400 font-medium">Account</div>
                                        <div className="text-base font-semibold text-slate-900">Cash</div>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 mt-auto">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-14 rounded-2xl bg-blue-900 hover:bg-blue-800 text-lg font-semibold shadow-lg shadow-blue-900/20"
                        >
                            {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Save Expense
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
