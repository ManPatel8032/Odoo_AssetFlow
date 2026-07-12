import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

serve(async () => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Check for overdue bookings or returns
  const { data: overdueBookings } = await supabaseClient
    .from('bookings')
    .select('id, employee_id, asset_id')
    .eq('status', 'confirmed')
    .lt('end_time', new Date().toISOString())

  if (overdueBookings && overdueBookings.length > 0) {
    for (const booking of overdueBookings) {
      await supabaseClient.from('notifications').insert([{
        profile_id: booking.employee_id,
        title: 'Overdue Asset Return',
        message: `Your booking for asset ${booking.asset_id} has exceeded its end time.`
      }])
    }
  }

  return new Response(JSON.stringify({ checked: true, count: overdueBookings?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  })
})
