export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const { supabaseUrl, supabaseKey } = config
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/dummy_service_states?service_id=eq.kiinara-identity&select=status`,
      { headers }
    )
    const data = await res.json()
    const status = data[0]?.status || 'operational'

    if (status === 'outage') {
      throw createError({ statusCode: 503, message: 'Service Unavailable' })
    }
    return {
      status: status === 'degraded' ? 'degraded' : 'ok',
      service: 'kiinara-identity',
      name: 'Kiinara Identity',
      timestamp: new Date().toISOString()
    }
  } catch (err: any) {
    if (err.statusCode === 503) throw err
    throw createError({ statusCode: 503, message: 'Service Unavailable' })
  }
})