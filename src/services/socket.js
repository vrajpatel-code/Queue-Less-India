import { supabase } from './supabase'

let channels = {}

export const connectSocket = (token) => {
  // Supabase automatically connects via the client created in supabase.js
  // We use this function signature just to keep the component APIs identical
  return supabase
}

export const disconnectSocket = () => {
  // Unsubscribe from all channels
  Object.values(channels).forEach(channel => {
    supabase.removeChannel(channel)
  })
  channels = {}
}

export const joinDepartment = (deptId) => {
  if (!deptId) return

  // Create a unique channel for this department if it doesn't exist
  if (!channels[deptId]) {
    const channel = supabase.channel(`department-${deptId}`)

    // Subscribe to token changes
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tokens', filter: `department_id=eq.${deptId}` },
      (payload) => {
        // We trigger custom events on the window object to mimic socket.io
        const event = new CustomEvent('queue_updated', { detail: payload.new })
        window.dispatchEvent(event)

        if (payload.new && payload.new.status === 'called') {
          const callEvent = new CustomEvent('token_called', { detail: payload.new })
          window.dispatchEvent(callEvent)
        }
      }
    )

    // Subscribe to department changes (for live queue count)
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'departments', filter: `id=eq.${deptId}` },
      (payload) => {
        const event = new CustomEvent('queue_updated', { detail: { type: 'department_stats', ...payload.new } })
        window.dispatchEvent(event)
      }
    )

    channel.subscribe()
    channels[deptId] = channel
  }
}

export const leaveDepartment = (deptId) => {
  if (channels[deptId]) {
    supabase.removeChannel(channels[deptId])
    delete channels[deptId]
  }
}

export const onQueueUpdated = (callback) => {
  // Listen for custom window events dispatched by the channel subscription
  const listener = (e) => callback(e.detail)
  window.addEventListener('queue_updated', listener)

  // Return cleanup function
  return () => window.removeEventListener('queue_updated', listener)
}

export const onTokenCalled = (callback) => {
  const listener = (e) => callback(e.detail)
  window.addEventListener('token_called', listener)

  // Return cleanup function
  return () => window.removeEventListener('token_called', listener)
}
