import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOutletContext } from 'react-router-dom';
import { BusinessLayoutContextType } from '@/pages/BusinessLayout';

const BusinessSettings = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            <span>Business Settings</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-12 text-center text-slate-500">
                        <p>Settings module coming soon.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BusinessSettings;
