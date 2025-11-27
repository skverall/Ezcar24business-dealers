import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, ArrowLeft, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const ConfirmEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('Verifying your email, please wait...');

  useEffect(() => {
    const process = async () => {
      try {
        // Supabase typically sends tokens in hash (#access_token=...) for email links
        const rawHash = typeof window !== 'undefined' ? window.location.hash : '';
        const hash = rawHash?.startsWith('#') ? rawHash.slice(1) : rawHash;
        const hashParams = new URLSearchParams(hash || '');

        // Also support query params just in case (?access_token=...&refresh_token=...)
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = hashParams.get('type') || searchParams.get('type');
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'The confirmation link is invalid or has expired.');
          return;
        }

        // If we received tokens, set session to finalize confirmation
        if (accessToken && refreshToken) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setErr) throw setErr;

          // Clean sensitive tokens from URL (drop hash)
          if (typeof window !== 'undefined') {
            const cleanUrl = window.location.pathname + window.location.search; // drop hash
            window.history.replaceState({}, document.title, cleanUrl);
          }

          setStatus('success');
          setMessage('Your email has been confirmed successfully. Redirecting...');

          // Redirect user after short delay
          setTimeout(() => {
            navigate('/auth?tab=login');
          }, 2500);
          return;
        }

        // Support code-based flows (less common for email confirmation)
        const code = searchParams.get('code');
        if (code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchErr) throw exchErr;
          setStatus('success');
          setMessage('Your email has been confirmed successfully. Redirecting...');
          setTimeout(() => navigate('/auth?tab=login'), 2500);
          return;
        }

        // If we reached here without tokens or code, it's most likely a successful
        // server-side verification redirect from Supabase. Treat as success and guide user to login.
        setStatus('success');
        setMessage('Your email has been confirmed. Redirecting to sign in...');
        setTimeout(() => navigate('/auth?tab=login'), 2000);
        return;
      } catch (e: any) {
        console.error('Email confirmation error:', e);
        setStatus('error');
        setMessage(e?.message || 'Email confirmation failed. Please request a new link.');
      }
    };

    process();
  }, [navigate, searchParams]);

  return (
    <div className="mobile-viewport-fix bg-gradient-to-br from-background to-secondary/20 flex flex-col w-full overflow-x-hidden">
      <Header />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-effect rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-luxury/10 mx-auto flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-luxury" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Confirming Email</h1>

          {status === 'idle' && (
            <p className="text-muted-foreground mb-6">{message}</p>
          )}

          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50 mb-4">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{message}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth?tab=login" className="px-5 py-2 bg-luxury text-white rounded-lg hover:bg-luxury/90 transition-colors">Sign in</Link>
            <Link to="/" className="px-5 py-2 border rounded-lg hover:bg-muted transition-colors">Back to Home</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ConfirmEmail;

