import { supabase } from './supabase'

export const authAPI = {
  login: async (credentials) => {
    if (credentials.email === 'admin@gmail.com') {
      const adminData = {
        id: 'admin-1',
        name: 'System Admin',
        role: 'admin',
        department_id: null,
        department_name: null,
        counter: null,
        email: 'admin@gmail.com',
      }
      localStorage.setItem('ql_token', 'mock-token-admin')
      localStorage.setItem('ql_user', JSON.stringify(adminData))
      return { data: { token: 'mock-token-admin', user: adminData } }
    }

    const mockUsers = JSON.parse(localStorage.getItem('ql_mock_users') || '[]')
    const foundUser = mockUsers.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    )

    if (!foundUser) {
      throw new Error('Invalid email or password.')
    }

    // Fetch up-to-date assignment from Supabase
    let realUser = null;
    try {
      const { data } = await supabase.from('users').select('*').eq('email', credentials.email).single()
      realUser = data;
    } catch (e) {
      console.error("Could not fetch real user details, falling back to local mock data.", e)
    }

    const userData = {
      id: realUser?.id || foundUser.id,
      name: realUser?.name || foundUser.name,
      role: realUser?.role || foundUser.role || 'citizen',
      department_id: realUser?.department_id || foundUser.department_id || null,
      department_name: null,
      counter: realUser?.counter || foundUser.counter || null,
      email: realUser?.email || foundUser.email,
    }

    localStorage.setItem('ql_token', 'mock-token-' + userData.id)
    localStorage.setItem('ql_user', JSON.stringify(userData))

    return { data: { token: 'mock-token-' + userData.id, user: userData } }
  },

  register: async ({ email, password, name }) => {
    const profilePayload = {
      id: crypto.randomUUID(),
      name: name || email.split('@')[0],
      role: 'citizen',
      department_id: null,
      counter: null,
      email: email,
    }

    const { data: insertedData, error: dbError } = await supabase.from('users').insert(profilePayload)
    if (dbError) {
      console.error("Supabase insert error:", dbError)
      throw new Error(`Database Error: ${dbError.message || dbError.details || 'Failed to insert user. Check database schema.'}`)
    }

    // Save to our mock credentials store for login validation
    const mockUsers = JSON.parse(localStorage.getItem('ql_mock_users') || '[]')
    const existingUser = mockUsers.find((u) => u.email === email)
    if (existingUser) {
      throw new Error('User with this email already exists.')
    }
    mockUsers.push({
      ...profilePayload,
      password: password, // Store password ONLY locally for the mock
    })
    localStorage.setItem('ql_mock_users', JSON.stringify(mockUsers))

    localStorage.setItem('ql_token', 'mock-token-' + profilePayload.id)
    localStorage.setItem('ql_user', JSON.stringify(profilePayload))

    return {
      data: {
        token: 'mock-token-' + profilePayload.id,
        user: profilePayload,
      },
    }
  },

  me: async () => {
    const userStr = localStorage.getItem('ql_user')
    if (!userStr) throw new Error('Not authenticated')
    return { data: { user: JSON.parse(userStr) } }
  },
}

export const servicesAPI = {
  getByDepartmentId: async (departmentId) => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('department_id', departmentId)
      .order('name')

    if (error) {
      console.error('Error fetching services:', error)
      throw new Error('Failed to fetch services')
    }
    return { data }
  },

  createService: async (payload) => {
    const { data, error } = await supabase
      .from('services')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      throw new Error('Failed to create service')
    }
    return { data }
  },

  updateService: async (id, payload) => {
    const { data, error } = await supabase
      .from('services')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      throw new Error('Failed to update service')
    }
    return { data }
  }
}

export const documentsAPI = {
  getByServiceId: async (serviceId) => {
    const { data, error } = await supabase
      .from('service_documents')
      .select('*')
      .eq('service_id', serviceId)
      .order('name')

    if (error) {
      console.error('Error fetching documents:', error)
      throw new Error('Failed to fetch documents')
    }
    return { data }
  },

  addDocument: async (payload) => {
    const { data, error } = await supabase
      .from('service_documents')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error adding document:', error)
      throw new Error('Failed to add document')
    }
    return { data }
  },

  deleteDocument: async (id) => {
    const { data, error } = await supabase
      .from('service_documents')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error deleting document:', error)
      throw new Error('Failed to delete document')
    }
    return { data }
  }
}

