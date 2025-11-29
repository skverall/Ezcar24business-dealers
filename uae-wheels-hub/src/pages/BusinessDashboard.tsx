import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
    LogOut,
    Bell,
    Search,
    Menu,
    X,
    CreditCard,
    Building2,
    Banknote,
    TrendingUp,
    DollarSign,
    CheckCircle2,
    Plus,
    FileText,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuxuryCard, LuxuryCardContent, LuxuryCardHeader, LuxuryCardTitle } from "@/components/ui/LuxuryCard";
import { FinancialCard } from "@/components/dashboard/FinancialCard";
import { ExpenseRow } from "@/components/dashboard/ExpenseRow";
import { AddExpenseDialog } from "@/components/dashboard/AddExpenseDialog";
import {
    useExpenses,
    useFinancialAccounts,
    useSales,
    useVehicles,
    useDeleteExpense
} from "@/hooks/useDashboardData";
import { useCrmAuth } from "@/hooks/useCrmAuth";
import { BusinessLayoutContextType } from "@/pages/BusinessLayout";
import { format } from "date-fns";

const BusinessDashboard = () => {
    const navigate = useNavigate();
    const { signOut, user } = useCrmAuth();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today');

    // Data Hooks
    const { data: expenses = [] } = useExpenses(timeRange);
    const { data: accounts = [] } = useFinancialAccounts();
    const { data: sales = [] } = useSales();
    const { data: vehicles = [] } = useVehicles();
    const { mutate: deleteExpense } = useDeleteExpense();

    const handleLogout = async () => {
        await signOut();
        navigate("/business");
    };

    // Calculations - match iOS logic exactly
    // Total vehicle value = purchase price + expenses (exclude sold vehicles)
    const totalVehicleValue = vehicles
        .filter((v: any) => v.status !== 'sold')
        .reduce((sum: number, v: any) => {
            const purchasePrice = v.purchase_price || 0;
            const vehicleExpenses = (v.expenses || []).reduce(
                (expSum: number, exp: any) => expSum + (exp.amount || 0),
                0
            );
            return sum + purchasePrice + vehicleExpenses;
        }, 0);
    const totalCash = accounts
        .filter((a: any) => a.account_type?.toLowerCase().includes('cash'))
        .reduce((sum: number, a: any) => sum + (a.balance || 0), 0);
    const totalBank = accounts
        .filter((a: any) => a.account_type?.toLowerCase().includes('bank'))
        .reduce((sum: number, a: any) => sum + (a.balance || 0), 0);
    const totalAssets = totalVehicleValue + totalCash + totalBank;

    const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.sale_price || s.amount || 0), 0);
    const totalProfit = sales.reduce((sum: number, s: any) => {
        const revenue = s.sale_price || s.amount || 0;
        const purchasePrice = s.vehicles?.purchase_price || 0;
        // Include vehicle expenses in profit calculation (same as iOS)
        const vehicleExpenses = (s.vehicles?.expenses || []).reduce(
            (expSum: number, exp: any) => expSum + (exp.amount || 0),
            0
        );
        return sum + (revenue - purchasePrice - vehicleExpenses);
    }, 0);
    const soldCount = sales.length;

    const todaysExpenses = expenses.filter((e: any) => {
        const expenseDate = new Date(e.date);
        const today = new Date();
        return expenseDate.getDate() === today.getDate() &&
            expenseDate.getMonth() === today.getMonth() &&
            expenseDate.getFullYear() === today.getFullYear();
    });

    const totalSpent = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Dashboard
                        </h1>
                        <p className="text-xs text-slate-500 hidden sm:block">
                            {format(new Date(), "EEEE, MMMM do, yyyy")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500/20 text-sm w-64 transition-all duration-300 focus:w-72 outline-none"
                        />
                    </div>

                    <Button
                        variant="outline"
                        className="hidden md:inline-flex border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>

                    <Button
                        onClick={() => setIsAddExpenseOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full px-4 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                    </Button>

                    <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                    </Button>
                </div>
            </header>

            {/* Dashboard Content */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-6 lg:space-y-8 pb-20 lg:pb-8 max-w-[1600px] mx-auto">

                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Welcome back, {user?.user_metadata?.full_name || 'Dealer'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Here's what's happening with your business today.
                        </p>
                    </div>
                </div>

                {/* Financial Overview Section */}
                <section className="space-y-4 animate-fade-in-up">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        <FinancialCard
                            title="Total Assets"
                            amount={totalAssets}
                            icon={Building2}
                            color="text-blue-500"
                            bgColor="bg-blue-50 dark:bg-blue-900/20"
                        />
                        <FinancialCard
                            title="Cash"
                            amount={totalCash}
                            icon={Banknote}
                            color="text-green-500"
                            bgColor="bg-green-50 dark:bg-green-900/20"
                        />
                        <FinancialCard
                            title="Bank"
                            amount={totalBank}
                            icon={CreditCard}
                            color="text-purple-500"
                            bgColor="bg-purple-50 dark:bg-purple-900/20"
                            className="col-span-2 lg:col-span-1"
                        />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        <FinancialCard
                            title="Total Revenue"
                            amount={totalRevenue}
                            icon={TrendingUp}
                            color="text-orange-500"
                            bgColor="bg-orange-50 dark:bg-orange-900/20"
                        />
                        <FinancialCard
                            title="Net Profit"
                            amount={totalProfit}
                            icon={DollarSign}
                            color={totalProfit >= 0 ? "text-green-500" : "text-red-500"}
                            bgColor={totalProfit >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}
                        />
                        <FinancialCard
                            title="Sold"
                            amount={soldCount}
                            icon={CheckCircle2}
                            color="text-cyan-500"
                            bgColor="bg-cyan-50 dark:bg-cyan-900/20"
                            isCount
                            className="col-span-2 lg:col-span-1"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                    {/* Today's Expenses Section */}
                    <section className="xl:col-span-2 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                Today's Expenses
                            </h2>
                            <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {todaysExpenses.length} items
                            </span>
                        </div>

                        {todaysExpenses.length === 0 ? (
                            <LuxuryCard className="border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <LuxuryCardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                        <FileText className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="font-medium">No expenses recorded today</p>
                                    <Button
                                        variant="link"
                                        onClick={() => setIsAddExpenseOpen(true)}
                                        className="text-blue-600 hover:text-blue-700 mt-2"
                                    >
                                        Add your first expense
                                    </Button>
                                </LuxuryCardContent>
                            </LuxuryCard>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {todaysExpenses.map((expense: any) => (
                                    <ExpenseRow
                                        key={expense.id}
                                        expense={expense}
                                        onDelete={(id) => deleteExpense(id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Summary Section */}
                    <section className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <LuxuryCard>
                            <LuxuryCardHeader className="pb-2">
                                <LuxuryCardTitle className="text-base lg:text-lg">Total Spent</LuxuryCardTitle>
                            </LuxuryCardHeader>
                            <LuxuryCardContent>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                                        AED {totalSpent.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    {(['today', 'week', 'month', 'year'] as const).map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRange(range)}
                                            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 capitalize ${timeRange === range
                                                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </LuxuryCardContent>
                        </LuxuryCard>

                        {/* Recent Expenses List */}
                        <LuxuryCard>
                            <LuxuryCardHeader>
                                <LuxuryCardTitle className="text-base">Recent Activity</LuxuryCardTitle>
                            </LuxuryCardHeader>
                            <LuxuryCardContent>
                                <div className="space-y-4">
                                    {expenses.slice(0, 5).map((expense: any) => (
                                        <div key={expense.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                                    <DollarSign className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                                                        {expense.description || expense.category}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {format(new Date(expense.date), 'MMM d, h:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                AED {expense.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                    {expenses.length === 0 && (
                                        <p className="text-slate-500 text-sm text-center py-4">No recent activity.</p>
                                    )}
                                </div>
                            </LuxuryCardContent>
                        </LuxuryCard>
                    </section>
                </div>

            </main>

            <AddExpenseDialog
                open={isAddExpenseOpen}
                onOpenChange={setIsAddExpenseOpen}
            />
        </div>
    );
};

export default BusinessDashboard;
