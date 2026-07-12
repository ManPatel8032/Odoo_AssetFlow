import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

serve(async (req) => {
  const { cycleId } = await req.json()
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Close the cycle
  await supabaseClient.from('audit_cycles').update({ status: 'closed', end_date: new Date() }).eq('id', cycleId)

  // 2. Identify missing items and flip asset status to lost
  const { data: missingItems } = await supabaseClient
    .from('audit_items')
    .select('asset_id')
    .eq('cycle_id', cycleId)
    .eq('status', 'missing')

  if (missingItems && missingItems.length > 0) {
    const assetIds = missingItems.map(item => item.asset_id)
    await supabaseClient.from('assets').update({ status: 'lost' }).in('id', assetIds)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
