import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { userId, newPassword, newEmail, newUsername, fullName } = await req.json();
    if (!userId || !newPassword) {
      throw new Error("Missing required fields: userId, newPassword");
    }

    const updatePayload: {
      password: string;
      email?: string;
      email_confirm?: boolean;
      user_metadata?: Record<string, string>;
    } = { password: newPassword };

    if (newEmail) {
      updatePayload.email = newEmail;
      updatePayload.email_confirm = true;
    }

    if (newUsername || fullName) {
      updatePayload.user_metadata = {
        ...(newUsername ? { username: newUsername } : {}),
        ...(fullName ? { full_name: fullName } : {}),
      };
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, updatePayload);

    if (updateError) throw updateError;

    if (newUsername) {
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({ username: newUsername })
        .eq("id", userId);

      if (profileError) throw profileError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
