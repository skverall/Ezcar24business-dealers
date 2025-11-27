import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BusinessCustomers = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-2"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
                </div>
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
