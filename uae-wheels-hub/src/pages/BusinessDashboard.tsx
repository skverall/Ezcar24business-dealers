import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Car,
    DollarSign,
    FileText,
    Settings,
    LogOut,
    Bell,
    Search,
    Menu,
    X,
    TrendingUp,
    Users,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EzcarLogo from "@/components/EzcarLogo";

const BusinessDashboard = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        navigate("/business");
    };

    const stats = [
        { title: "Total Revenue", value: "AED 1,245,000", change: "+12.5%", icon: DollarSign, color: "text-green-500" },
        { title: "Active Listings", value: "45", change: "+3", icon: Car, color: "text-blue-500" },
        { title: "Total Sales", value: "12", change: "+2", icon: TrendingUp, color: "text-purple-500" },
        { title: "Active Leads", value: "28", change: "+5", icon: Users, color: "text-orange-500" },
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
                        <NavItem icon={LayoutDashboard} label="Dashboard" active />
                        <NavItem icon={Car} label="Inventory" />
                        <NavItem icon={FileText} label="Sales" />
                        <NavItem icon={CreditCard} label="Expenses" />
                        <NavItem icon={Users} label="Customers" />
                        <div className="pt-4 mt-4 border-t border-slate-800">
                            <NavItem icon={Settings} label="Settings" />
                        </div>
                    </nav>

                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                                JD
                            </div>
                            <div>
                                <p className="font-medium text-sm">John Doe</p>
                                <p className="text-xs text-slate-400">Manager</p>
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
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5 text-slate-600" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full"></span>
                        </Button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat, index) => (
                            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                                            <stat.icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            {stat.change}
                                        </span>
                                    </div>
                                    <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.title}</h3>
                                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Recent Activity Placeholder */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-2 border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle>Recent Sales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    Chart Placeholder
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button className="w-full justify-start" variant="outline">
                                    <Car className="mr-2 h-4 w-4" /> Add New Vehicle
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <FileText className="mr-2 h-4 w-4" /> Create Invoice
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    <Users className="mr-2 h-4 w-4" /> Add Customer
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
};

const NavItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <button
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
