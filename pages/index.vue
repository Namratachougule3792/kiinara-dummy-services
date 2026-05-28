<script setup>
import { ref, onMounted } from 'vue'

const config = useRuntimeConfig()

const SERVICES = [
  { id: 'kiinara-identity', name: 'Kiinara Identity',  description: 'Authentication & user identity', icon: '🔐' },
  { id: 'kiinara-core',     name: 'Kiinara Core',      description: 'Management Software',            icon: '⚙️' },
  { id: 'kiinara-accounts', name: 'Kiinara Accounts',  description: 'Accounts management',            icon: '🏫' },
  { id: 'pulse-email',      name: 'Pulse — Email',     description: 'Email delivery service',         icon: '📧' },
  { id: 'pulse-whatsapp',   name: 'Pulse — WhatsApp',  description: 'WhatsApp messaging service',     icon: '💬' }
]

const states = ref({})
const loading = ref(false)
const feedback = ref(null)

SERVICES.forEach(s => { states.value[s.id] = 'operational' })

const setStatus = async (serviceId, status) => {
  loading.value = true
  feedback.value = null
  try {
    const res = await $fetch('/api/set-status', {
      method: 'POST',
      body: { serviceId, status }
    })
    if (res.success) {
      states.value[serviceId] = status
      feedback.value = { type: 'success', message: serviceId + ' set to ' + status }
    } else {
      feedback.value = { type: 'error', message: res.error || 'Failed' }
    }
  } catch (err) {
    feedback.value = { type: 'error', message: err.message }
  } finally {
    loading.value = false
    setTimeout(() => { feedback.value = null }, 3000)
  }
}

const statusColor = (status) => {
  if (status === 'operational') return 'text-green-400'
  if (status === 'degraded') return 'text-amber-400'
  return 'text-red-400'
}

const statusLabel = (status) => {
  if (status === 'operational') return 'Operational'
  if (status === 'degraded') return 'Degraded'
  return 'Outage'
}
</script>

<template>
<div class="min-h-screen bg-[#0f1117] text-white">
  <div class="border-b border-[#1e2433] px-6 py-4 flex items-center justify-between">
    <div>
      <h1 class="text-base font-semibold text-white">Kiinara Service Simulator</h1>
      <p class="text-xs text-slate-500 mt-0.5">Each button click writes a real log to Supabase → status page updates instantly</p>
    </div>
    <div class="flex items-center gap-2 text-xs text-slate-500">
      <div class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Live → Supabase
    </div>
  </div>

  <div class="max-w-2xl mx-auto px-6 py-8 space-y-4">

    <div
      v-if="feedback"
      :class="feedback.type === 'success' ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-red-900/30 border-red-700 text-red-400'"
      class="border rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ feedback.message }}
    </div>

    <div
      v-for="svc in SERVICES"
      :key="svc.id"
      class="bg-[#141824] border border-[#1e2433] rounded-xl p-5"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="text-xl">{{ svc.icon }}</span>
          <div>
            <p class="text-sm font-semibold text-white">{{ svc.name }}</p>
            <p class="text-xs text-slate-500">{{ svc.description }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div
            :class="states[svc.id] === 'operational' ? 'bg-green-500' : states[svc.id] === 'degraded' ? 'bg-amber-400' : 'bg-red-500'"
            class="w-2 h-2 rounded-full"
          />
          <span :class="statusColor(states[svc.id])" class="text-xs font-medium">
            {{ statusLabel(states[svc.id]) }}
          </span>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          @click="setStatus(svc.id, 'operational')"
          :disabled="loading"
          :class="states[svc.id] === 'operational' ? 'bg-green-600 border-green-500' : 'bg-[#0f1117] border-[#1e2433] text-slate-400 hover:border-green-700 hover:text-green-400'"
          class="flex-1 border rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-50"
        >
          ✓ Healthy
        </button>
        <button
          @click="setStatus(svc.id, 'degraded')"
          :disabled="loading"
          :class="states[svc.id] === 'degraded' ? 'bg-amber-600 border-amber-500' : 'bg-[#0f1117] border-[#1e2433] text-slate-400 hover:border-amber-700 hover:text-amber-400'"
          class="flex-1 border rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-50"
        >
          ⚠ Degraded
        </button>
        <button
          @click="setStatus(svc.id, 'outage')"
          :disabled="loading"
          :class="states[svc.id] === 'outage' ? 'bg-red-600 border-red-500' : 'bg-[#0f1117] border-[#1e2433] text-slate-400 hover:border-red-700 hover:text-red-400'"
          class="flex-1 border rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-50"
        >
          ✕ Outage
        </button>
      </div>
    </div>

  </div>
</div>
</template>