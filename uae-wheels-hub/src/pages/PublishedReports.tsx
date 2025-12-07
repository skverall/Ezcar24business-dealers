import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
    FileText,
    ExternalLink,
    Search,
    Loader2,
    Calendar,
    ArrowLeft,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getMyReports, deleteReport } from '@/services/reportsService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const PublishedReports = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteReport = async (report: any) => {
        const confirmMsg = report.listing
            ? `Are you sure you want to delete this report? It will be unlinked from the listing "${report.listing.year} ${report.listing.make} ${report.listing.model}".`
            : 'Are you sure you want to delete this report? This action cannot be undone.';

        if (!window.confirm(confirmMsg)) return;

        setDeletingId(report.id);
        try {
            await deleteReport(report.id);
            setReports(prev => prev.filter(r => r.id !== report.id));
            toast({
                title: 'Report deleted',
                description: 'The report has been permanently deleted.',
            });
        } catch (error: any) {
            console.error('Failed to delete report:', error);
            toast({
                title: 'Delete failed',
                description: error.message || 'Failed to delete the report.',
                variant: 'destructive',
            });
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        async function loadReports() {
            if (!user) return;
            try {
                const data = await getMyReports();
                setReports(data || []);
            } catch (error) {
                console.error('Failed to load reports', error);
            } finally {
                setLoading(false);
            }
        }
        loadReports();
    }, [user]);

    const filteredReports = reports.filter(report => {
        const searchLower = searchQuery.toLowerCase();
        const title = report.listing?.title?.toLowerCase() || '';
        const vin = report.vin?.toLowerCase() || '';
        const displayId = report.display_id?.toLowerCase() || '';
        const id = report.id?.toLowerCase() || '';

        return title.includes(searchLower) ||
            vin.includes(searchLower) ||
            displayId.includes(searchLower) ||
            id.includes(searchLower);
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-luxury" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/car-reports')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Published Reports</h1>
                        <p className="text-muted-foreground mt-1">Manage and view your vehicle inspection reports.</p>
                    </div>
                </div>
                <Button onClick={() => navigate('/car-reports')} className="bg-luxury hover:bg-luxury/90 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    New Report
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by ID, VIN, or Car..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Report ID</TableHead>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Inspection Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No reports found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReports.map((report) => (
                                        <TableRow key={report.id} className="group">
                                            <TableCell className="font-medium font-mono">
                                                {report.display_id || report.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">
                                                        {report.listing?.year} {report.listing?.make} {report.listing?.model}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-mono">{report.vin}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {format(new Date(report.inspection_date), 'MMM dd, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={report.status === 'frozen' ? 'default' : 'secondary'}
                                                    className={report.status === 'frozen' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                                                >
                                                    {report.status === 'frozen' ? 'Published' : 'Draft'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Link to={`/car-reports?id=${report.id}`} title="Edit">
                                                            <FileText className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                                        </Link>
                                                    </Button>
                                                    {report.status === 'frozen' && report.share_slug && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Link to={`/report/${report.share_slug}`} target="_blank" title="View Public">
                                                                <ExternalLink className="w-4 h-4 text-luxury hover:text-luxury/80" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteReport(report)}
                                                        disabled={deletingId === report.id}
                                                        className="h-8 w-8 p-0"
                                                        title="Delete Report"
                                                    >
                                                        {deletingId === report.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PublishedReports;
