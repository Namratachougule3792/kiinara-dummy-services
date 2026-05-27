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

  const res = await fetch(`${supabaseUrl}/rest/v1/dummy_service_states`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ service_id: serviceId, status, updated_at: new Date().toISOString() })
  })

  return { success: res.ok }
})