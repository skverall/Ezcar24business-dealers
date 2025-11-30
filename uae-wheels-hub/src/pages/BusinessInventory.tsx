import React, { useState, useMemo } from 'react';
import { useVehicles, useDealerProfile } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Car, Plus, Edit, Trash2, Eye, Menu, Calendar, Tag, DollarSign, Search, Filter, ArrowUpDown, Gauge, Fuel } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { BusinessLayoutContextType } from '@/pages/BusinessLayout';
import { AddVehicleDialog } from '@/components/dashboard/AddVehicleDialog';
import { LuxuryCard, LuxuryCardContent } from '@/components/ui/LuxuryCard';
import { Badge } from '@/components/ui/badge';
import { crmSupabase } from '@/integrations/supabase/crmClient';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from '@/components/ui/card';

// Helper to get vehicle image URL from Supabase storage with cache-busting
const getVehicleImageUrl = (dealerId: string, vehicleId: string, updatedAt?: string): string => {
    const path = `${dealerId}/vehicles/${vehicleId}.jpg`;
    const { data } = crmSupabase.storage.from('vehicle-images').getPublicUrl(path);
    // Add cache-busting parameter based on updated_at timestamp or current time
    const cacheBuster = updatedAt ? new Date(updatedAt).getTime() : Date.now();
    return `${data.publicUrl}?t=${cacheBuster}`;
};

const BusinessInventory = () => {
    const navigate = useNavigate();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    const { data: allVehicles = [], isLoading } = useVehicles();
    const { data: dealerProfile } = useDealerProfile();
    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    // Filter/Sort States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'active_inventory' | 'all' | 'on_sale' | 'sold' | 'under_service'>('active_inventory');
    const [sortOrder, setSortOrder] = useState<'newest' | 'price_high' | 'price_low'>('newest');

    const dealerId = dealerProfile?.dealer_id;

    const filteredVehicles = useMemo(() => {
        let result = allVehicles.filter((v: any) => {
            // Search Filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                v.make?.toLowerCase().includes(searchLower) ||
                v.model?.toLowerCase().includes(searchLower) ||
                v.vin?.toLowerCase().includes(searchLower) ||
                v.year?.toString().includes(searchLower);

            // Status Filter
            let matchesStatus = true;
            if (statusFilter === 'active_inventory') {
                matchesStatus = v.status !== 'sold';
            } else if (statusFilter !== 'all') {
                matchesStatus = v.status === statusFilter;
            }

            return matchesSearch && matchesStatus;
        });

        // Sorting
        return result.sort((a: any, b: any) => {
            switch (sortOrder) {
                case 'price_high':
                    return (b.purchase_price || 0) - (a.purchase_price || 0);
                case 'price_low':
                    return (a.purchase_price || 0) - (b.purchase_price || 0);
                case 'newest':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });
    }, [allVehicles, searchQuery, statusFilter, sortOrder]);

    // Stats
    const totalInventoryValue = filteredVehicles.reduce((sum: number, v: any) => sum + (v.purchase_price || 0), 0);
    const onSaleCount = allVehicles.filter((v: any) => v.status === 'on_sale').length;
    const soldCount = allVehicles.filter((v: any) => v.status === 'sold').length;

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'on_sale':
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'sold':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'under_service':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 lg:p-8 space-y-8">
            {/* Header Section */}
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
                            Inventory
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Manage your vehicle inventory
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsAddVehicleOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Add Vehicle</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Inventory Value</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                AED {totalInventoryValue.toLocaleString()}
                            </h3>
                        </div>
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Vehicles On Sale</p>
                            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{onSaleCount}</h3>
                        </div>
                        <div className="h-10 w-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <Car className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sold Vehicles</p>
                            <h3 className="text-2xl font-bold text-slate-600 dark:text-slate-300">{soldCount}</h3>
                        </div>
                        <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <Tag className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search make, model, VIN..."
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
                                    <Filter className="h-4 w-4" />
                                    <span>
                                        Status: {
                                            statusFilter === 'active_inventory' ? 'Active' :
                                                statusFilter === 'all' ? 'All History' :
                                                    statusFilter.replace('_', ' ')
                                        }
                                    </span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusFilter('active_inventory')}>Active Inventory</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('on_sale')}>On Sale</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('under_service')}>Under Service</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('sold')}>Sold</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All History</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                            <DropdownMenuItem onClick={() => setSortOrder('newest')}>Newest First</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder('price_high')}>Price: High to Low</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder('price_low')}>Price: Low to High</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-[380px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : filteredVehicles.length === 0 ? (
                <LuxuryCard className="border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <LuxuryCardContent className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                            <Car className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No vehicles found</h3>
                        <p className="max-w-sm text-center mb-6">
                            {searchQuery || statusFilter !== 'all'
                                ? "Try adjusting your search or filters to find what you're looking for."
                                : "Start building your inventory by adding your first vehicle."}
                        </p>
                        <Button onClick={() => setIsAddVehicleOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                            Add Vehicle
                        </Button>
                    </LuxuryCardContent>
                </LuxuryCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredVehicles.map((car: any) => (
                        <LuxuryCard key={car.id} className="group flex flex-col h-full hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            {/* Vehicle Image */}
                            <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                                {dealerId && !imageErrors.has(car.id) ? (
                                    <img
                                        src={getVehicleImageUrl(dealerId, car.id, car.updated_at)}
                                        alt={`${car.year} ${car.make} ${car.model}`}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={() => setImageErrors(prev => new Set(prev).add(car.id))}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-900">
                                        <Car className="w-12 h-12" />
                                    </div>
                                )}
                                {/* Status Badge */}
                                <div className="absolute top-3 right-3 z-10">
                                    <Badge variant="outline" className={`backdrop-blur-md shadow-sm ${getStatusColor(car.status)}`}>
                                        {car.status === 'on_sale' ? 'On Sale' : car.status?.replace('_', ' ') || 'Active'}
                                    </Badge>
                                </div>
                                {/* Price Tag Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                                    <p className="text-white font-bold text-lg flex items-center">
                                        AED {car.purchase_price ? car.purchase_price.toLocaleString() : '—'}
                                    </p>
                                </div>
                            </div>

                            <LuxuryCardContent className="flex-1 flex flex-col p-5">
                                <div className="mb-4">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {car.year} {car.make} {car.model}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Tag className="w-3.5 h-3.5" />
                                            <span className="font-mono text-xs">{car.vin ? car.vin.slice(-6) : 'No VIN'}</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                        <div className="flex items-center gap-1">
                                            <Gauge className="w-3.5 h-3.5" />
                                            <span className="text-xs">{car.mileage ? `${car.mileage.toLocaleString()} km` : '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Color</p>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full border border-slate-200 shadow-sm"
                                                style={{ backgroundColor: car.color?.toLowerCase() || '#ccc' }}
                                            />
                                            <p className="font-medium text-sm text-slate-900 dark:text-white capitalize">
                                                {car.color || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Added</p>
                                        <p className="font-medium text-sm text-slate-900 dark:text-white flex items-center">
                                            <Calendar className="w-3 h-3 mr-1.5 text-slate-400" />
                                            {car.created_at ? formatDistanceToNow(new Date(car.created_at), { addSuffix: true }) : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <Button variant="ghost" size="sm" className="flex-1 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 font-medium">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                    </Button>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 text-slate-500">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </LuxuryCardContent>
                        </LuxuryCard>
                    ))}
                </div>
            )}

            <AddVehicleDialog
                open={isAddVehicleOpen}
                onOpenChange={setIsAddVehicleOpen}
            />
        </div>
    );
};

export default BusinessInventory;
