import React from 'react';
import { useListings } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const BusinessInventory = () => {
    const navigate = useNavigate();
    const { data: listingsData, isLoading } = useListings();
    const listings = listingsData?.data || [];

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
                        <p className="text-slate-500">Manage your vehicle listings</p>
                    </div>
                    <Button onClick={() => navigate('/list-car')} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Vehicle
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car className="w-5 h-5" />
                            <span>All Listings ({listings.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">Loading inventory...</div>
                        ) : listings.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Car className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No vehicles in inventory.</p>
                                <Button variant="link" onClick={() => navigate('/list-car')}>
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
                                        {listings.map((car: any) => (
                                            <tr key={car.id} className="hover:bg-slate-50">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        {car.image_url && (
                                                            <img
                                                                src={car.image_url}
                                                                alt={car.model}
                                                                className="w-12 h-12 rounded object-cover bg-slate-200"
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-slate-900">{car.year} {car.make} {car.model}</p>
                                                            <p className="text-xs text-slate-500">{car.mileage?.toLocaleString()} km</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-medium text-slate-900">
                                                    AED {car.price?.toLocaleString()}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${car.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            car.status === 'sold' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {car.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-slate-500">
                                                    {car.created_at ? formatDistanceToNow(new Date(car.created_at), { addSuffix: true }) : '-'}
                                                </td>
                                                <td className="p-4 text-right space-x-2">
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/car/${car.id}`)}>
                                                        <Eye className="w-4 h-4 text-slate-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon">
                                                        <Trash2 className="w-4 h-4 text-red-500" />
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
        </div>
    );
};

export default BusinessInventory;
