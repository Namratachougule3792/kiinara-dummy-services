<script setup>
import { ref, onMounted } from 'vue'

const SERVICES = [
  { id: 'kiinara-identity',  name: 'Kiinara Identity',   icon: '🔐', description: 'Authentication & user identity' },
  { id: 'kiinara-core',      name: 'Kiinara Core',        icon: '⚙️', description: 'Management Software' },
  { id: 'kiinara-accounts',  name: 'Kiinara Accounts',    icon: '🏫', description: 'Accounts management' },
  { id: 'pulse-email',       name: 'Pulse — Email',       icon: '📧', description: 'Email delivery service' },
  { id: 'pulse-whatsapp',    name: 'Pulse — WhatsApp',    icon: '💬', description: 'WhatsApp messaging service' },
]

const states = ref({})
const loading = ref({})
const lastResult = ref({})

// Initialize all to operational
SERVICES.forEach(s => {
  states.value[s.id] = 'operational'
  loading.value[s.id] = false
  lastResult.value[s.id] = null
})

const setStatus = async (serviceId, status) => {
  loading.value[serviceId] = true
  lastResult.value[serviceId] = null
  try {
    const res = await fetch('/api/set-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, status })
    })
    const data = await res.json()
    if (data.success) {
      states.value[serviceId] = status
      lastResult.value[serviceId] = { type: status, message: `Set to ${status}` }
    }
  } catch (err) {
    lastResult.value[serviceId] = { type: 'error', message: 'Failed to update' }
  } finally {
    loading.value[serviceId] = false
  }
}

const testHealth = async (serviceId) => {
  loading.value[serviceId] = true
  try {
    const res = await fetch(`/api/health/${serviceId}`)
    const data = await res.json()
    lastResult.value[serviceId] = {
      type: res.ok ? 'operational' : 'outage',
      message: res.ok ? `✓ Health check passed (${data.status})` : `✗ Health check failed`
    }
  } catch {
    lastResult.value[serviceId] = { type: 'outage', message: '✗ Health check failed' }
  } finally {
    loading.value[serviceId] = false
  }
}

const statusColor = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-400',
  outage: 'bg-red-500'
}

const statusLabel = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage'
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <!-- Header -->
    <div class="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-white">Kiinara Service Simulator</h1>
        <p class="text-gray-500 text-sm mt-0.5">Control dummy health states → reflected on status page</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        Connected to Supabase
      </div>
    </div>

    <!-- Cards -->
    <div class="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <div
        v-for="svc in SERVICES"
        :key="svc.id"
        class="bg-gray-900 border border-gray-800 rounded-xl p-6"
      >
        <!-- Service header -->
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ svc.icon }}</span>
            <div>
              <p class="font-semibold text-white">{{ svc.name }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ svc.description }}</p>
            </div>
          </div>
          <!-- Current status badge -->
          <div class="flex items-center gap-2">
            <span :class="['w-2.5 h-2.5 rounded-full', statusColor[states[svc.id]]]"></span>
            <span class="text-sm font-medium text-gray-300">{{ statusLabel[states[svc.id]] }}</span>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3">
          <button
            @click="setStatus(svc.id, 'operational')"
            :disabled="loading[svc.id]"
            :class="[
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border',
              states[svc.id] === 'operational'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-emerald-600 hover:text-emerald-400'
            ]"
          >
            ✓ Healthy
          </button>
          <button
            @click="setStatus(svc.id, 'degraded')"
            :disabled="loading[svc.id]"
            :class="[
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border',
              states[svc.id] === 'degraded'
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-amber-500 hover:text-amber-400'
            ]"
          >
            ⚠ Degraded
          </button>
          <button
            @click="setStatus(svc.id, 'outage')"
            :disabled="loading[svc.id]"
            :class="[
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border',
              states[svc.id] === 'outage'
                ? 'bg-red-700 border-red-600 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-red-600 hover:text-red-400'
            ]"
          >
            ✗ Outage
          </button>
          <button
            @click="testHealth(svc.id)"
            :disabled="loading[svc.id]"
            class="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-800 border border-gray-700 text-gray-400 hover:text-blue-400 hover:border-blue-600 transition-all"
          >
            Test
          </button>
        </div>

        <!-- Result feedback -->
        <div
          v-if="lastResult[svc.id]"
          :class="[
            'mt-3 px-4 py-2 rounded-lg text-xs font-medium',
            lastResult[svc.id].type === 'operational' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            lastResult[svc.id].type === 'degraded' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-red-500/10 text-red-400 border border-red-500/20'
          ]"
        >
          {{ lastResult[svc.id].message }}
        </div>
      </div>

      <!-- Health URLs reference -->
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Health Endpoint URLs</p>
        <div class="space-y-1.5 font-mono text-xs text-gray-400">
          <p v-for="svc in SERVICES" :key="svc.id">
            <span class="text-gray-600">GET </span>
            <span class="text-blue-400">/api/health/{{ svc.id }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>