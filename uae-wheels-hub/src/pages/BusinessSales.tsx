import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const BusinessSales = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            <span>Sales History</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-12 text-center text-slate-500">
                        <p>Sales management module coming soon.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BusinessSales;
