import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, LogOut, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import RealtimeChat from "../RealtimeChat";

interface UserActionsProps {
    pathPrefix: string;
}

const UserActions = ({ pathPrefix }: UserActionsProps) => {
    const { t } = useTranslation();
    const { user, signOut } = useAuth();

    if (user) {
        return (
            <>
                <RealtimeChat className="flex" />

                <Link to={`${pathPrefix}/profile/my-listings`}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-luxury/10 hover:text-luxury transition-all duration-300"
                    >
                        <User className="h-5 w-5 mr-0 lg:mr-2" />
                        <span className="hidden lg:inline font-medium">{t('nav.profile')}</span>
                    </Button>
                </Link>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                >
                    <LogOut className="h-5 w-5 mr-0 lg:mr-2" />
                    <span className="hidden lg:inline font-medium">{t('nav.signOut')}</span>
                </Button>

                <Link to={`${pathPrefix}/list-car`} className="hidden lg:inline-flex">
                    <Button
                        className="bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/20 transition-all hover:scale-105 active:scale-95"
                        size="sm"
                    >
                        {t('nav.sell')}
                    </Button>
                </Link>
            </>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <Link to={`${pathPrefix}/auth?tab=login`}>
                <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-luxury/10 hover:text-luxury transition-all duration-300 font-medium"
                >
                    <LogIn className="h-5 w-5 mr-0 lg:mr-2" />
                    <span className="hidden lg:inline">{t('nav.signIn')}</span>
                </Button>
            </Link>

            <Link to={`${pathPrefix}/auth?tab=signup`}>
                <Button
                    className="bg-luxury hover:bg-luxury/90 text-white shadow-lg shadow-luxury/20 transition-all hover:scale-105 active:scale-95"
                    size="sm"
                >
                    <UserPlus className="h-5 w-5 mr-0 lg:mr-2" />
                    <span className="hidden lg:inline">{t('nav.signUp')}</span>
                </Button>
            </Link>
        </div>
    );
};

export default UserActions;
