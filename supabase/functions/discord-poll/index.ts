import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Parse Discord message like "$1200 AMAM FEX UPON ISSUE PA (Nancy Bustos)" */
function parseMessage(raw: string) {
  const match = raw.match(
    /^\$?([\d,]+(?:\.\d+)?)\s+(\S+)\s+(\S+)\s+(.+?)\s+\(([^)]+)\)\s*$/
  );
  if (!match) return null;
  const amount = parseFloat(match[1].replace(/,/g, ""));
  let company = match[2].toUpperCase();
  const COMPANY_MAP: Record<string, string> = {
    'AMAN': 'AMAM', 'AMAM': 'AMAM',
    'MOO': 'MUTUAL OF OMAHA',
    'NLG': 'NL', 'NL': 'NL',
    'COB': 'Corebridge',
  };
  company = COMPANY_MAP[company] || company;
  const policyType = match[3].toUpperCase();
  // Everything between policy_type and (client) is payment_method
  const paymentMethod = match[4].trim();
  const clientName = match[5].trim();
  return { amount, company, policyType, paymentMethod, clientName };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
  if (!DISCORD_BOT_TOKEN) {
    return new Response(
      JSON.stringify({ error: "DISCORD_BOT_TOKEN is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const DISCORD_CHANNEL_ID = Deno.env.get("DISCORD_CHANNEL_ID");
  if (!DISCORD_CHANNEL_ID) {
    return new Response(
      JSON.stringify({ error: "DISCORD_CHANNEL_ID is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get last stored message ID to only fetch new ones
    const { data: lastAssignment } = await supabase
      .from("closing_assignments")
      .select("discord_message_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let url = `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages?limit=50`;
    if (lastAssignment?.discord_message_id) {
      url += `&after=${lastAssignment.discord_message_id}`;
    }

    const discordRes = await fetch(url, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    });

    if (!discordRes.ok) {
      const errBody = await discordRes.text();
      throw new Error(`Discord API error [${discordRes.status}]: ${errBody}`);
    }

    const messages = await discordRes.json();
    let inserted = 0;

    for (const msg of messages) {
      // Skip bot messages
      if (msg.author?.bot) continue;

      const content = msg.content?.trim();
      if (!content) continue;

      const parsed = parseMessage(content);

      const row: Record<string, unknown> = {
        discord_message_id: msg.id,
        raw_message: content,
        amount: parsed?.amount ?? null,
        company: parsed?.company ?? null,
        policy_type: parsed?.policyType ?? null,
        payment_method: parsed?.paymentMethod ?? null,
        client_name: parsed?.clientName ?? null,
        status: "pending",
      };

      const { error } = await supabase
        .from("closing_assignments")
        .upsert(row, { onConflict: "discord_message_id" });

      if (!error) inserted++;
    }

    return new Response(
      JSON.stringify({ success: true, processed: messages.length, inserted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Discord poll error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
