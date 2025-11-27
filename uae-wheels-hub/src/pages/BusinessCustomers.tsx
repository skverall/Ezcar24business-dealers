import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const BusinessCustomers = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            <span>Customer Database</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-12 text-center text-slate-500">
                        <p>Customer management module coming soon.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BusinessCustomers;
