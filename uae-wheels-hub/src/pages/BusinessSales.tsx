import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp } from 'lucide-react';
import { useSales, useVehicles } from '@/hooks/useDashboardData';
import { format } from 'date-fns';

const BusinessSales = () => {
    const { data: sales = [], isLoading } = useSales();
    const { data: vehicles = [] } = useVehicles();

    const vehicleMap = React.useMemo(() => {
        const map = new Map<string, any>();
        vehicles.forEach((v: any) => map.set(v.id, v));
        return map;
    }, [vehicles]);

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
                        <p className="text-slate-500">View recorded sales from the CRM Supabase</p>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                        <TrendingUp className="w-4 h-4" />
                        <span>Total: {sales.length}</span>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            <span>Sales History</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-slate-500">Loading sales...</div>
                        ) : sales.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No sales recorded.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-medium text-slate-600">Vehicle</th>
                                            <th className="p-4 font-medium text-slate-600">Buyer</th>
                                            <th className="p-4 font-medium text-slate-600">Sale Price</th>
                                            <th className="p-4 font-medium text-slate-600">Profit</th>
                                            <th className="p-4 font-medium text-slate-600">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {sales.map((sale: any) => {
                                            const vehicle = vehicleMap.get(sale.vehicle_id);
                                            return (
                                                <tr key={sale.id} className="hover:bg-slate-50">
                                                    <td className="p-4">
                                                        <div className="font-medium text-slate-900">
                                                            {vehicle ? `${vehicle.year || '—'} ${vehicle.make || ''} ${vehicle.model || ''}` : 'Vehicle'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">VIN: {vehicle?.vin || sale.vehicle_id}</div>
                                                    </td>
                                                    <td className="p-4 text-slate-800">{sale.buyer_name}</td>
                                                    <td className="p-4 font-medium text-slate-900">
                                                        AED {sale.sale_price?.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-900">
                                                        AED {sale.profit?.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-500">
                                                        {sale.date ? format(new Date(sale.date), 'MMM d, yyyy') : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BusinessSales;