export const queueAPI = {
  takeToken: async (data) => {
    const userStr = localStorage.getItem('ql_user')
    const user = userStr ? JSON.parse(userStr) : null
    if (!user) throw new Error('Not authenticated')

    // Find citizen profile
    const citizen = user

    const today = new Date().toISOString().split('T')[0]

    // Calculate dynamic estimated wait for people ahead of this new token
    const { data: aheadTokens } = await supabase
      .from('tokens')
      .select('service_estimate')
      .eq('department_id', data.department_id)
      .in('status', ['waiting', 'called'])
      .gte('created_at', today)

    // Sum estimates (default to 5 if null)
    const currentWaitSum = aheadTokens?.reduce((sum, t) => sum + (t.service_estimate || 5), 0) || 0
    // Keep this token's own estimate tracked for future tokens
    const thisEstimate = data.service_estimate || 5

    // Get number of tokens today to generate token number
    const { count } = await supabase
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', data.department_id)
      .gte('created_at', today)

    const tokenNumber = `T-${(count || 0) + 1}`

    const { data: token, error } = await supabase
      .from('tokens')
      .insert({
        number: tokenNumber,
        department_id: data.department_id,
        citizen_id: user.id,
        citizen_name: citizen?.name || 'Citizen',
        service_id: data.service_id || null,
        service_name: data.service_name || null,
        service_estimate: thisEstimate,
        status: 'waiting',
        estimated_wait: currentWaitSum, // dynamic estimate
      })
      .select('*, departments(name)')
      .single()

    if (error) throw error

    // Trigger queue count update on department
    await updateDepartmentQueueCount(data.department_id)

    // Calculate position (people ahead + 1)
    const position = (aheadTokens?.length || 0) + 1

    return {
      data: {
        token: { ...token, department_name: token.departments?.name },
        position: position,
        estimated_wait: currentWaitSum
      }
    }
  },

  getStatus: async (tokenId) => {
    const { data: token, error } = await supabase
      .from('tokens')
      .select('*, departments(name)')
      .eq('id', tokenId)
      .single()

    if (error) throw error

    // Get people ahead of this token
    const { data: aheadTokens } = await supabase
      .from('tokens')
      .select('service_estimate')
      .eq('department_id', token.department_id)
      .in('status', ['waiting', 'called'])
      .lt('created_at', token.created_at)

    const aheadWaitSum = aheadTokens?.reduce((sum, t) => sum + (t.service_estimate || 5), 0) || 0

    // Update the DB record with fresh estimate
    await supabase.from('tokens').update({ estimated_wait: aheadWaitSum }).eq('id', tokenId)

    return {
      data: {
        token: { ...token, department_name: token.departments?.name, estimated_wait: aheadWaitSum },
        position: (aheadTokens?.length || 0) + 1,
        estimated_wait: aheadWaitSum
      }
    }
  },

  callNext: async (deptId) => {
    const userStr = localStorage.getItem('ql_user')
    const user = userStr ? JSON.parse(userStr) : { id: 'mock-worker' }

    // Find next waiting token
    const { data: tokens, error: fetchError } = await supabase
      .from('tokens')
      .select('*')
      .eq('department_id', deptId)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(1)

    if (fetchError || !tokens.length) throw new Error('No more tokens in queue')

    const nextToken = tokens[0]

    // Update status to called
    const { data: updated, error } = await supabase
      .from('tokens')
      .update({
        status: 'called',
        worker_id: user.id
      })
      .eq('id', nextToken.id)
      .select()
      .single()

    if (error) throw error
    await updateDepartmentQueueCount(deptId)

    return { data: { token: updated } }
  },

  markDone: async (id) => {
    const { data, error } = await supabase
      .from('tokens')
      .update({ status: 'done' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await updateDepartmentQueueCount(data.department_id)
    return { data }
  },

  skipToken: async (id) => {
    const { data, error } = await supabase
      .from('tokens')
      .update({ status: 'skipped' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await updateDepartmentQueueCount(data.department_id)
    return { data }
  },

  getQueue: async (deptId) => {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('department_id', deptId)
      .in('status', ['waiting', 'called', 'serving'])
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: { queue: data } }
  },

  getUserTokens: async (userId) => {
    const { data, error } = await supabase
      .from('tokens')
      .select('*, departments(name)')
      .eq('citizen_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: { tokens: data } }
  },

  cancelToken: async (tokenId) => {
    const { data, error } = await supabase
      .from('tokens')
      .update({ status: 'cancelled' })
      .eq('id', tokenId)
      .select()
      .single()

    if (error) throw error
    await updateDepartmentQueueCount(data.department_id)
    return { data }
  }
}

export const departmentAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name')

    if (error) throw error
    return { data: { departments: data } }
  },

  create: async (payload) => {
    const { name, description, city, state } = payload;
    const { data, error } = await supabase
      .from('departments')
      .insert({ name, description, city, state })
      .select()
      .single()

    if (error) throw error
    return { data }
  },

  assignWorker: async (deptId, payload) => {
    const { data, error } = await supabase
      .from('users')
      .update({ department_id: deptId, counter: payload.counter || '1' })
      .eq('id', payload.worker_id)
      .select()

    if (error) throw error
    return { data }
  }
}

export const workerAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*, departments(name)')
      .eq('role', 'worker')

    if (error) throw error
    return { data }
  },

  create: async ({ name, email, password, department_id }) => {
    // 1. Create unique ID and user profile object
    const workerProfile = {
      id: crypto.randomUUID(), // Must be a valid UUID
      name: name || email.split('@')[0],
      role: 'worker',
      department_id: department_id || null,
      counter: null,
      email: email,
    }

    // 2. Insert into Supabase 'users' table
    console.log("Attempting to insert into Supabase: ", workerProfile)
    const { data: insertedData, error: dbError } = await supabase.from('users').insert(workerProfile)

    if (dbError) {
      console.error("Supabase insert error:", dbError)
      throw new Error(`Database Error: ${dbError.message || dbError.details || 'Failed to insert user'}`)
    }

    // 3. Save to mock local system so the new worker can log in
    const mockUsers = JSON.parse(localStorage.getItem('ql_mock_users') || '[]')
    const existingUser = mockUsers.find((u) => u.email === email)
    if (existingUser) {
      throw new Error('User with this email already exists.')
    }
    mockUsers.push({
      ...workerProfile,
      password: password, // Store test password for mock login
    })
    localStorage.setItem('ql_mock_users', JSON.stringify(mockUsers))

    return { data: workerProfile }
  }
}

