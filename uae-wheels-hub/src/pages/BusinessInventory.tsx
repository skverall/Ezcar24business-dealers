import React, { useState } from 'react';
import { useVehicles } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Car, Plus, Edit, Trash2, Eye, Menu } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { BusinessLayoutContextType } from '@/pages/BusinessLayout';
import { AddVehicleDialog } from '@/components/dashboard/AddVehicleDialog';

const BusinessInventory = () => {
    const navigate = useNavigate();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    const { data: allVehicles = [], isLoading } = useVehicles();
    const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
    const vehicles = allVehicles.filter((v: any) => v.status !== 'sold');

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-start lg:items-center gap-4">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden mt-1"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mb-2 pl-0 hover:pl-2 transition-all"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Inventory</h1>
                            <p className="text-sm text-slate-500">Manage your vehicles from the business CRM</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsAddVehicleOpen(true)} className="bg-blue-600 hover:bg-blue-700 shrink-0">
                        <Plus className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Add Vehicle</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car className="w-5 h-5" />
                            <span>All Vehicles ({vehicles.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading inventory...</div>
                        ) : vehicles.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Car className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No vehicles in inventory.</p>
                                <Button variant="link" onClick={() => setIsAddVehicleOpen(true)}>
                                    Add your first car
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-medium text-slate-600">Vehicle</th>
                                            <th className="p-4 font-medium text-slate-600">Price</th>
                                            <th className="p-4 font-medium text-slate-600">Status</th>
                                            <th className="p-4 font-medium text-slate-600">Created</th>
                                            <th className="p-4 font-medium text-slate-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {vehicles.map((car: any) => (
                                            <tr key={car.id} className="hover:bg-slate-50">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <p className="font-medium text-slate-900">{car.year || '—'} {car.make} {car.model}</p>
                                                            <p className="text-xs text-slate-500">VIN: {car.vin || '—'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-medium text-slate-900">
                                                    {car.purchase_price ? `AED ${car.purchase_price.toLocaleString()}` : '—'}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${car.status === 'active' || car.status === 'on_sale' ? 'bg-green-100 text-green-800' :
                                                        car.status === 'sold' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {car.status === 'on_sale' ? 'On Sale' : car.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-slate-500">
                                                    {car.created_at ? formatDistanceToNow(new Date(car.created_at), { addSuffix: true }) : '-'}
                                                </td>
                                                <td className="p-4 text-right space-x-2">
                                                    <Button variant="ghost" size="icon" disabled>
                                                        <Eye className="w-4 h-4 text-slate-300" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" disabled>
                                                        <Edit className="w-4 h-4 text-slate-300" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" disabled>
                                                        <Trash2 className="w-4 h-4 text-slate-300" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AddVehicleDialog
                open={isAddVehicleOpen}
                onOpenChange={setIsAddVehicleOpen}
            />
        </div>
    );
};

export default BusinessInventory;
