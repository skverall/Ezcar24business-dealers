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
}

export const FinancialCard = ({
    title,
    amount,
    icon: Icon,
    color,
    bgColor = "bg-slate-50",
    isCount = false,
    onClick
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
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
            <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className={cn("p-2 rounded-lg", bgColor)}>
                        <Icon className={cn("h-5 w-5", color)} />
                    </div>
                </div>

                <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-xl font-bold text-slate-900">{formattedAmount}</h3>
                </div>
            </CardContent>
        </Card>
    );
};
