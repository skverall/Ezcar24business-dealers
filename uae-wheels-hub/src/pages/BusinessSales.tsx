import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, TrendingUp, Menu, Plus, Search, DollarSign, Calendar, Filter, ArrowUpDown, Car } from 'lucide-react';
import { useSales, useVehicles, useDealerProfile } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BusinessLayoutContextType } from '@/pages/BusinessLayout';
import { LuxuryCard, LuxuryCardContent } from '@/components/ui/LuxuryCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AddSaleDialog } from '@/components/dashboard/AddSaleDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const BusinessSales = () => {
    const navigate = useNavigate();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    const { data: sales = [], isLoading } = useSales();
    const { data: vehicles = [] } = useVehicles();
    const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'price_high' | 'price_low' | 'profit_high'>('date_desc');

    const vehicleMap = useMemo(() => {
        const map = new Map<string, any>();
        vehicles.forEach((v: any) => map.set(v.id, v));
        return map;
    }, [vehicles]);

    const filteredSales = useMemo(() => {
        let result = sales.filter((sale: any) => {
            const vehicle = vehicleMap.get(sale.vehicle_id);
            const searchLower = searchQuery.toLowerCase();

            return (
                sale.buyer_name?.toLowerCase().includes(searchLower) ||
                vehicle?.make?.toLowerCase().includes(searchLower) ||
                vehicle?.model?.toLowerCase().includes(searchLower) ||
                vehicle?.vin?.toLowerCase().includes(searchLower)
            );
        });

        return result.sort((a: any, b: any) => {
            switch (sortOrder) {
                case 'date_asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'price_high':
                    return (b.sale_price || 0) - (a.sale_price || 0);
                case 'price_low':
                    return (a.sale_price || 0) - (b.sale_price || 0);
                case 'profit_high':
                    return (b.profit || 0) - (a.profit || 0);
                case 'date_desc':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });
    }, [sales, searchQuery, sortOrder, vehicleMap]);

    // Stats
    const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.sale_price || s.amount || 0), 0);
    const totalProfit = sales.reduce((sum: number, s: any) => sum + (s.profit || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden mt-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mb-2 pl-0 hover:pl-2 transition-all text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Sales
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Track your sales performance and history
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsAddSaleOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Record Sale</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                AED {totalRevenue.toLocaleString()}
                            </h3>
                        </div>
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Profit</p>
                            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                                AED {totalProfit.toLocaleString()}
                            </h3>
                        </div>
                        <div className="h-10 w-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vehicles Sold</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{sales.length}</h3>
                        </div>
                        <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <Car className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search buyer, vehicle..."
                        className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 w-full md:w-auto justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4" />
                                    <span>Sort</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSortOrder('date_desc')}>Newest First</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder('date_asc')}>Oldest First</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder('price_high')}>Price: High to Low</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder('profit_high')}>Profit: High to Low</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Sales List */}
            <LuxuryCard>
                <LuxuryCardContent className="p-0">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-500">Loading sales...</div>
                    ) : filteredSales.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No sales found</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {searchQuery ? "Try adjusting your search terms." : "Record your first sale to see it here."}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => setIsAddSaleOpen(true)} variant="outline">
                                    Record Sale
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Vehicle</th>
                                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Buyer</th>
                                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Sale Price</th>
                                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Profit</th>
                                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-sm">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredSales.map((sale: any) => {
                                        const vehicle = vehicleMap.get(sale.vehicle_id);
                                        return (
                                            <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-900 dark:text-white">
                                                        {vehicle ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}` : 'Vehicle not found'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                        {vehicle?.vin ? `VIN: ${vehicle.vin.slice(-6)}` : `ID: ${sale.vehicle_id.slice(0, 8)}`}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-slate-700 dark:text-slate-300 font-medium">{sale.buyer_name}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        AED {(sale.sale_price ?? sale.amount ?? 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                                        AED {(sale.profit ?? sale.amount ?? 0).toLocaleString()}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {sale.date ? format(new Date(sale.date), 'MMM d, yyyy') : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </LuxuryCardContent>
            </LuxuryCard>

            <AddSaleDialog
                open={isAddSaleOpen}
                onOpenChange={setIsAddSaleOpen}
            />
        </div>
    );
};

export default BusinessSales;
