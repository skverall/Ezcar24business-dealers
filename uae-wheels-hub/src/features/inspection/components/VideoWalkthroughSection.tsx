import React, { useState, useEffect } from 'react';
import { Video, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoWalkthroughSectionProps {
    videoUrl: string;
    onVideoUrlChange: (url: string) => void;
    readOnly?: boolean;
}

export const VideoWalkthroughSection: React.FC<VideoWalkthroughSectionProps> = ({
    videoUrl,
    onVideoUrlChange,
    readOnly,
}) => {
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Helper to extract embed URL from common video links
    const getEmbedUrl = (url: string): string | null => {
        if (!url) return null;

        try {
            // YouTube
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                let videoId = '';
                if (url.includes('youtu.be')) {
                    videoId = url.split('/').pop()?.split('?')[0] || '';
                } else {
                    videoId = new URL(url).searchParams.get('v') || '';
                }
                return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
            }

            // Vimeo
            if (url.includes('vimeo.com')) {
                const videoId = url.split('/').pop();
                return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
            }

            return null;
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        const embed = getEmbedUrl(videoUrl);
        setEmbedUrl(embed);
        if (videoUrl && !embed) {
            setError('Invalid or unsupported video URL. Please use a valid YouTube or Vimeo link.');
        } else {
            setError(null);
        }
    }, [videoUrl]);

    if (readOnly && !embedUrl) {
        return null;
    }

    return (
        <div className="col-span-1 md:col-span-12 print-break-inside-avoid">
            <Card className="p-6 border-border/50 shadow-sm bg-card overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                        <Video className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Video Walkthrough</h3>
                        <p className="text-xs text-muted-foreground">Engine start, exhaust sound, and walkaround</p>
                    </div>
                </div>

                {!readOnly && (
                    <div className="mb-6 space-y-2">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={videoUrl}
                                    onChange={(e) => onVideoUrlChange(e.target.value)}
                                    placeholder="Paste YouTube or Vimeo link here..."
                                    className="pl-9 bg-background/50"
                                />
                            </div>
                        </div>
                        {error && (
                            <Alert variant="destructive" className="py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">{error}</AlertDescription>
                            </Alert>
                        )}
                        <p className="text-[10px] text-muted-foreground ml-1">
                            Supported: YouTube, Vimeo. The video will be embedded automatically.
                        </p>
                    </div>
                )}

                {embedUrl ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/5 border border-border/50 shadow-inner">
                        <iframe
                            src={embedUrl}
                            title="Video Walkthrough"
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    !readOnly && (
                        <div className="w-full aspect-video rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground bg-accent/5">
                            <Video className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No video added</p>
                        </div>
                    )
                )}
            </Card>
        </div>
    );
};
