import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FinancialCardProps {
    title: string;
    amount: number;
    icon: LucideIcon;
    color: string; // Tailwind text color class, e.g., "text-blue-500"
    bgColor?: string; // Tailwind bg color class, e.g., "bg-blue-50"
    isCount?: boolean;
    onClick?: () => void;
    className?: string;
}

export const FinancialCard = ({
    title,
    amount,
    icon: Icon,
    color,
    bgColor = "bg-slate-50",
    isCount = false,
    onClick,
    className
}: FinancialCardProps) => {
    const formattedAmount = isCount
        ? Math.round(amount).toString()
        : new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: 'AED',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);

    return (
        <Card
            className={cn(
                "border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-3 lg:p-4 flex flex-col gap-2 lg:gap-3">
                <div className="flex items-center justify-between">
                    <div className={cn("p-1.5 lg:p-2 rounded-lg", bgColor)}>
                        <Icon className={cn("h-4 w-4 lg:h-5 lg:w-5", color)} />
                    </div>
                </div>

                <div>
                    <p className="text-[10px] lg:text-xs font-medium text-slate-500 mb-0.5 lg:mb-1">{title}</p>
                    <h3 className="text-base lg:text-xl font-bold text-slate-900 truncate">{formattedAmount}</h3>
                </div>
            </CardContent>
        </Card>
    );
};
