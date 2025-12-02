import { LucideIcon } from "lucide-react";
import { LuxuryCard, LuxuryCardContent, LuxuryCardHeader, LuxuryCardTitle } from "@/components/ui/LuxuryCard";
import { cn } from "@/lib/utils";

interface FinancialCardProps {
    title: string;
    amount: number;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    className?: string;
    isCount?: boolean;
}

export const FinancialCard = ({
    title,
    amount,
    icon: Icon,
    color,
    bgColor,
    className,
    isCount = false
}: FinancialCardProps) => {
    return (
        <LuxuryCard className={cn("group", className)}>
            <LuxuryCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <LuxuryCardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {title}
                </LuxuryCardTitle>
                <div className={cn("p-1.5 rounded-full transition-colors duration-300 group-hover:bg-opacity-80", bgColor)}>
                    <Icon className={cn("h-3.5 w-3.5", color)} />
                </div>
            </LuxuryCardHeader>
            <LuxuryCardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isCount ? amount : `AED ${amount.toLocaleString()}`}
                </div>
                {/* Optional: Add trend indicator here if available */}
                {/* <p className="text-xs text-muted-foreground mt-1">
                    +20.1% from last month
                </p> */}
            </LuxuryCardContent>
        </LuxuryCard>
    );
};
