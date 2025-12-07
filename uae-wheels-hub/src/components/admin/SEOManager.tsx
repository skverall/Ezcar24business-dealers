import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateSitemap, downloadSitemap } from '@/utils/generateSitemap';

const SEOManager = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sitemapPreview, setSitemapPreview] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const handleGenerateSitemap = async () => {
    setIsGenerating(true);
    try {
      const sitemap = await generateSitemap();
      setSitemapPreview(sitemap);
      setLastGenerated(new Date());
      toast({
        title: 'Sitemap generated',
        description: 'Sitemap has been generated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate sitemap.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSitemap = async () => {
    const success = await downloadSitemap();
    if (success) {
      toast({
        title: 'Download started',
        description: 'Sitemap.xml download has started.',
      });
    } else {
      toast({
        title: 'Download failed',
        description: 'Failed to download sitemap.',
        variant: 'destructive',
      });
    }
  };

  const seoChecklist = [
    { item: 'robots.txt configured', status: 'completed' },
    { item: 'sitemap.xml available', status: 'completed' },
    { item: 'Meta tags on all pages', status: 'completed' },
    { item: 'Open Graph tags', status: 'completed' },
    { item: 'Structured data for cars', status: 'completed' },
    { item: 'Google Analytics tracking', status: 'completed' },
    { item: 'Canonical URLs', status: 'completed' },
    { item: 'Mobile-friendly design', status: 'completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">SEO Management</h2>
        <Badge variant="outline" className="text-green-600">
          SEO Optimized
        </Badge>
      </div>

      {/* SEO Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            SEO Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seoChecklist.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">{item.item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sitemap Management */}
      <Card>
        <CardHeader>
          <CardTitle>Sitemap Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateSitemap}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate Sitemap
            </Button>
            <Button 
              onClick={handleDownloadSitemap}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button 
              onClick={() => window.open('/sitemap.xml', '_blank')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Current
            </Button>
          </div>

          {lastGenerated && (
            <p className="text-sm text-muted-foreground">
              Last generated: {lastGenerated.toLocaleString()}
            </p>
          )}

          {sitemapPreview && (
            <div>
              <h4 className="font-medium mb-2">Sitemap Preview:</h4>
              <Textarea
                value={sitemapPreview}
                readOnly
                className="h-40 font-mono text-xs"
                placeholder="Generated sitemap will appear here..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Important SEO URLs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">robots.txt</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/robots.txt', '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">sitemap.xml</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/sitemap.xml', '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Search Console */}
      <Card>
        <CardHeader>
          <CardTitle>Google Search Console</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Monitor your site's performance in Google Search Console:
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('https://search.google.com/search-console', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Google Search Console
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('https://search.google.com/search-console/sitemaps', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Submit Sitemap
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOManager;
