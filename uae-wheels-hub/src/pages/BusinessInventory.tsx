import React, { useState } from 'react';
import { useVehicles } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Car, Plus, Edit, Trash2, Eye, Menu, Calendar, Tag, DollarSign } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { BusinessLayoutContextType } from '@/pages/BusinessLayout';
import { AddVehicleDialog } from '@/components/dashboard/AddVehicleDialog';
import { LuxuryCard, LuxuryCardContent } from '@/components/ui/LuxuryCard';
import { Badge } from '@/components/ui/badge';

const BusinessInventory = () => {
    const navigate = useNavigate();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    const { data: allVehicles = [], isLoading } = useVehicles();
    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
    const vehicles = allVehicles.filter((v: any) => v.status !== 'sold');

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
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
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

                {/* Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-[300px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : vehicles.length === 0 ? (
                    <LuxuryCard className="border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                        <LuxuryCardContent className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                                <Car className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No vehicles in inventory</h3>
                            <p className="max-w-sm text-center mb-6">Start building your inventory by adding your first vehicle.</p>
                            <Button onClick={() => setIsAddVehicleOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                                Add your first car
                            </Button>
                        </LuxuryCardContent>
                    </LuxuryCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {vehicles.map((car: any) => (
                            <LuxuryCard key={car.id} className="group flex flex-col h-full hover:border-blue-500/30 dark:hover:border-blue-400/30">
                                {/* Image Placeholder or Actual Image */}
                                <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden border-b border-slate-100 dark:border-slate-800">
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                        <Car className="w-12 h-12" />
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="outline" className={`backdrop-blur-md ${getStatusColor(car.status)}`}>
                                            {car.status === 'on_sale' ? 'On Sale' : car.status || 'Active'}
                                        </Badge>
                                    </div>
                                </div>

                                <LuxuryCardContent className="flex-1 flex flex-col p-5">
                                    <div className="mb-4">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {car.year} {car.make} {car.model}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            <Tag className="w-3.5 h-3.5" />
                                            <span className="font-mono">{car.vin || 'No VIN'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Purchase Price</p>
                                            <p className="font-semibold text-slate-900 dark:text-white flex items-center">
                                                <DollarSign className="w-3 h-3 mr-1 text-slate-400" />
                                                {car.purchase_price ? car.purchase_price.toLocaleString() : '—'}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Added</p>
                                            <p className="font-medium text-sm text-slate-900 dark:text-white flex items-center">
                                                <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                                                {car.created_at ? formatDistanceToNow(new Date(car.created_at), { addSuffix: true }) : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                        <Button variant="ghost" size="sm" className="flex-1 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400">
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                        <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                                            <Edit className="w-4 h-4 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </LuxuryCardContent>
                            </LuxuryCard>
                        ))}
                    </div>
                )}
            </div>

            <AddVehicleDialog
                open={isAddVehicleOpen}
                onOpenChange={setIsAddVehicleOpen}
            />
        </div>
    );
};

export default BusinessInventory;
