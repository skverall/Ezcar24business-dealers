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
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const BusinessDashboard = () => {
    const navigate = useNavigate();
    const { signOut } = useCrmAuth();
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

    // Calculations
    const totalAssets = vehicles.reduce((sum: number, v: any) => sum + (v.purchase_price || 0), 0);
    const totalCash = accounts
        .filter((a: any) => a.account_type?.toLowerCase().includes('cash'))
        .reduce((sum: number, a: any) => sum + (a.balance || 0), 0);
    const totalBank = accounts
        .filter((a: any) => a.account_type?.toLowerCase().includes('bank'))
        .reduce((sum: number, a: any) => sum + (a.balance || 0), 0);

    const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.sale_price || s.amount || 0), 0);
    const totalProfit = sales.reduce((sum: number, s: any) => sum + (s.profit || s.amount || 0), 0);
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
        <>
            {/* Header */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                    <h1 className="text-xl font-semibold text-slate-800">Dashboard Overview</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 rounded-full bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                        />
                    </div>

                    <Button
                        variant="outline"
                        className="hidden md:inline-flex"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>

                    <Button
                        onClick={() => setIsAddExpenseOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                    </Button>

                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5 text-slate-600" />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
                    </Button>
                </div>
            </header>

            {/* Dashboard Content */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-6 lg:space-y-8 pb-20 lg:pb-8">

                {/* Financial Overview Section */}
                <section className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                        <FinancialCard
                            title="Total Assets"
                            amount={totalAssets}
                            icon={Building2}
                            color="text-blue-500"
                            bgColor="bg-blue-50"
                        />
                        <FinancialCard
                            title="Cash"
                            amount={totalCash}
                            icon={Banknote}
                            color="text-green-500"
                            bgColor="bg-green-50"
                        />
                        <FinancialCard
                            title="Bank"
                            amount={totalBank}
                            icon={CreditCard}
                            color="text-purple-500"
                            bgColor="bg-purple-50"
                            className="col-span-2 lg:col-span-1"
                        />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                        <FinancialCard
                            title="Total Revenue"
                            amount={totalRevenue}
                            icon={TrendingUp}
                            color="text-orange-500"
                            bgColor="bg-orange-50"
                        />
                        <FinancialCard
                            title="Net Profit"
                            amount={totalProfit}
                            icon={DollarSign}
                            color={totalProfit >= 0 ? "text-green-500" : "text-red-500"}
                            bgColor={totalProfit >= 0 ? "bg-green-50" : "bg-red-50"}
                        />
                        <FinancialCard
                            title="Sold"
                            amount={soldCount}
                            icon={CheckCircle2}
                            color="text-cyan-500"
                            bgColor="bg-cyan-50"
                            isCount
                            className="col-span-2 lg:col-span-1"
                        />
                    </div>
                </section>

                {/* Today's Expenses Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Today's Expenses</h2>
                        <span className="text-sm text-slate-500">{todaysExpenses.length} items</span>
                    </div>

                    {todaysExpenses.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-8 text-slate-500">
                                <FileText className="h-12 w-12 mb-2 opacity-20" />
                                <p>No expenses recorded today</p>
                                <Button
                                    variant="link"
                                    onClick={() => setIsAddExpenseOpen(true)}
                                    className="text-blue-600"
                                >
                                    Add your first expense
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
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
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base lg:text-lg">Total Spent ({timeRange})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl lg:text-4xl font-bold text-slate-900">
                                    {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalSpent)}
                                </span>
                            </div>
                            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                                {(['today', 'week', 'month', 'year'] as const).map((range) => (
                                    <Button
                                        key={range}
                                        variant={timeRange === range ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setTimeRange(range)}
                                        className="capitalize shrink-0"
                                    >
                                        {range}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placeholder for Category Breakdown - can be implemented later with Recharts */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base lg:text-lg">Spending Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[140px] text-slate-400 text-sm">
                            Chart coming soon
                        </CardContent>
                    </Card>
                </section>

                {/* Recent Expenses Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Recent Expenses</h2>
                    <div className="space-y-3">
                        {expenses.slice(0, 5).map((expense: any) => (
                            <ExpenseRow
                                key={expense.id}
                                expense={expense}
                                onDelete={(id) => deleteExpense(id)}
                            />
                        ))}
                        {expenses.length === 0 && (
                            <p className="text-slate-500 text-sm">No recent expenses found.</p>
                        )}
                    </div>
                </section>

            </main>

            <AddExpenseDialog
                open={isAddExpenseOpen}
                onOpenChange={setIsAddExpenseOpen}
            />
        </>
    );
};

export default BusinessDashboard;
