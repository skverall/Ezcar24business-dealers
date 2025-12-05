import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getReportBySlug } from '@/services/reportsService';
import {
    Car,
    Calendar,
    Gauge,
    MapPin,
    FileText,
    Check,
    AlertTriangle,
    X,
    Camera,
    ArrowLeft,
    Loader2,
    User,
    Share2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const conditionColors: Record<string, string> = {
    excellent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    good: 'text-green-600 bg-green-50 border-green-200',
    fair: 'text-amber-600 bg-amber-50 border-amber-200',
    poor: 'text-orange-600 bg-orange-50 border-orange-200',
    salvage: 'text-red-600 bg-red-50 border-red-200',
};

const bodyPartConditionColors: Record<string, string> = {
    ok: 'bg-emerald-100 text-emerald-700',
    minor_damage: 'bg-amber-100 text-amber-700',
    major_damage: 'bg-orange-100 text-orange-700',
    needs_replacement: 'bg-red-100 text-red-700',
};

const PublicReportView: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { toast } = useToast();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadReport = async () => {
            if (!slug) {
                setError('Invalid report link');
                setLoading(false);
                return;
            }

            try {
                const data = await getReportBySlug(slug);
                if (!data) {
                    setError('Report not found or not published');
                } else {
                    setReport(data);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load report');
            } finally {
                setLoading(false);
            }
        };

        loadReport();
    }, [slug]);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Car Inspection Report', url });
            } catch {
                // User cancelled
            }
        } else {
            await navigator.clipboard.writeText(url);
            toast({ title: 'Link Copied!', description: 'Report link copied to clipboard.' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-luxury" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="max-w-md mx-auto">
                        <CardContent className="pt-6 text-center">
                            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                            <h1 className="text-xl font-semibold mb-2">Report Not Found</h1>
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <Link to="/">
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Go Home
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="flex-1 py-8 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-luxury/10 rounded-xl">
                                <FileText className="w-6 h-6 text-luxury" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Inspection Report</h1>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(report.inspection_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handleShare} className="gap-2">
                            <Share2 className="w-4 h-4" />
                            Share
                        </Button>
                    </div>

                    {/* Overall Condition */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`px-4 py-2 rounded-xl border font-semibold capitalize ${conditionColors[report.overall_condition]}`}>
                                        {report.overall_condition}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Overall Condition
                                    </div>
                                </div>
                                {report.author && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        <span>{report.author.full_name}</span>
                                        {report.author.role && (
                                            <Badge variant="outline" className="text-xs">{report.author.role}</Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vehicle Info */}
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="font-semibold mb-4 flex items-center gap-2">
                                <Car className="w-5 h-5 text-luxury" />
                                Vehicle Information
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase">VIN</p>
                                    <p className="font-mono text-sm">{report.vin}</p>
                                </div>
                                {report.odometer_km && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                                            <Gauge className="w-3 h-3" /> Mileage
                                        </p>
                                        <p className="font-semibold">{Number(report.odometer_km).toLocaleString()} km</p>
                                    </div>
                                )}
                                {report.location && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> Location
                                        </p>
                                        <p>{report.location}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Date
                                    </p>
                                    <p>{new Date(report.inspection_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Body Parts */}
                    {report.body_parts && report.body_parts.length > 0 && (
                        <Card>
                            <CardContent className="pt-6">
                                <h2 className="font-semibold mb-4">Body & Paint Condition</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {report.body_parts.map((part: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-xl ${bodyPartConditionColors[part.condition] || 'bg-gray-100'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium capitalize">
                                                    {part.part.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                {part.condition === 'ok' ? (
                                                    <Check className="w-4 h-4" />
                                                ) : part.condition === 'needs_replacement' ? (
                                                    <X className="w-4 h-4" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4" />
                                                )}
                                            </div>
                                            {part.notes && (
                                                <p className="text-xs mt-1 opacity-80">{part.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Photos */}
                    {report.photos && report.photos.length > 0 && (
                        <Card>
                            <CardContent className="pt-6">
                                <h2 className="font-semibold mb-4 flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-luxury" />
                                    Photos ({report.photos.length})
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {report.photos.map((photo: any, idx: number) => (
                                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                                            <img
                                                src={photo.storage_path}
                                                alt={photo.label || `Photo ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {photo.label && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                                                    {photo.label}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Footer */}
                    <div className="text-center text-sm text-muted-foreground py-4">
                        <p>This report was generated by EZCAR24</p>
                        <p className="text-xs mt-1">Report ID: {report.share_slug}</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PublicReportView;
