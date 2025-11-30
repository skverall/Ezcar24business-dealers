import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Menu, Plus, Search, Filter, ArrowUpDown, UserCheck, UserX } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { BusinessLayoutContextType } from '@/pages/BusinessLayout';
import { useClients } from '@/hooks/useDashboardData';
import { AddClientDialog } from '@/components/dashboard/AddClientDialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BusinessCustomers = () => {
    const navigate = useNavigate();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<BusinessLayoutContextType>();
    const { data: clients, isLoading } = useClients();
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortOrder, setSortOrder] = useState<'name' | 'date'>('date');

    const filteredClients = useMemo(() => {
        if (!clients) return [];

        let result = clients.filter((client: any) => {
            const matchesSearch =
                client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.phone?.includes(searchQuery);

            const matchesStatus = statusFilter === 'all'
                ? true
                : statusFilter === 'active'
                    ? client.status === 'active'
                    : client.status !== 'active';

            return matchesSearch && matchesStatus;
        });

        return result.sort((a: any, b: any) => {
            if (sortOrder === 'name') {
                return a.name.localeCompare(b.name);
            } else {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });
    }, [clients, searchQuery, statusFilter, sortOrder]);

    const activeCount = clients?.filter((c: any) => c.status === 'active').length || 0;
    const totalCount = clients?.length || 0;

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 hover:bg-transparent hover:text-slate-900"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customers</h1>
                        <p className="text-slate-500">Manage your client relationships</p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsAddClientOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white shadow-sm border-slate-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Customers</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalCount}</h3>
                        </div>
                        <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-slate-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Clients</p>
                            <h3 className="text-2xl font-bold text-green-600">{activeCount}</h3>
                        </div>
                        <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-slate-100">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Inactive/Other</p>
                            <h3 className="text-2xl font-bold text-slate-600">{totalCount - activeCount}</h3>
                        </div>
                        <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center">
                            <UserX className="h-5 w-5 text-slate-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="border-0 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-white/50 p-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span>Customer Database</span>
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name, email, phone..."
                                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="gap-2 bg-white">
                                            <Filter className="h-4 w-4" />
                                            {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active' : 'Inactive'}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active Only</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>Inactive Only</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                    variant="outline"
                                    className="gap-2 bg-white"
                                    onClick={() => setSortOrder(prev => prev === 'date' ? 'name' : 'date')}
                                >
                                    <ArrowUpDown className="h-4 w-4" />
                                    {sortOrder === 'date' ? 'Newest' : 'Name A-Z'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p>Loading customer data...</p>
                        </div>
                    ) : filteredClients?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-4">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <Search className="h-8 w-8 text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-slate-900">No customers found</p>
                                <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                            {clients?.length === 0 && (
                                <Button variant="link" onClick={() => setIsAddClientOpen(true)} className="text-blue-600">
                                    Add your first customer
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="w-[30%]">Name</TableHead>
                                        <TableHead className="w-[30%]">Contact Info</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Added Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients?.map((client: any) => (
                                        <TableRow key={client.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            {client.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">ID: {client.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    {client.phone && (
                                                        <div className="flex items-center gap-2 text-slate-600">
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-medium">TEL</span>
                                                            {client.phone}
                                                        </div>
                                                    )}
                                                    {client.email && (
                                                        <div className="flex items-center gap-2 text-slate-600">
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-medium">@</span>
                                                            {client.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`
                                                        ${client.status === 'active'
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-slate-50 text-slate-700 border-slate-200'}
                                                        px-3 py-1 capitalize
                                                    `}
                                                >
                                                    {client.status || 'Active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500 font-medium">
                                                {client.created_at ? format(new Date(client.created_at), 'MMM d, yyyy') : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <AddClientDialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen} />
        </div>
    );
};

export default BusinessCustomers;
