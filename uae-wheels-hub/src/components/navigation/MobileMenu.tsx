import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, LogOut, LogIn, UserPlus, Building2, MessageCircle, Sun, Moon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    pathPrefix: string;
    onSellClick: () => void;
    totalUnread: number;
    onSearch: (query: string) => void;
}

const MobileMenu = ({
    isOpen,
    onClose,
    pathPrefix,
    onSellClick,
    totalUnread,
    onSearch
}: MobileMenuProps) => {
    const { t } = useTranslation();
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearchSubmit = () => {
        onSearch(searchQuery);
        onClose();
    };

    const menuItems = [
        { label: t('nav.explore'), path: `${pathPrefix}/browse` },
        { label: t('nav.about'), path: `${pathPrefix}/about` },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Menu Panel */}
            <div
                className={cn(
                    "fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-background z-50 md:hidden shadow-2xl transition-transform duration-300 ease-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                    <span className="font-bold text-xl text-luxury">Menu</span>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6">

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                            placeholder={t('search.placeholder')}
                            className="pl-9 bg-secondary/50 border-transparent focus:bg-background transition-all"
                        />
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className="block px-4 py-3 rounded-lg hover:bg-secondary transition-colors font-medium text-lg"
                            >
                                {item.label}
                            </Link>
                        ))}

                        <button
                            onClick={() => {
                                onSellClick();
                                onClose();
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg hover:bg-secondary transition-colors font-medium text-lg"
                        >
                            {t('nav.sell')}
                        </button>

                        <Link
                            to={`${pathPrefix}/business`}
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors font-medium text-lg text-luxury"
                        >
                            <Building2 className="w-5 h-5" />
                            For Business
                        </Link>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* User Section */}
                    <div className="space-y-2">
                        {user ? (
                            <>
                                <div className="px-4 py-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                                    My Account
                                </div>

                                <Link to="/messages" onClick={onClose}>
                                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal">
                                        <MessageCircle className="h-5 w-5 mr-3" />
                                        Messages
                                        {totalUnread > 0 && (
                                            <Badge variant="destructive" className="ml-auto">
                                                {totalUnread > 99 ? '99+' : totalUnread}
                                            </Badge>
                                        )}
                                    </Button>
                                </Link>

                                <Link to={`${pathPrefix}/profile/my-listings`} onClick={onClose}>
                                    <Button variant="ghost" className="w-full justify-start h-12 text-base font-normal">
                                        <User className="h-5 w-5 mr-3" />
                                        {t('nav.profile')}
                                    </Button>
                                </Link>

                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        signOut();
                                        onClose();
                                    }}
                                    className="w-full justify-start h-12 text-base font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="h-5 w-5 mr-3" />
                                    {t('nav.signOut')}
                                </Button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <Link to={`${pathPrefix}/auth?tab=login`} onClick={onClose}>
                                    <Button variant="outline" className="w-full h-12">
                                        <LogIn className="h-4 w-4 mr-2" />
                                        {t('nav.signIn')}
                                    </Button>
                                </Link>
                                <Link to={`${pathPrefix}/auth?tab=signup`} onClick={onClose}>
                                    <Button className="w-full h-12 bg-luxury hover:bg-luxury/90 text-white">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        {t('nav.signUp')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-secondary/30">
                    <Button
                        variant="ghost"
                        className="w-full justify-between"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        <span className="flex items-center gap-2">
                            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            {theme === 'dark' ? t('nav.light') : t('nav.dark')}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Theme</span>
                    </Button>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;
