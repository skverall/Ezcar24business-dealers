import React from "react";
import { cn } from "@/lib/utils";

interface LuxuryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glass?: boolean;
}

export const LuxuryCard = ({
  children,
  className,
  hoverEffect = true,
  glass = true,
  ...props
}: LuxuryCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/20 transition-all duration-300",
        glass && "bg-white/80 backdrop-blur-md dark:bg-slate-900/80",
        !glass && "bg-card text-card-foreground shadow-sm",
        hoverEffect && "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10",
        className
      )}
      {...props}
    >
      {/* Gradient Glow Effect on Hover */}
      {hoverEffect && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-primary/10" />
      )}
      
      {/* Top Highlight Line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 dark:via-white/20" />

      {children}
    </div>
  );
};

export const LuxuryCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5", className)}
    {...props}
  />
));
LuxuryCardHeader.displayName = "LuxuryCardHeader";

export const LuxuryCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100",
      className
    )}
    {...props}
  />
));
LuxuryCardTitle.displayName = "LuxuryCardTitle";

export const LuxuryCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
LuxuryCardContent.displayName = "LuxuryCardContent";
