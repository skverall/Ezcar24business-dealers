import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  addWhitelistWithAuthor,
  fetchReportAuthors,
  fetchWhitelist,
  hasAdminRole,
  isWhitelistedReportAuthor,
} from '@/services/reportsService';
import { format } from 'date-fns';
import { ShieldCheck, UserPlus, RefreshCcw, Users, Ban } from 'lucide-react';

type WhitelistEntry = {
  user_id: string;
  note?: string | null;
  created_at: string;
  added_by?: string | null;
};

type AuthorRow = {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at: string;
};

const ReportAccessManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    fullName: '',
    contactEmail: '',
    contactPhone: '',
    note: '',
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  const canWrite = useMemo(() => isAdmin, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wlRes, authorsRes] = await Promise.all([fetchWhitelist(), fetchReportAuthors()]);
      if (wlRes.error) throw wlRes.error;
      if (authorsRes.error) throw authorsRes.error;
      setWhitelist(wlRes.data || []);
      setAuthors((authorsRes.data as AuthorRow[]) || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load report access data',
        description: error.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const check = async () => {
      if (!user?.id) return;
      const [adminFlag, wlFlag] = await Promise.all([
        hasAdminRole(),
        isWhitelistedReportAuthor(user.id),
      ]);
      setIsAdmin(!!adminFlag);
      setIsWhitelisted(!!wlFlag);
    };
    check();
  }, [user?.id]);

  const handleAdd = async () => {
    if (!form.userId || !form.fullName) {
      toast({
        title: 'User ID and name are required',
        description: 'Provide both user ID and full name to whitelist.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await addWhitelistWithAuthor({
        userId: form.userId.trim(),
        fullName: form.fullName.trim(),
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        note: form.note || null,
      });
      toast({ title: 'Whitelisted', description: 'Dealer added to whitelist and authors.' });
      setForm({
        userId: '',
        fullName: '',
        contactEmail: '',
        contactPhone: '',
        note: '',
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Failed to whitelist',
        description: error.message || 'Check RLS permissions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-semibold">Report Access Control</h1>
          <p className="text-sm text-muted-foreground">
            Manage whitelist and report authors. RLS permits write only for admins; others are read-only.
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant={isAdmin ? 'default' : 'outline'}>{isAdmin ? 'Admin' : 'Not admin'}</Badge>
            <Badge variant={isWhitelisted ? 'secondary' : 'outline'}>
              {isWhitelisted ? 'Whitelisted' : 'Not whitelisted'}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" className="ml-auto gap-2" onClick={loadData} disabled={loading}>
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Whitelist dealer/inspector
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canWrite && (
            <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
              Only admins can add to the whitelist. Sign in as admin (Supabase auth) to proceed.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>User ID (UUID from Supabase auth)</Label>
              <Input
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                placeholder="00000000-0000-0000-0000-000000000000"
                disabled={!canWrite}
              />
            </div>
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Inspector name"
                disabled={!canWrite}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="inspector@example.com"
                disabled={!canWrite}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="+9715xxxxxxxx"
                disabled={!canWrite}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Note</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Why whitelisted? (optional)"
                disabled={!canWrite}
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!canWrite || loading} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add to whitelist
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Whitelisted users ({whitelist.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {whitelist.length === 0 && (
              <div className="text-sm text-muted-foreground">No whitelisted users yet.</div>
            )}
            {whitelist.map((item) => (
              <div key={item.user_id} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{item.user_id}</span>
                  <Badge variant="outline">since {format(new Date(item.created_at), 'yyyy-MM-dd')}</Badge>
                </div>
                {item.note && <p className="text-sm text-muted-foreground mt-2">{item.note}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Report authors ({authors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {authors.length === 0 && (
              <div className="text-sm text-muted-foreground">No authors yet.</div>
            )}
            {authors.map((author) => (
              <div key={author.id} className="border rounded-md p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{author.full_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{author.user_id}</div>
                  </div>
                  <Badge variant="outline">{author.role}</Badge>
                </div>
                <div className="text-xs text-muted-foreground flex gap-3">
                  {author.contact_email && <span>{author.contact_email}</span>}
                  {author.contact_phone && <span>{author.contact_phone}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-4 h-4" />
            Read-only reminder
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Public and non-whitelisted users can only read reports (FROZEN). Writes are blocked by RLS.</p>
          <Separator />
          <p>To allow a dealer to create/edit reports:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Find their auth user id (UUID).</li>
            <li>Add to whitelist above (admin only).</li>
            <li>Inspector signs in via normal Supabase auth; they can then create reports.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportAccessManager;
