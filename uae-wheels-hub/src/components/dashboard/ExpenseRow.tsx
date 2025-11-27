import { format } from "date-fns";
import {
    Car,
    Wrench,
    Fuel,
    FileText,
    MoreHorizontal,
    Trash2,
    Pencil,
    Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ExpenseRowProps {
    expense: any; // Using any for now as we wait for types to propagate fully
    onDelete: (id: string) => void;
    onEdit?: (expense: any) => void;
}

const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
        case 'maintenance': return Wrench;
        case 'fuel': return Fuel;
        case 'documents': return FileText;
        case 'shipping': return Car;
        default: return Tag;
    }
};

const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
        case 'maintenance': return "text-orange-500 bg-orange-50";
        case 'fuel': return "text-yellow-500 bg-yellow-50";
        case 'documents': return "text-blue-500 bg-blue-50";
        case 'shipping': return "text-purple-500 bg-purple-50";
        default: return "text-slate-500 bg-slate-50";
    }
};

export const ExpenseRow = ({ expense, onDelete, onEdit }: ExpenseRowProps) => {
    const Icon = getCategoryIcon(expense.category);
    const colorClass = getCategoryColor(expense.category);

    const formattedDate = format(new Date(expense.date), "MMM d, yyyy");
    const formattedAmount = new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
    }).format(expense.amount);

    return (
        <div className="flex items-center justify-between p-3 lg:p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 lg:gap-4">
                <div className={cn("p-2 lg:p-3 rounded-full shrink-0", colorClass)}>
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                </div>

                <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm lg:text-base text-slate-900 truncate">
                        {expense.description || expense.category}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] lg:text-xs text-slate-500">
                        <span>{formattedDate}</span>
                        {expense.vehicle_id && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1">
                                    <Car className="h-3 w-3 hidden sm:block" />
                                    <span className="hidden sm:inline">Vehicle Linked</span>
                                    <span className="sm:hidden">• Car</span>
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 ml-2">
                <span className="font-bold text-sm lg:text-base text-slate-900 whitespace-nowrap">{formattedAmount}</span>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(expense)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => onDelete(expense.id)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};
