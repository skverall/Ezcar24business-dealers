import { useState } from "react";
import { Outlet } from "react-router-dom";
import BusinessSidebar from "@/components/BusinessSidebar";
import BusinessProtectedRoute from "@/components/BusinessProtectedRoute";

export type BusinessLayoutContextType = {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
};

const BusinessLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <BusinessProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex">
                <BusinessSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex-1 flex flex-col min-w-0">
                    <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
                </div>
            </div>
        </BusinessProtectedRoute>
    );
};

export default BusinessLayout;
