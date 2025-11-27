/**
 * Admin System Check Component
 * Runs a sequence of safe checks and optional end-to-end flows
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { getProxiedImageUrl } from '@/utils/imageUrl';
import { useToast } from '@/hooks/use-toast';
import { Activity, Database, Mail, UserPlus, Image, Trash2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface CheckResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
}

const oneByOnePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y2b6RkAAAAASUVORK5CYII=';

function base64ToBlob(b64: string, contentType: string): Blob {
  const byteChars = atob(b64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

const AdminSystemCheck: React.FC = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, CheckResult>>({});

  // Persist simple inputs in memory (avoid storing secrets long-term)
  const [emailForTests, setEmailForTests] = useState('');
  const [testUserEmail, setTestUserEmail] = useState('');
  const [testUserPassword, setTestUserPassword] = useState('');

  // Which checks to run
  const [includeEmailChecks, setIncludeEmailChecks] = useState(true);
  const [includeListingFlow, setIncludeListingFlow] = useState(false);
  const [includeRegistrationCheck, setIncludeRegistrationCheck] = useState(false);

  // Registration test inputs
  const [regTestEmail, setRegTestEmail] = useState('');
  const [regTestPassword, setRegTestPassword] = useState('');
  const [usePlusAlias, setUsePlusAlias] = useState(true);
  const [allowResidualUser, setAllowResidualUser] = useState(false);

  const resetResults = () => setResults({});

  const record = (name: string, res: CheckResult) => {
    setResults(prev => ({ ...prev, [name]: res }));
  };

  const getBadge = (name: string) => {
    const r = results[name];
    if (!r) return null;
    return (
      <Badge variant={r.success ? 'default' : 'destructive'}>
        {r.success ? 'PASS' : 'FAIL'}
      </Badge>
    );
  };

  const checkDatabase = async () => {
    try {
      const { error } = await supabase.from('listings').select('id').limit(1);
      if (error) throw error;
      record('database', { success: true, message: 'Database connection OK' });
    } catch (e: any) {
      record('database', { success: false, error: e.message });
    }
  };

  const checkAdminTables = async () => {
    const tables = ['admin_users', 'admin_sessions', 'admin_activity_log'];
    const out: Record<string, string> = {};
    try {
      for (const t of tables) {
        try {
          const { error } = await (supabase as any).from(t).select('*').limit(1);
          out[t] = error ? `Error: ${error.message}` : 'OK';
        } catch (err: any) {
          out[t] = `Error: ${err.message}`;
        }
      }
      record('admin_tables', { success: true, message: 'Tables checked', details: out });
    } catch (e: any) {
      record('admin_tables', { success: false, error: e.message, details: out });
    }
  };

  const checkAdminFunctions = async () => {
    const functions = [
      'authenticate_admin',
      'validate_admin_session',
      'logout_admin',
      'change_admin_password',
      'get_admin_dashboard_stats'
    ];
    const out: Record<string, string> = {};
    try {
      for (const f of functions) {
        try {
          const { error } = await (supabase as any).rpc(f, {});
          out[f] = error ? (error.code === '42883' ? 'Missing' : 'Exists') : 'Exists';
        } catch (err: any) {
          out[f] = `Error: ${err.message}`;
        }
      }
      record('admin_functions', { success: true, message: 'Functions checked', details: out });
    } catch (e: any) {
      record('admin_functions', { success: false, error: e.message, details: out });
    }
  };

  const sendPasswordReset = async () => {
    if (!emailForTests) {
      record('email_reset', { success: false, error: 'No email provided' });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailForTests);
      if (error) throw error;
      record('email_reset', { success: true, message: `Reset email sent to ${emailForTests}` });
    } catch (e: any) {
      record('email_reset', { success: false, error: e.message });
    }
  };

  const sendMagicLink = async () => {
    if (!emailForTests) {
      record('email_magic', { success: false, error: 'No email provided' });
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: emailForTests });
      if (error) throw error;
      record('email_magic', { success: true, message: `Magic link sent to ${emailForTests}` });
    } catch (e: any) {
      record('email_magic', { success: false, error: e.message });
    }
  };

  const listingFlow = async () => {
    if (!testUserEmail || !testUserPassword) {
      record('listing_flow', { success: false, error: 'Provide test user email and password' });
      return;
    }

    // Sign in as test user
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword
      });
      if (signInError) throw signInError;
      const uid = signInData.user?.id;
      if (!uid) throw new Error('No user id after sign-in');

      // Create draft listing
      const { data: newListing, error: createErr } = await supabase
        .from('listings')
        .insert({ user_id: uid, title: 'SysCheck Draft', is_draft: true })
        .select('id')
        .single();
      if (createErr) throw createErr;
      const listingId = newListing.id as string;

      // Upload tiny image
      const blob = base64ToBlob(oneByOnePngBase64, 'image/png');
      const path = `${uid}/${listingId}/syscheck-${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from('listing-images')
        .upload(path, blob, { upsert: false, contentType: 'image/png' });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);

      // Insert listing_images row
      const { data: imgRow, error: imgErr } = await supabase
        .from('listing_images')
        .insert({ listing_id: listingId, url: pub.publicUrl, sort_order: 0, is_cover: true })
        .select('id')
        .single();
      if (imgErr) throw imgErr;

      // Cleanup: delete image + row, delete listing
      const imgId = imgRow.id as string;
      await supabase.storage.from('listing-images').remove([path]);
      await supabase.from('listing_images').delete().eq('id', imgId);
      await supabase.from('listings').delete().eq('id', listingId).eq('user_id', uid);

      // Sign out test user (do not touch admin session)
      await supabase.auth.signOut();

      record('listing_flow', { success: true, message: 'Listing create/upload/delete flow OK' });
    } catch (e: any) {
      record('listing_flow', { success: false, error: e.message });
      // Try to sign out test user if anything failed
      try { await supabase.auth.signOut(); } catch {}
    }
  };

  // Registration check
  const registrationCheck = async () => {
    // Strategy: use plus-aliasing if enabled: local+timestamp@domain.
    // Otherwise, if allowResidualUser=false, we try to delete pre-existing user via Admin API (not available on client anon key).
    // Therefore, we default to using +alias to avoid needing deletes.
    if (!regTestEmail || !regTestPassword) {
      record('registration', { success: false, error: 'Provide registration test email base and password' });
      return;
    }
    try {
      // Build email
      const email = (() => {
        if (!usePlusAlias) return regTestEmail;
        const [local, domain] = regTestEmail.split('@');
        if (!local || !domain) throw new Error('Invalid base email');
        return `${local}+syscheck${Date.now()}@${domain}`;
      })();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: regTestPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`,
          data: { full_name: 'System Check', phone: null, is_dealer: false }
        }
      });

      if (error) throw error;

      // Interpret identities length like in useAuth fix: if identities=0 -> email exists/unconfirmed case.
      const alreadyExists = (data?.user?.identities?.length ?? 0) === 0;
      if (alreadyExists) {
        record('registration', { success: false, error: 'Email appears already registered or pending confirmation' });
        return;
      }

      // Success: user created; do not delete (unless allowResidualUser=false and we had admin delete).
      record('registration', { success: true, message: `Registration initiated for ${email}. Check email delivery.` });

    } catch (e: any) {
      record('registration', { success: false, error: e.message });
    }
  };

  const runAll = async () => {
    setIsRunning(true);
    resetResults();
    try {
      await checkDatabase();
      await checkAdminTables();
      await checkAdminFunctions();
      if (includeEmailChecks) {
        await sendPasswordReset();
        await sendMagicLink();
      }
      if (includeRegistrationCheck) {
        await registrationCheck();
      }
      if (includeListingFlow) {
        await listingFlow();
      }
      toast({ title: 'System check completed' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Full System Check
        </CardTitle>
        <CardDescription>
          Runs connectivity checks, optional email tests and optional end-to-end listing flow using a provided test user.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Email for email tests</Label>
            <Input placeholder="test@example.com" value={emailForTests} onChange={(e) => setEmailForTests(e.target.value)} />
            <div className="text-xs text-muted-foreground">Used for password reset and magic link checks</div>
          </div>
          <div className="space-y-2">
            <Label>Test user email (for listing flow)</Label>
            <Input placeholder="confirmed.user@example.com" value={testUserEmail} onChange={(e) => setTestUserEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Test user password</Label>
            <Input type="password" value={testUserPassword} onChange={(e) => setTestUserPassword(e.target.value)} />
          </div>
        </div>

        {/* Registration test inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Registration base email</Label>
            <Input placeholder="qa+alias@domain.com" value={regTestEmail} onChange={(e) => setRegTestEmail(e.target.value)} />
            <div className="text-xs text-muted-foreground">Will use +alias with timestamp by default to avoid clashes</div>
          </div>
          <div className="space-y-2">
            <Label>Registration password</Label>
            <Input type="password" value={regTestPassword} onChange={(e) => setRegTestPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
              <Button size="sm" variant={usePlusAlias ? 'default' : 'outline'} onClick={() => setUsePlusAlias(v => !v)}>Plus alias: {usePlusAlias ? 'ON' : 'OFF'}</Button>
              <Button size="sm" variant={includeRegistrationCheck ? 'default' : 'outline'} onClick={() => setIncludeRegistrationCheck(v => !v)}>Registration check: {includeRegistrationCheck ? 'ON' : 'OFF'}</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Button variant={includeEmailChecks ? 'default' : 'outline'} size="sm" onClick={() => setIncludeEmailChecks(v => !v)} className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> Email checks: {includeEmailChecks ? 'ON' : 'OFF'}
          </Button>
          <Button variant={includeListingFlow ? 'default' : 'outline'} size="sm" onClick={() => setIncludeListingFlow(v => !v)} className="flex items-center gap-2">
            <Image className="w-4 h-4" /> Listing + upload flow: {includeListingFlow ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={runAll} disabled={isRunning} className="flex items-center gap-2">
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            Run Full System Check
          </Button>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Database className="w-4 h-4" /> Database</span>
                {getBadge('database')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.database && (
                <Alert variant={results.database.success ? 'default' : 'destructive'}>
                  {results.database.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertDescription>
                    {results.database.success ? results.database.message : results.database.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Admin Tables & Functions</span>
                {getBadge('admin_tables')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.admin_tables && (
                <Alert variant={results.admin_tables.success ? 'default' : 'destructive'}>
                  {results.admin_tables.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertDescription>
                    {results.admin_tables.success ? 'Tables check completed' : results.admin_tables.error}
                  </AlertDescription>
                </Alert>
              )}
              {results.admin_functions && (
                <Alert variant={results.admin_functions.success ? 'default' : 'destructive'}>
                  {results.admin_functions.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertDescription>
                    {results.admin_functions.success ? 'Functions check completed' : results.admin_functions.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {includeEmailChecks && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</span>
                  {getBadge('email_reset')}
                </CardTitle>
                <CardDescription>Password reset & magic link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.email_reset && (
                  <Alert variant={results.email_reset.success ? 'default' : 'destructive'}>
                    {results.email_reset.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertDescription>
                      {results.email_reset.success ? results.email_reset.message : results.email_reset.error}
                    </AlertDescription>
                  </Alert>
                )}
                {results.email_magic && (
                  <Alert variant={results.email_magic.success ? 'default' : 'destructive'}>
                    {results.email_magic.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertDescription>
                      {results.email_magic.success ? results.email_magic.message : results.email_magic.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {includeListingFlow && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><Image className="w-4 h-4" /> Listing Flow</span>
                  {getBadge('listing_flow')}
                </CardTitle>
                <CardDescription>Create draft, upload 1x1 image, cleanup</CardDescription>
              </CardHeader>
              <CardContent>
                {results.listing_flow && (
                  <Alert variant={results.listing_flow.success ? 'default' : 'destructive'}>
                    {results.listing_flow.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertDescription>
                      {results.listing_flow.success ? results.listing_flow.message : results.listing_flow.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSystemCheck;

