import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Car,
    FileText,
    Settings,
    LogOut,
    Bell,
    Search,
    Menu,
    X,
    Users,
    CreditCard,
    Building2,
    Banknote,
    TrendingUp,
    DollarSign,
    CheckCircle2,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EzcarLogo from "@/components/EzcarLogo";
import { FinancialCard } from "@/components/dashboard/FinancialCard";
import { ExpenseRow } from "@/components/dashboard/ExpenseRow";
import { AddExpenseDialog } from "@/components/dashboard/AddExpenseDialog";
import {
    useExpenses,
    useFinancialAccounts,
    useSales,
    useVehicles,
    useDeleteExpense,
    useDealerProfile
} from "@/hooks/useDashboardData";
import { useCrmAuth } from "@/hooks/useCrmAuth";

const BusinessDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useCrmAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today');

    // Data Hooks
    const { data: dealerProfile } = useDealerProfile();
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

    const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.sale_price || 0), 0);
    const totalProfit = sales.reduce((sum: number, s: any) => sum + (s.profit || 0), 0);
    const soldCount = sales.length;

    const todaysExpenses = expenses.filter((e: any) => {
        const expenseDate = new Date(e.date);
        const today = new Date();
        return expenseDate.getDate() === today.getDate() &&
            expenseDate.getMonth() === today.getMonth() &&
            expenseDate.getFullYear() === today.getFullYear();
    });

    const totalSpent = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/business/dashboard" },
        { icon: Car, label: "Inventory", path: "/business/inventory" }, // Placeholder path
        { icon: FileText, label: "Sales", path: "/business/sales" }, // Placeholder path
        { icon: CreditCard, label: "Expenses", path: "/business/expenses" }, // Placeholder path
        { icon: Users, label: "Customers", path: "/business/customers" }, // Placeholder path
        { icon: Settings, label: "Settings", path: "/business/settings" }, // Placeholder path
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:relative lg:translate-x-0`}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <EzcarLogo className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg tracking-wide">EZCAR24</h2>
                            <p className="text-xs text-slate-400">Business Portal</p>
                        </div>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        {navItems.slice(0, 5).map((item) => (
                            <NavItem
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                active={location.pathname === item.path}
                                onClick={() => navigate(item.path)}
                            />
                        ))}
                        <div className="pt-4 mt-4 border-t border-slate-800">
                            <NavItem
                                icon={Settings}
                                label="Settings"
                                active={location.pathname === "/business/settings"}
                                onClick={() => navigate("/business/settings")}
                            />
                        </div>
                    </nav>

                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                                {dealerProfile?.name?.charAt(0) || "U"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-medium text-sm truncate">{dealerProfile?.name || "Loading..."}</p>
                                <p className="text-xs text-slate-400">Dealer Admin</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
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
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto space-y-8">

                    {/* Financial Overview Section */}
                    <section className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle>Total Spent ({timeRange})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-slate-900">
                                        {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalSpent)}
                                    </span>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    {(['today', 'week', 'month', 'year'] as const).map((range) => (
                                        <Button
                                            key={range}
                                            variant={timeRange === range ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setTimeRange(range)}
                                            className="capitalize"
                                        >
                                            {range}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Placeholder for Category Breakdown - can be implemented later with Recharts */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle>Spending Breakdown</CardTitle>
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
            </div>

            <AddExpenseDialog
                open={isAddExpenseOpen}
                onOpenChange={setIsAddExpenseOpen}
            />
        </div>
    );
};

interface NavItemProps {
    icon: any;
    label: string;
    active?: boolean;
    onClick: () => void;
}

const NavItem = ({ icon: Icon, label, active = false, onClick }: NavItemProps) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
    >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{label}</span>
    </button>
);

export default BusinessDashboard;
