import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export type ReportBodyPartInput = {
  id?: string;
  part: string;
  condition: 'ok' | 'minor_damage' | 'major_damage' | 'needs_replacement';
  notes?: string | null;
  severity?: number;
};

export type ReportPhotoInput = {
  id?: string;
  storage_path: string;
  label?: string | null;
  body_part_id?: string | null;
  sort_order?: number;
  taken_at?: string;
};

export type ReportInput = {
  id?: string;
  author_id: string;
  vin: string;
  odometer_km?: number | null;
  inspection_date: string;
  location?: string | null;
  overall_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'salvage';
  summary?: string | null;
};

export async function isWhitelistedReportAuthor(userId: string) {
  if (!userId) return false;
  const { data, error } = await supabase.rpc('is_whitelisted_report_author', { uid: userId });
  if (error) {
    console.error('isWhitelistedReportAuthor error', error);
    return false;
  }
  return !!data;
}

export async function hasAdminRole() {
  // Use simple query to user_roles to avoid security definer RPC issues
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('hasAdminRole error', error);
    return false;
  }
  return !!data;
}

export async function fetchWhitelist() {
  return sb.from('report_author_whitelist').select('user_id, note, created_at, added_by');
}

export async function fetchReportAuthors() {
  return sb.from('report_authors').select('id, user_id, full_name, role, contact_email, contact_phone, created_at');
}

export async function addWhitelistWithAuthor(params: {
  userId: string;
  fullName: string;
  role?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  note?: string | null;
}) {
  const { userId, fullName, role = 'inspector', contactEmail, contactPhone, note } = params;
  const { error } = await supabase.rpc('add_report_author_whitelisted', {
    p_user_id: userId,
    p_full_name: fullName,
    p_role: role,
    p_contact_email: contactEmail || null,
    p_contact_phone: contactPhone || null,
    p_note: note || null,
  });
  if (error) throw error;
  return true;
}

export async function ensureAuthorForUser(userId: string, payload: { full_name?: string; contact_email?: string | null; contact_phone?: string | null }) {
  const { data, error } = await sb
    .from('report_authors')
    .upsert({
      user_id: userId,
      full_name: payload.full_name || 'Inspector',
      contact_email: payload.contact_email || null,
      contact_phone: payload.contact_phone || null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data?.id as string;
}

export async function listReports() {
  return sb
    .from('reports')
    .select('id, vin, inspection_date, overall_condition, created_at, author:report_authors(full_name, user_id)')
    .order('created_at', { ascending: false });
}

export async function getReportWithDetails(reportId: string) {
  return sb
    .from('reports')
    .select(
      `
      *,
      author:report_authors(id, user_id, full_name, role, contact_email, contact_phone),
      body_parts:report_body_parts(id, part, condition, notes, severity, created_at, updated_at),
      photos:report_photos(id, storage_path, label, body_part_id, sort_order, taken_at)
    `
    )
    .eq('id', reportId)
    .single();
}

export async function saveReport(
  report: ReportInput,
  bodyParts: ReportBodyPartInput[],
  photos: ReportPhotoInput[] = []
) {
  const { data: savedReport, error: reportError } = await sb
    .from('reports')
    .upsert(report, { onConflict: 'id' })
    .select('id')
    .single();

  if (reportError) throw reportError;
  const reportId = savedReport.id as string;

  if (bodyParts?.length) {
    const cleaned = bodyParts.map((bp) => ({
      ...bp,
      report_id: reportId,
      severity: bp.severity ?? 0,
    }));
    await sb.from('report_body_parts').delete().eq('report_id', reportId);
    const { error: bpError } = await sb.from('report_body_parts').upsert(cleaned);
    if (bpError) throw bpError;
  }

  if (photos) {
    await sb.from('report_photos').delete().eq('report_id', reportId);
    if (photos.length) {
      const prepared = photos.map((ph, idx) => ({
        ...ph,
        report_id: reportId,
        sort_order: ph.sort_order ?? idx,
      }));
      const { error: photoError } = await sb.from('report_photos').insert(prepared);
      if (photoError) throw photoError;
    }
  }

  await supabase.rpc('log_report_action', {
    p_action: report.id ? 'update' : 'create',
    p_report_id: reportId,
    p_details: { vin: report.vin },
  });

  return reportId;
}

export async function logReportAction(action: string, reportId: string, details?: Record<string, any>) {
  await supabase.rpc('log_report_action', {
    p_action: action,
    p_report_id: reportId,
    p_details: details || null,
  });
}

export async function uploadReportPhoto(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await sb.storage
    .from('car-reports')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = sb.storage.from('car-reports').getPublicUrl(filePath);
  return data.publicUrl;
}
