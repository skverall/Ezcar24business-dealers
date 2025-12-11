
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getReportBySlug } from '@/services/reportsService';
import EzcarLogo from '@/components/EzcarLogo';
import {
    Loader2,
    AlertTriangle,
    ArrowLeft,
    Phone,
    MessageCircle,
    Share2,
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

                    // Debug logging
                    console.log('🔍 PublicReportView - Raw data from DB:', {
                        reportId: data.id,
                        hasSummary: !!data.summary,
                        summaryLength: data.summary?.length || 0,
                        summaryPreview: data.summary?.substring(0, 150) + '...',
                    });

                    if (data.summary) {
                        try {
                            const summaryObj = typeof data.summary === 'string'
                                ? JSON.parse(data.summary)
                                : data.summary;

                            console.log('🔍 PublicReportView - Parsed summary:', {
                                hasSummary: !!summaryObj.summary,
                                hasServiceHistory: !!summaryObj.serviceHistory,
                                serviceHistoryCount: summaryObj.serviceHistory?.length || 0,
                                hasMechanical: !!summaryObj.mechanicalStatus,
                                hasTires: !!summaryObj.tiresStatus,
                                hasInterior: !!summaryObj.interiorStatus,
                                hasComment: !!summaryObj.comment,
                            });

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

                            // Support both old 'comment' and new 'summary' field names
                            if (summaryObj.summary) {
                                parsedData.summary = summaryObj.summary;
                            } else if (summaryObj.comment) {
                                parsedData.summary = summaryObj.comment;
                            }

                            // Add service history
                            if (summaryObj.serviceHistory) {
                                parsedData.service_history = summaryObj.serviceHistory;
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
        const carName = `${report?.year || ''} ${report?.brand || report?.make || ''} ${report?.model || ''}`.trim();
        const title = `${carName} - Vehicle Inspection Report | EZCAR24`;
        const text = `🔍 Professional Inspection Report\n\n🚗 ${carName}\n✅ Condition: ${(report?.overall_condition || 'N/A').toUpperCase()}\n🏆 Verified by EZCAR24\n\n📋 View full inspection report:`;

        if (navigator.share) {
            try {
                // Try to share with files API (if browser supports it)
                const shareData: ShareData = {
                    title: title,
                    text: text,
                    url: url
                };

                // Check if we can share files
                if (navigator.canShare && navigator.canShare({ files: [] })) {
                    // User can choose to share PDF or just link
                    await navigator.share(shareData);
                } else {
                    // Just share the link
                    await navigator.share(shareData);
                }
            } catch (error: any) {
                // User cancelled or error occurred
                if (error.name !== 'AbortError') {
                    console.error('Share error:', error);
                }
            }
        } else {
            // Fallback: copy link to clipboard
            await navigator.clipboard.writeText(`${text}\n\n${url}`);
            toast({
                title: 'Link copied',
                description: 'Report link and description copied to clipboard.',
                duration: 3000
            });
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
                    <title>{`${report.year || ''} ${report.brand || report.make || ''} ${report.model || ''} - Inspection Report | EZCAR24`.trim()}</title>
                    <meta name="description" content={`Professional vehicle inspection report for ${report.year || ''} ${report.brand || report.make || ''} ${report.model || ''}. Overall Condition: ${(report.overall_condition || 'N/A').toUpperCase()}. Verified by EZCAR24 certified inspectors.`} />

                    {/* Open Graph / Facebook / WhatsApp / Twitter */}
                    <meta property="og:type" content="article" />
                    <meta property="og:site_name" content="EZCAR24 - Premium Car Marketplace" />
                    <meta property="og:title" content={`${report.year || ''} ${report.brand || report.make || ''} ${report.model || ''} - Vehicle Inspection Report`} />
                    <meta property="og:description" content={`🔍 Professional Inspection Report\n\n✅ Overall Condition: ${(report.overall_condition || 'N/A').toUpperCase()}\n📋 Complete mechanical & body inspection\n📸 ${report.photos?.length || 0}+ detailed photos\n🏆 Verified by EZCAR24 certified inspectors\n\nView full inspection report →`} />
                    {report.photos && report.photos.length > 0 && (
                        <>
                            <meta property="og:image" content={report.photos[0].storage_path} />
                            <meta property="og:image:secure_url" content={report.photos[0].storage_path} />
                            <meta property="og:image:type" content="image/jpeg" />
                            <meta property="og:image:width" content="1200" />
                            <meta property="og:image:height" content="630" />
                            <meta property="og:image:alt" content={`${report.year || ''} ${report.brand || report.make || ''} ${report.model || ''} - Front View`} />
                        </>
                    )}
                    <meta property="og:url" content={window.location.href} />
                    <meta property="og:locale" content="en_US" />

                    {/* Twitter Card */}
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:site" content="@ezcar24" />
                    <meta name="twitter:title" content={`${report.year || ''} ${report.brand || report.make || ''} ${report.model || ''} - Inspection Report`} />
                    <meta name="twitter:description" content={`Professional vehicle inspection - Overall Condition: ${(report.overall_condition || 'N/A').toUpperCase()}. Verified by EZCAR24.`} />
                    {report.photos && report.photos.length > 0 && (
                        <meta name="twitter:image" content={report.photos[0].storage_path} />
                    )}

                    {/* WhatsApp specific */}
                    <meta property="og:see_also" content="https://ezcar24.com" />

                    {/* Schema.org Structured Data */}
                    <script type="application/ld+json">
                        {JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Article",
                            "headline": `${report.year || ''} ${report.brand || report.make || ''} ${report.model || ''} - Vehicle Inspection Report`,
                            "image": report.photos && report.photos.length > 0 ? [report.photos[0].storage_path] : [],
                            "datePublished": report.created_at || new Date().toISOString(),
                            "dateModified": report.updated_at || new Date().toISOString(),
                            "author": {
                                "@type": "Organization",
                                "name": "EZCAR24",
                                "url": "https://ezcar24.com"
                            },
                            "publisher": {
                                "@type": "Organization",
                                "name": "EZCAR24",
                                "logo": {
                                    "@type": "ImageObject",
                                    "url": "https://ezcar24.com/favicon-192.png"
                                }
                            },
                            "description": `Professional vehicle inspection report for ${report.year || ''} ${report.brand || report.make || ''} ${report.model || ''}. Overall Condition: ${(report.overall_condition || 'N/A').toUpperCase()}.`
                        })}
                    </script>
                </Helmet>
            )}

            {/* Sticky Public Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm supports-[backdrop-filter]:bg-background/60">
                <div className="w-full px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-luxury/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <EzcarLogo className="h-10 w-10 relative z-10 transition-transform duration-500 group-hover:scale-110" />
                            </div>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-xl font-bold tracking-tight leading-none">EZCAR24</span>
                                <span className="text-[10px] tracking-[0.2em] text-luxury font-medium uppercase">Luxury Marketplace</span>
                            </div>
                        </Link>
                        <div className="hidden sm:block h-4 w-[1px] bg-border" />
                        <span className="hidden sm:block text-sm font-medium text-muted-foreground">
                            Inspection Report
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Download PDF Button */}


                        {report?.contact_phone && (
                            <Button
                                variant="default"
                                size="sm"
                                className="hidden sm:flex bg-luxury hover:bg-luxury/90 text-white gap-2"
                                onClick={() => window.open(`https://wa.me/${report.contact_phone?.replace(/[^0-9]/g, '')}?text=I'm interested in this car: ${window.location.href}`, '_blank')}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Contact Seller
                            </Button >
                        )}
                        <Button variant="ghost" size="icon" onClick={handleShare}>
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div >
                </div >
            </div >

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
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50 sm:hidden z-50">
                <div className="flex gap-3">
                    <Button
                        size="sm"
                        className="flex-1 bg-luxury hover:bg-luxury/90 text-white gap-2 h-9 text-xs uppercase tracking-wide shadow-md shadow-luxury/20"
                        onClick={() => window.open(`https://wa.me/971585263233?text=I'm interested in this car: ${window.location.href}`, '_blank')}
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 h-9 text-xs uppercase tracking-wide border-luxury/30 text-luxury hover:bg-luxury/5"
                        onClick={() => window.location.href = 'tel:+971585263233'}
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                    </Button>
                </div>
            </div>

            <div className="hidden sm:block">
                <Footer />
            </div>
        </div >
    );
};

export default PublicReportView;
