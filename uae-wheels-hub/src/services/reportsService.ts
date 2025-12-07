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

export type ReportStatus = 'draft' | 'frozen';

export type ReportInput = {
  id?: string;
  author_id: string;
  vin: string;
  odometer_km?: number | null;
  inspection_date: string;
  location?: string | null;
  overall_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'salvage';
  summary?: string | null;
  status?: ReportStatus;
  listing_id?: string | null;
  display_id?: string | null;
};

export type FreezeReportResult = {
  id: string;
  share_slug: string;
  status: ReportStatus;
};

export async function isWhitelistedReportAuthor(userId: string) {
  if (!userId) return false;
  // @ts-ignore
  const { data, error } = await sb.rpc('is_whitelisted_report_author', {
    uid: userId
  });
  if (error) {
    console.error('isWhitelistedReportAuthor error', error);
    return false;
  }
  return !!data;
}

export async function hasAdminRole(userId?: string) {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;

  if (!uid) return false;

  // Use simple query to user_roles to avoid security definer RPC issues
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', uid)
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
  // @ts-ignore
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
  // First check if author already exists for this user
  const { data: existing, error: fetchError } = await sb
    .from('report_authors')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing?.id) {
    // Author exists, update their info (but don't update contact_email to avoid unique constraint)
    const { data, error } = await sb
      .from('report_authors')
      .update({
        full_name: payload.full_name || 'Inspector',
        contact_phone: payload.contact_phone || null,
      })
      .eq('id', existing.id)
      .select('id')
      .single();

    if (error) throw error;
    return data?.id as string;
  }

  // No existing author, create new one
  const { data, error } = await sb
    .from('report_authors')
    .insert({
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
    .select('id, display_id, vin, inspection_date, overall_condition, status, share_slug, listing_id, created_at, author:report_authors(full_name, user_id)')
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
      photos:report_photos(id, storage_path, label, body_part_id, sort_order, taken_at),
      listing:listings!reports_listing_id_fkey(id, title, make, model, year)
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
  // Generate Display ID if not present (for new reports or existing ones missing it)
  if (!report.display_id) {
    // EZ- + 7 random digits
    const random7 = Math.floor(1000000 + Math.random() * 9000000);
    report.display_id = `EZ-${random7}`;
  }

  const { data: savedReport, error: reportError } = await sb
    .from('reports')
    .upsert(report, { onConflict: 'id' })
    .select('id, display_id')
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

  return { id: reportId, display_id: savedReport.display_id };
}

export async function logReportAction(action: string, reportId: string, details?: Record<string, any>) {
  // @ts-ignore
  await sb.rpc('log_report_action', {
    p_action: action,
    p_report_id: reportId,
    p_details: details,
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

// Freeze a report and generate shareable link
export async function freezeReport(reportId: string): Promise<FreezeReportResult> {
  const { data, error } = await sb.rpc('freeze_report', { p_report_id: reportId });
  if (error) throw error;
  return data as FreezeReportResult;
}

// Unfreeze a report (admin only - check should happen in component)
export async function unfreezeReport(reportId: string): Promise<FreezeReportResult> {
  const { data, error } = await sb.rpc('unfreeze_report', { p_report_id: reportId });
  if (error) throw error;
  return data as FreezeReportResult;
}

// Get report by share slug (for public view)
export async function getReportBySlug(slug: string) {
  const { data, error } = await sb.rpc('get_report_by_slug', { p_slug: slug });
  if (error) throw error;
  return data;
}

// Get reports for the current user (inspector)
export async function getMyReports() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('getMyReports: No user logged in');
    return [];
  }

  console.log('getMyReports: Fetching reports for user', user.id);

  // Check if admin
  const isAdmin = await hasAdminRole(user.id);
  console.log('getMyReports: isAdmin =', isAdmin);

  let query = sb
    .from('reports')
    .select(`
      *,
      listing:listings!reports_listing_id_fkey(title, year, make, model)
    `)
    .order('created_at', { ascending: false });

  // If not admin, filter by author
  if (!isAdmin) {
    // 1. Get author ID - use maybeSingle() to avoid error when no row found
    const { data: author, error: authorError } = await sb
      .from('report_authors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('getMyReports: Author lookup result:', { author, authorError });

    if (!author) {
      console.log('getMyReports: No author found for user, returning empty');
      return [];
    }

    query = query.eq('author_id', author.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }

  console.log('getMyReports: Found', data?.length || 0, 'reports');
  return data || [];
}

export async function getReport(id: string) {
  const { data, error } = await sb
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Link/unlink report to a listing
export async function linkReportToListing(reportId: string, listingId: string | null) {
  // Update report with listing_id
  const { error: reportError } = await sb
    .from('reports')
    .update({ listing_id: listingId })
    .eq('id', reportId);

  if (reportError) throw reportError;

  // Also update listing with report_id (bidirectional link)
  if (listingId) {
    const { error: listingError } = await sb
      .from('listings')
      .update({ report_id: reportId })
      .eq('id', listingId);

    if (listingError) throw listingError;
  }

  return true;
}

// Get listings that can be linked (active listings without a report)
export async function getAvailableListingsForReport() {
  const { data, error } = await sb
    .from('listings')
    .select('id, title, make, model, year')
    .eq('status', 'active')
    .eq('is_draft', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

// Get listing info for a report
export async function getLinkedListing(listingId: string) {
  const { data, error } = await sb
    .from('listings')
    .select('id, title, make, model, year')
    .eq('id', listingId)
    .single();

  if (error) return null;
  return data;
}
