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

import { format } from "date-fns";
import {
    Car,
    Wrench,
    Fuel,
    FileText,
    ShoppingBag,
    Briefcase,
    User,
    Coffee,
    MoreHorizontal,
    Trash2,
    Pencil
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
    expense: any;
    onDelete: (id: string) => void;
    onEdit?: (expense: any) => void;
}

const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
        case 'maintenance': return Wrench;
        case 'fuel': return Fuel;
        case 'documents': return FileText;
        case 'shipping': return Car;
        case 'marketing': return ShoppingBag;
        case 'office': return Briefcase;
        case 'personal': return User;
        case 'employee': return Briefcase;
        default: return Coffee; // Default icon from screenshot seems to be generic or coffee
    }
};

const getCategoryBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
        case 'marketing': return "bg-gray-500";
        case 'employee': return "bg-purple-500";
        case 'personal': return "bg-orange-500";
        default: return "bg-blue-500";
    }
};

export const ExpenseRow = ({ expense, onDelete, onEdit }: ExpenseRowProps) => {
    const Icon = getCategoryIcon(expense.category);
    const badgeColor = getCategoryBadgeColor(expense.category);

    const formattedTime = format(new Date(expense.date), "h:mm a"); // e.g., 4:00 AM
    const formattedAmount = new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        minimumFractionDigits: 2
    }).format(expense.amount);

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-slate-700" />
                </div>

                <div className="flex flex-col">
                    <span className="font-bold text-base text-slate-900">
                        {expense.description || expense.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <span>{expense.user_name || 'User'}</span> {/* Placeholder for user name */}
                        {/* <span>•</span>
                        <span>{formattedTime}</span> */}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1">
                <span className="font-bold text-base text-slate-900">{formattedAmount}</span>
                <span className={cn("text-[10px] font-medium text-white px-2 py-0.5 rounded-md", badgeColor)}>
                    {expense.category}
                </span>
            </div>

            {/* Hidden delete action for now, or could be a swipe/long-press in future. 
                Keeping it accessible via a subtle menu if needed, but visually matching the screenshot 
                which doesn't show visible actions. 
            */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2 text-slate-300 hover:text-slate-600">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
    );
};