export const analyticsAPI = {
  getSummary: async () => {
    // This is a simplified mock of the analytics since Supabase doesn't easily total across views without RPC
    const today = new Date().toISOString().split('T')[0]

    const [{ count: tokensTotal }, { count: tokensDone }] = await Promise.all([
      supabase.from('tokens').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('tokens').select('*', { count: 'exact', head: true }).eq('status', 'done').gte('created_at', today)
    ])

    return {
      data: {
        total_tokens: tokensTotal || 0,
        served: tokensDone || 0,
        avg_wait_time: 15,
        departments_active: 5
      }
    }
  },
  getDaily: async () => {
    // Fetch last 7 days of tokens
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: rawTokens, error } = await supabase
      .from('tokens')
      .select('created_at, status')
      .gte('created_at', sevenDaysAgo.toISOString())

    if (error) {
      console.error("Failed to fetch daily stats", error)
      return { data: [] }
    }

    // Initialize an array holding the last 7 days with 0 counts
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      return {
        dateString: d.toISOString().split('T')[0],
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        issued: 0,
        served: 0,
        skipped: 0
      }
    })

    // Bin the raw tokens into their respective days
    rawTokens?.forEach(token => {
      const tokenDate = token.created_at.split('T')[0]
      const binIndex = last7Days.findIndex(d => d.dateString === tokenDate)
      if (binIndex !== -1) {
        last7Days[binIndex].issued += 1
        if (token.status === 'done') last7Days[binIndex].served += 1
        if (token.status === 'skipped') last7Days[binIndex].skipped += 1
      }
    })

    return {
      data: last7Days
    }
  }
}

// Helper to keep department queue count in sync
async function updateDepartmentQueueCount(deptId) {
  const { count } = await supabase
    .from('tokens')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', deptId)
    .eq('status', 'waiting')

  await supabase
    .from('departments')
    .update({ queue_count: count || 0 })
    .eq('id', deptId)
}

export const adminAPI = {
  getAllUsers: async () => {
    // Fetch all users with their associated department details and token history (to see which dept citizens visited)
    // We must use the explicit foreign key !tokens_citizen_id_fkey because tokens also has worker_id pointing to users
    const { data, error } = await supabase
      .from('users')
      .select('*, departments(name, city, state), tokens!tokens_citizen_id_fkey(departments(name))')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: { users: data } }
  },

  getChartData: async () => {
    // Fetch raw token counts by status for charts
    // Doing a raw count aggregation for pie charts
    const { data: statusCounts, error } = await supabase
      .from('tokens')
      .select('status');

    if (error) throw error;

    return { data: { statusData: statusCounts } };
  }
}

// Keep the default export so App doesn't crash if it imports api
export default {}
