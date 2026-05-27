export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { supabaseUrl, supabaseKey } = config
  const body = await readBody(event)
  const { serviceId, status } = body

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  }

  // 1. Update current state
  const stateRes = await fetch(`${supabaseUrl}/rest/v1/dummy_service_states`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      service_id: serviceId,
      status,
      updated_at: new Date().toISOString()
    })
  })

  // 2. Write REAL log to health_checks immediately
  // Map button status to health_check status + response time
  const responseTime = status === 'operational' ? Math.floor(Math.random() * 200) + 50   // 50-250ms realistic
                     : status === 'degraded'    ? Math.floor(Math.random() * 2000) + 1000 // 1000-3000ms slow
                     : 0 // outage = no response

  const errorText = status === 'outage' ? 'Service unavailable - manually triggered' : null

  const logRes = await fetch(`${supabaseUrl}/rest/v1/health_checks`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      service_id: serviceId,
      status,           // 'operational', 'degraded', or 'outage'
      response_time: responseTime,
      error: errorText,
      checked_at: new Date().toISOString()
    })
  })

  if (!stateRes.ok || !logRes.ok) {
    throw createError({ statusCode: 500, message: 'Failed to update status' })
  }

  return {
    success: true,
    logged: {
      service_id: serviceId,
      status,
      response_time: responseTime,
      checked_at: new Date().toISOString()
    }
  }
})