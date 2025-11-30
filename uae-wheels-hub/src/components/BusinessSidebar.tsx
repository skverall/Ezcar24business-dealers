import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Car,
    FileText,
    Settings,
    LogOut,
    Users,
    CreditCard,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EzcarLogo from "@/components/EzcarLogo";
import { useDealerProfile } from "@/hooks/useDashboardData";
import { useCrmAuth } from "@/hooks/useCrmAuth";
import { cn } from "@/lib/utils";

interface BusinessSidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

const BusinessSidebar = ({ isOpen, onClose }: BusinessSidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut } = useCrmAuth();
    const { data: dealerProfile } = useDealerProfile();

    const handleLogout = async () => {
        await signOut();
        navigate("/business");
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/business/dashboard" },
        { icon: Car, label: "Inventory", path: "/business/inventory" },
        { icon: FileText, label: "Sales", path: "/business/sales" },
        { icon: CreditCard, label: "Expenses", path: "/business/expenses" },
        { icon: Users, label: "Customers", path: "/business/customers" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 sidebar-glass text-white transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 shadow-2xl",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 pb-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-gradient-to-br from-white/10 to-white/5 p-2.5 rounded-xl border border-white/10 shadow-lg shadow-black/20">
                                <EzcarLogo className="h-8 w-8 text-luxury" />
                            </div>
                            <div>
                                <h2 className="font-bold text-xl tracking-wide text-white">EZCAR24</h2>
                                <p className="text-[10px] uppercase tracking-widest text-luxury font-medium">Business Portal</p>
                            </div>
                        </div>

                        {/* Profile Card */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-luxury to-yellow-600 flex items-center justify-center font-bold text-white shadow-lg">
                                    {dealerProfile?.name?.charAt(0) || "U"}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-sm truncate text-white">{dealerProfile?.name || "Loading..."}</p>
                                    <p className="text-xs text-slate-400">Dealer Admin</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                        <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Menu
                        </div>
                        {navItems.map((item) => (
                            <NavItem
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                active={location.pathname === item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    if (window.innerWidth < 1024 && onClose) {
                                        onClose();
                                    }
                                }}
                            />
                        ))}

                        <div className="my-6 border-t border-white/5 mx-4" />

                        <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                            System
                        </div>
                        <NavItem
                            icon={Settings}
                            label="Settings"
                            active={location.pathname === "/business/settings"}
                            onClick={() => {
                                navigate("/business/settings");
                                if (window.innerWidth < 1024 && onClose) {
                                    onClose();
                                }
                            }}
                        />
                    </nav>

                    {/* Footer */}
                    <div className="p-4 m-4 mt-auto border-t border-white/5">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>
        </>
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
        className={cn(
            "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
            active
                ? "nav-item-active text-white shadow-lg shadow-black/10"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
        )}
    >
        <div className="flex items-center gap-3 relative z-10">
            <Icon className={cn(
                "h-5 w-5 transition-colors duration-300",
                active ? "text-luxury" : "text-slate-500 group-hover:text-white"
            )} />
            <span className="font-medium tracking-wide text-sm">{label}</span>
        </div>
        {active && (
            <ChevronRight className="h-4 w-4 text-luxury animate-pulse" />
        )}
    </button>
);

export default BusinessSidebar;
