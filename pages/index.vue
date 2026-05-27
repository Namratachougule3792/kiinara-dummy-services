<script setup>
import { ref } from 'vue'

const SERVICES = [
  { id: 'kiinara-identity',  name: 'Kiinara Identity',  icon: '🔐', description: 'Authentication & user identity' },
  { id: 'kiinara-core',      name: 'Kiinara Core',      icon: '⚙️', description: 'Management Software' },
  { id: 'kiinara-accounts',  name: 'Kiinara Accounts',  icon: '🏫', description: 'Accounts management' },
  { id: 'pulse-email',       name: 'Pulse — Email',     icon: '📧', description: 'Email delivery service' },
  { id: 'pulse-whatsapp',    name: 'Pulse — WhatsApp',  icon: '💬', description: 'WhatsApp messaging service' },
]

const states = ref(Object.fromEntries(SERVICES.map(s => [s.id, 'operational'])))
const loading = ref(Object.fromEntries(SERVICES.map(s => [s.id, false])))
const lastLog = ref(Object.fromEntries(SERVICES.map(s => [s.id, null])))

const setStatus = async (serviceId, status) => {
  loading.value[serviceId] = true
  lastLog.value[serviceId] = null

  try {
    const res = await fetch('/api/set-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, status })
    })
    const data = await res.json()

    if (data.success) {
      states.value[serviceId] = status
      // Show the REAL log that was written to health_checks
      lastLog.value[serviceId] = {
        type: status,
        service_id: data.logged.service_id,
        status: data.logged.status,
        response_time: data.logged.response_time,
        checked_at: new Date(data.logged.checked_at).toLocaleTimeString(),
        error: data.logged.error
      }
    }
  } catch (err) {
    lastLog.value[serviceId] = { type: 'error', message: 'Failed to update — check console' }
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

const logBg = {
  operational: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  outage: 'bg-red-500/10 text-red-400 border-red-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20'
}
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <!-- Header -->
    <div class="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">Kiinara Service Simulator</h1>
        <p class="text-gray-500 text-sm mt-0.5">
          Each button click writes a real log to Supabase → status page updates instantly
        </p>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"/>
        Live → Supabase
      </div>
    </div>

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
          <div class="flex items-center gap-2">
            <span :class="['w-2.5 h-2.5 rounded-full', statusColor[states[svc.id]]]"/>
            <span class="text-sm text-gray-300 font-medium">{{ statusLabel[states[svc.id]] }}</span>
          </div>
        </div>

        <!-- 3 buttons -->
        <div class="flex gap-3">
          <button
            v-for="btn in [
              { status: 'operational', label: '✓ Healthy',  active: 'bg-emerald-600 border-emerald-500', idle: 'hover:border-emerald-600 hover:text-emerald-400' },
              { status: 'degraded',    label: '⚠ Degraded', active: 'bg-amber-600 border-amber-500',   idle: 'hover:border-amber-500 hover:text-amber-400' },
              { status: 'outage',      label: '✗ Outage',   active: 'bg-red-700 border-red-600',       idle: 'hover:border-red-600 hover:text-red-400' }
            ]"
            :key="btn.status"
            @click="setStatus(svc.id, btn.status)"
            :disabled="loading[svc.id]"
            :class="[
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border disabled:opacity-50',
              states[svc.id] === btn.status
                ? btn.active + ' text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 ' + btn.idle
            ]"
          >
            {{ loading[svc.id] ? '...' : btn.label }}
          </button>
        </div>

        <!-- Real log feedback -->
        <div
          v-if="lastLog[svc.id]"
          :class="['mt-3 px-4 py-3 rounded-lg text-xs border font-mono', logBg[lastLog[svc.id].type]]"
        >
          <div v-if="lastLog[svc.id].status" class="space-y-0.5">
            <p>
              <span class="opacity-60">logged to health_checks →</span>
              <span class="font-bold ml-1">{{ lastLog[svc.id].status }}</span>
            </p>
            <p>
              <span class="opacity-60">response_time:</span>
              <span class="ml-1">{{ lastLog[svc.id].response_time }}ms</span>
              <span class="opacity-60 ml-3">at:</span>
              <span class="ml-1">{{ lastLog[svc.id].checked_at }}</span>
            </p>
            <p v-if="lastLog[svc.id].error">
              <span class="opacity-60">error:</span>
              <span class="ml-1">{{ lastLog[svc.id].error }}</span>
            </p>
          </div>
          <p v-else>{{ lastLog[svc.id].message }}</p>
        </div>
      </div>

      <!-- Endpoint reference -->
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Health Endpoints (pinged by scheduler)
        </p>
        <div class="space-y-1.5 font-mono text-xs">
          <p v-for="svc in SERVICES" :key="svc.id" class="text-gray-400">
            <span class="text-gray-600">GET </span>
            <span class="text-blue-400">/api/health/{{ svc.id }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>