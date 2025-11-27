import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Car,
    FileText,
    Settings,
    LogOut,
    Users,
    CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EzcarLogo from "@/components/EzcarLogo";
import { useDealerProfile } from "@/hooks/useDashboardData";
import { useCrmAuth } from "@/hooks/useCrmAuth";

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
        { icon: Settings, label: "Settings", path: "/business/settings" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
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
                                onClick={() => {
                                    navigate(item.path);
                                    if (window.innerWidth < 1024 && onClose) {
                                        onClose();
                                    }
                                }}
                            />
                        ))}
                        <div className="pt-4 mt-4 border-t border-slate-800">
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
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
    >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{label}</span>
    </button>
);

export default BusinessSidebar;
