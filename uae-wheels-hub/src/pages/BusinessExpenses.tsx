import { useState, useMemo } from 'react';
import { useExpenses, useDeleteExpense } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { Plus, Menu, ChevronDown } from 'lucide-react';
import { ExpenseRow } from '@/components/dashboard/ExpenseRow';
import { AddExpenseDialog } from '@/components/dashboard/AddExpenseDialog';
import { useOutletContext } from 'react-router-dom';
import { BusinessLayoutContextType } from '@/pages/BusinessLayout';
import { format, isToday, isYesterday, parseISO, isSameWeek } from 'date-fns';

const BusinessExpenses = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const { data: expenses = [], isLoading } = useExpenses('year');
    const { mutate: deleteExpense } = useDeleteExpense();

    // Calculate "This Week" total
    const totalAmount = useMemo(() => {
        const now = new Date();
        return expenses
            .filter((expense: any) => isSameWeek(parseISO(expense.date), now, { weekStartsOn: 1 })) // Week starts on Monday
            .reduce((sum: number, expense: any) => sum + (Number(expense.amount) || 0), 0);
    }, [expenses]);

    // Group expenses by date
    const groupedExpenses = useMemo(() => {
        const groups: Record<string, any[]> = {};

        expenses.forEach((expense: any) => {
            const date = parseISO(expense.date);
            let key = format(date, 'yyyy-MM-dd');

            if (isToday(date)) key = 'Today';
            else if (isYesterday(date)) key = 'Yesterday';
            else key = format(date, 'MMM d, yyyy');

            if (!groups[key]) groups[key] = [];
            groups[key].push(expense);
        });

        // Sort keys to ensure Today/Yesterday come first, then dates
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === 'Today') return -1;
            if (b === 'Today') return 1;
            if (a === 'Yesterday') return -1;
            if (b === 'Yesterday') return 1;
            return new Date(b).getTime() - new Date(a).getTime(); // Descending date
        });

        return sortedKeys.map(key => ({
            title: key,
            data: groups[key],
            total: groups[key].reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        }));
    }, [expenses]);

    return (
        <div className="min-h-screen bg-slate-50 pb-24 relative">
            {/* Header Section */}
            <div className="bg-slate-50 px-4 pt-4 pb-2 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu className="h-6 w-6 text-slate-900" />
                        </Button>
                        {/* Back button for desktop/mobile consistency if needed, or just title */}
                    </div>
                </div>

                <div className="space-y-1 px-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expenses</h1>
                    <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-sm font-medium">This Week</span>
                        <span className="text-4xl font-bold text-slate-900">
                            {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(totalAmount).replace('AED', '')} <span className="text-xl text-slate-500 font-medium">AED</span>
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mt-6 overflow-x-auto no-scrollbar pb-2">
                    {['Vehicle', 'Employee', 'Category'].map((filter) => (
                        <button
                            key={filter}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm text-sm font-medium text-slate-700 whitespace-nowrap active:scale-95 transition-transform"
                        >
                            {filter}
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Expenses List */}
            <div className="px-4 space-y-6 mt-2">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-400">Loading...</div>
                ) : groupedExpenses.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <p>No expenses found</p>
                    </div>
                ) : (
                    groupedExpenses.map((group) => (
                        <div key={group.title} className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-semibold text-slate-500">{group.title}</h3>
                                <span className="text-sm font-medium text-slate-400">
                                    AED {group.total.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {group.data.map((expense) => (
                                    <ExpenseRow
                                        key={expense.id}
                                        expense={expense}
                                        onDelete={(id) => deleteExpense(id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="h-14 w-14 rounded-full bg-blue-900 hover:bg-blue-800 shadow-lg flex items-center justify-center p-0"
                >
                    <Plus className="h-8 w-8 text-white" />
                </Button>
            </div>

            <AddExpenseDialog
                open={isAddExpenseOpen}
                onOpenChange={setIsAddExpenseOpen}
            />
        </div>
    );
};

export default BusinessExpenses;
