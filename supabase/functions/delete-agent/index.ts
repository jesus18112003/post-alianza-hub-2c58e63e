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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized: admin role required");

    const { agentId } = await req.json();
    if (!agentId) throw new Error("Missing required field: agentId");

    // Prevent deleting yourself
    if (agentId === caller.id) {
      throw new Error("No puedes eliminarte a ti mismo");
    }

    // Delete related data first (order matters)
    await adminClient.from("policies").delete().eq("agent_id", agentId);
    await adminClient.from("agent_details").delete().eq("agent_id", agentId);
    await adminClient.from("agent_producer_numbers").delete().eq("agent_id", agentId);
    await adminClient.from("agent_portal_credentials").delete().eq("agent_id", agentId);
    await adminClient.from("welcome_templates").delete().eq("agent_id", agentId);
    await adminClient.from("closing_assignments").delete().eq("assigned_agent_id", agentId);
    await adminClient.from("user_roles").delete().eq("user_id", agentId);
    await adminClient.from("profiles").delete().eq("id", agentId);

    // Delete auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(agentId);
    if (deleteAuthError) throw deleteAuthError;

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
