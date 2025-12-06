import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getReportBySlug } from '@/services/reportsService';
import {
    Loader2,
    AlertTriangle,
    ArrowLeft,
    Phone,
    MessageCircle,
    Share2,
    Car,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CarInspectionReport from '@/components/CarInspectionReport';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

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
                    // Parse the summary JSON and merge its contents into the data object
                    // The summary contains carInfo, mechanicalStatus, tiresStatus, interiorStatus, comment
                    let parsedData = { ...data };
                    if (data.summary) {
                        try {
                            const summaryObj = typeof data.summary === 'string'
                                ? JSON.parse(data.summary)
                                : data.summary;

                            // Merge carInfo fields
                            if (summaryObj.carInfo) {
                                parsedData = {
                                    ...parsedData,
                                    brand: summaryObj.carInfo.brand,
                                    make: summaryObj.carInfo.brand, // alias for Helmet
                                    model: summaryObj.carInfo.model,
                                    year: summaryObj.carInfo.year,
                                    owners: summaryObj.carInfo.owners,
                                    mulkiaExpiry: summaryObj.carInfo.mulkiaExpiry,
                                    number_of_owners: summaryObj.carInfo.owners,
                                    mulkia_expiry: summaryObj.carInfo.mulkiaExpiry,
                                };
                            }

                            // Add mechanicalStatus, tiresStatus, interiorStatus
                            if (summaryObj.mechanicalStatus) {
                                parsedData.mechanical_checklist = summaryObj.mechanicalStatus;
                            }
                            if (summaryObj.tiresStatus) {
                                parsedData.tires_status = summaryObj.tiresStatus;
                            }
                            if (summaryObj.interiorStatus) {
                                parsedData.interior_status = summaryObj.interiorStatus;
                            }
                            if (summaryObj.comment) {
                                parsedData.notes = summaryObj.comment;
                            }
                        } catch (parseErr) {
                            console.error('Failed to parse report summary:', parseErr);
                        }
                    }

                    // Extract contact_phone from author
                    if (data.author?.contact_phone) {
                        parsedData.contact_phone = data.author.contact_phone;
                    }

                    setReport(parsedData);
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
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </div>
                        <h1 className="text-xl font-semibold">Report Not Available</h1>
                        <p className="text-muted-foreground max-w-sm mx-auto">{error}</p>
                        <Link to="/">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Go Home
                            </Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {report && (
                <Helmet>
                    <title>{`Inspection Report: ${report.year || ''} ${report.make || ''} ${report.model || ''} | EZCAR24`.trim()}</title>
                    <meta name="description" content={`Detailed inspection report for ${report.year || ''} ${report.make || ''} ${report.model || ''}. Condition: ${report.overall_condition || 'N/A'}. View photos and mechanical checks.`} />

                    {/* Open Graph / Facebook / WhatsApp */}
                    <meta property="og:type" content="article" />
                    <meta property="og:title" content={`Inspection Report: ${report.year || ''} ${report.make || ''} ${report.model || ''}`} />
                    <meta property="og:description" content={`Overall Condition: ${(report.overall_condition || 'N/A').toUpperCase()}. Verified by EZCAR24.`} />
                    {report.photos && report.photos.length > 0 && (
                        <meta property="og:image" content={report.photos[0].storage_path} />
                    )}
                    <meta property="og:url" content={window.location.href} />
                </Helmet>
            )}

            {/* Sticky Public Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <img src="/LOGO%20EZCAR24%20NEW.jpeg" alt="EZCAR24" className="h-10 w-auto" />
                        </Link>
                        <div className="hidden sm:block h-4 w-[1px] bg-border" />
                        <span className="hidden sm:block text-sm font-medium text-muted-foreground">
                            Inspection Report
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {report?.contact_phone && (
                            <Button
                                variant="default"
                                size="sm"
                                className="hidden sm:flex bg-luxury hover:bg-luxury/90 text-white gap-2"
                                onClick={() => window.open(`https://wa.me/${report.contact_phone?.replace(/[^0-9]/g, '')}?text=I'm interested in this car: ${window.location.href}`, '_blank')}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Contact Seller
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={handleShare}>
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <main className="flex-1 py-8 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <CarInspectionReport
                        reportId={report.id}
                        readOnly={true} // Forces read-only mode, turning off all editing
                        initialData={report} // Pass loaded data to avoid re-fetching
                    />
                </div>
            </main>

            {/* Mobile Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50 sm:hidden z-50 flex gap-3">
                <Button
                    className="flex-1 bg-luxury hover:bg-luxury/90 text-white gap-2"
                    onClick={() => window.open(`https://wa.me/971501234567?text=I'm interested in this car: ${window.location.href}`, '_blank')}
                >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => window.location.href = 'tel:+971501234567'}
                >
                    <Phone className="w-4 h-4" />
                    Call
                </Button>
            </div>

            <div className="hidden sm:block">
                <Footer />
            </div>
        </div>
    );
};

export default PublicReportView;
