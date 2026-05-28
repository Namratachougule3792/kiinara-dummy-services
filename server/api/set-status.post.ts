export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { serviceId, status } = body

  if (!serviceId || !status) {
    return { error: 'serviceId and status are required' }
  }

  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey

  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey,
    'Prefer': 'resolution=merge-duplicates'
  }

  const errorMsg = status === 'outage' ? 'manually triggered outage' : null
  const responseTime = status === 'operational' ? Math.floor(Math.random() * 200) + 50 : 0

  // Upsert dummy_service_states
  const stateRes = await fetch(supabaseUrl + '/rest/v1/dummy_service_states', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      service_id: serviceId,
      status: status,
      updated_at: new Date().toISOString()
    })
  })

  if (!stateRes.ok) {
    const err = await stateRes.text()
    console.error('dummy_service_states error:', err)
    return { error: 'Failed to update state: ' + err }
  }

  // Insert health_checks log
  const logRes = await fetch(supabaseUrl + '/rest/v1/health_checks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      service_id: serviceId,
      status: status,
      response_time: responseTime,
      checked_at: new Date().toISOString(),
      error: errorMsg
    })
  })

  if (!logRes.ok) {
    const err = await logRes.text()
    console.error('health_checks error:', err)
    return { error: 'Failed to insert log: ' + err }
  }

  return { success: true, serviceId, status }
})