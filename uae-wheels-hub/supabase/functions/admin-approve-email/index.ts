// Supabase Edge Function: admin-approve-email
// Confirms a user's email (sets email_confirmed_at) using the service role key.
// Validates the admin session via validate_admin_session RPC before update.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ReqBody = { userId?: string; sessionToken?: string };

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: ReqBody = {};
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userId, sessionToken } = body;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Missing userId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  // Validate admin session via RPC
  try {
    const { data: sessionData, error: sessionError } = await admin.rpc(
      "validate_admin_session",
      { p_session_token: sessionToken ?? null },
    );

    if (sessionError || !sessionData?.valid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (_) {
    return new Response(JSON.stringify({ error: "Session validation failed" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Confirm email
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  } as any);

  if (updateError) {
    return new Response(
      JSON.stringify({ error: updateError.message || "Failed to approve email" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

